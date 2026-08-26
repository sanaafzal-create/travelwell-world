/**
 * Emit the taxonomy as MACHINE-READABLE sets, for surfaces that cannot import it.
 *
 *   npm run gen:board   → docs/board.json
 *
 * ── WHY THIS EXISTS (2026-08-26) ───────────────────────────────────────────
 * The research library's SI-slug mapping arrived with a guarantee: "the slug set
 * is YOURS, read from `sana/main:src/data/taxonomy.ts` at run time and never
 * typed into our file… 54 ids read; every target below is one of them."
 *
 * 54 is the tell. The board is 35. What yields exactly 54 is a scrape of every
 * `id: "…"` literal in that file, which sweeps in three sets that are not
 * interests: the 13 Wells, the 4 retired rows, and the 10 category headings.
 * So `shop` (a Well), `nightlife` (retired), and `nature` and `water` (category
 * headings — "Nature & Wellbeing" and "Water & Cruise") all passed a validator
 * that believed it was checking against the board.
 *
 * And the same scrape MISSES three real interests. `sailing`, `yacht` and `wine`
 * are merged into `SIS` from `special-interests.json` at module load, so they
 * never appear as `id:` literals — which is why 59 jewels valued `wine` were
 * mapped to `culinary` under the stated reason "no wine interest on the board".
 * There is one. This exact trio was reported missing for this exact reason on
 * 2026-08-14; the conformance check in `gen-ground-truth` exists because of it.
 *
 * A text scrape of a TypeScript file cannot distinguish a category from an
 * interest, and cannot see a value that arrives at runtime. Neither can be fixed
 * by scraping more carefully. So the sets are published, separated and named.
 *
 * ⛔ THE SETS ARE DELIBERATELY NOT MERGED. A consumer must not be able to write
 * `ids.includes(x)` and get a true for a Well. Anything reading this file should
 * read `interests[]` and nothing else unless it means something else.
 */
import { SIS, boardSis, SI_GROUPS, WELLS, LUX_WELLS } from "../src/data/taxonomy";
import { writeGenerated, VOLATILE_DATE } from "./lib/write-generated";

const board = boardSis(SIS);
const retired = SIS.filter((s) => (s as { retired?: boolean }).retired);

const payload = {
  _what: "The taxonomy as separated sets, for tools that cannot import taxonomy.ts. Generated — do not hand-edit.",
  _rule: "A slug is a Signature Interest ONLY if it appears in `interests`. Categories, Wells and retired rows are listed so a consumer can recognise them and reject them, never so it can accept them.",
  _generated_by: "npm run gen:board",
  counts: {
    interests: board.length,
    retired: retired.length,
    categories: SI_GROUPS.length,
    wells: WELLS.length + LUX_WELLS.length,
  },

  /** THE BOARD. The only valid target for an `si` value. */
  interests: board.map((s) => ({ id: s.id, name: s.name, status: s.status })),

  /**
   * In `SIS` and OFF the board. They keep their database row because the
   * generated seed carries `delete … where id not in (…)`, so removing one from
   * the array really drops it from Postgres. Never a valid mapping target.
   */
  retired: retired.map((s) => ({ id: s.id, name: s.name })),

  /**
   * CATEGORY HEADINGS, not interests. These are what a text scrape mistakes for
   * interests — `nature` and `water` are the two that reached a mapping.
   */
  categories: SI_GROUPS.map((g) => ({ id: g.id, name: g.name })),

  /** The Wells. A different axis entirely. `shop` is here, not in `interests`. */
  wells: [...WELLS, ...LUX_WELLS].map((w) => ({ id: w.id, name: w.name, status: w.status })),
};

const wrote = writeGenerated("docs/board.json", JSON.stringify(payload, null, 2) + "\n", VOLATILE_DATE);
console.log(
  `${wrote ? "Wrote" : "Unchanged"} docs/board.json — ${payload.counts.interests} interests · ` +
  `${payload.counts.retired} retired · ${payload.counts.categories} categories · ${payload.counts.wells} wells ` +
  `(a naive id-scrape of taxonomy.ts sees all four as one set of 54)`
);
