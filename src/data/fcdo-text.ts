/**
 * THE FCDO's OWN WORDS, PER COUNTRY — the store the consent and refusal
 * screens quote from.
 *
 * `fcdo-consent-text.json` is the research library's verbatim extract
 * (SANA-FCDO-CONSENT-TEXT, 2026-08-24): all 226 FCDO countries, each with its
 * threshold quotes ALREADY SPLIT BY FORM ("against all travel" vs "against all
 * but essential travel"), the page URL, the page date, and the ETag it was
 * fetched under. Its own header carries the property that makes it usable
 * here: "Every part body is the FCDO's own HTML, stored unchanged. Nothing
 * here is reworded, summarised or paraphrased." We store the file byte-for-
 * byte as delivered — editing it would break exactly that property.
 *
 * This closed the consent screen's stated gap: it said plainly "we don't hold
 * the advisory text on file" because we didn't. Now we do, and the screen
 * quotes it — hand-transcribing was never an option, because two of the four
 * hand-written screens this architecture replaced were caught inventing
 * sentences the source never wrote.
 *
 * ── The join is a VERIFIED slug, never a guess ─────────────────────────────
 * Lookup is our country display name → FCDO slug. The default derivation
 * covers 83 of our 95; the 10 aliases below are read off the library's
 * ETag-verified slug table (SANA-ADVISORY-LINK-SLUGS, 2026-08-24 — "a slug
 * with an ETag beside it is not a guess about a URL, it is a URL we opened"),
 * and the 2 non-entries carry their stated reasons. Never add an alias from
 * memory: Korea, Congo and Côte d'Ivoire are the standing examples of why.
 */
import fcdoJson from "./fcdo-consent-text.json";

export interface FcdoQuote {
  /** "against all travel" | "against all but essential travel" */
  form: string;
  /** The FCDO's sentence(s), verbatim. */
  text: string;
}

export interface FcdoCountryText {
  country: string;
  slug: string;
  url: string;
  /** The page's own publication date — what a consent is recorded against. */
  publicUpdatedAt: string;
  reviewedAt: string;
  etag: string;
  posture: string;
  alertStatus: string[];
  quotes: FcdoQuote[];
}

const COUNTRIES = (fcdoJson as unknown as { countries: Record<string, FcdoCountryText & { public_updated_at: string; reviewed_at: string; alert_status: string[] }> }).countries;

/**
 * Our display name → FCDO slug, where derivation can't reach it. Every row is
 * from the library's ETag-verified table — the FCDO files territories under
 * their covering advisory (its Denmark page states it "also covers the Faroe
 * Islands and Greenland"; Puerto Rico and the USVI sit on the `usa` page; the
 * Bonaire trio share one page). `Sint Maarten (NL) / Saint-Martin (FR)` maps
 * to the Dutch side's page per the library's verified call — the French half
 * lives on `st-martin-and-st-barthelemy`, which is where our St Barthélemy
 * row points.
 */
const FCDO_NAME_ALIAS: Record<string, string> = {
  Bonaire: "bonaire-st-eustatius-saba",
  Saba: "bonaire-st-eustatius-saba",
  "Sint Eustatius": "bonaire-st-eustatius-saba",
  "Faroe Islands (Kingdom of Denmark)": "denmark",
  "Puerto Rico (US territory)": "usa",
  "US Virgin Islands (US territory)": "usa",
  "United States": "usa",
  "Sint Maarten (NL) / Saint-Martin (FR)": "st-maarten",
  "St. Barthélemy (France/EU)": "st-martin-and-st-barthelemy",
  "Turks & Caicos": "turks-and-caicos-islands",
};

/**
 * Countries that correctly have NO FCDO page — a stated reason each, so an
 * absence here is a decision someone made, never a gap nobody noticed. The
 * FCDO issues no travel advice for the UK itself, and a row naming two
 * countries has two pages and therefore no single truthful deep link.
 */
const FCDO_NO_PAGE = new Set(["United Kingdom", "Belgium / Luxembourg"]);

// Same derivation the advisory links use (advisory-sources.ts) — kept
// character-identical so the two joins can never disagree about a name.
const derive = (countryName: string) =>
  countryName
    .replace(/\s*\([^)]*\)\s*$/, "")
    .replace(/&/g, " and ")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/**
 * The FCDO's verbatim record for a country, or null when we hold none.
 * Null is an answer the screens are built to say plainly ("we can't quote it,
 * read it at the source") — never a gap to paper over with our own summary.
 */
export function fcdoCountryText(countryName: string): FcdoCountryText | null {
  if (!countryName || FCDO_NO_PAGE.has(countryName)) return null;
  const slug = FCDO_NAME_ALIAS[countryName] ?? derive(countryName);
  const row = COUNTRIES[slug];
  if (!row) return null;
  return {
    country: row.country,
    slug: row.slug,
    url: row.url,
    publicUpdatedAt: (row as { public_updated_at?: string }).public_updated_at ?? "",
    reviewedAt: (row as { reviewed_at?: string }).reviewed_at ?? "",
    etag: row.etag,
    posture: row.posture,
    alertStatus: (row as { alert_status?: string[] }).alert_status ?? [],
    quotes: row.quotes ?? [],
  };
}
