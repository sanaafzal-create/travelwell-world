/**
 * The legal entity, and the one place it is written down.
 *
 * ── WHY THIS FILE EXISTS (2026-08-26) ──────────────────────────────────────
 * On 20 August a letter went to our travel attorney naming "TravelVisions.World
 * INC" as the operating entity. It is not filed. The same wrong name is sitting
 * at the top of the research library's Search Console report of the same date.
 * Two surfaces, one day, and neither had anywhere to look it up.
 *
 * Nothing in this repository carried the wrong name — it carried NO name, which
 * is how a placeholder survives to launch. `ORIGIN` in `site.ts` exists for the
 * same reason and its lesson applies exactly: a fact kept in three heads ends up
 * right in one place and wrong in another with nothing to catch it.
 *
 * ⛔ NOTHING HERE IS DERIVED, INFERRED OR REMEMBERED. Every value is either a
 * sourced fact with its source named, or `null`. A legal page is the last place
 * to put something that merely sounds right.
 */

/**
 * The operating entity.
 *
 * SOURCED — David McCallister, 2026-08-20: "TravelWell.World LLC is the
 * operating entity today — the D-U-N-S, the CLIA and the Pestronk letter are all
 * correctly under it. TravelVisions.World INC isn't filed."
 */
export const LEGAL_ENTITY = "TravelWell.World LLC";

/**
 * The governing-law jurisdiction — the state under whose law the LLC is
 * organized and these terms are construed.
 *
 * ⛔ DELIBERATELY `null`, AND IT MUST STAY `null` UNTIL SOMEONE CONFIRMS IT.
 * We do not hold this fact. Sana is confirming it with David (2026-08-26), and
 * it is on the list for counsel's review of the disclosures.
 *
 * Naming a state here would be indistinguishable, to every reader, from a state
 * somebody checked — and picking a plausible one is the exact failure that put a
 * fictional entity in a letter to our attorney six days ago. A governing-law
 * clause that quietly names the wrong state is worse than one that is openly
 * unfinished, because only the second gets fixed.
 *
 * When it is confirmed: set it here, and `Terms.tsx` renders the real clause
 * with no other edit. `npm run gen:ground-truth` reports it as unset until then,
 * so it cannot be forgotten the way the old inline placeholder was.
 */
export const GOVERNING_LAW: string | null = null;
