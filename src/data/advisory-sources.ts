/**
 * TravelWell — the official advisory sources, and DEEP links into them.
 *
 * David's §7B: we publish our verification date, name the sources, hand the
 * traveler the link, and say plainly to read the advisory before they go. His
 * requirement on the link: it must go to that COUNTRY's page, not the source's
 * homepage — "that is the difference between a useful link and a gesture."
 *
 * ── Why this is a table and not string manipulation ────────────────────────
 * The sources don't share a slug. Portugal is `portugal` at the FCDO and
 * `portugal-travel-advisory` at State. Irregular names (the UAE, Turks & Caicos,
 * St. Lucia) don't derive from the display name under any rule that also works
 * for Kenya. So: derive the regular ones, override the rest, in one place.
 *
 * ── A wrong deep link is worse than a homepage link ────────────────────────
 * A 404 looks like we checked and didn't. So every URL this file generates is
 * checkable: `npm run check:advisory-links` fetches all of them and reports what
 * resolves. It needs outbound network, which the build sandbox doesn't have —
 * run it from an environment that does BEFORE these go public-facing, and fix
 * any slug it flags here rather than in a component.
 *
 * Framework-free, no network at read time — the same discipline as
 * emergency-numbers.ts. Building a URL never fetches anything.
 */

/**
 * State's own published advisory URLs, from its Travel Advisories feed
 * (snapshot 2026-08-17). See `state-advisory-feed.json`.
 *
 * ── Why we stopped deriving State's URLs ────────────────────────────────────
 * We built them from the display name: `<slug>-travel-advisory.html`. Checked
 * against the URL State itself publishes for each country, **14 of our 36
 * differed.** Thirteen because State has been migrating to a new path shape
 * (`destination.esp.html`, ISO-3 based) and our derivation still produced the
 * old one; one — Turks & Caicos — because our slug was simply wrong
 * (`turks-and-caicos-islands` where State uses `turks-and-caicos`).
 *
 * None of that was findable by rule. The source publishes the answer, so we use
 * the source's answer and derive only where the feed has no entry.
 *
 * ── THE JOIN IS THE COUNTRY NAME. NEVER THE `tag`. ─────────────────────────
 * Each feed entry carries a two-letter `Country-Tag`, and it is tempting because
 * it looks like a key. It is not one. Measured across 197 entries whose title
 * matches State's own GeoPoliticalArea table: **182 tags are the FIPS 10-4 code,
 * 15 are not** — some are ISO 3166-1 (Philippines `PH`, Australia `AU`), some
 * are neither (Switzerland `SR`, Malta `ML`, Libya `LB`, French Guiana `A2`).
 *
 * That mixture is worse than either system alone, because the odd ones collide
 * with a DIFFERENT country in ISO: `SR` is Suriname, `ML` is Mali, `LB` is
 * Lebanon. A join on `tag` does not fail — it silently attaches Suriname's
 * advisory to Switzerland. Reading the tag as ISO across our own country list
 * would have mis-attached four outright: Spain would show El Salvador's level,
 * South Korea Kiribati's, Switzerland China's, South Africa Zambia's.
 *
 * The title ("Switzerland - Level 1: Exercise Normal Precautions") is
 * unambiguous, human-checkable, and the same key the daily checker already
 * matches on. Keep it that way.
 */
import feedSnapshot from "./state-advisory-feed.json";

interface FeedEntry { country: string; lvl: number; tag: string | null; url: string; published: string | null; summary?: string }
const FEED = feedSnapshot.entries as FeedEntry[];

/** The feed names some countries differently from our display names. */
const FEED_NAME: Record<string, string> = {
  UAE: "United Arab Emirates",
  "South Korea": "Korea (Republic of)",
  "Turks & Caicos": "Turks and Caicos Islands",
  "St. Lucia": "Saint Lucia",
  Bahamas: "The Bahamas",
};

const normName = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
const FEED_BY_NAME = new Map(FEED.map((e) => [normName(e.country), e]));

/** State's own published URL for a country, or null if the feed has no entry. */
export function statePublishedUrl(countryName: string): string | null {
  for (const cand of [FEED_NAME[countryName], countryName, countryName.replace("&", "and"), `The ${countryName}`]) {
    if (!cand) continue;
    const hit = FEED_BY_NAME.get(normName(cand));
    if (hit) return hit.url;
  }
  return null;
}

/**
 * The level State published for a country at the snapshot date — for
 * RECONCILIATION, not for rendering. Our cards read `safety.json`, which is the
 * curated baseline a human has reviewed; this is what the gate compares it
 * against so a drift between the two shows up as a check rather than as a
 * traveler seeing a stale number.
 */
export function stateSnapshotLevel(countryName: string): { lvl: number; published: string | null } | null {
  for (const cand of [FEED_NAME[countryName], countryName, countryName.replace("&", "and"), `The ${countryName}`]) {
    if (!cand) continue;
    const hit = FEED_BY_NAME.get(normName(cand));
    if (hit) return { lvl: hit.lvl, published: hit.published };
  }
  return null;
}

/**
 * State's OWN WORDS for a country, plus when they published them.
 *
 * This is what the Level 3 consent screen renders. It is deliberately the stored
 * snapshot rather than anything hand-transcribed: the screens arrived with three
 * of four Cartagena lines paraphrased ("In some places, organized crime is
 * rampant" appears nowhere in State's text) and a Rwanda framing taken from a
 * superseded version of the advisory. Both were careful work by people who knew
 * the rule. Hand-transcription is simply not a reliable way to quote, and the
 * whole safety property of that screen is "we cannot get a quotation wrong".
 *
 * So the screen quotes this, and nobody retypes an advisory again.
 */
export function stateAdvisoryText(countryName: string): { summary: string; published: string | null; lvl: number; url: string } | null {
  for (const cand of [FEED_NAME[countryName], countryName, countryName.replace("&", "and"), `The ${countryName}`]) {
    if (!cand) continue;
    const hit = FEED_BY_NAME.get(normName(cand));
    if (hit?.summary) return { summary: hit.summary, published: hit.published, lvl: hit.lvl, url: hit.url };
  }
  return null;
}

export const STATE_FEED_UPDATED = feedSnapshot._feed_updated as string;

export type AdvisorySourceId = "state" | "fcdo" | "cdc";

export interface AdvisorySource {
  id: AdvisorySourceId;
  /** How we name it to the traveler. */
  name: string;
  /** Whose advisory this is — so a non-US, non-UK traveler knows to also check their own. */
  issuer: string;
  /** Where the link lands when we have no country slug for this source. */
  index: string;
}

export const ADVISORY_SOURCES: Record<AdvisorySourceId, AdvisorySource> = {
  state: {
    id: "state",
    name: "US State Department",
    issuer: "United States",
    index: "https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html",
  },
  fcdo: {
    id: "fcdo",
    name: "UK FCDO",
    issuer: "United Kingdom",
    index: "https://www.gov.uk/foreign-travel-advice",
  },
  cdc: {
    id: "cdc",
    name: "CDC Travel Health Notices",
    issuer: "United States · health",
    index: "https://wwwnc.cdc.gov/travel/notices",
  },
};

/**
 * Country slug per source, keyed by ISO alpha-2.
 *
 * `undefined` for a source means "we don't have a confirmed slug" — the link
 * falls back to that source's index rather than guessing, because a guess that
 * 404s is worse than an honest index link. Fill these in from the checker's
 * output; don't hand-type from memory.
 *
 * The default derivation (display name → lowercase, spaces to hyphens) covers
 * most countries; entries here exist only where that derivation is wrong.
 */
const SLUG_OVERRIDES: Record<string, Partial<Record<AdvisorySourceId, string>>> = {
  AE: { state: "united-arab-emirates", fcdo: "united-arab-emirates", cdc: "united-arab-emirates" },
  TC: { state: "turks-and-caicos-islands", fcdo: "turks-and-caicos-islands", cdc: "turks-and-caicos-islands" },
  LC: { state: "saint-lucia", fcdo: "st-lucia", cdc: "saint-lucia" },
  // FCDO is `bahamas`, not `the-bahamas` — the checker's first live run 404'd on
  // it (2026-08-11). Empirical beats plausible: this is the whole reason the run
  // reports per-country failures instead of a single pass/fail.
  BS: { state: "the-bahamas", fcdo: "bahamas", cdc: "bahamas" },
  KR: { state: "south-korea", fcdo: "south-korea", cdc: "south-korea" },
  PF: { state: "french-polynesia", fcdo: "french-polynesia", cdc: "french-polynesia" },
  ZA: { state: "south-africa", fcdo: "south-africa", cdc: "south-africa" },
  NZ: { state: "new-zealand", fcdo: "new-zealand", cdc: "new-zealand" },
  SA: { state: "saudi-arabia", fcdo: "saudi-arabia", cdc: "saudi-arabia" },
};

const derive = (countryName: string) =>
  countryName.normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/**
 * A destination whose `country` spans TWO countries has no single advisory page
 * (we write those with a slash — "Chile / Argentina").
 *
 * Deliberately a slash and nothing else: "&" and "and" appear inside plenty of
 * SINGLE country names — Turks & Caicos, Antigua & Barbuda, Trinidad and Tobago.
 * A looser rule silently downgraded Turks & Caicos to an index link.
 */
export const isMultiCountry = (countryName: string) => countryName.includes("/");

function slugFor(source: AdvisorySourceId, iso: string | null, countryName: string): string | null {
  if (isMultiCountry(countryName)) return null;
  const override = iso ? SLUG_OVERRIDES[iso.toUpperCase()]?.[source] : undefined;
  if (override) return override;
  const d = derive(countryName);
  return d || null;
}

export interface AdvisoryLink {
  source: AdvisorySource;
  href: string;
  /** False when we fell back to the source's index — the UI says so plainly. */
  deep: boolean;
}

/**
 * The links we hand a traveler for one destination's country.
 * Never throws, never fetches; returns an index link rather than a bad guess.
 */
export function advisoryLinks(countryName: string, iso: string | null): AdvisoryLink[] {
  return (["state", "fcdo", "cdc"] as AdvisorySourceId[]).map((id) => {
    const source = ADVISORY_SOURCES[id];
    // State publishes its own URL per country. Prefer it over anything we can
    // derive — a rule that produces 22 of 36 correctly is not a rule worth
    // keeping when the source hands you the answer.
    if (id === "state" && !isMultiCountry(countryName)) {
      const published = statePublishedUrl(countryName);
      if (published) return { source, href: published, deep: true };
    }
    const slug = slugFor(id, iso, countryName);
    if (!slug) return { source, href: source.index, deep: false };
    const href =
      id === "state" ? `https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/${slug}-travel-advisory.html`
      : id === "fcdo" ? `https://www.gov.uk/foreign-travel-advice/${slug}`
      : `https://wwwnc.cdc.gov/travel/destinations/traveler/none/${slug}`;
    return { source, href, deep: true };
  });
}
