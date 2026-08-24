/**
 * Does this traveller-facing sentence rest on the RETIRED advisory authority?
 *
 * David retired the US State Department as a safety authority on 2026-08-18:
 * it is not read, published or cited anywhere in the product. Our own numbers
 * are why this needs a predicate rather than a memo — every row in `safety.json`
 * names State as its source, and 153 FAQ answers across 150 destinations cite it
 * by URL.
 *
 * ── WHY THIS LIVES IN `src/lib` AND NOT IN THE GATE ────────────────────────
 * Two consumers need the same answer and they are on opposite sides of the
 * build: `jsonld.ts` decides whether to PUBLISH a Q&A into FAQPage, and
 * `scripts/lib/check-safety-language.ts` decides whether to COUNT it. If those
 * drift, the structured data withholds a different set from the one the ratchet
 * is tracking, and the number on the dashboard stops describing the thing on the
 * page.
 *
 * That is the failure this repo keeps finding — two readers of one field written
 * months apart — so the rule is written once and imported twice.
 */

/**
 * Deliberately matches the authority and its tier LANGUAGE, not the word
 * "level" alone. "Level 3" appears in plenty of prose that is not an advisory
 * claim; "Level 3 — Reconsider Travel" does not.
 */
export const RETIRED_AUTHORITY_RE =
  /\bU\.?S\.?\s*Level\s*[1-4]\b|State\s+Department|State\s+Dept\b|travel\.state\.gov|cadataapi\.state\.gov|Exercise\s+Normal\s+Precautions|Exercise\s+Increased\s+Caution|Reconsider\s+Travel|Do\s+Not\s+Travel|\bLevel\s*[1-4]\b(?=[^.]{0,60}\b(?:State|U\.?S\.?)\b)/i;
// The last clause is load-bearing and was nearly lost. A bare "Level 3" is not
// an advisory citation on its own — the phrase appears in ordinary prose — but
// "Level 3 … State Department" in one sentence is. Consolidating the gate's
// pattern into this file without it dropped the count from 366 to 355: eleven
// real citations that would have stopped being tracked AND stopped being
// withheld, while the number went DOWN, which reads as progress.
//
// That is the quiet way a ratchet gets defeated: not by editing the baseline,
// but by narrowing what the baseline counts.

/** True when a sentence cites the retired authority. Safe on any input. */
export function citesRetiredAuthority(text: unknown): boolean {
  return typeof text === "string" && text.length > 0 && RETIRED_AUTHORITY_RE.test(text);
}

/**
 * True when a Q&A pair should be withheld from FAQPage.
 *
 * The ANSWER only. A question may legitimately ask "is X safe right now?" —
 * that is what people search for, and it is the question we most want to be
 * found answering. It is the answer that makes the claim.
 */
export const faqAnswerIsPublishable = (f: { a?: unknown }): boolean =>
  !citesRetiredAuthority(f?.a);
