/**
 * MCP safety block — SOURCE for the generated `supabase/functions/mcp/safety-fallback.ts`.
 *
 * This module is bundled (with the real resolver and the real data) by
 * `npm run gen:mcp-safety` into a self-contained file the Deno edge function
 * imports. Edit THIS file and the modules it imports, never the bundle.
 *
 * WHY A BUNDLE OF THE REAL RESOLVER, NOT A PARALLEL TABLE. The first fallback
 * was a one-off scratchpad bake of safety.json from June 2026. Its generator
 * was deleted with the scratchpad, nothing guarded it, and it sat deployed for
 * ten weeks while the whole safety architecture moved underneath it — still
 * citing the retired authority, still speaking numeric levels, and defaulting
 * an UNKNOWN country to "book-freely" (fail-open, the exact inversion of the
 * site's rule). An agent asking about Dubai got a stale March reading with a
 * source we had disowned. The fix is structural: the MCP now runs
 * `resolveSafety` — the same cascade, composite handling, zone join, and
 * fail-safe defaults as every page on the site — so the two surfaces cannot
 * disagree again, and `check:generated` refuses any commit where this bundle
 * is stale against its sources.
 *
 * WHAT AN AGENT RECEIVES (the payload-provenance contract, David 2026-08-29):
 * every safety fact carries its SOURCE, the date we READ it, and the OFFICIAL
 * ADVISORY PAGE — a cited fact an agent can answer for, never a bare claim.
 * And no numeric levels: the retired scale renders nowhere, machine surfaces
 * included. The advice is the FCDO threshold in words.
 */
import {
  resolveSafety,
  isoForCountry,
  fcdoThreshold,
  fcdoQuote,
  THRESHOLD_TEXT,
  ZONE_POSTURE_TEXT,
  type FcdoThreshold,
  type SafetyInfo,
} from "../src/data/safety-data";
import { advisoryLinks } from "../src/data/advisory-sources";

export interface McpSafety {
  /** The FCDO threshold in the advisory's own words — never a number. */
  advice: string;
  threshold: FcdoThreshold;
  /** True → content-only; an agent must never surface a booking action. */
  booking_hold: boolean;
  /**
   * True → bookable only after the traveler is shown the COMPLETE advisory
   * verbatim and consents. An agent cannot collect that consent on our behalf —
   * it happens on our consent screen, so treat this as "send the human to the
   * page, do not book directly".
   */
  consent_required: boolean;
  summary: string;
  considerations?: string[];
  /** The named FCDO advisory area this place sits in, when it sits in one. */
  zone?: string;
  /** The FCDO's verbatim sentence for that area, where we hold one. */
  fcdo_quote?: { area: string; text: string };
  /** Who says so — provenance travels with the fact. */
  source: string;
  /** When we read it. Absent when the row cannot truthfully claim a date. */
  read_date?: string;
  /** The official advisory page for this country — cite it, don't paraphrase us. */
  advisory_page?: string;
  /**
   * The country's named advise-against areas, so a country-level answer never
   * reads "no advisory against travel" while the FCDO's own headline says
   * "…to parts of". A zone transcribed from FCDO text carries the FCDO's
   * wording; a legacy zone (pre-re-read) points at the official page rather
   * than quoting words we do not hold.
   */
  restricted_areas?: { area: string; restriction: string; except?: string[] }[];
  /** True when this is the country-level read with no place-level dossier join. */
  derived: boolean;
  granularity: "country" | "place";
}

function agentBlock(
  resolved: SafetyInfo,
  countryName: string,
  granularity: "country" | "place",
): McpSafety {
  const threshold = fcdoThreshold(resolved);
  const quote = fcdoQuote(resolved);
  const restricted = (resolved.zones ?? [])
    .filter((z) => z.posture || z.lvl >= 3)
    .map((z) => ({
      area: z.name,
      restriction: z.posture
        ? ZONE_POSTURE_TEXT[z.posture]
        : "restricted area — this zone's transcription predates the FCDO re-read; read the official advisory page for its current wording",
      ...(z.except?.length ? { except: z.except } : {}),
    }));
  // A country query must not answer "no advisory against travel" when the
  // FCDO's own page headline is "…to parts of <country>". Only FCDO-transcribed
  // (postured) zones may put those words in the FCDO's mouth.
  const postured = (resolved.zones ?? []).filter((z) => z.posture);
  const partsAdvice =
    granularity === "country" && threshold === "none" && postured.length
      ? `advises against ${postured.some((z) => z.posture === "all") ? "all travel" : "all but essential travel"} to parts of ${countryName} — see restricted_areas`
      : null;
  const iso = isoForCountry(countryName);
  const fcdo = advisoryLinks(countryName, iso).find((l) => l.source.id === "fcdo");
  // A country outside our checked set gets NO page link: `advisoryLinks` would
  // derive a slug from the name, and a guessed URL that 404s reads as "we
  // checked" when we didn't. (An index link — composites — is honest and stays.)
  const page = fcdo && (iso !== null || !fcdo.deep) ? fcdo.href : undefined;
  return {
    advice: partsAdvice ?? THRESHOLD_TEXT[threshold],
    threshold,
    booking_hold: Boolean(resolved.bookingHold),
    consent_required: threshold === "essential-only",
    summary: resolved.summary,
    ...(resolved.considerations?.length ? { considerations: resolved.considerations } : {}),
    ...(resolved.inZone ? { zone: resolved.inZone.name } : {}),
    ...(quote ? { fcdo_quote: quote } : {}),
    source: resolved.source,
    ...(resolved.verified ? { read_date: resolved.verified } : {}),
    ...(page ? { advisory_page: page } : {}),
    ...(restricted.length ? { restricted_areas: restricted } : {}),
    derived: granularity === "country",
    granularity,
  };
}

/**
 * Country-level safety for `get_safety` by country name. An unknown country
 * resolves UNVERIFIED with booking held — never a false "safe". Composite rows
 * ("Belgium / Luxembourg") resolve as the stricter of both halves, exactly as
 * the site does.
 */
export function deriveSafety(country: string): McpSafety {
  const c = (country || "").trim();
  return agentBlock(resolveSafety({ country: c }, isoForCountry(c)), c, "country");
}

/**
 * Resolve and attach the safety block on a catalog row. The dossier's own
 * safety fields (its zone link above all) are INPUTS to the cascade, never the
 * output: an agent receives the resolved truth, not a raw join key. Handles
 * both row shapes — `get_destination` carries `data.safety`, search rows carry
 * a top-level `safety` (selected from `data->safety`).
 */
export function withSafety<T extends Record<string, unknown>>(row: T): T {
  if (!row) return row;
  const r = row as Record<string, any>;
  const hasData = r.data && typeof r.data === "object";
  const dossier = hasData ? r.data.safety : r.safety;
  const country = typeof r.country === "string" ? r.country : "";
  const resolved = resolveSafety(
    { country, ...(dossier ? { data: { safety: dossier } } : {}) },
    isoForCountry(country),
  );
  const block = agentBlock(resolved, country, dossier ? "place" : "country");
  if (hasData) r.data = { ...r.data, safety: block };
  else r.safety = block;
  return row;
}
