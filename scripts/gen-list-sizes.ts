/**
 * gen:list-sizes → docs/list-sizes.json
 *
 * THE OTHER HALF OF THE RESEARCH LIBRARY'S CAP RATCHET (their ask, 2026-08-24).
 *
 * Their hunter ranks every literal truncation on a published surface — 53 of
 * them — and grandfathers each by file:line:cap. Its stated blind spot: it can
 * see that a cap of 12 exists, but not that the list it cuts now holds 333.
 * That length only exists here, where the catalog does. So the build emits it:
 * one row per capped published surface — surface · list · cap · current length
 * · what the reader is shown — and their ratchet can compare a cap against
 * what it actually cuts. The class becomes DETECTABLE instead of findable in
 * hindsight.
 *
 * It is a generated file guarded by `check:generated` (and therefore by the
 * pre-commit hook), so the lengths regenerate on any catalog change — a
 * recorded size cannot go quietly stale, which is what would make it a second
 * copy of the truth rather than a reading of it.
 *
 * `reader_can_tell` is their clause ③, recorded per surface: a truncation the
 * reader cannot detect is the four-regions class; a visible count with a path
 * to the rest is not. Every surface here should say how it tells the reader —
 * a "NO" in that field is an open defect, not a note.
 */
import { writeGenerated } from "./lib/write-generated";
import { mergedDestinations } from "./lib/destination-batches";
import { jewelsForSi, jewelTotalsForSi, destinationsBehind } from "../src/lib/jewels";
import { SIS, boardSis, WELLS, LUX_WELLS, REGIONS } from "../src/data/taxonomy";
import { PROVIDERS } from "../src/data/places";
import type { Destination } from "../src/data/places";

// The merged catalog — bundle + every drop-in batch — because the shelf serves
// the merged set and a length read from the 44-row bundle would understate
// every ingested interest (the SF-21 partial-read class, avoided on purpose).
const dests = mergedDestinations() as unknown as Record<string, Destination[]>;

// ── The jewels shelf (SiDetail · JewelsSection) ─────────────────────────────
const SHELF_CAP = 24;   // src/lib/jewels.ts jewelsForSi limit
const SHELF_DESTS = 12; // src/lib/jewels.ts jewelsForSi maxDests
const shelf: Record<string, { length: number; shown: number; dests: number; dests_shown: number }> = {};
for (const si of boardSis(SIS)) {
  const totals = jewelTotalsForSi(dests, si.id);
  if (!totals.jewels) continue;
  const shown = jewelsForSi(dests, si.id);
  shelf[si.id] = {
    length: totals.jewels,
    shown: shown.length,
    dests: totals.dests,
    dests_shown: destinationsBehind(shown),
  };
}

// ── The provider rail (SiDetail · providerRail) ─────────────────────────────
const RAIL_CAP = 9; // slice(0, 9) — and 3 per Well before it
const rail: Record<string, number> = {};
for (const si of boardSis(SIS)) {
  const n = Object.values(PROVIDERS).flat()
    .filter((p) => p.tier !== "prospective" && (p.si ?? []).includes(si.id)).length;
  if (n) rail[si.id] = n;
}

const doc = {
  _: "GENERATED — npm run gen:list-sizes. Do not hand-edit; the numbers are read from the catalog at generation time.",
  _for: "The research library's cap ratchet (their 2026-08-24 ask): compare each literal cap against the list it currently cuts.",
  generated: new Date().toISOString().slice(0, 10),
  surfaces: [
    {
      surface: "si-shelf · jewels (SiDetail JewelsSection)",
      cap: SHELF_CAP,
      cap_source: "src/lib/jewels.ts · jewelsForSi limit",
      reader_can_tell: "YES — the section line prints shown-of-total ('a selection of 24 from our N experiences across M destinations') whenever shown < length (2026-08-28)",
      lengths_by_interest: shelf,
    },
    {
      surface: "si-shelf · destinations behind it (same section)",
      cap: SHELF_DESTS,
      cap_source: "src/lib/jewels.ts · jewelsForSi maxDests",
      reader_can_tell: "YES — same line prints destination totals and '(12 shown here)'",
      note: "lengths are the dests/dests_shown fields on the row above",
    },
    {
      surface: "si-provider-rail (SiDetail providerRail)",
      cap: RAIL_CAP,
      cap_source: "src/pages/SiDetail.tsx · providerRail slice(0, 9), 3 per Well before it",
      reader_can_tell: "YES — the section line prints 'a selection of N from our M vetted partners' whenever cut (2026-08-28)",
      lengths_by_interest: rail,
    },
    {
      surface: "mega-menu · interests column",
      cap: 5,
      cap_source: "src/components/shell/MegaMenu.tsx · slice(0, 5) of live interests",
      length: boardSis(SIS).filter((s) => s.status === "live").length,
      reader_can_tell: "YES — column header prints the true count and links 'View all {n}'",
    },
    {
      surface: "mega-menu · wells column",
      cap: 8,
      cap_source: "src/components/shell/MegaMenu.tsx · slice(0, 8) of non-lux Wells",
      length: WELLS.length,
      length_note: `full roster is ${WELLS.length + LUX_WELLS.length} (the published count); the column lists non-lux`,
      reader_can_tell: "YES — true count + 'View all' link",
    },
    {
      surface: "mega-menu · regions column",
      cap: 8,
      cap_source: "src/components/shell/MegaMenu.tsx · slice(0, 8)",
      length: REGIONS.length,
      reader_can_tell: "YES — true count + 'View all' link",
    },
  ],
};

writeGenerated("docs/list-sizes.json", JSON.stringify(doc, null, 1) + "\n", [/"generated": "\d{4}-\d{2}-\d{2}"/]);
console.log(`docs/list-sizes.json — ${doc.surfaces.length} capped surfaces, ${Object.keys(shelf).length} interests carrying jewels, ${Object.keys(rail).length} carrying providers.`);
