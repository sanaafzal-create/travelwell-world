/**
 * GLOBAL advisories — the ones that apply everywhere, not to one country.
 *
 * The State Department issues a Worldwide Caution that sits above the per-country
 * levels. It is live right now (David found it in the Consular Affairs API,
 * 2026-08-10) and it was invisible to us: our safety card only ever showed a
 * country level, so a caution covering every destination on the site appeared on
 * none of them.
 *
 * ── Rules this file follows ────────────────────────────────────────────────
 * · VERBATIM. A government advisory is quoted, never paraphrased. Summarising
 *   one is how you accidentally change what it says.
 * · ATTRIBUTED TO ITS ISSUER. This is the US State Department advising US
 *   citizens. A German traveler reading our page needs to know whose advice it
 *   is, or it reads as a claim of ours about the world.
 * · IT EXPIRES. `active: false` (or a withdrawal) removes it everywhere in one
 *   edit. A stale worldwide caution is worse than none — it trains people to
 *   ignore the banner.
 * · NETWORK-FREE, like every other safety layer here. The fortnightly checker
 *   will write this record; nothing fetches it at render time.
 */

export interface GlobalAdvisory {
  /** Set false the moment it's withdrawn — it then renders nowhere. */
  active: boolean;
  id: string;
  title: string;
  /** Who issued it, and therefore whose citizens it addresses. */
  issuer: string;
  /** ISO date it was issued. */
  issued: string;
  /** The advisory's own words. Do not paraphrase. */
  text: string;
  /** Where a traveler reads it in full. */
  url: string;
  /** When WE last confirmed it still stands. */
  verified: string;
}

/**
 * Issued 2026-02-28, still current as of the 2026-08-10 check.
 * Text quoted from the Bureau of Consular Affairs advisory record.
 */
// ── RETIRED 2026-08-20, AND TAKEN OUT OF THE BUNDLE RATHER THAN FLAGGED ────
// David: "We need all references to State Safety Advisories off our website
// completely. Nothing remains." Setting `active: false` stopped it rendering —
// this file's own documented mechanism — but the record still SHIPPED, so its
// text and its travel.state.gov URL sat in a JS chunk every visitor downloads.
// Not visible; unquestionably present.
//
// The record is kept as SOURCE rather than as data. Comments do not reach the
// browser, so what we published and when survives for us without being carried
// to a traveller, and the shape below is what to restore if a global advisory is
// ever needed again.
//
// export const WORLDWIDE_CAUTION: GlobalAdvisory = {
//   // RETIRED 2026-08-20 on David's ruling that no State reference remains on the
//   // site. This is the mechanism the file documents for exactly this: one edit,
//   // and the note stops rendering everywhere. The record is kept rather than
//   // deleted so the history of what we published, and when, survives.
//   active: false,
//   id: "us-worldwide-caution-2026-02",
//   title: "Worldwide Caution",
//   issuer: "US State Department",
//   issued: "2026-02-28",
//   text:
//     "Following the launch of U.S. combat operations in Iran, Americans worldwide and especially in the Middle East should follow the guidance in the latest security alerts. They may experience travel disruptions due to periodic airspace closures. The Department of State advises Americans worldwide to exercise increased caution.",
//   url: "https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/worldwide-caution.html",
//   verified: "2026-08",
// };

/**
 * The global advisories in force right now. **Empty is the normal state**, and it
 * is the state today — the only record we ever carried was State's Worldwide
 * Caution, retired above.
 *
 * The array stays, and the component that renders from it stays, because the
 * mechanism is right and a future advisory from an authority we do publish drops
 * straight in. What was removed is the DATA, not the capability.
 */
export const activeGlobalAdvisories = (): GlobalAdvisory[] =>
  ([] as GlobalAdvisory[]).filter((a) => a.active);
