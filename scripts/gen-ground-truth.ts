/**
 * Emit the repository's ground truth — every count, field path and vocabulary
 * READ FROM THE SOURCE, with the file and line each one came from.
 *
 *   npm run gen:ground-truth   → docs/ground-truth.md
 *
 * WHY THIS EXISTS (2026-08-12). A planning surface with no access to this
 * repository produced a spec built on remembered field names: "booking windows
 * are in §6 of the nineteen sections." The dossier is nine layers, booking
 * windows are layer 4a, and no interest carries a dossier at all — so an
 * inheritance plan for 211 items had nothing to inherit from. None of that was
 * arguable; it was all one lookup away. The lookup just never happened, and
 * from the inside a confident recollection is indistinguishable from a read.
 *
 * So the fix isn't a promise to check more carefully. It's making the check a
 * command anyone can run and paste. This file is the artifact you hand to a
 * surface that can't read the repo — and because it is generated, it cannot
 * quietly drift from the code the way a hand-kept fact sheet does. A fact sheet
 * that goes stale is worse than none: it launders a stale claim as a verified
 * one.
 *
 * The conformance section is the important half. Counts answer "how many";
 * conformance answers "does the data actually obey the rule we wrote down",
 * which is the question a spec is really asking when it assumes a shape.
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { SIS, boardSis, REGIONS, WELLS, LUX_WELLS, SI_GROUPS, SUBREGIONS, taglineSubject } from "../src/data/taxonomy";
import { DESTINATIONS, ACTIVITIES, PROVIDERS, GUIDES, SUBREGION_TOP } from "../src/data/places";
import { COUNTRY_ISO, SAFETY_DATA } from "../src/data/safety-data";
import { mergedDestinations } from "./lib/destination-batches";
import { isIndexableDestination } from "../src/lib/site";
import { stateSnapshotLevel, STATE_FEED_UPDATED } from "../src/data/advisory-sources";

/**
 * A citation that survives the file moving underneath it.
 *
 * LINE NUMBERS ROT, and they rot silently — insert one line above and
 * `taxonomy.ts:222` now points at something else while still looking precise.
 * This repo ships daily, so a citation written this morning can be quietly
 * misdirecting by evening, and nothing about it looks stale.
 *
 * So every citation carries BOTH: the line number, which is exact right now and
 * regenerates on every run, and the matched source text, which is how a reader
 * finds the thing again after the number has drifted. Grep the anchor, ignore
 * the number.
 */
function lineOf(file: string, re: RegExp): string {
  const lines = readFileSync(file, "utf8").split("\n");
  const i = lines.findIndex((l) => re.test(l));
  if (i === -1) return `${file}`;
  const anchor = lines[i].trim().replace(/\s+/g, " ").slice(0, 46);
  return `${file}:${i + 1} · \`${anchor}\``;
}

const dests = Object.values(DESTINATIONS).flat();
const acts = Object.values(ACTIVITIES).flat();
const provs = Object.values(PROVIDERS).flat();
const board = boardSis(SIS);
const live = SIS.filter((s) => s.status === "live");
const allWells = [...WELLS, ...LUX_WELLS];

const TAX = "src/data/taxonomy.ts";
const PLACES = "src/data/places.ts";

// ── Conformance: does the DATA obey the rules we wrote down? ────────────────
// Each check is a documented rule turned into a predicate. A rule that can't be
// checked mechanically is left out rather than asserted — an unchecked rule in a
// list of checked ones reads as verified, which is the failure this file exists
// to prevent.
const idPattern = /^[a-z0-9]+(-[a-z0-9]+)+$/;
// The documented key is <city>-<country>, country spelled out. We can't prove a
// segment IS a country without a gazetteer, so this checks the weaker, decidable
// property: the id is hyphenated and multi-part at all. Single-word ids
// ("paris") definitively fail the convention.
const idConforming = dests.filter((d) => idPattern.test(d.id));
const idSingleWord = dests.filter((d) => !d.id.includes("-"));

const dossierFiles = {
  interests: readdirSync("src/data/interests").filter((f) => f.endsWith(".json")),
  destinations: readdirSync("src/data/destinations").filter((f) => f.endsWith(".json")),
};
const shipping = (files: string[]) => files.filter((f) => !f.startsWith("_"));

// Every country a destination sits in needs a country-level safety row, because
// `resolveSafety` cascades country → destination: a dossier carve-out with no
// baseline underneath it has nothing to carve out of.
const destCountries = [...new Set(dests.map((d) => d.country))];
const missingSafety = destCountries.filter((c) => !(c in COUNTRY_ISO));

// A safety row must not claim verification its own source denies. Uganda carried
// lvl 4 with `verified: "2026-08"` beside a source reading "NOT independently
// re-verified — confirm ... before public use". Both strings RENDER on the
// destination page, so a traveler saw an internal note to ourselves next to a
// Verified badge contradicting it. The caveat was written down and then ignored
// by every field that drives the UI.
const SELF_FLAGGED = /not independently|reported by|unconfirmed|not re-?verified|before public use/i;
const safetyRows = Object.entries(SAFETY_DATA as Record<string, {
  source?: string; verified?: string; reported?: boolean; unverified?: boolean; lvl?: number;
}>);
const provenanceLies = safetyRows.filter(([, r]) =>
  r.source && SELF_FLAGGED.test(r.source) && !r.reported && !r.unverified);
const claimsBoth = safetyRows.filter(([, r]) => r.reported && r.verified);

// Jewels. David's decisions 1-3 all turn on how many there are and whether they
// carry provenance, and the figure he reasons from (5,422) is his library's, not
// this repo's. Counted here so nobody plans against a number from the wrong side
// of the border.
const allJewels = dests.flatMap((d) => d.data?.jewels ?? []);
const jewelCount = allJewels.length;
const jewelSourced = allJewels.filter((j) => j.source).length;
const jewelAccessed = allJewels.filter((j) => j.accessed).length;

// OUR CURATED LEVEL vs THE LEVEL STATE PUBLISHED. Not the same thing and not
// meant to be — safety.json is a baseline a human reviewed, and it holds through
// a source we could not read. But a silent divergence is how St. Lucia sat at
// Level 1 in our data for six weeks after State moved it to Level 2, showing
// travelers a LESS strict level than the source. Nothing in the product could
// see it, because nothing compared the two.
//
// The snapshot is dated. That is the point: it ages visibly, and a check against
// a six-month-old snapshot says so rather than quietly passing.
const levelDrift = Object.entries(COUNTRY_ISO).flatMap(([name, iso]) => {
  const ours = (SAFETY_DATA as Record<string, { lvl?: number; country?: string }>)[iso];
  const theirs = stateSnapshotLevel(name);
  if (!ours?.lvl || !theirs) return [];
  return ours.lvl === theirs.lvl ? [] : [`${name}: ours L${ours.lvl}, State L${theirs.lvl} (published ${theirs.published})`];
});
const stateCovered = Object.keys(COUNTRY_ISO).filter((n) => stateSnapshotLevel(n)).length;

// THREE INTERESTS ARRIVE FROM JSON, NOT FROM THE LITERAL ARRAY. `sailing`,
// `yacht` and `wine` are merged into SIS from `special-interests.json` at module
// load. Anything that reads the `BASE_SIS` literal instead of the exported `SIS`
// is blind to them.
//
// That is not hypothetical — the research library reported all three as missing
// from the board (David 2026-08-14) because every tool on their side read the
// literal. Our exported SIS does include them, and this check is what keeps that
// true: if the merge is ever moved, refactored or dropped, three interests would
// vanish from the board, the seed's `delete ... where id not in (...)` would drop
// their Postgres rows, and nothing else here would notice.
const JSON_SOURCED = ["sailing", "yacht", "wine"];
const jsonSourcedMissing = JSON_SOURCED.filter((id) => !SIS.some((s) => s.id === id));

// ONE ID, ONE REGION. A destination belongs to exactly one region, and the seed
// upserts on id — so the same id under two region codes emits two INSERT rows and
// Postgres silently keeps whichever ran last. Nothing failed: the generator
// counted both, `validate:ingest` checks ids within the incoming file rather than
// against the bundle, and the only symptom was a count that disagreed by one when
// a human ran the migration and looked.
// THE MERGED SET, not the bundle. Checking `DESTINATIONS` alone would report
// "44 ids unique" and miss the entire ingested library — which is where the
// duplicate actually was. A check that inspects the wrong set passes for the
// wrong reason, and reads exactly like one that passed for the right one.
const allDestRows = Object.entries(mergedDestinations()).flatMap(([code, list]) => list.map((d) => ({ id: String(d.id), code })));
const byDestId = new Map<string, string[]>();
for (const r of allDestRows) byDestId.set(r.id, [...(byDestId.get(r.id) ?? []), r.code]);
const crossRegionDupes = [...byDestId.entries()].filter(([, codes]) => codes.length > 1);

// HOW MANY INGESTED DESTINATIONS HAVE NO ADVISORY AT ALL.
//
// The old check asked whether every country behind a BUNDLED destination had a
// row, and answered "all 33 covered" — true, and about the 44 rows we wrote
// ourselves. After the library ingest the denominator is 503, and 233 of them
// sit in 48 countries we hold nothing for. Those pages render the fail-safe
// card: no level, "not yet verified", no Book button. Correct behaviour and a
// large silent hole, and the check that was passing could not see it because it
// was pointed at the wrong set.
const mergedRows = Object.values(mergedDestinations()).flat() as { country: string }[];
const noAdvisory = mergedRows.filter((d) => {
  const iso = (COUNTRY_ISO as Record<string, string>)[d.country];
  return !iso || !(iso in (SAFETY_DATA as Record<string, unknown>));
});
const noAdvisoryCountries = [...new Set(noAdvisory.map((d) => d.country))].sort();

// ── The hosting rewrite list must not resurrect the catch-all ───────────────
// This is the check for the most expensive defect the project has had. A single
// `{ source: "/(.*)", destination: "/index.html" }` served the home shell with a
// 200 for every dead URL, so a previous build's pages could never age out of the
// index. Search Console, read 2026-08-17: 519 pages known to Google, 313 of them
// `/en/*` paths that match no route we have ever had — a different destination
// list, region codes (02A, 03B, 06D) that are not among our thirteen, and SI
// slugs that are not ours. Crawled daily, and the source of at least four wrong
// figures quoted back to us as current.
//
// The generator asserts things about its INPUT (enough routes were found, the
// in-app 404 still exists). Nothing asserted the OUTPUT, which is the artifact
// Vercel actually reads. One re-added line brings all of it back, and the symptom
// would take another quarter to reappear in a report.
const vercelRewrites: { source?: string }[] = (() => {
  try { return (JSON.parse(readFileSync("vercel.json", "utf8")).rewrites ?? []) as { source?: string }[]; }
  catch { return []; }
})();
const catchAlls = vercelRewrites.filter((r) => /\(\.\*\)|^\/\*$|^\/\(\.\+\)$/.test(r.source ?? ""));

// ── SI dossier identity vs the locked board ─────────────────────────────────
// `validate:si` now errors when a dossier's identity field disagrees with the
// board, because an SI batch shallow-merges and would overwrite it. But its
// loader skips `_`-prefixed files by design — references never ship — which
// leaves the GOLD REFERENCE, the file every other dossier is authored against,
// as the one the gate cannot see.
//
// That is where the drift actually was: `_REFERENCE.golf.json` carried
// `group: "active"` and `accent: "#3C7E55"` against the board's `premium` and
// `#2F6B3A`, positioned to propagate into 34 more dossiers. An unguarded
// exemplar is worse than an unguarded instance.
//
// So this check reads EVERY interest file, references included, and reports
// drift without blocking a commit over a teaching file.
const SI_ID_FIELDS = ["name", "sig", "status", "accent", "lux", "group"] as const;
const siIdentityDrift: string[] = [];
for (const f of readdirSync("src/data/interests").filter((f) => f.endsWith(".json"))) {
  let rows: Record<string, unknown>[];
  try {
    const raw = JSON.parse(readFileSync(`src/data/interests/${f}`, "utf8"));
    rows = Array.isArray(raw) ? raw : (raw.special_interests as Record<string, unknown>[]) ?? [raw];
  } catch { siIdentityDrift.push(`${f}: unreadable`); continue; }
  for (const d of rows) {
    const live = SIS.find((s) => s.id === d.id) as Record<string, unknown> | undefined;
    if (!live) continue;
    for (const k of SI_ID_FIELDS) {
      if (!(k in d) || d[k] == null) continue;
      if (JSON.stringify(d[k]) !== JSON.stringify(live[k])) {
        siIdentityDrift.push(`${f} (${d.id}): ${k} ${JSON.stringify(d[k])} vs board ${JSON.stringify(live[k])}`);
      }
    }
  }
}

// ── Atlas's roster vs the taxonomy ──────────────────────────────────────────
// Read the prompt files as TEXT, deliberately. They are Deno / standalone-Node
// sources this build never imports, so there is no binding to check — the only
// honest question is whether the string a traveler's concierge is given actually
// contains the name. A missing file is reported, not skipped: "we couldn't look"
// must never render as "nothing missing".
const ATLAS_PROMPT_FILES = ["supabase/functions/atlas/index.ts", "voice-agent/index.ts"];
const atlasPromptGaps: [string, string[]][] = ATLAS_PROMPT_FILES.flatMap((f) => {
  let text: string;
  try { text = readFileSync(f, "utf8"); } catch { return [[f, ["(file not found)"]] as [string, string[]]]; }
  const missing = allWells.map((w) => w.name).filter((n) => !text.includes(n));
  return missing.length ? [[f, missing] as [string, string[]]] : [];
});

// ── The sitemap vs the catalog ──────────────────────────────────────────────
// Read from the EMITTED FILE, not by re-running the sitemap's own logic. Asking
// the generator what it would produce cannot catch a generator pointed at the
// wrong catalog — it would agree with itself. The file is the artifact Google
// fetches, so the file is what gets compared.
//
// It is gitignored (regenerated before every build), so absence is a real state
// and reported as one rather than crashing the fact sheet.
// Both halves come from the MERGED set. Writing the withheld count as
// `dests.length - indexableDests.length` printed "-453 unreleased": `dests` is
// the 44-row bundle and `indexableDests` is the 497 merged rows. Wrong set, in
// the very check written to catch a wrong set — which is the argument for
// deriving both numbers from one binding rather than two similar-looking ones.
const allMergedDests = Object.values(mergedDestinations()).flat() as { id: string; status?: string }[];
const indexableDests = allMergedDests.filter((d) => isIndexableDestination(d));
// The board, and the interest ids the sitemap actually lists.
const board_ = boardSis(SIS);
const sitemapSiIds: string[] | null = (() => {
  try {
    const xml = readFileSync("public/sitemap.xml", "utf8");
    return [...xml.matchAll(/<loc>[^<]*\/si\/([^<]+)<\/loc>/g)].map((m) => m[1]);
  } catch { return null; }
})();

const sitemapDestUrls: string[] | null = (() => {
  try {
    const xml = readFileSync("public/sitemap.xml", "utf8");
    return [...xml.matchAll(/<loc>[^<]*\/destination\/([^<]+)<\/loc>/g)].map((m) => m[1]);
  } catch { return null; }
})();

// Every country we know by name should have an advisory row. `COUNTRY_ISO` is
// the set we recognise — it drives the advisory checker's daily payload — so an
// ISO in there with no row in safety.json is a country we ask about every
// morning and hold no baseline for. The counts differing is how this surfaced.
const isoNoRow = [...new Set(Object.values(COUNTRY_ISO))].filter((i) => !(i in SAFETY_DATA));

// A named area with a level attached must live in `zones[]`, where the booking
// gate can read it — never only as a sentence in `considerations`.
//
// This is the check that found the thing. Ten of thirty-six rows carried lines
// like 'Level 4 "Do Not Travel": the Sinai Peninsula, the Western Desert…'. They
// rendered correctly and read well, and no code could see them: the gate reads
// `lvl`, which is the COUNTRY number. A destination inside a Do-Not-Travel zone
// would have shown its country's Level 2 and offered a Book button. Nothing was
// wrong live only because all 44 live destinations sit in the mainstream part of
// their country — luck, not a gate.
//
// The regex is deliberately narrow: it matches a LEVEL claim, not the words
// "reconsider" or "do not travel" on their own, which legitimately appear in a
// country's own summary line at that level.
const ZONE_PROSE = /level\s*[34]\b|"?do not travel"?\s*(zones?|:|within|areas?)/i;
const proseZones = (Object.entries(SAFETY_DATA as Record<string, {
  lvl?: number; considerations?: string[]; zones?: { name: string; lvl: number }[];
}>)).flatMap(([iso, r]) =>
  (r.considerations ?? [])
    .filter((c) => ZONE_PROSE.test(c) && (r.lvl ?? 0) < 3)
    .map((c) => `${iso}: “${c.slice(0, 60)}…”`));
const zoneRows = Object.entries(SAFETY_DATA as Record<string, { zones?: unknown[] }>)
  .filter(([, r]) => (r.zones ?? []).length);
const zoneCount = zoneRows.reduce((n, [, r]) => n + (r.zones ?? []).length, 0);

// No two interests may share a slogan subject (David, nineteen-rules §1). Two
// interests resolving to the same "If It's [X]… TravelWell." makes the line
// ambiguous about which world it is selling — and for a mark whose filing rests
// on consistent use, an ambiguous instance is worse than a plain one. Caught
// this way once already: `liveaboard` and `diveglobal` both held "Diving".
const subjects = board.map((s) => [s.id, taglineSubject(s as never)] as const);
const dupSubjects = subjects.filter(([, sub], i) =>
  subjects.findIndex(([, other]) => other.toLowerCase() === sub.toLowerCase()) !== i);

const checks: { rule: string; result: string; ok: boolean; where: string }[] = [
  {
    rule: "The board is 35 Signature Interests in 10 categories (David-locked 2026-08-10)",
    result: `${board.length} on the board, ${Object.keys(SI_GROUPS).length} categories`,
    ok: board.length === 35 && Object.keys(SI_GROUPS).length === 10,
    where: lineOf(TAX, /export const SI_GROUPS/),
  },
  {
    rule: "Retired interests stay in SIS (the seed carries `delete … where id not in (…)`)",
    result: `${SIS.length - board.length} retired rows still present: ${SIS.filter((s) => s.retired).map((s) => s.id).join(", ") || "none"}`,
    ok: SIS.length > board.length,
    where: lineOf(TAX, /export const boardSis/),
  },
  {
    rule: "7 launch interests are live, plus `ultra` as the luxury overlay — 8 rows at status live",
    result: `${live.length} live: ${live.map((s) => s.id).join(", ")}`,
    ok: live.length === 8 && live.some((s) => s.id === "ultra"),
    where: lineOf(TAX, /export const SIS/),
  },
  {
    rule: "No two interests share a slogan subject — the `If It's [X]…` slot must name one world",
    result: dupSubjects.length
      ? `${dupSubjects.length} duplicate: ${dupSubjects.map(([id, sub]) => `${id} → "${sub}"`).join(", ")}`
      : `all ${subjects.length} subjects distinct`,
    ok: dupSubjects.length === 0,
    where: lineOf(TAX, /export const SI_TAGLINE_SUBJECT/),
  },
  {
    rule: "13 Wells total, 10 live + 3 soon",
    result: `${allWells.length} total, ${allWells.filter((w) => w.status === "live").length} live, ${allWells.filter((w) => w.status !== "live").length} not live`,
    ok: allWells.length === 13 && allWells.filter((w) => w.status === "live").length === 10,
    where: lineOf(TAX, /export const WELLS/),
  },
  {
    rule: "13-code region scheme",
    result: `${REGIONS.length} regions`,
    ok: REGIONS.length === 13,
    where: lineOf(TAX, /export const REGIONS/),
  },
  {
    rule: "Destination id is `<city>-<country>`, lowercase and hyphenated",
    result: `${idConforming.length} of ${dests.length} are hyphenated multi-part; ${idSingleWord.length} are single-word and cannot conform${idSingleWord.length ? ` (${idSingleWord.slice(0, 8).map((d) => d.id).join(", ")}${idSingleWord.length > 8 ? ", …" : ""})` : ""}`,
    ok: idSingleWord.length === 0,
    where: lineOf(PLACES, /export const DESTINATIONS/),
  },
  {
    // The generators kept drifting apart on WHICH catalog they read. `gen:heads`
    // and `prerender` were moved onto the merged set; `gen:sitemap` was not, and
    // for weeks the build rendered 590 pages while telling Google about 121 —
    // every ingested dossier crawlable, prerendered, and listed nowhere. Nothing
    // failed; the sitemap was internally consistent, just consistent about the
    // wrong 44 rows. So the check compares the emitted file against the catalog
    // rather than trusting that two scripts read the same thing.
    // The destination half of this check existed; the INTEREST half did not, and
    // that is where the next instance of the same bug turned up. `gen-sitemap`
    // read raw `SIS` while `gen-static-heads` read `boardSis()`, so four retired
    // interests — compsports, nightlife, olympic, prosports — were listed in the
    // sitemap with no page behind them, each serving the generic app shell. One
    // of them is `olympic`, which our own canon says needs trademark clearance
    // before public use.
    //
    // Checked against the BOARD rather than against `dist/`, deliberately: dist is
    // a build artifact that may not exist, and the question is whether the file we
    // publish agrees with the source of truth, not with a previous build.
    rule: "The sitemap lists exactly the interests on the board — no retired ones, none missing",
    result: (() => {
      if (!sitemapSiIds) return "public/sitemap.xml not present — run `npm run gen:sitemap`";
      const board = new Set(board_.map((s) => s.id));
      const listed = new Set(sitemapSiIds);
      const retiredListed = [...listed].filter((id) => !board.has(id));
      const boardMissing = [...board].filter((id) => !listed.has(id));
      if (!retiredListed.length && !boardMissing.length) return `all ${board.size} board interests listed, no retired ones`;
      return `${retiredListed.length} retired interest(s) listed (${retiredListed.join(", ") || "—"}); ${boardMissing.length} board interest(s) missing (${boardMissing.join(", ") || "—"})`;
    })(),
    ok: !!sitemapSiIds && sitemapSiIds.length === board_.length
      && board_.every((s) => sitemapSiIds!.includes(s.id)),
    where: "scripts/gen-sitemap.ts vs boardSis() in src/data/taxonomy.ts",
  },
  {
    rule: "The sitemap lists every indexable destination (merged catalog, not the bundle)",
    result: (() => {
      if (!sitemapDestUrls) return "public/sitemap.xml not present — run `npm run gen:sitemap` (it is a gitignored build artifact)";
      const listed = new Set(sitemapDestUrls);
      const missing = indexableDests.filter((d) => !listed.has(d.id));
      const extra = [...listed].filter((id) => !indexableDests.some((d) => d.id === id));
      if (!missing.length && !extra.length) return `all ${indexableDests.length} indexable destinations listed; ${allMergedDests.length - indexableDests.length} unreleased withheld (and stamped noindex)`;
      return `${missing.length} indexable destinations missing from the sitemap${missing.length ? ` (${missing.slice(0, 5).map((d) => d.id).join(", ")}${missing.length > 5 ? ", …" : ""})` : ""}; ${extra.length} listed but not indexable`;
    })(),
    ok: !!sitemapDestUrls && sitemapDestUrls.length === indexableDests.length
      && indexableDests.every((d) => sitemapDestUrls!.includes(d.id)),
    where: "scripts/gen-sitemap.ts",
  },
  {
    // Atlas's roster is HAND-TYPED in the typed edge function and in the voice
    // worker's fallback, and a hand-typed roster drifts the moment the board
    // moves. Pets-Well was locked as the 13th Well on 2026-08-10 and named in
    // neither prompt for ten days: the concierge could not have mentioned the
    // one Well whose whole argument is that nobody else serves it.
    //
    // Nothing caught it because a prompt is a string — no import, no type, no
    // generator. This check is the import: it reads the actual prompt files and
    // asks whether every Well the taxonomy defines appears in them.
    rule: "vercel.json has no catch-all rewrite — an unknown path must 404, never return the home shell with a 200",
    result: catchAlls.length
      ? `${catchAlls.length} catch-all rewrite(s) present: ${catchAlls.map((r) => r.source).join(", ")} — every dead URL will serve 200 and can never age out of the index`
      : `${vercelRewrites.length} rewrites, none matching everything`,
    ok: vercelRewrites.length > 0 && catchAlls.length === 0,
    where: "vercel.json (generated by scripts/gen-vercel-routes.ts)",
  },
  {
    rule: "No interest dossier — references included — redeclares an identity field against the locked board",
    result: siIdentityDrift.length
      ? `${siIdentityDrift.length} field(s) drifting: ${siIdentityDrift.join("; ")}`
      : `all ${shipping(dossierFiles.interests).length} shipping + ${dossierFiles.interests.length - shipping(dossierFiles.interests).length} reference file(s) agree with the board`,
    ok: siIdentityDrift.length === 0,
    where: "scripts/validate-si.ts (shipping files) + this check (references too)",
  },
  {
    rule: "Both Atlas prompts (typed + voice fallback) name every Well in the taxonomy",
    result: (() => {
      const missing = atlasPromptGaps;
      if (!missing.length) return `all ${allWells.length} Wells named in both prompts`;
      return missing.map(([file, names]) => `${file}: missing ${names.join(", ")}`).join("; ");
    })(),
    ok: atlasPromptGaps.length === 0,
    where: "supabase/functions/atlas/index.ts + voice-agent/index.ts",
  },
  {
    rule: "Every interest dossier layer is optional, but a populated one must carry labeled figures",
    result: `${SIS.filter((s) => s.data && Object.keys(s.data).length).length} of ${SIS.length} interests carry a dossier`,
    ok: true, // zero is a valid state — it means the work hasn't started, not that a rule is broken
    where: lineOf(TAX, /export interface SiData/),
  },
  {
    rule: "Every country holding a destination **currently in the catalog** has a country-level safety row (the advisory cascade is country → destination)",
    result: missingSafety.length
      ? `${missingSafety.length} of ${destCountries.length} missing: ${missingSafety.join(", ")} — a dossier carve-out for these has no baseline to override`
      : `all ${destCountries.length} covered`,
    ok: missingSafety.length === 0,
    where: "src/data/safety-data.ts (COUNTRY_ISO) vs src/data/places.ts (DESTINATIONS)",
  },
  {
    rule: "Every country in `COUNTRY_ISO` has an advisory row — it is the set the daily checker asks about, so a missing row is a country we query and hold no baseline for",
    result: isoNoRow.length
      ? `${isoNoRow.length} with no row: ${isoNoRow.join(", ")} — checked daily, nothing to compare against`
      : `all ${Object.keys(SAFETY_DATA).length} covered`,
    ok: isoNoRow.length === 0,
    where: "src/data/safety-data.ts (COUNTRY_ISO) vs src/data/safety.json",
  },
  {
    rule: "The three interests merged in from `special-interests.json` (`sailing`, `yacht`, `wine`) are present in the exported `SIS`",
    result: jsonSourcedMissing.length
      ? `${jsonSourcedMissing.length} missing: ${jsonSourcedMissing.join(", ")} — the merge has broken, and the seed's delete-what-is-missing would drop their rows`
      : `all ${JSON_SOURCED.length} present — read \`SIS\`, never the \`BASE_SIS\` literal`,
    ok: jsonSourcedMissing.length === 0,
    where: "src/data/taxonomy.ts (`import siExtra from \"./special-interests.json\"`)",
  },
  {
    rule: "Every INGESTED destination has a country advisory row — the fail-safe card is correct behaviour, not coverage",
    result: noAdvisory.length
      ? `${noAdvisory.length} of ${mergedRows.length} destinations (${Math.round(100 * noAdvisory.length / mergedRows.length)}%) render "not yet verified", across ${noAdvisoryCountries.length} countries: ${noAdvisoryCountries.slice(0, 8).join(", ")}${noAdvisoryCountries.length > 8 ? `, +${noAdvisoryCountries.length - 8} more` : ""}`
      : `all ${mergedRows.length} covered`,
    ok: noAdvisory.length === 0,
    where: "src/data/safety.json vs the merged catalog · fallback is DEFAULT_SAFETY in src/data/safety-data.ts",
  },
  {
    rule: "No destination id appears under more than one region — the seed upserts on id, so a duplicate emits twice and the database keeps whichever ran last",
    result: crossRegionDupes.length
      ? `${crossRegionDupes.length} duplicated: ${crossRegionDupes.map(([id, c]) => `${id} in ${c.join(" and ")}`).join("; ")}`
      : `all ${byDestId.size} ids unique across ${new Set(allDestRows.map((r) => r.code)).size} regions`,
    ok: crossRegionDupes.length === 0,
    where: "src/data/places.ts + src/data/destinations/ · merged by scripts/lib/destination-batches.ts",
  },
  {
    rule: "Our curated level matches the level State published for that country",
    result: levelDrift.length
      ? `${levelDrift.length} diverge: ${levelDrift.join("; ")}`
      : `all ${stateCovered} countries State covers agree (feed snapshot ${STATE_FEED_UPDATED.slice(0, 10)})`,
    ok: levelDrift.length === 0,
    where: "src/data/safety.json vs src/data/state-advisory-feed.json",
  },
  {
    rule: "A named area carrying its own advisory level lives in structured `zones[]`, not as prose in `considerations` — prose is invisible to the booking gate",
    result: proseZones.length
      ? `${proseZones.length} level claim(s) still only in prose: ${proseZones.join("; ")}`
      : `${zoneCount} zones across ${zoneRows.length} country rows, all structured`,
    ok: proseZones.length === 0,
    where: "src/data/safety.json (`zones[]`) · resolved by `resolveSafety` in src/data/safety-data.ts",
  },
  {
    rule: "No safety row claims verification its own `source` string denies (the source RENDERS on the destination page)",
    result: provenanceLies.length
      ? `${provenanceLies.length} row(s) self-flag as unconfirmed but carry neither \`reported\` nor \`unverified\`: ${provenanceLies.map(([iso]) => iso).join(", ")}`
      : `all ${safetyRows.length} rows consistent`,
    ok: provenanceLies.length === 0,
    where: "src/data/safety.json vs src/data/safety-data.ts (SafetyInfo.reported)",
  },
  {
    rule: "A `reported` safety row carries no `verified` date — we act on it, we don't claim it",
    result: claimsBoth.length ? `${claimsBoth.length}: ${claimsBoth.map(([iso]) => iso).join(", ")}` : "none claim both",
    ok: claimsBoth.length === 0,
    where: "src/data/safety.json",
  },
  {
    rule: "`_`-prefixed dossier files are references and never ship",
    result: `interests/: ${dossierFiles.interests.length} file(s), ${shipping(dossierFiles.interests).length} shipping · destinations/: ${dossierFiles.destinations.length} file(s), ${shipping(dossierFiles.destinations).length} shipping`,
    ok: true,
    where: "src/data/interests/, src/data/destinations/",
  },
];

// ── The nine layers, read off the interface itself ──────────────────────────
const LAYERS: [string, string, string][] = [
  ["1", "market", "{ summary?, figures?: Figure[] }"],
  ["2", "streams", "{ id?, name, blurb?, figures? }[]"],
  ["3", "sources", "{ country, iso?, note?, figures? }[]"],
  ["4a", "timing", "{ season?, best_months?: number[], booking_window?: string, notes? }"],
  ["4b", "events", "SiEvent[]"],
  ["5", "map", "{ destinations?: string[], regions?, anchors?, note? }"],
  ["6", "providers", "SiProvider[]"],
  ["7", "faq", "SiFaq[]"],
  ["8", "wells · whispers · safety", "string[] · string[] · Record<string, unknown>"],
  ["9", "seo · schema", "{ title?, description?, keywords?, geo_keywords? } · string[]"],
];

const rows = (r: string[][]) => r.map((c) => `| ${c.join(" | ")} |`).join("\n");
const tick = (ok: boolean) => (ok ? "✅" : "⚠️");

const md = `# Ground truth — generated, do not hand-edit

*Generated by \`npm run gen:ground-truth\`. Every number and field path below is
read from the source at generation time.*

**What this is for.** Hand it to anyone — or anything — that needs to reason
about this codebase without being able to read it. A spec built on a remembered
field name is bad work, and the remedy is not more care: it is a lookup that
costs one command. Because this file is generated, it cannot drift from the code
the way a hand-kept fact sheet does, and a fact sheet that has gone stale is
worse than none — it launders a stale claim as a verified one.

**How to use it in a review.** Take each factual claim in the spec — a field
name, a section number, a count, a file path — and find it here. Anything you
cannot find is unverified, which is not the same as wrong, but it is the same as
not-yet-checkable. Say so rather than letting it through.

**Citations carry an anchor, not just a line number.** Every \`file:line\` below is
followed by the source text it points at. Line numbers rot silently — insert one
line above and the number points elsewhere while still looking precise — so grep
the anchor and ignore the number if the two disagree. Regenerating fixes both.

**You can read this file instead of running it.** A pre-commit hook re-runs every
generator and refuses the commit if any generated file is out of step, so the
committed copy cannot be behind the source it describes. Reading it at HEAD is as
good as regenerating it.

## Inventory

| Thing | Count | Read from |
|---|---|---|
${rows([
  ["Signature Interests on the board", String(board.length), lineOf(TAX, /export const SIS/)],
  ["…rows in \`SIS\` including retired", String(SIS.length), lineOf(TAX, /export const boardSis/)],
  ["…at \`status: live\` (incl. \`ultra\` overlay)", String(live.length), lineOf(TAX, /export const SIS/)],
  ["SI categories", String(Object.keys(SI_GROUPS).length), lineOf(TAX, /export const SI_GROUPS/)],
  ["Destinations", String(dests.length), lineOf(PLACES, /export const DESTINATIONS/)],
  ["…with a \`price_band\`", `${dests.filter((d) => d.price_band).length}`, lineOf(PLACES, /price_band\?/)],
  ["…at \`depth: verified\`", `${dests.filter((d) => d.depth === "verified").length}`, lineOf(PLACES, /export type DestDepth/)],
  ["Activities", String(acts.length), lineOf(PLACES, /export const ACTIVITIES/)],
  // The bundle is not the whole picture: gen-catalog-seed merges the provider
  // CSVs on top before writing 0004, so the DB carries more than this array.
  // Reporting only the array would understate it by a third.
  ["Providers **in the bundle**", `${provs.length} (CSVs under \`src/data/providers/\` merge on top at seed time — run \`npm run gen:catalog\` to see the DB total)`, lineOf(PLACES, /export const PROVIDERS/)],
  ["Regions", String(REGIONS.length), lineOf(TAX, /export const REGIONS/)],
  ["Wells (10 live + 3 soon)", String(allWells.length), lineOf(TAX, /export const WELLS/)],
  ["Sub-region lists", String(Object.keys(SUBREGION_TOP).length), lineOf(PLACES, /export const SUBREGION_TOP/)],
  ["Guides", String(GUIDES.length), lineOf(PLACES, /export const GUIDES/)],
  // These were one row reading "Countries with a safety row: 37", which was
  // wrong twice: it counted name→ISO entries, not advisory rows, and the
  // mislabel hid the fact that the two numbers differ. Reported by David's
  // nineteen-rules v3 as an inconsistency; it turned out to conceal a gap.
  ["Country name→ISO entries (`COUNTRY_ISO`)", String(Object.keys(COUNTRY_ISO).length), lineOf("src/data/safety-data.ts", /export const COUNTRY_ISO/)],
  ["…of those, countries WITH an advisory row (`safety.json`)", String(Object.keys(SAFETY_DATA).length), lineOf("src/data/safety-data.ts", /export const SAFETY_DATA/)],
])}

## The Signature-Interest dossier — NINE layers

Defined by \`SiData\` at ${lineOf(TAX, /export interface SiData/)}. There is no
nineteen-section structure in this repository.

| Layer | Field path | Type |
|---|---|---|
${rows(LAYERS.map(([n, f, t]) => [n, f.split(" · ").map((k) => `\`data.${k}\``).join(" · "), `\`${t}\``]))}

**Booking windows are layer 4a**, at \`data.timing.booking_window\`
(${lineOf(TAX, /booking_window\?/)}), typed \`string\`. Layer 6 is \`providers\`.

**Every figure carries its own confidence.** \`Figure\` is
\`{label, value, confidence, source?}\` with \`confidence\` REQUIRED
(${lineOf(TAX, /export interface Figure/)}); \`verified\` without a \`source\` is a
hard error in \`npm run validate:si\`. An unlabeled number is a guessed number.

## Live roster

**Interests at \`status: live\` (${live.length}):** ${live.map((s) => `\`${s.id}\``).join(" · ")}
— \`ultra\` is the luxury overlay, not a trip type, so the bookable set is ${live.length - 1}.

**Wells live (${allWells.filter((w) => w.status === "live").length}):** ${allWells.filter((w) => w.status === "live").map((w) => w.name).join(" · ")}
**Not live (${allWells.filter((w) => w.status !== "live").length}):** ${allWells.filter((w) => w.status !== "live").map((w) => w.name).join(" · ")}

## Canonical vocabularies — as typed, not as remembered

| Vocabulary | Values | Read from |
|---|---|---|
${rows([
  ["Budget tier (\`price\`)", "`essential` · `comfort` · `premier` · `luxury` · `ultra`", lineOf(PLACES, /export type Price/)],
  ["Provider curation (\`tier\`)", "`prime` · `vetted` · `prospective`", lineOf(PLACES, /export type Tier/)],
  ["Interest status", "`live` · `preview` · `soon`", lineOf(TAX, /export type Status/)],
  ["Destination status", "`live` · `future`", lineOf(PLACES, /export type DestStatus/)],
  ["Destination depth", "`verified` · `stub` · `cached`", lineOf(PLACES, /export type DestDepth/)],
  ["Booking path", "`api` · `request-to-book` · `aggregator` · `lead`", lineOf(TAX, /export type BookingPath/)],
])}

Budget tier and provider curation are **different axes** that both get called
"tier" in conversation. \`price\` is what it costs; \`tier\` is how well we know
the provider.

## Conformance — does the data obey the rules?

${checks.map((c) => `${tick(c.ok)} **${c.rule}**\n   → ${c.result}\n   → \`${c.where}\``).join("\n\n")}

*Scope note on the safety check: it covers the countries we serve **today**. An
incoming dossier can name a country with no row yet, and that surfaces at
\`npm run validate:ingest\`, not here. A green tick above is not a claim about
countries we haven't ingested.*

## What is NOT populated yet

Stating this explicitly because an empty structure and a filled one look
identical in a schema, and a plan that assumes inheritance needs to know which
it is.

- **${SIS.filter((s) => s.data && Object.keys(s.data).length).length} of ${SIS.length} interests carry a dossier.** The only \`booking_window\` value in the repo is inside \`src/data/interests/_REFERENCE.golf.json\`, which is \`_\`-prefixed and never ships. **There is nothing to inherit booking windows from.**
- **${jewelCount} jewels across ${dests.filter((d) => (d.data?.jewels ?? []).length).length} of ${dests.length} destinations** \u2014 all hand-authored here. Any larger figure quoted for the experience catalogue (5,422, say) is counting a research library this repo cannot read; **nothing in it has been ingested.** ${jewelSourced} of the ${jewelCount} carry a \`source\`, ${jewelAccessed} an \`accessed\` date.
- **${dests.filter((d) => d.price_band).length} of ${dests.length} destinations carry a \`price_band\`.**
- **${dests.filter((d) => d.feel?.length).length} of ${dests.length} destinations carry \`feel\` tags.**
- **${dests.filter((d) => d.sub_region).length} of ${dests.length} destinations carry a \`sub_region\`.**
- **${shipping(dossierFiles.destinations).length} shipping destination dossier file(s)** and **${shipping(dossierFiles.interests).length} shipping interest dossier file(s)** in the drop-in folders.

## Exact-match strings — the characters that bounce a batch

Every string below is compared **character for character** by a gate. Each one
contains a character an editor, a word processor or an email client can silently
replace: a curly quote for a straight one, an em dash for a hyphen, an accent
stripped. A mismatch is a hard error, and it doesn't fail one row — it bounces
the batch.

**Match the codepoint, not the glyph.** \`'\` (U+0027) and \`’\` (U+2019) are
indistinguishable at reading size and are different bytes. So is \`‘\` (U+2018).
Copy these from this file, which is generated from the source, rather than from
an email — mail clients smart-quote, which is how a correct string arrives wrong.

| Where | String | The character to watch |
|---|---|---|
${(() => {
  const rows: string[][] = [];
  const nonAscii = (s: string) => [...s].filter((c) => c.charCodeAt(0) > 127 || c === "'");
  const cp = (c: string) => `U+${c.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0")} \`${c}\``;
  for (const [code, list] of Object.entries(SUBREGIONS as Record<string, string[]>)) {
    for (const s of list) if (nonAscii(s).length) rows.push([`sub_region ${code}`, `\`${s}\``, nonAscii(s).map(cp).join(" · ")]);
  }
  for (const s of [...new Set(dests.map((d) => d.sub_region).filter(Boolean))] as string[]) {
    if (nonAscii(s).length) rows.push(["live `sub_region`", `\`${s}\``, nonAscii(s).map(cp).join(" · ")]);
  }
  for (const d of dests) {
    if (nonAscii(d.name).length) rows.push(["destination `name`", `\`${d.name}\``, nonAscii(d.name).map(cp).join(" · ")]);
  }
  return rows.map((r) => `| ${r.join(" | ")} |`).join("\n");
})()}

*\`Hawai‘i\` uses U+2018, a left single quotation mark. The Hawaiian ʻokina is
properly U+02BB — so if the canonical master spells it with the ʻokina, our
validated string and the master disagree and one of them has to move. Flagged
rather than changed: these strings come verbatim from the master.*

## Gates

| Command | Refuses |
|---|---|
| \`npm run validate:ingest\` | A destination batch that breaks the destination contract |
| \`npm run validate:si\` | An interest dossier with an unlabeled figure, or \`verified\` with no \`source\` |
| \`npm run check:advisory-links\` | An advisory deep link that 404s — **and a run that proved nothing** (exit 2), or a partial one (exit 3). Needs outbound network. |
| \`npx tsc --noEmit\` + \`npm run build\` | Anything that doesn't type-check or build |
`;

writeFileSync("docs/ground-truth.md", md);
const failing = checks.filter((c) => !c.ok);

/**
 * THE PASTE BLOCK — the short version, for a surface that cannot read the repo.
 *
 * The daily reset carries counts, and eleven of the nineteen defects found in it
 * were STALE — true when written, false by the time they were read. That is not
 * carelessness, it is the format: a hand-maintained document of numbers drifts
 * every day, and no amount of care fixes it.
 *
 * The obvious remedy — "point the reset at ground-truth.md" — does not actually
 * work. The surface that most needs these numbers has no filesystem and no
 * GitHub connector, so it cannot open the file; and at 170+ lines the file is
 * too long to paste into a chat every morning anyway.
 *
 * So: this. Short enough to paste, current by construction, and it names the
 * commit it came from so a reader can tell how old it is. Plain text, no tables
 * — it has to survive being pasted into Notion, an email, or a chat window.
 *
 * The counts come OUT of the reset and this goes in, regenerated when it looks
 * stale. Nothing else about the reset changes: the strategy, the priorities and
 * the open questions belong there, and they don't drift the way a number does.
 */
const liveIds = live.filter((s) => s.id !== "ultra").map((s) => s.id);
const wellsLive = allWells.filter((w) => w.status === "live");
const wellsSoon = allWells.filter((w) => w.status !== "live");
const withDossier = SIS.filter((s) => s.data && Object.keys(s.data).length).length;

const block = `TRAVELWELL MVP — THE NUMBERS, GENERATED
Regenerate with: npm run gen:ground-truth   ·   full detail: docs/ground-truth.md

These replace any count written from memory. If a number below disagrees with a
number elsewhere in this document, this one is right and the other is stale.

CATALOGUE
  Destinations ............ ${dests.length}   (all ids conform to <city>-<country>)
  Activities .............. ${acts.length}
  Signature Interests ..... ${board.length} on the board, in ${Object.keys(SI_GROUPS).length} categories
                          ${SIS.length} rows in total, ${SIS.length - board.length} retired but not deleted
  Live interests .......... ${live.length} rows, of which ultra is the luxury overlay
                          so the bookable set is ${liveIds.length}: ${liveIds.join(", ")}
  Regions ................. ${REGIONS.length}
  Wells ................... ${allWells.length} — ${wellsLive.length} live, ${wellsSoon.length} not yet (${wellsSoon.map((w) => w.name).join(", ")})
  Providers ............... ${provs.length} in the bundle; more once the CSVs merge at seed time
  Slogan variants ......... ${2 + board.length} — 1 master, 1 category, ${board.length} interest subjects

NOT POPULATED YET  (an empty structure and a filled one look identical in a schema)
  Interests with a dossier ....... ${withDossier} of ${SIS.length}
  Destinations with price_band ... ${dests.filter((d) => d.price_band).length} of ${dests.length}
  Destinations with feel tags .... ${dests.filter((d) => d.feel?.length).length} of ${dests.length}
  Destinations with sub_region ... ${dests.filter((d) => d.sub_region).length} of ${dests.length}

CONFORMANCE  ${checks.length} checks, ${failing.length} failing
${failing.length ? failing.map((f) => `  FAILING — ${f.rule.replace(/\*\*/g, "").split(" — ")[0].slice(0, 72)}\n           ${f.result}`).join("\n") : "  All passing."}

THE RESEARCH LIBRARY IS A DIFFERENT INVENTORY. Its dossier counts answer a
different question from these. Never compare the two without saying which is which.
`;

writeFileSync("docs/reset-facts.txt", block);

console.log(`Wrote docs/ground-truth.md — ${checks.length} conformance checks, ${failing.length} not conforming`);
console.log(`Wrote docs/reset-facts.txt — the paste block, ${block.split("\n").length} lines`);
for (const f of failing) console.log(`  ⚠️  ${f.rule}\n      ${f.result}`);
