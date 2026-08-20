/**
 * MVP-side ingest validator — the border gate. Checks incoming dossiers against
 * the LIVE MVP canon BEFORE they go near the generator or the DB, so a mistake in
 * the research library (broken cross-ref, wrong region scheme, non-canonical
 * spelling, missing field) is caught at the boundary, not shipped + translated ×9.
 *
 * Two input modes:
 *   • A path to the library's JSON — a single `.json` (array of dossiers, or an
 *     object keyed by region code) or a directory of `.json` files:
 *       npm run validate:ingest -- path/to/dossiers
 *   • No arg → self-checks THIS repo's own `src/data/places.ts` (a regression
 *     guard so we never introduce a bad id/ref ourselves):
 *       npm run validate:ingest
 *
 * Canon is read straight from source (taxonomy + places), so the gate always
 * reflects the live vocabularies. Reports per-row; exits non-zero on any error.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { REGIONS, SIS, SUBREGIONS, boardSis } from "../src/data/taxonomy";
import { DESTINATIONS, LEGACY_DEST_ID, resolveDestId } from "../src/data/places";
import { COUNTRY_ISO, SAFETY_DATA } from "../src/data/safety-data";
import { mergedDestinations } from "./lib/destination-batches";
import { checkHero } from "./lib/check-hero";
import { checkSafetyLanguage } from "./lib/check-safety-language";

// ── Canon, straight from the live source ──────────────────────────────────
const REGION_CODES = new Set(REGIONS.map((r) => r.code));
const SI_SLUGS = new Set(SIS.map((s) => s.id));
// The BOARD is what a traveller can actually reach. `SIS` still holds retired
// interests — they keep their Postgres rows on purpose — so validating against
// SIS alone accepts a tag that can never surface: `useSpecialInterests()` filters
// retired, so the interest page does not exist. Same silent non-appearance as a
// missing tag, which is why it is called out rather than passed.
const BOARD_SLUGS = new Set(boardSis(SIS).map((s) => s.id));
const TIERS = new Set(["essential", "comfort", "premier", "luxury", "ultra"]);
const STATUS = new Set(["live", "future"]);
const DEPTH = new Set(["verified", "stub", "cached"]);
// A figure about the world: money, a duration, a distance, a clock time, a
// count of nights or people. Deliberately does NOT match a bare year or a month
// name — "Feb–Mar for the most reliable snow" is a season, not a claim that ages.
const CHECKABLE_CLAIM =
  /[$€£¥]\s?\d|\d+\s?(usd|eur|gbp|chf|km|kilometres|kilometers|miles|mi\b|hours?|hrs?|mins?|minutes?|nights?|days?|people|guests|pax|metres|meters|ft\b|feet)\b|\b\d{1,2}[:.]\d{2}\s?(am|pm)?\b|\b\d+\s?%/i;
const DRAW = new Set(["anchor", "core", "emerging"]);
const FEEL = new Set(["dramatic","serene","rugged","refined","wild","polished","cosmopolitan","buzzy","festive","romantic","secluded","family-friendly","coastal","alpine","historic","tropical","urban","remote","pastoral","adventurous"]);
const ADVISORY = new Set(["L1", "L2", "L3", "L4"]);
// The live MVP ids — the universe a reconciles_live_mvp / see-also must resolve
// into. Built from our own bundle so it's always current.
//
// LEGACY SLUGS COUNT. The whole point of `reconciles_live_mvp` is that a dossier
// names the row by the slug it was authored against, and 34 of those slugs were
// renamed on 2026-08-12 (`paris` → `paris-france`). Dossiers already written
// against `kruger` are not wrong; they are exactly what the reconcile map asked
// for. Rejecting them would punish authors for following the instruction.
const LIVE_IDS = new Set([
  ...Object.values(DESTINATIONS).flat().map((d) => d.id),
  ...Object.keys(LEGACY_DEST_ID),
]);

const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)+$/;
const SLUG_RE = /^[a-z0-9-]+$/;
// Keys that hold cross-references to other destinations (the "see also" links).
const REF_KEYS = ["see_also", "related", "related_destinations", "nearby", "links"];

const slug = (s: string) =>
  (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const deriveId = (name: string, country: string) => `${slug(name)}-${slug(country)}`;

// ── Load input → a flat list of { code, d } ───────────────────────────────
type Row = { code: string; d: any };
function normalize(raw: any, fromRegionKey?: string): Row[] {
  if (Array.isArray(raw)) return raw.map((d) => ({ code: d.region_code ?? fromRegionKey ?? "?", d }));
  if (raw && typeof raw === "object") {
    // object keyed by region code → { "05A": [ ... ] }
    if (Object.keys(raw).every((k) => Array.isArray((raw as any)[k]))) {
      return Object.entries(raw).flatMap(([code, list]) => (list as any[]).map((d) => ({ code: d.region_code ?? code, d })));
    }
    return [{ code: (raw as any).region_code ?? fromRegionKey ?? "?", d: raw }]; // single dossier
  }
  return [];
}
function loadRows(): { rows: Row[]; source: string } {
  const arg = process.argv[2];
  if (!arg) {
    // ── THE SELF-CHECK MUST COVER WHAT SHIPS, NOT WHAT WE HAND-WROTE ────────
    // This read `DESTINATIONS` — the 44 bundled rows — so `npm run validate:ingest`
    // and the CI step that runs it were both checking the catalog's smallest and
    // most carefully-authored corner while 459 ingested dossiers went unexamined
    // unless somebody remembered to pass the directory by hand.
    //
    // What that cost: 54 of 484 delivered rows carried a dangling markdown bold
    // and a brand mark in `line` — "Turtle bay, cenotes and reef **TravelWell" —
    // and shipped into Postgres, the prerendered HTML and 54 search snippets with
    // every gate green. One of them named an unreleased brand. The gate was not
    // wrong about the rows it read; it was pointed at the wrong rows.
    //
    // The merged set, so the default answers "is what we ship valid" — and via
    // the same reader every other consumer uses, which is what stops this drifting
    // apart again. Explicit-argument mode is unchanged: that is pre-ingest triage
    // of an incoming batch, a different question.
    const rows = Object.entries(mergedDestinations()).flatMap(([code, list]) =>
      list.map((d) => ({ code, d: d as unknown as Row["d"] })));
    return { rows, source: `merged catalog — src/data/places.ts + src/data/destinations/ (${rows.length} rows, self-check)` };
  }
  const st = statSync(arg);
  const files = st.isDirectory()
    ? readdirSync(arg).filter((f) => f.endsWith(".json")).map((f) => join(arg, f))
    : [arg];
  const rows = files.flatMap((f) => normalize(JSON.parse(readFileSync(f, "utf8"))));
  return { rows, source: `${arg} (${files.length} file${files.length === 1 ? "" : "s"})` };
}

// ── Validate ──────────────────────────────────────────────────────────────
const errs: string[] = [];
const warns: string[] = [];
const bump = (m: Record<string, number>, k: string) => { m[k] = (m[k] || 0) + 1; };
const perRegion: Record<string, number> = {};
const seenIds = new Set<string>();
const seenReconcile = new Set<string>();
const refChecks: { at: string; ref: string }[] = [];
// Image-reuse tracking. Two destinations showing the SAME photo is a trust
// problem — a reader who sees one beach on Bonaire and Curaçao stops believing
// the rest of the page. Tokens are only placeholders so reuse there is a soft
// warning; a PINNED hero url reused is a hard error, because that one really
// does render the identical picture twice.
const byToken: Record<string, string[]> = {};
const byHeroUrl: Record<string, string[]> = {};
const byHeroQuery: Record<string, string[]> = {};
let linked = 0;

const { rows, source } = loadRows();
const incomingIds = new Set(rows.map(({ d }) => d.id ?? deriveId(d.name, d.country)));

for (const { code, d } of rows) {
  const id = d.id ?? deriveId(d.name, d.country);
  const at = `[${code}] ${id ?? d.name ?? "?"}`;

  for (const f of ["name", "country", "line", "status", "depth"]) {
    if (d[f] == null || d[f] === "") errs.push(`${at}: missing required "${f}"`);
  }
  // ── `line` IS RENDERED COPY, SO IT MUST BE FINISHED PROSE ─────────────────
  // It shows on the destination page and, when a dossier carries no seo block,
  // becomes the meta description — the sentence in the search result. Yet the
  // gate only ever asked whether it was non-empty.
  //
  // 54 of 484 rows in one delivery ended with a dangling markdown bold and a
  // brand mark: "Turtle bay, cenotes and reef **TravelWell". Every one shipped —
  // into Postgres, into the prerendered HTML, into 54 search snippets — because
  // "present and a string" was the whole test. The brand mark does not belong in
  // a per-destination line at all; the Tagline primitive renders the slogan.
  //
  // Checked on the FRAGMENT, not on the brand name: a line legitimately naming
  // TravelWell is not the defect, an unclosed `**` is.
  if (typeof d.line === "string") {
    if (d.line.includes("**")) {
      errs.push(`${at}: line carries markdown "**" — it renders as literal asterisks in the page and the search snippet: ${JSON.stringify(d.line)}`);
    }
    if (/\s(–|—|-|\|)\s*$/.test(d.line) || /\.\.\.$/.test(d.line)) {
      errs.push(`${at}: line ends mid-thought — truncated on the way in? ${JSON.stringify(d.line)}`);
    }
  }
  // Region scheme — the 13-code is official; a 15-scheme code must be mapped down.
  if (!REGION_CODES.has(code)) errs.push(`${at}: region "${code}" is not a valid 13-code region — map 15→13 via the reconciliation table before ingest`);
  // Id: net-new dossiers must be <city>-<country>; the 38 legacy live slugs
  // (bali, kyoto, machu…) are grandfathered canon — they're the reconcile anchors.
  if (!ID_RE.test(id) && !LIVE_IDS.has(id)) errs.push(`${at}: id "${id}" isn't <city>-<country> (lowercase, hyphenated)`);
  if (d.id && d.id !== deriveId(d.name, d.country)) warns.push(`${at}: id "${d.id}" ≠ derived "${deriveId(d.name, d.country)}" (name/country drift)`);
  if (seenIds.has(id)) errs.push(`${at}: duplicate id "${id}" (two dossiers → same slot)`); else seenIds.add(id);
  // ── AND THE SAME ID IN A DIFFERENT REGION FROM THE BUNDLE ────────────────
  // Not an error — a batch is allowed to MOVE a destination, and the merge now
  // removes the old row. But it is worth saying out loud, because it silently
  // relocates a live page: cortina-dampezzo-italy was hand-authored onto the
  // alpine shelf in 01F and delivered under 02F with Italy, and until 2026-08-18
  // that emitted the id twice and Postgres kept whichever INSERT ran last.
  const bundled = Object.entries(DESTINATIONS).find(([, l]) => l.some((d) => d.id === id));
  if (bundled && bundled[0] !== code) {
    warns.push(`${at}: MOVES an existing destination from region ${bundled[0]} to ${code}. The batch wins and the old row is dropped — intended?`);
  }
  // sub_region — validate against the region's known set where we have it (12A/13A
  // in the bundle); can't strictly check regions whose sub_regions live only in the seed.
  const subs = SUBREGIONS[code];
  if (d.sub_region && subs && !subs.includes(d.sub_region)) errs.push(`${at}: sub_region "${d.sub_region}" isn't a ${code} sub_region (${subs.join(" · ")})`);
  // Enums.
  if (d.status && !STATUS.has(d.status)) errs.push(`${at}: status "${d.status}" not live|future`);
  if (d.depth && !DEPTH.has(d.depth)) errs.push(`${at}: depth "${d.depth}" not verified|stub|cached`);
  if (d.draw_rank != null && !DRAW.has(d.draw_rank)) errs.push(`${at}: draw_rank "${d.draw_rank}" not anchor|core|emerging`);
  if (d.price_band != null && !TIERS.has(d.price_band)) errs.push(`${at}: price_band "${d.price_band}" not a valid tier`);
  for (const tb of d.tier_range ?? []) if (!TIERS.has(tb)) errs.push(`${at}: tier_range has "${tb}" (not a valid tier)`);
  for (const s of d.si ?? []) {
    if (!SI_SLUGS.has(s)) warns.push(`${at}: si "${s}" isn't a known SI slug (won't surface)`);
    else if (!BOARD_SLUGS.has(s)) warns.push(`${at}: si "${s}" is RETIRED — off the board, so no interest page exists for it and this tag surfaces nowhere`);
  }
  for (const f of d.feel ?? []) if (!FEEL.has(f)) errs.push(`${at}: feel "${f}" is outside the controlled vocabulary (breaks matching)`);
  if (!(d.si ?? []).length) warns.push(`${at}: no si tags`);

  // data (jsonb) — v1 dossier tier (safety, timing, jewels+si+commission, faq).
  const data = d.data;
  if (data != null && typeof data !== "object") errs.push(`${at}: data must be an object (jsonb)`);
  if (data && typeof data === "object") {
    if (d.depth === "verified" && !data.safety) warns.push(`${at}: verified but no data.safety (safety spine)`);
    if (data.safety?.advisory_level && !ADVISORY.has(data.safety.advisory_level)) errs.push(`${at}: advisory_level "${data.safety.advisory_level}" not L1–L4`);
    // ── LEVEL 4 MUST CARRY THE STRUCTURED HOLD — a hard error, not a warning ──
    // David's R2, 2026-08-08, from a real defect in his library:
    // `pemba-mozambique` carried its suppression as PROSE inside the level string
    // ("L4 NOT bookable - content-only, no waiver") and had no structured flag at
    // all. Intent written where nothing reads it.
    //
    // This was a warning. It is now an error, because a warning is advice and
    // this is the one rule with "no override" attached to it. A row that asserts
    // Do Not Travel and omits the flag is internally contradictory, and the
    // contradiction should not be able to cross the border.
    //
    // Worth stating plainly for whoever reads this next: OUR renderer does not
    // depend on the flag. `resolveSafety` computes the hold as
    // `booking_hold === true || lvl === 4`, so an L4 row suppresses booking here
    // even with the field missing. That is defence in depth, not a reason to
    // relax the check — the flag is what every OTHER consumer reads, and a row
    // whose prose and whose fields disagree is a bug wherever it lands next.
    if (data.safety?.advisory_level === "L4" && data.safety.booking_hold !== true) {
      errs.push(`${at}: advisory_level L4 with no "booking_hold": true — Level 4 never books, and the suppression has to be in the FIELD, not in prose. (Our renderer derives the hold from L4 anyway; this is about the row being self-consistent for every other reader.)`);
    }
    // The same contradiction wearing different clothes: a posture that invites
    // booking on a row that cannot be booked.
    if (data.safety?.advisory_level === "L4" && data.safety.posture === "book-freely") {
      errs.push(`${at}: advisory_level L4 with posture "book-freely" — those cannot both be true.`);
    }
    // ── THE ZONE LINK ────────────────────────────────────────────────────────
    // `safety.zone` names an area on the COUNTRY row (safety.json `zones[]`), so
    // the level lives in one place and every destination inside it follows when
    // the advisory moves. That only holds if the name actually joins: a typo, a
    // renamed zone, or a country whose row carries no zones at all would leave a
    // destination silently inheriting the country baseline while its author
    // believed they had placed it under a Level 4.
    //
    // Checked here rather than trusted at runtime because the runtime fallback
    // is deliberately blunt — an unresolvable zone holds booking and prints no
    // level, which is right for safety and wrong for a page anyone wants to
    // publish. The gate is where a bad join should be caught and fixed.
    const zoneName = data.safety?.zone;
    if (zoneName) {
      const iso = d.country ? COUNTRY_ISO[d.country] : undefined;
      const row = iso ? (SAFETY_DATA as Record<string, { zones?: { name: string }[] }>)[iso] : undefined;
      if (!iso) {
        errs.push(`${at}: safety.zone "${zoneName}" but country "${d.country}" has no ISO mapping in COUNTRY_ISO — nothing to join the zone against.`);
      } else if (!row) {
        errs.push(`${at}: safety.zone "${zoneName}" but ${d.country} (${iso}) has no row in src/data/safety.json — add the country baseline first, zones live on it.`);
      } else {
        const names = (row.zones ?? []).map((z) => z.name);
        const hit = names.some((n) => n.trim().toLowerCase() === zoneName.trim().toLowerCase());
        if (!hit) {
          errs.push(`${at}: safety.zone "${zoneName}" doesn't match any zone on the ${d.country} row. Known zones: ${names.length ? names.map((n) => `"${n}"`).join(", ") : "(none — the country row carries no zones)"}`);
        }
      }
    }
    for (const [i, j] of (data.jewels ?? []).entries()) {
      if (!j?.name) errs.push(`${at}: jewel #${i + 1} missing "name"`);
      if (j?.tier && !TIERS.has(j.tier)) errs.push(`${at}: jewel "${j.name}" tier "${j.tier}" not a valid tier`);
      if (j?.si && !SI_SLUGS.has(j.si)) warns.push(`${at}: jewel "${j.name}" si "${j.si}" isn't a known SI slug`);
      if (!j?.commission) warns.push(`${at}: jewel "${j?.name}" has no commission lane (the money — set it if bookable)`);
      // ── A CHECKABLE CLAIM NEEDS A SOURCE ──────────────────────────────────
      // Not every jewel does. "The Matterhorn head-on, before the crowds" is an
      // editorial pick, and demanding a citation for taste produces fake ones.
      // But a price, a duration, a distance or an opening time is a fact about
      // the world that changes without telling us — and once a jewel renders on
      // an interest page it has left its dossier's prose behind, so the citation
      // that covered it there is no longer on the page at all.
      //
      // Warning rather than error, deliberately: the line between editorial and
      // factual is a judgement, and a gate that hard-fails on a judgement gets
      // routed around with --no-verify. The `verified`-without-`source` case
      // below is not a judgement, so that one is an error.
      const claim = `${j?.blurb ?? ""} ${j?.when ?? ""}`;
      if (CHECKABLE_CLAIM.test(claim) && !j?.source) {
        warns.push(`${at}: jewel "${j?.name}" states a checkable figure but carries no "source" — on an interest page this jewel renders away from the dossier's prose, so nothing on the page cites it`);
      }
      if (j?.accessed && !j?.source) {
        errs.push(`${at}: jewel "${j.name}" has "accessed" but no "source" — a date we read nothing on is not provenance`);
      }
      if (j?.accessed && !/^\d{4}-\d{2}(-\d{2})?$/.test(String(j.accessed))) {
        errs.push(`${at}: jewel "${j.name}" accessed "${j.accessed}" — use YYYY-MM or YYYY-MM-DD so it sorts and ages visibly`);
      }
    }
    for (const [i, q] of (data.faq ?? []).entries()) {
      if (!q?.q || !q?.a) errs.push(`${at}: faq #${i + 1} needs both q and a (it emits FAQPage schema)`);
    }
    // Editorial hero override (data.hero) — the content team's image pick.
    // Shared with the SI gate so the two can't drift: a missing credit on a
    // PINNED url used to be a warning here and nothing at all there, which is
    // two answers to one question.
    checkHero(at, data.hero, { errs, warns });
    // Never promise "safe" — locked canon, and the FAQ ships as structured data.
    checkSafetyLanguage(at, data, { errs, warns });

    // reconciles_live_mvp → must resolve to an ACTUAL live MVP id (not just a slug).
    const rec = data.reconciles_live_mvp;
    if (rec == null) warns.push(`${at}: no data.reconciles_live_mvp (confirm this is net-new, not an existing MVP row)`);
    else if (typeof rec !== "string" || !SLUG_RE.test(rec)) errs.push(`${at}: reconciles_live_mvp "${String(rec)}" isn't a clean lowercase slug`);
    else if (!LIVE_IDS.has(rec)) errs.push(`${at}: reconciles_live_mvp "${rec}" is not a live MVP id (would map onto nothing)`);
    else {
      linked++;
      // Collide on the RESOLVED id, not the string. Two dossiers claiming the
      // same row — one as `kruger`, one as `greater-kruger-south-africa` — are a
      // duplicate, and comparing raw strings would wave both through, producing
      // exactly the duplicate row the reconcile map exists to prevent.
      const canon = resolveDestId(rec)!;
      if (seenReconcile.has(canon)) errs.push(`${at}: reconciles_live_mvp "${rec}" already claimed (collision — resolves to "${canon}")`);
      else seenReconcile.add(canon);
    }
  }

  // Collect cross-references for a resolution pass once every id is known.
  const scan = (obj: any) => {
    if (!obj || typeof obj !== "object") return;
    for (const k of REF_KEYS) {
      const v = obj[k];
      for (const ref of Array.isArray(v) ? v : v != null ? [v] : []) if (typeof ref === "string") refChecks.push({ at, ref });
    }
  };
  if (d.img) (byToken[String(d.img)] ??= []).push(id);
  const h = (data ?? {}).hero as { url?: string; query?: string } | undefined;
  if (h?.url) (byHeroUrl[h.url] ??= []).push(id);
  if (h?.query) (byHeroQuery[h.query.toLowerCase()] ??= []).push(id);

  scan(d); scan(data);
  bump(perRegion, code);
}

// ── Cross-reference resolution — the "see also → empty shelf" bug ──────────
const known = new Set([...LIVE_IDS, ...incomingIds]);
let brokenRefs = 0;
for (const { at, ref } of refChecks) {
  if (!known.has(ref)) { errs.push(`${at}: see-also "${ref}" points to no destination (broken link)`); brokenRefs++; }
}

// ── Duplicate imagery ─────────────────────────────────────────────────────
for (const [url, ids] of Object.entries(byHeroUrl)) {
  if (ids.length > 1) errs.push(`duplicate pinned hero image — ${ids.join(", ")} all use ${url}. The same photo on two places reads as fake.`);
}
for (const [q, ids] of Object.entries(byHeroQuery)) {
  if (ids.length > 1) warns.push(`same hero.query "${q}" on ${ids.join(", ")} — they will very likely resolve to the identical photo`);
}
for (const [tok, ids] of Object.entries(byToken)) {
  if (ids.length > 3) warns.push(`placeholder token "${tok}" reused by ${ids.length} destinations (${ids.slice(0, 4).join(", ")}…) — only the pre-load image, but consider spreading them`);
}

// ── Report ────────────────────────────────────────────────────────────────
const fmt = (m: Record<string, number>) => Object.entries(m).sort().map(([k, v]) => `${k}:${v}`).join("  ");
console.log(`\n── INGEST GATE ─────────────────────────────`);
console.log(`source:      ${source}`);
console.log(`destinations: ${rows.length}   regions: ${Object.keys(perRegion).length}`);
console.log(`per region:  ${fmt(perRegion)}`);
console.log(`linkage:     ${linked}/${rows.length} reconcile to a live row   unique ids: ${seenIds.size}   cross-refs: ${refChecks.length} (${brokenRefs} broken)`);

// ── WILL THIS BATCH ACTUALLY SURFACE? ──────────────────────────────────────
// "Clean against live canon, safe to ingest" is true and not the same as "these
// will appear." A destination surfaces on an interest page through its `si`
// array, and a row with none ingests perfectly and is reachable only by someone
// who already knows its URL.
//
// That is not hypothetical: 37 of our own 44 bundled rows carry no si tag, which
// is why the safari page lists 39 providers and no places. The gate has always
// warned per row, and a per-row warning in a list of forty scrolls past. So the
// coverage is stated as a number, next to the tick, where it can't be missed.
// `rows` holds { code, d } wrappers, not destinations. The first version of this
// read `d.si` off the WRAPPER, so it reported 0 on every input it was ever given
// — including a 484-row batch where 482 rows are tagged. A coverage line that
// always says zero is worse than no coverage line: it is the shape of an alarm
// that cannot distinguish a real problem from itself, and it was about to be
// quoted at the research library as evidence their batch surfaced nowhere.
const tagged = rows.filter(({ d }) => (d.si ?? []).length).length;
const bySi: Record<string, number> = {};
for (const { d } of rows) for (const s of d.si ?? []) bySi[s] = (bySi[s] ?? 0) + 1;
const covered = Object.entries(bySi).sort((a, b) => b[1] - a[1]);
console.log(`si coverage:  ${tagged}/${rows.length} rows carry an si tag${tagged < rows.length ? `  — the other ${rows.length - tagged} will not appear on ANY interest page` : ""}`);
console.log(`             ${covered.length ? covered.map(([k, v]) => `${k}:${v}`).join("  ") : "none — this batch lights up no interest page"}`);
if (warns.length) { console.log(`\n⚠︎ ${warns.length} warnings (won't block, but check):`); warns.forEach((w) => console.log("  · " + w)); }
if (errs.length) { console.log(`\n✗ ${errs.length} ERRORS (must fix before ingest):`); errs.forEach((e) => console.log("  ✗ " + e)); process.exit(1); }
console.log(`\n✓ Clean against live canon — safe to ingest.`);
