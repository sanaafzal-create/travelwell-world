/**
 * Jewels, gathered by Signature Interest.
 *
 * A jewel is authored inside a DESTINATION dossier — that is where the research
 * happens and where it belongs. But the query that most wants one is
 * interest-led: someone asking about liveaboard diving, or about ski, wants the
 * experiences, not a list of countries. Until now the interest page rendered
 * none of them, so every researched experience was reachable only by already
 * knowing which destination to open — which is the opposite of how anyone
 * arrives (David's decision 2, 2026-08-12).
 *
 * ── Two things this deliberately does NOT do ────────────────────────────────
 *
 * It does not fall back. If an interest has no jewels tagged to it, the section
 * doesn't render. The provider rail had the other behaviour and it put safari
 * lodges on the dive page — a fallback on a matching surface isn't a graceful
 * degradation, it's a wrong answer delivered confidently.
 *
 * It does not sort by anything it can't measure. Sorting by tier would imply
 * luxury is better; sorting by "relevance" would need a score we don't have.
 * Stable and explicable beats clever.
 *
 * ── BUT THE CAP HAS TO SPREAD (2026-08-17) ─────────────────────────────────
 * It used to take the first `limit` in destination-then-authoring order, which
 * was fine while an interest had a handful of jewels and silently became the
 * thing deciding the page once it had hundreds. Measured after the library's tag
 * mapping landed:
 *
 *   liveaboard   93 jewels across 21 destinations → all 12 shown from ONE (Red Sea)
 *   ski         333 across 58                     → 3
 *   ultra       133 across 62                     → 4
 *   romance     485 across 263                    → 5
 *
 * A shelf whose whole promise is breadth was rendering a monoculture, and
 * `destinationsBehind()` prints that count on the page — so the Dive Liveaboards
 * page said "1 destination" while we held twenty-one. Raising the cap would not
 * have fixed it; the first 24 would have come from two.
 *
 * So the cap now spreads: one jewel from each destination, then a second from
 * each, and so on. Twelve jewels become up to twelve PLACES. This adds no
 * ranking — within a destination the authoring order is untouched, and no
 * destination is preferred over another — it only changes which axis the
 * truncation cuts along, from "everything from the first few" to "a little from
 * many". Deterministic, and explicable in one sentence to a traveller.
 */
import type { Destination, Jewel } from "@/data/places";

/** A jewel with the destination it was authored in — the page needs both. */
export interface PlacedJewel {
  jewel: Jewel;
  dest: Destination;
}

/**
 * Every jewel tagged to this interest, across every destination we hold.
 *
 * Matches on the jewel's OWN `si` tag, never the destination's. A Zermatt
 * dossier tagged `ski` can carry a spa jewel tagged `wellness`, and it should
 * surface under Wellness rather than Ski — the jewel is the unit of interest,
 * which is the whole reason the field is on the jewel.
 */
/**
 * A jewel's interest slugs, always as a list.
 *
 * The ONE place that decides what `si` means, so a second reader can never
 * disagree with the first — the shape of bug this repo keeps finding is two
 * consumers of the same field that were written months apart.
 */
export const jewelSis = (jewel: { si?: string | string[] }): string[] =>
  jewel.si == null ? [] : Array.isArray(jewel.si) ? jewel.si : [jewel.si];

/**
 * ── AND THE CAP GAINED DEPTH (2026-08-28, David: "VERY THIN. Increase.") ────
 * The interleave bought breadth by spending depth: a cap of 12 showed twelve
 * places and ONE jewel each, so an interest holding 1.9 jewels per destination
 * (Romance) rendered one-and-done by construction. The shelf now shows up to
 * `maxDests` places and runs the interleave DEEPER into those same places —
 * twelve places × up to two jewels for the same authoring. Which destinations
 * participate is unchanged (the first twelve contributing, in catalog order —
 * stable and explicable); only how deep each is drawn from moved.
 */
export function jewelsForSi(
  destinations: Record<string, Destination[]>,
  siId: string,
  limit = 24,
  maxDests = 12
): PlacedJewel[] {
  // Grouped by destination, preserving both destination order and, inside each
  // destination, the order the jewels were authored in.
  const byDest: PlacedJewel[][] = [];
  for (const list of Object.values(destinations)) {
    for (const dest of list) {
      // A destination we don't show has nowhere for the jewel's link to land.
      if (dest.status !== "live") continue;
      const mine: PlacedJewel[] = [];
      for (const jewel of dest.data?.jewels ?? []) {
        // `si` is one slug or several — normalise, never compare a raw value.
        // `=== siId` against a string field quietly excluded every jewel that
        // serves two interests, which is exactly the jewel most worth showing.
        if (jewelSis(jewel).includes(siId)) mine.push({ jewel, dest });
      }
      if (mine.length) byDest.push(mine);
    }
  }

  // Round-robin: the first from each participating destination, then the
  // second from each… so the cap buys PLACES first and then depth within them.
  // With `limit` at or above the total this returns everything, in the same
  // order-preserving interleave — callers asking for all of it are unaffected
  // (pass Infinity for both to get the whole set).
  const pool = byDest.slice(0, maxDests);
  const out: PlacedJewel[] = [];
  const deepest = pool.reduce((m, l) => Math.max(m, l.length), 0);
  for (let round = 0; round < deepest && out.length < limit; round++) {
    for (const list of pool) {
      if (out.length >= limit) break;
      if (round < list.length) out.push(list[round]);
    }
  }
  return out;
}

/** How many destinations contributed — the section says so, so the count is checkable. */
export const destinationsBehind = (js: PlacedJewel[]): number =>
  new Set(js.map((j) => j.dest.id)).size;

/**
 * The WHOLE, so the shelf can say a truncation happened (2026-08-28).
 *
 * The research library's cap-ratchet named its own blind spot plainly: a
 * dev-time gate "cannot see that a cap of 12 now cuts a list of 333 — that
 * needs the list size at runtime, inside her app." This is that. The shelf
 * line used to present the SHOWN counts as the whole ("24 experiences across
 * 12 destinations") on an interest holding 586 across 311 — an under-claim no
 * reader could detect, which is the same defect as a silent truncation, worn
 * politely. The page now states shown-of-total, so growth under the cap is
 * visible on the surface it cuts, the day it happens, to everyone.
 */
export function jewelTotalsForSi(
  destinations: Record<string, Destination[]>,
  siId: string
): { jewels: number; dests: number } {
  let jewels = 0;
  const dests = new Set<string>();
  for (const list of Object.values(destinations)) {
    for (const dest of list) {
      if (dest.status !== "live") continue;
      for (const jewel of dest.data?.jewels ?? []) {
        if (jewelSis(jewel).includes(siId)) { jewels++; dests.add(dest.id); }
      }
    }
  }
  return { jewels, dests: dests.size };
}
