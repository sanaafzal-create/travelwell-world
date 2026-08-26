#!/usr/bin/env node
/**
 * The mark is ONE WORD. This fails the build if the two-word form ships.
 *
 *   npm run build && npm run check:brand
 *
 * WHY IT SCANS `dist/` RATHER THAN `src/`. The two-word pun was retired on
 * 2026-08-09, and the retirement is documented in source comments that quote it —
 * so a source scan has to special-case its own documentation, and a check with
 * exceptions is a check that erodes. The built output has comments stripped and
 * every template, translation, meta tag and JSON-LD field already inlined, so it
 * is both stricter and simpler: if the string is in `dist/`, a reader can see it.
 *
 * David's reasoning, 2026-08-04, and the last line is why this exists at all:
 *   · A brand with two forms doesn't have one.
 *   · The filing protects the CONSTRUCTION — "If It's [anything]… TravelWell." —
 *     so every two-word instance is a variant of our own mark on our own site,
 *     working against a filing that has to show consistent use in commerce.
 *   · His voice dictation produces "Travel Well" when he says "TravelWell", so a
 *     page carrying both forms makes it impossible for anyone downstream to tell
 *     deliberate poetry from a transcription error. One form removes the
 *     guesswork permanently.
 *
 * He also asked specifically that the sweep cover metadata and structured data,
 * not just visible copy — page titles, meta descriptions, og: tags, alt text,
 * error strings, and above all the JSON-LD publisher/brand/Organization.name,
 * "because structured data is the machine-readable version of the mark, so it is
 * what an AI cites when it names us." Scanning the built output covers all of
 * those in one pass, including the ones no visible-copy review would look at.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "dist";
const SCAN = /\.(html|js|css|json|webmanifest|txt|xml|svg)$/i;

/**
 * ── LAUNCH DAY IS ONE FLIP, NOT TWO EDITS (2026-08-26) ─────────────────────
 * Retiring the old name used to mean deleting one rule AND inverting the other,
 * and the note below already warned why that is dangerous: "a window where
 * neither name is enforced is how both end up shipping." A procedure that warns
 * against its own middle state should not have a middle state.
 *
 * So both rules read this constant and invert together. `false` today: the site
 * is TravelWell.World, and the unreleased name must not ship. On filing day this
 * becomes `true` and the pair swaps — TravelVisions becomes correct, TravelWell
 * becomes the failure — atomically, with no version of this file that enforces
 * neither.
 *
 * The research library's gate carries the same constant under the same name, so
 * the two repositories flip on one agreed date and neither can be caught holding
 * the other's state. ⛔ Do not flip this until the filing is through AND the
 * other side flips in the same window.
 */
const BRAND_SWITCHED = false;

const LIVE = BRAND_SWITCHED ? "TravelVisions.World" : "TravelWell.World";
const COMING = BRAND_SWITCHED ? "TravelWell.World" : "TravelVisions.World";
// The one-word rule always targets whichever name is NOT live, plus the two-word
// split of the live one.
const TWO_WORD_RE = BRAND_SWITCHED ? /travel\s+visions(?![a-z])/i : /travel\s+well(?![a-z])/i;
const UNRELEASED_RE = BRAND_SWITCHED ? /travel\s*well/i : /travel\s*visions/i;

const RULES = [
  {
    id: "two-word",
    // "travel well" NOT followed by another letter — so "travel wellness" is fine
    // and "Travel Well." is not. Apostrophes and punctuation after are still caught.
    re: TWO_WORD_RE,
    headline: "THE TWO-WORD FORM SHIPS",
    advice: `The mark is ONE WORD — TravelWell. A two-word instance is a variant of our own
mark on our own site, and for a filing resting on consistent use in commerce that
works against us. Fix it at the source, not here.

If the line is deliberate poetry, it still closes on the one-word mark: keep the
image ("The wild is calling.") and let the mark end it.`,
  },
  {
    // ── THE UNRELEASED NAME MUST NOT SHIP ───────────────────────────────────
    // The site is TravelWell.World. The rebrand to TravelVisions.World is real
    // and already on social, but it is NOT announced here — so the name reaching
    // a live page is neither a rebrand nor a typo, it is the two coexisting,
    // which is the one outcome that serves nobody: a page saying TravelVisions
    // beside 573 saying TravelWell reads as a mistake on whichever is correct.
    //
    // Not hypothetical. A research-library dossier authored under the new name
    // shipped `lalibela-ethiopia` with "Can I book a trip to Lalibela through
    // TravelVisions?", a TravelVisions.World meta title and a TravelVisions.World
    // byline — through every gate, into Postgres and into prerendered HTML,
    // because nothing was looking for a name that is not wrong, only early.
    //
    // TO RETIRE THIS RULE ON LAUNCH DAY: flip `BRAND_SWITCHED` above. Both rules
    // invert together, which is what removes the window this note used to warn
    // about — there is no longer a state where one is loosened and the other has
    // not yet been tightened.
    id: "unreleased-name",
    re: UNRELEASED_RE,
    headline: "THE UNRELEASED BRAND NAME SHIPS",
    advice: `The live site is TravelWell.World. TravelVisions.World is the coming rebrand and
it is not announced on this surface, so a page carrying it puts two brands in
front of the same reader.

Fix it in the SOURCE dossier or component, not here. If a research-library
delivery introduced it, tell the library — otherwise the next batch reintroduces
it and this gate catches it again after the work is redone.`,
  },
];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (SCAN.test(p)) out.push(p);
  }
  return out;
}

let files;
try {
  files = walk(ROOT);
} catch {
  console.error(`✗ No ${ROOT}/ to scan. Run \`npm run build\` first — this checks the SHIPPED output, not the source.`);
  process.exit(2);
}

const hitsByRule = new Map(RULES.map((r) => [r.id, []]));
for (const f of files) {
  const text = readFileSync(f, "utf8");
  for (const [i, line] of text.split("\n").entries()) {
    for (const rule of RULES) {
      const m = rule.re.exec(line);
      if (!m) continue;
      const at = Math.max(0, m.index - 60);
      hitsByRule.get(rule.id).push({ file: f, line: i + 1, excerpt: line.slice(at, m.index + 80).trim() });
    }
  }
}

// EVERY rule reports before exiting. Bailing on the first failure hides the
// second, and the person then fixes one thing, re-runs, and is surprised again.
let failed = false;
for (const rule of RULES) {
  const hits = hitsByRule.get(rule.id);
  if (!hits.length) continue;
  failed = true;
  console.error(`\n✗ ${rule.headline} — ${hits.length} occurrence(s) in the built output:\n`);
  for (const h of hits.slice(0, 20)) console.error(`   ${h.file}:${h.line}\n      …${h.excerpt}…`);
  if (hits.length > 20) console.error(`   …and ${hits.length - 20} more`);
  console.error(`\n${rule.advice}`);
}
if (failed) process.exit(1);

console.log(`✓ One form only — scanned ${files.length} built files against ${RULES.length} rules, no occurrences.`);
