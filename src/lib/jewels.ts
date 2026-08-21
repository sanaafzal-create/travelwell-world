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
 * It does not sort by anything it can't measure. Order is destination order then
 * authoring order, which is a real editorial decision someone made. Sorting by
 * tier would imply luxury is better; sorting by "relevance" would need a score
 * we don't have. Stable and explicable beats clever.
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

export function jewelsForSi(
  destinations: Record<string, Destination[]>,
  siId: string,
  limit = 12
): PlacedJewel[] {
  const out: PlacedJewel[] = [];
  for (const list of Object.values(destinations)) {
    for (const dest of list) {
      // A destination we don't show has nowhere for the jewel's link to land.
      if (dest.status !== "live") continue;
      for (const jewel of dest.data?.jewels ?? []) {
        // `si` is one slug or several — normalise, never compare a raw value.
        // `=== siId` against a string field quietly excluded every jewel that
        // serves two interests, which is exactly the jewel most worth showing.
        if (jewelSis(jewel).includes(siId)) out.push({ jewel, dest });
      }
    }
  }
  return out.slice(0, limit);
}

/** How many destinations contributed — the section says so, so the count is checkable. */
export const destinationsBehind = (js: PlacedJewel[]): number =>
  new Set(js.map((j) => j.dest.id)).size;
