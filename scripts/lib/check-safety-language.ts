import { RETIRED_AUTHORITY_RE } from "../../src/lib/retired-authority";
/**
 * NEVER PROMISE "SAFE". Locked canon, and until now nothing enforced it.
 *
 * We keep travellers INFORMED so they can be as safe as possible. We do not
 * promise safety — that is an outcome nobody controls, and a guarantee we cannot
 * stand behind. Travel-safety content also sits in the highest-scrutiny category
 * search engines have, and our FAQ answers auto-emit FAQPage structured data, so
 * a promise doesn't just appear on a page — it ships as a machine-readable claim.
 *
 * David locked the rule on 2026-08-02 and swept the research library for it,
 * finding 17 across 152 rows. Our own hand-written data had never been swept,
 * because the rule reached the library and not this repo. It carried ELEVEN:
 * three destination notes he spotted, and eight country-level summaries he did
 * not — the worse set, because a country summary renders on the Safety Card of
 * every destination in that country. "Switzerland is very safe" appeared under
 * Zermatt and St. Moritz both.
 *
 * ── THE RULE ABOVE WAS REVERSED. READ THIS BEFORE RESTORING ANYTHING ──────
 * This file used to say, in capitals, that the fix is NEVER to delete the
 * question — that people search "is X safe", the question deserves an answer,
 * and it should get the real risk instead of a promise. That was David's ruling
 * of 2026-08-02 and it is no longer in force.
 *
 * He reversed it on 2026-08-19 and confirmed it directly on 2026-08-24: "The
 * question as written is not to be allowed — stating that a destination is safe.
 * That's a promise we will not make. No one can."
 *
 * The reasoning that changed it is worth keeping, because the earlier argument
 * was not wrong about search demand: the ANSWER is now one standard shape
 * everywhere — the FCDO advisory verbatim, its date, and the decision is the
 * traveller's. Once the answer is fixed and identical on every page, a question
 * asking whether a place is safe has nothing left to do.
 *
 * This note exists because the old rule was stated emphatically enough that the
 * next person to read it would have restored 168 questions in good faith. A
 * superseded rule written in capitals is more dangerous than one written plainly.
 *
 * WHAT THIS DOES NOT FLAG, deliberately: "safer", "safety", "keep valuables
 * safe", "safe-deposit". The offence is asserting that a PLACE is safe, not the
 * word itself — a matcher that fires on every "safe" would be muted within a
 * week, and a muted check is worse than none.
 */
export interface SafetyLanguageHit {
  match: string;
  context: string;
}

/**
 * Assertions that a place IS safe, in the forms that actually get written:
 *   "Austria is very safe" · "the resort is safe" · "the beaches are safe"
 *   "remains perfectly safe" · "feels completely safe" · "there's no danger"
 * The subject-agnostic verb+adverb+`safe` shape catches paraphrases too, which a
 * literal list of phrases would miss.
 */
const PROMISE =
  /\b(?:is|are|was|were|remains?|stays?|feels?|seems?)\s+(?:\w+\s+){0,2}?safe\b(?!\w)|(?:perfectly|completely|totally|entirely|absolutely|100%)\s+safe\b|no\s+danger\b|nothing\s+to\s+worry\s+about\b|\bsafest\b|\bsafer\s+than\b/gi;
// ── `safest` WAS THE HOLE, AND IT IS THE COMMONER PHRASING ─────────────────
// The pattern above required the word `safe` with a word boundary after it, so
// "safest" never matched — `safe` is followed by `st`. Every superlative form
// walked through: "the safest tier", "one of the safest cities in Europe",
// "safer than most capitals".
//
// That is not a smaller claim than "is safe", it is a larger one, and it is how
// the sentence actually gets written. Found live on 2026-08-18 in FAQPage
// structured data on the deployed site: "Yes — freely bookable. Hungary is US
// Level 1 (Exercise Normal Precautions), the safest tier". Published under our
// name, in the surface an answer engine quotes, on the one claim the doctrine
// calls absolute.
//
// A rule that catches the plain form and misses the emphatic one is worse than
// no rule, because the emphatic one is what a confident author writes.

/**
 * A traveller-facing claim resting on the RETIRED advisory authority.
 *
 * David's decision, 2026-08-18: State stops being read, published or cited as a
 * safety authority anywhere in the product. Our own numbers say why it needs a
 * detector rather than a memo — all 38 rows in safety.json name State as their
 * source, and 164 FAQ answers across 157 destinations cite it in prose that
 * renders into FAQPage structured data.
 *
 * The Budapest answer is the shape to catch: *"Yes — freely bookable. Hungary is
 * US Level 1 (Exercise Normal Precautions), the safest tier."* The booking
 * conclusion is right under our doctrine — no advisory against travel means
 * freely bookable — and the authority it rests on is retired. That is worse than
 * a wrong answer, because it reads as defensible: anyone checking finds a sound
 * decision sourced to something we have said we do not use.
 *
 * Deliberately NOT rewritten by anything mechanical. A human reads the FCDO and
 * a human writes the posture — the alternative is what put a sentence State
 * never wrote into a Cartagena consent screen.
 */
// THE SAME PREDICATE THE APP PUBLISHES BY. Imported rather than restated: this
// gate COUNTS what `jsonld.ts` WITHHOLDS, and if the two definitions drift the
// ratchet stops describing the thing on the page. One rule, two consumers.
const RETIRED_AUTHORITY = new RegExp(RETIRED_AUTHORITY_RE.source, "gi");

/** Every retired-authority citation in a blob of text. */
export function findRetiredAuthority(text: unknown): SafetyLanguageHit[] {
  if (typeof text !== "string" || !text) return [];
  const hits: SafetyLanguageHit[] = [];
  for (const m of text.matchAll(RETIRED_AUTHORITY)) {
    const at = m.index ?? 0;
    hits.push({ match: m[0].trim(), context: text.slice(Math.max(0, at - 55), at + m[0].length + 45).trim() });
  }
  return hits;
}

/** Every safety promise in a blob of text, with enough context to find it. */
export function findSafetyPromises(text: unknown): SafetyLanguageHit[] {
  if (typeof text !== "string" || !text) return [];
  const hits: SafetyLanguageHit[] = [];
  for (const m of text.matchAll(PROMISE)) {
    const at = m.index ?? 0;
    hits.push({
      match: m[0].trim(),
      context: text.slice(Math.max(0, at - 55), at + m[0].length + 45).trim(),
    });
  }
  return hits;
}

/**
 * Walk a dossier's safety block and FAQ answers. Both render, and the FAQ also
 * emits structured data — so a promise there is published twice, once for a
 * reader and once for a machine that will quote it back.
 */
export function checkSafetyLanguage(
  at: string,
  data: unknown,
  out: { errs: string[]; warns: string[] },
): void {
  if (!data || typeof data !== "object") return;
  const d = data as { safety?: Record<string, unknown>; faq?: Array<{ q?: unknown; a?: unknown }> };

  for (const [field, value] of Object.entries(d.safety ?? {})) {
    for (const hit of findSafetyPromises(value)) {
      out.errs.push(`${at}: safety.${field} promises safety — "${hit.match}". Describe the real risk instead. …${hit.context}…`);
    }
  }
  // The ANSWER is checked for a promise, and the QUESTION is checked for being
  // asked at all — see FORBIDDEN_QUESTION. The second of those was the opposite
  // of the rule this file used to state; see the header.
  for (const [i, f] of (d.faq ?? []).entries()) {
    for (const hit of findSafetyPromises(f?.a)) {
      out.errs.push(`${at}: faq #${i + 1} answer promises safety — "${hit.match}". Rewrite it from the advisory, or delete the pair. …${hit.context}…`);
    }
  }
}

/**
 * A question that ASKS whether a place is safe.
 *
 * David, 2026-08-19: "The question as written is not to be allowed — stating
 * that a destination is safe. That's a promise we will not make."
 *
 * The whole PAIR goes, not the answer alone. An answer deleted from under its
 * question leaves the question standing with nothing behind it, which is worse
 * than either. And the research library established the constraint that makes
 * whole-pair deletion safe: no destination may be left with an empty `faq`, or
 * it stops emitting FAQPage entirely and the page gets weaker rather than safer.
 */
const FORBIDDEN_QUESTION =
  /\bis\s+[^?]{0,40}?\bsafe\b|\bsafe\s+to\s+(?:visit|travel|go)\b|\bhow\s+safe\b/i;

/** Every faq entry whose QUESTION may not be asked. */
export function findForbiddenQuestions(
  data: unknown,
): { index: number; q: string }[] {
  if (!data || typeof data !== "object") return [];
  const faq = (data as { faq?: Array<{ q?: unknown }> }).faq ?? [];
  const out: { index: number; q: string }[] = [];
  for (const [i, f] of faq.entries()) {
    const q = String(f?.q ?? "");
    if (q && FORBIDDEN_QUESTION.test(q)) out.push({ index: i + 1, q });
  }
  return out;
}

/**
 * Count retired-authority citations across everything traveller-facing.
 *
 * Counted rather than errored, and the caller ratchets on the total. 164 answers
 * across 157 destinations cite it today; erroring would paint the gate red until
 * 157 dossiers are rewritten by hand, and a permanently red gate is one people
 * learn to pass with --no-verify. A ratchet makes the set shrinkable and
 * un-growable, which is the property that matters. Same approach the research
 * library took on its own side, independently.
 */
export function countRetiredAuthority(
  at: string,
  data: unknown,
  found: { where: string; match: string; context: string }[],
): void {
  // ── THE WHOLE BLOB, NOT TWO FIELDS (2026-08-25) ───────────────────────────
  // This walked `safety.*` and `faq[].a` only — and the dive-group incident
  // measured what that missed: 29 retired-authority mentions sitting in
  // `booking`, 13 in `key_facts`, more in `orbit` and `timing`, all invisible
  // to a ratchet that was quoted as the proof the payload was clean. A check
  // pointed one level away from the thing it governs, again — the counter
  // described two fields while the number was read as describing the dossier.
  // Now every string in the dossier body is walked, with the path recorded, so
  // the count means what everyone already believed it meant.
  const walk = (node: unknown, path: string): void => {
    if (typeof node === "string") {
      for (const hit of findRetiredAuthority(node)) found.push({ where: `${at}: ${path}`, ...hit });
      return;
    }
    if (Array.isArray(node)) { node.forEach((v, i) => walk(v, `${path}[${i}]`)); return; }
    if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) walk(v, path ? `${path}.${k}` : k);
    }
  };
  walk(data, "");
}
