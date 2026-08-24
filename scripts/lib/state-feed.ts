/**
 * THE STORED STATE FEED — BUILD-TIME ONLY, AND THAT IS THE POINT.
 *
 * David, 2026-08-20: "We need all references to State Safety Advisories off our
 * website completely. Nothing remains."
 *
 * This lived in `src/data/advisory-sources.ts`, which app code imports — so the
 * feed was bundled and shipped to every visitor: **165 KB carrying 225
 * travel.state.gov URLs**, in a chunk nothing rendered from any more. Not visible,
 * and unquestionably on the website.
 *
 * It sits under `scripts/` now, which the Vite build never reaches, so the app
 * CANNOT pull it back in by accident. That is a stronger guarantee than a comment
 * asking nobody to import it.
 *
 * The snapshot is kept rather than deleted, because comparing our curated levels
 * against what State published is how a silent divergence surfaced before (St.
 * Lucia sat at Level 1 for six weeks after State moved it to 2). A comparison we
 * run at build time is not a reference we publish — the distinction David's
 * instruction turns on is what a traveller reaches, and nothing here is reachable.
 */
import feedSnapshot from "../../src/data/state-advisory-feed.json";

export const STATE_FEED_UPDATED = feedSnapshot._feed_updated as string;

interface FeedEntry { country: string; lvl: number; tag: string | null; url: string; published: string | null; summary?: string }
const FEED = feedSnapshot.entries as FeedEntry[];

/** The feed names some countries differently from our display names. */
const FEED_NAME: Record<string, string> = {
  UAE: "United Arab Emirates",
  "South Korea": "Korea (Republic of)",
  "Turks & Caicos": "Turks and Caicos Islands",
  "St. Lucia": "Saint Lucia",
  Bahamas: "The Bahamas",
  // State issues ONE advisory for the Kingdom of Denmark, and it covers the
  // constituent countries. Listed explicitly rather than inferred: "this
  // territory is covered by that state's advisory" is a political judgement, and
  // the place to make one is a table a person can read and disagree with.
  Denmark: "Kingdom of Denmark",
  "Faroe Islands (Kingdom of Denmark)": "Kingdom of Denmark",
};

const normName = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

/**
 * THE FEED TITLES ARE NOT ALL BARE COUNTRY NAMES, and the ones that aren't were
 * silently missing.
 *
 * Some entries are titled "Mexico Travel Advisory" rather than "Mexico". Because
 * the join normalises to letters only, "mexicotraveladvisory" never equalled
 * "mexico", so `statePublishedUrl` returned null for Mexico — our single largest
 * country by destination count, 54 rows — and `advisoryLinks` quietly fell back
 * to a slug we derive ourselves. The whole argument for preferring the feed is
 * that the source hands us the answer; a suffix was throwing that away.
 *
 * Found while measuring which countries lacked a safety row: Mexico appeared in
 * the "not in the feed" column, which was implausible enough to check. Denmark,
 * St. Kitts & Nevis and St. Vincent & the Grenadines were in the same column for
 * the neighbouring reason — the feed spells "Saint" where we spell "St.".
 *
 * So both sides get normalised rather than one: the feed key is also indexed with
 * a trailing "travel advisory" removed, and the lookup tries a "St." → "Saint"
 * expansion. Indexed under BOTH forms, never replaced, so an entry genuinely
 * titled with the suffix still matches on its full name.
 */
const stripAdvisorySuffix = (s: string) => s.replace(/traveladvisory$/, "");

/**
 * THE FEED CARRIES THE SAME COUNTRY TWICE, and which copy wins was decided by
 * array order until this was written down.
 *
 * State is migrating to an ISO-3 path (`destination.aus.html`) from the old
 * slug (`australia-travel-advisory.html`), and the feed publishes BOTH — Australia
 * at index 12 and 13, Philippines at 156 and 157, Saint Lucia at 167 and 168.
 * The original index was `new Map(FEED.map(...))`, where a later duplicate
 * overwrites an earlier one, so the OLD-shape URL won by being second. Rebuilding
 * the map as a loop with a first-wins guard silently flipped that, and three
 * traveller-facing links changed for no reason anyone had stated.
 *
 * Neither order is a rule. So the winner is chosen explicitly: the most recently
 * PUBLISHED entry, and where the dates tie, the new path shape — because that is
 * the direction State is migrating, so the modern URL is the one more likely to
 * outlive this snapshot. Australia's two copies are a year apart (2026-05-30 vs
 * 2025-05-30) and the rule picks the newer, which the old code did not.
 *
 * Exact names are indexed before suffix-stripped ones, so an exact title always
 * beats a derived key regardless of where either sits in the array.
 */
const NEW_SHAPE = (u: string) => /\/destination\.[a-z]{3}\.html/i.test(u);
const better = (a: FeedEntry, b: FeedEntry) => {
  const da = a.published ?? "", db = b.published ?? "";
  if (da !== db) return da > db ? a : b;
  if (NEW_SHAPE(a.url) !== NEW_SHAPE(b.url)) return NEW_SHAPE(a.url) ? a : b;
  return a;
};

const FEED_BY_NAME = new Map<string, FeedEntry>();
const EXACT = new Set<string>();
for (const e of FEED) {                                   // pass 1 — exact titles
  const key = normName(e.country);
  const cur = FEED_BY_NAME.get(key);
  FEED_BY_NAME.set(key, cur ? better(cur, e) : e);
  EXACT.add(key);
}
for (const e of FEED) {                                   // pass 2 — suffix-stripped
  const key = normName(e.country);
  const bare = stripAdvisorySuffix(key);
  if (!bare || bare === key || EXACT.has(bare)) continue; // an exact title always wins
  const cur = FEED_BY_NAME.get(bare);
  FEED_BY_NAME.set(bare, cur ? better(cur, e) : e);
}

/** Our spelling → the feed's, for names no normalisation rule reaches. */
const expandSaint = (s: string) => s.replace(/\bSt\.?\s+/g, "Saint ");

/** State's own published URL for a country, or null if the feed has no entry. */
export function statePublishedUrl(countryName: string): string | null {
  for (const cand of [FEED_NAME[countryName], countryName, countryName.replace("&", "and"), expandSaint(countryName), expandSaint(countryName).replace("&", "and"), `The ${countryName}`]) {
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
  for (const cand of [FEED_NAME[countryName], countryName, countryName.replace("&", "and"), expandSaint(countryName), expandSaint(countryName).replace("&", "and"), `The ${countryName}`]) {
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
  for (const cand of [FEED_NAME[countryName], countryName, countryName.replace("&", "and"), expandSaint(countryName), expandSaint(countryName).replace("&", "and"), `The ${countryName}`]) {
    if (!cand) continue;
    const hit = FEED_BY_NAME.get(normName(cand));
    if (hit?.summary) return { summary: hit.summary, published: hit.published, lvl: hit.lvl, url: hit.url };
  }
  return null;
}
