/**
 * The count-floor gate — nothing may VANISH from the data without a human
 * saying so in the same commit.
 *
 * Built 2026-10-01, the day the library lost eleven countries out of their
 * FCDO warning-text file to a block of swallowed timeouts (their letter,
 * F1–F4). Their guard watched the wrong number (the fetch count, with a 20%
 * tolerance) and the loss was found by a human reading a diff. David's F3:
 * "I want something watching for this automatically rather than somebody
 * noticing a diff."
 *
 * Our generators never touch the network, so a timeout can't shrink our data —
 * but a bad merge, a truncated file, a script with an overeager filter, or a
 * batch that replaces 520 rows with 50 all can, and the generated seed carries
 * `delete ... where id not in (...)`, so a shrunken source really does delete
 * rows from Postgres on the next re-run. This gate makes any shrink loud:
 *
 *   · `scripts/lib/count-floors.json` records the expected count of every
 *     load-bearing collection, measured from source.
 *   · This check re-measures and REFUSES on any mismatch, in either direction:
 *       BELOW the floor is the vanishing-country shape — the commit stops.
 *       ABOVE the floor means the floors are stale — bump them, staged, in the
 *       same commit, so the floor always equals reality and a later drop back
 *       to a stale floor can't pass.
 *   · `--accept` rewrites the floors to what is measured. Growth: run it and
 *     stage the file. Shrink: run it ONLY when the removal is deliberate, and
 *     say why in the commit message — that sentence is the human the gate
 *     exists to summon.
 *
 * Runs in the pre-commit gate loop (sub-second, deterministic, network-free).
 */
import { readFileSync, writeFileSync } from "node:fs";
import SAFETY from "../src/data/safety.json";
import { SIS, boardSis, WELLS, LUX_WELLS, REGIONS, LOCALES } from "../src/data/taxonomy";
import { DESTINATIONS, PROVIDERS, GUIDES } from "./ssr/places-merged";

const FLOORS_PATH = "scripts/lib/count-floors.json";

const allDests = Object.values(DESTINATIONS).flat();
const liveDests = allDests.filter((d) => d.status === "live");
const board = boardSis(SIS) as typeof SIS;

const measured: Record<string, number> = {
  safety_countries: Object.keys(SAFETY).length,
  safety_zones: Object.values(SAFETY as Record<string, { zones?: unknown[] }>).reduce((n, c) => n + (c.zones?.length ?? 0), 0),
  destinations_total: allDests.length,
  destinations_live: liveDests.length,
  faq_questions: liveDests.reduce((n, d) => n + (((d.data as { faq?: unknown[] } | undefined)?.faq) ?? []).length, 0),
  board_sis: board.length,
  sis_live: board.filter((s) => s.status === "live").length,
  wells: WELLS.length + LUX_WELLS.length,
  regions: REGIONS.length,
  locales: LOCALES.length,
  providers: new Set(Object.values(PROVIDERS).flat().map((p) => p.name)).size,
  guides: GUIDES.length,
};

if (process.argv.includes("--accept")) {
  writeFileSync(FLOORS_PATH, JSON.stringify({
    __note: "The expected count of every load-bearing collection, measured from source. check:floors refuses any commit where reality disagrees in EITHER direction — below is the vanishing-country shape (library incident, 2026-09-29: eleven countries silently lost to swallowed timeouts), above means these floors are stale. Update ONLY via `npm run check:floors -- --accept`, staged in the same commit as the change that moved the counts; a deliberate shrink gets its reason in the commit message.",
    counts: measured,
  }, null, 2) + "\n");
  console.log(`✓ ${FLOORS_PATH} set to measured reality: ${Object.entries(measured).map(([k, v]) => `${k}=${v}`).join(" · ")}`);
  process.exit(0);
}

let floors: Record<string, number>;
try {
  floors = JSON.parse(readFileSync(FLOORS_PATH, "utf8")).counts;
} catch {
  console.error(`✗ ${FLOORS_PATH} is missing or unreadable. Run \`npm run check:floors -- --accept\` to create it from measured reality, and stage it.`);
  process.exit(1);
}

const fell: string[] = [];
const grew: string[] = [];
for (const [key, floor] of Object.entries(floors)) {
  const now = measured[key];
  if (now === undefined) { fell.push(`${key}: floor ${floor} but this check no longer measures it — remove or re-measure`); continue; }
  if (now < floor) fell.push(`${key}: ${floor} → ${now} (LOST ${floor - now})`);
  else if (now > floor) grew.push(`${key}: ${floor} → ${now} (+${now - floor})`);
}
for (const key of Object.keys(measured)) {
  if (!(key in floors)) grew.push(`${key}: new collection, unfloored (${measured[key]})`);
}

if (fell.length) {
  console.error(`✗ check:floors — a count FELL below its floor. This is the vanishing-country shape (eleven FCDO countries, 2026-09-29): data going missing with nothing watching.`);
  for (const f of fell) console.error(`   · ${f}`);
  console.error(`  If this shrink is DELIBERATE: \`npm run check:floors -- --accept\`, stage ${FLOORS_PATH}, and say why in the commit message. If it is not deliberate, you just caught it before it shipped.`);
  process.exit(1);
}
if (grew.length) {
  console.error(`✗ check:floors — the data grew past its recorded floors, so the floors are stale (a stale floor lets a later drop pass silently):`);
  for (const g of grew) console.error(`   · ${g}`);
  console.error(`  Run \`npm run check:floors -- --accept\` and stage ${FLOORS_PATH} in this commit.`);
  process.exit(1);
}
console.log(`✓ check:floors — all ${Object.keys(floors).length} collections exactly at their recorded counts.`);
