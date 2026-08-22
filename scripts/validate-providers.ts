/**
 * PROVIDER CSV GATE — the one David correctly noticed was missing.
 *
 *   npm run validate:providers                      (checks src/data/providers/)
 *   npm run validate:providers -- path/to/set.csv   (checks a batch before it lands)
 *
 * `validate:ingest` covers destination dossiers and `validate:si` covers interest
 * dossiers. Providers had nothing, so a supplier set could only be checked by
 * eye against an existing file — which is how eleven carefully-researched
 * liveaboard rows can be correct in every visible way and still never render.
 *
 * THE CHECK THAT MATTERS MOST IS `si`. A provider with no interest tag cannot
 * surface on any interest page: the rail filters by the interest being viewed,
 * so an untagged row is invisible no matter how good it is. That is not a
 * hypothetical — it is exactly why "liveaboard has zero providers" was true while
 * the table held rows. An empty `si` column is a silent delisting, so it is an
 * error here rather than a warning.
 *
 * Everything else is canon read from the live source, so the gate can't drift
 * from what the app accepts: the Wells, the five budget tiers, the three
 * curation tiers, the four handoff modes, the interest slugs, the region codes.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { SIS, REGIONS, ALL_WELLS } from "../src/data/taxonomy";

const WELL_IDS = new Set(ALL_WELLS.map((w) => w.id));
const SI_SLUGS = new Set(SIS.map((s) => s.id));
const REGION_CODES = new Set(REGIONS.map((r) => r.code));
const PRICE = new Set(["essential", "comfort", "premier", "luxury", "ultra"]);
const TIER = new Set(["prime", "vetted", "prospective"]);
const MODE = new Set(["api", "widget", "affiliate", "first-party"]);
// The commission column is a LANE LABEL, not a rate — David's own correction,
// 2026-08-13. A number here means someone recorded a percentage where a lane
// belongs, and it would render as though we were quoting terms.
const LOOKS_LIKE_A_RATE = /\d\s*%|\bpercent\b|^\s*\d+(\.\d+)?\s*$/i;

const REQUIRED = ["name", "well", "tier", "price", "mode", "description", "commission", "si"];

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
    else if (c === "," && !q) { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

const arg = process.argv[2];
const files: string[] = arg
  ? (statSync(arg).isDirectory() ? readdirSync(arg).filter((f) => f.endsWith(".csv")).map((f) => join(arg, f)) : [arg])
  : (() => { try { return readdirSync("src/data/providers").filter((f) => f.endsWith(".csv")).map((f) => join("src/data/providers", f)); } catch { return []; } })();

const errs: string[] = [];
const warns: string[] = [];
const seen = new Map<string, string>();          // name → where first seen
let rows = 0, withUrl = 0;
const bySi: Record<string, number> = {};

for (const file of files) {
  const lines = readFileSync(file, "utf8").trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) { errs.push(`${file}: empty file`); continue; }
  const header = parseCsvLine(lines[0]).map((h) => h.trim());
  for (const col of REQUIRED) {
    if (!header.includes(col)) errs.push(`${file}: header is missing the "${col}" column`);
  }

  lines.slice(1).forEach((line, i) => {
    const cells = parseCsvLine(line);
    const r: Record<string, string> = {};
    header.forEach((h, j) => { r[h] = (cells[j] ?? "").trim(); });
    const at = `${file}:${i + 2} ${r.name || "(no name)"}`;
    rows++;

    if (!r.name) errs.push(`${at}: no name`);
    else if (seen.has(r.name)) errs.push(`${at}: duplicate provider name — already in ${seen.get(r.name)}`);
    else seen.set(r.name, file);

    if (!WELL_IDS.has(r.well)) errs.push(`${at}: well "${r.well}" is not a Well id`);
    if (!TIER.has(r.tier)) errs.push(`${at}: tier "${r.tier}" not prime|vetted|prospective`);
    if (!PRICE.has(r.price)) errs.push(`${at}: price "${r.price}" not a budget tier`);
    if (!MODE.has(r.mode)) errs.push(`${at}: mode "${r.mode}" not api|widget|affiliate|first-party`);
    if (!r.description) warns.push(`${at}: no description — the card renders blank under the name`);

    // THE ONE THAT SILENTLY DELISTS A ROW.
    const si = (r.si || "").split("|").map((s) => s.trim()).filter(Boolean);
    if (!si.length) {
      errs.push(`${at}: no "si" tag — the interest rail filters by interest, so this row can never appear on any interest page. Pipe-separate several: liveaboard|diveglobal`);
    }
    for (const s of si) {
      if (!SI_SLUGS.has(s)) errs.push(`${at}: si "${s}" is not an interest slug`);
      else bySi[s] = (bySi[s] || 0) + 1;
    }

    // ── A PER-DOOR DESCRIPTION FOR A DOOR THIS PROVIDER DOESN'T STAND IN ────
    // `desc_by_si` lets one provider read differently on each interest page it
    // serves. The failure it invites is a framing keyed to an interest the row
    // does not carry: it is never rendered, never wrong on screen, and looks like
    // finished work — so an author fills it, ships it, and the Romance page keeps
    // showing the generic line with nobody able to say why.
    //
    // Refused rather than warned. A description written for a door is evidence
    // someone believed the provider stands in it, so the disagreement with `si`
    // is a real contradiction to resolve, not noise.
    if (r.desc_by_si) {
      let byDoor: Record<string, string> | null = null;
      try { byDoor = JSON.parse(r.desc_by_si) as Record<string, string>; }
      catch { errs.push(`${at}: desc_by_si is not valid JSON — expected {"romance": "…", "culinary": "…"}`); }
      for (const [door, line] of Object.entries(byDoor ?? {})) {
        if (!SI_SLUGS.has(door)) errs.push(`${at}: desc_by_si key "${door}" is not an interest slug`);
        else if (!si.includes(door)) errs.push(`${at}: desc_by_si has a description for "${door}" but the row's si column doesn't list it — it would never render. Add "${door}" to si, or drop the description.`);
        if (!String(line ?? "").trim()) errs.push(`${at}: desc_by_si["${door}"] is empty — an empty override silently falls back, which reads as the field not working`);
      }
    }

    if (r.region && !REGION_CODES.has(r.region)) errs.push(`${at}: region "${r.region}" is not a 13-code region (blank = cross-region, which is fine)`);

    if (r.commission && LOOKS_LIKE_A_RATE.test(r.commission)) {
      errs.push(`${at}: commission "${r.commission}" looks like a RATE. This column is a lane label — "Commission partner", "Affiliate partner", "Prospective partner", "First-party".`);
    }

    const url = r.booking_url || "";
    if (url) {
      withUrl++;
      if (!/^https:\/\//i.test(url)) errs.push(`${at}: booking_url must be absolute https`);
    } else if (r.mode === "affiliate") {
      // Not an error: David's Aggressor row is deliberately null because their
      // engine takes no URL parameters, and pointing at a marketing page while
      // implying bookability is the worse choice. But it changes what the app
      // says, so it should be a conscious omission rather than a missing cell.
      warns.push(`${at}: affiliate with no booking_url — the card will read "Atlas will connect you" rather than opening a partner site. Intended?`);
    }
  });
}

console.log(`\n── PROVIDER GATE ───────────────────────────`);
console.log(`files: ${files.length}   rows: ${rows}   with a booking URL: ${withUrl}`);
console.log(`interests covered: ${Object.entries(bySi).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join("  ") || "none"}`);
if (warns.length) { console.log(`\n⚠︎ ${warns.length} warnings:`); warns.slice(0, 15).forEach((w) => console.log("  · " + w)); }
if (errs.length) {
  console.log(`\n✗ ${errs.length} ERRORS (must fix before ingest):`);
  errs.forEach((e) => console.log("  ✗ " + e));
  process.exit(1);
}
console.log(`\n✓ Clean against live canon — safe to ingest.`);
