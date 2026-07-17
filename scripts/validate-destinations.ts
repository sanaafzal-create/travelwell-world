/**
 * Destination ingest validator — checks a normalized places.ts against
 * docs/dossier-ingest-shape.md BEFORE it goes near the generator or a DB.
 *
 * Usage: drop the pilot/library file's DESTINATIONS export at
 * `scratchpad/pilot-places.ts` (or point the import below at it), then:
 *   ./node_modules/.bin/esbuild scripts/validate-destinations.ts --bundle --platform=node --format=esm --define:import.meta.env='{}' --outfile=scratchpad/val.mjs && node scratchpad/val.mjs
 *
 * Catches the things that would error at migration time or silently break
 * matching: bad id scheme, illegal enums, invalid region codes, missing
 * required fields. Reports per-row; exits non-zero if anything fails.
 */
// @ts-expect-error — Sana drops the pilot here (standalone DESTINATIONS export)
import { DESTINATIONS } from "../scratchpad/pilot-places";
import { REGIONS, SIS } from "../src/data/taxonomy";

const REGION_CODES = new Set(REGIONS.map((r) => r.code));
const SI_SLUGS = new Set(SIS.map((s) => s.id));
const TIERS = new Set(["essential", "comfort", "premier", "luxury", "ultra"]);
const STATUS = new Set(["live", "future"]);
const DEPTH = new Set(["verified", "stub", "cached"]);
const DRAW = new Set(["anchor", "core", "emerging"]);
const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)+$/; // lowercase, hyphenated, ≥2 segments

const errs: string[] = [];
const warns: string[] = [];
let count = 0;

for (const [code, list] of Object.entries(DESTINATIONS as Record<string, any[]>)) {
  if (!REGION_CODES.has(code)) errs.push(`region "${code}" is not a valid 13-code region (FK would error)`);
  for (const d of list) {
    count++;
    const at = `[${code}] ${d.id ?? d.name ?? "?"}`;
    for (const f of ["id", "name", "country", "line", "status", "depth", "img"]) {
      if (d[f] == null || d[f] === "") errs.push(`${at}: missing required "${f}"`);
    }
    if (d.id && !ID_RE.test(d.id)) errs.push(`${at}: id "${d.id}" isn't <city>-<country> (lowercase, hyphenated)`);
    if (d.id && /[A-Z_ ]/.test(d.id)) errs.push(`${at}: id "${d.id}" has uppercase/space/underscore`);
    if (d.status && !STATUS.has(d.status)) errs.push(`${at}: status "${d.status}" not live|future`);
    if (d.depth && !DEPTH.has(d.depth)) errs.push(`${at}: depth "${d.depth}" not verified|stub|cached`);
    if (d.draw_rank != null && !DRAW.has(d.draw_rank)) errs.push(`${at}: draw_rank "${d.draw_rank}" not anchor|core|emerging`);
    if (d.price_band != null && !TIERS.has(d.price_band)) errs.push(`${at}: price_band "${d.price_band}" not a valid tier`);
    for (const tb of d.tier_range ?? []) if (!TIERS.has(tb)) errs.push(`${at}: tier_range has "${tb}" (not a valid tier)`);
    for (const s of d.si ?? []) if (!SI_SLUGS.has(s)) warns.push(`${at}: si "${s}" isn't a known SI slug (won't surface)`);
    if (d.data != null && typeof d.data !== "object") errs.push(`${at}: data must be an object (jsonb)`);
    if (!(d.si ?? []).length) warns.push(`${at}: no si tags`);
    if (!(d.feel ?? []).length) warns.push(`${at}: no feel tags`);
  }
}

console.log(`\nValidated ${count} destinations across ${Object.keys(DESTINATIONS).length} regions.`);
if (warns.length) { console.log(`\n⚠︎ ${warns.length} warnings (won't error, but check):`); warns.forEach((w) => console.log("  · " + w)); }
if (errs.length) { console.log(`\n✗ ${errs.length} ERRORS (must fix before ingest):`); errs.forEach((e) => console.log("  ✗ " + e)); process.exit(1); }
else console.log("\n✓ Shape is clean — safe to run through the generator.");
