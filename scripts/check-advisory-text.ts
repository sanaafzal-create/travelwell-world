/**
 * Does our stated REASON match the reason the source gives?
 *
 *   npm run check:advisory-text
 *
 * ── WHY A SECOND CHECK, WHEN THE LEVEL ALREADY HAS ONE ─────────────────────
 * `gen:ground-truth` compares our curated LEVEL against State's. Both Rwanda and
 * Uganda passed it: L3 and L4, agreeing exactly. And both cards were wrong.
 *
 * We said Rwanda was Level 3 "due to a regional Ebola health emergency" and
 * Uganda Level 4 "due to an active Ebola (Bundibugyo) outbreak". State's current
 * advisories for both say crime and unrest, and neither mentions Ebola,
 * Bundibugyo or Ituri anywhere (Rwanda reissued 2026-05-11, Uganda 2025-12-08).
 *
 * The number was right and the sentence beside it was wrong — which is the more
 * dangerous half, because the sentence is what a traveller reads and acts on. A
 * person told a Level 4 is a live haemorrhagic-fever outbreak makes different
 * decisions from one told it is crime and terrorism, and we had published the
 * former under our own name.
 *
 * ── HOW IT CHECKS ──────────────────────────────────────────────────────────
 * ONLY where we attribute a CAUSE. Both defects were of one exact shape: our
 * summary said "due to X", which asserts X as the reason for the level, and X was
 * not in the advisory. So the check reads only the `due to …` clause of OUR
 * summary and tests the hazards named inside it.
 *
 * Everything else in a row is OURS and stays unchecked. "Bushfire season and
 * tropical cyclones in the north" on Australia, "plan for earthquakes and the
 * typhoon season" on Japan, "Cyclone season Nov–Apr" on French Polynesia — all
 * true, all useful, none of them claiming State said it. The first version of this
 * check read the whole row and flagged all seven, which would have made it a gate
 * that fires on correct data. David's own note, the same week: a matcher that
 * fires on every instance of a word gets muted within a week, and then it catches
 * nothing at all. Scope is the thing that makes a check survive.
 */
import { readFileSync } from "node:fs";
import { SAFETY_DATA, COUNTRY_ISO } from "../src/data/safety-data";
import feedSnapshot from "../src/data/state-advisory-feed.json";
import { mergedDestinations } from "./lib/destination-batches";

interface FeedEntry { country: string; lvl: number; url: string; published: string | null; summary?: string }
const FEED = feedSnapshot.entries as FeedEntry[];

const normName = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
const FEED_NAME: Record<string, string> = {
  UAE: "United Arab Emirates", "South Korea": "Korea (Republic of)",
  "Turks & Caicos": "Turks and Caicos Islands", "St. Lucia": "Saint Lucia", Bahamas: "The Bahamas",
};
const byName = new Map(FEED.map((e) => [normName(e.country), e]));

/**
 * Named hazards. Each is a thing a traveller would act on differently, and each
 * is a word a source either uses or does not — no interpretation required.
 *
 * Deliberately excludes soft words ("risk", "danger", "caution", "concern") that
 * appear in almost every advisory and would make every row match everything.
 */
const HAZARDS: Array<{ name: string; ours: RegExp; theirs: RegExp }> = [
  { name: "Ebola", ours: /\bebola\b|bundibugyo/i, theirs: /\bebola\b|bundibugyo/i },
  { name: "an epidemic or outbreak", ours: /\boutbreak\b|\bepidemic\b|\bpandemic\b/i, theirs: /\boutbreak\b|\bepidemic\b|\bpandemic\b|\bhealth\b/i },
  { name: "cholera", ours: /\bcholera\b/i, theirs: /\bcholera\b/i },
  { name: "malaria", ours: /\bmalaria\b/i, theirs: /\bmalaria\b|\bmosquito|\bhealth\b/i },
  { name: "terrorism", ours: /\bterroris/i, theirs: /\bterroris/i },
  { name: "kidnapping", ours: /\bkidnap/i, theirs: /\bkidnap/i },
  { name: "armed conflict or war", ours: /\barmed conflict\b|\bwar\b|\bmissile\b|\bdrone\b/i, theirs: /\barmed conflict\b|\bwar\b|\bmissile\b|\bdrone\b|\bconflict\b|\bunrest\b/i },
  { name: "civil unrest", ours: /\bunrest\b|\bprotest|\bdemonstration/i, theirs: /\bunrest\b|\bprotest|\bdemonstration|\bcivil\b/i },
  { name: "landmines or UXO", ours: /\blandmine|\bunexploded|\bUXO\b/i, theirs: /\blandmine|\bunexploded|\bUXO\b/i },
  { name: "an exit ban", ours: /\bexit ban/i, theirs: /\bexit ban/i },
  { name: "wrongful detention", ours: /\bwrongful detention\b|\brisk of detention\b/i, theirs: /\bdetention\b|\bdetain/i },
  { name: "a natural disaster", ours: /\bhurricane|\bearthquake|\bvolcan|\bcyclone|\btyphoon/i, theirs: /\bhurricane|\bearthquake|\bvolcan|\bcyclone|\btyphoon|\bnatural disaster|\bweather\b/i },
];

interface Row { lvl?: number; country?: string; summary?: string; considerations?: string[]; source?: string }
const rows = SAFETY_DATA as unknown as Record<string, Row>;

const problems: string[] = [];
let compared = 0, noSource = 0;

for (const [displayName, iso] of Object.entries(COUNTRY_ISO)) {
  const ours = rows[iso];
  if (!ours) continue;
  const cand = [FEED_NAME[displayName], displayName, displayName.replace("&", "and"), `The ${displayName}`].filter(Boolean) as string[];
  const theirs = cand.map((c) => byName.get(normName(c))).find(Boolean);
  if (!theirs?.summary) { noSource++; continue; }
  compared++;

  // The attribution clause only — "…due to crime and unrest." Everything before
  // "due to", and every consideration, is our own voice and not a claim about
  // what the advisory says.
  const because = (ours.summary ?? "").match(/\bdue to\b([\s\S]*)$/i)?.[1] ?? "";
  if (!because.trim()) continue;
  const ourText = because;
  for (const h of HAZARDS) {
    if (h.ours.test(ourText) && !h.theirs.test(theirs.summary)) {
      problems.push(
        `${displayName} (${iso}): we name ${h.name}, and State's advisory — L${theirs.lvl}, published ${theirs.published} — does not mention it anywhere.`
      );
    }
  }
}

// ── THE SAME QUESTION, ASKED OF THE FAQ (David, 2026-08-19) ────────────────
// This gate only ever read `safety.json` country rows. David's point: the Ebola
// framing we corrected on the Rwanda and Uganda ROWS is still sitting in the FAQ
// answers underneath them — 16 answers on 7 destinations on his side. Same
// defect, one field over, and the check could not see it because nobody had
// pointed it there.
//
// It is NOT a copy of the country check. A destination FAQ legitimately names
// hazards no national advisory mentions — riptides, altitude, a road. Flagging
// those would fire on correct content, and a matcher that fires on correct data
// gets switched off.
//
// So it fires only when the answer ATTRIBUTES the hazard to an advisory: the
// sentence invokes a level or an authority AND names a hazard the source's own
// text does not contain. "L3 CONSENT (2026 regional Ebola-alert precaution)" is
// caught; "swim at the guarded cove" is not.
const ATTRIBUTES = /\bL[1-4]\b|\blevel\s*[1-4]\b|\badvisory\b|\bState Dept|\bState Department|\bFCDO\b|\breconsider travel\b|\bdo not travel\b|\bexercise (?:normal|increased)/i;

let faqChecked = 0;
for (const d of Object.values(mergedDestinations()).flat() as any[]) {
  const country = d.country as string | undefined;
  if (!country) continue;
  const cand = [FEED_NAME[country], country, country.replace("&", "and"), `The ${country}`].filter(Boolean) as string[];
  const theirs = cand.map((c) => byName.get(normName(c))).find(Boolean);
  if (!theirs?.summary) continue;
  for (const [i, f] of ((d.data?.faq ?? []) as any[]).entries()) {
    const a = String(f?.a ?? "");
    if (!a || !ATTRIBUTES.test(a)) continue;
    faqChecked++;
    for (const h of HAZARDS) {
      if (h.ours.test(a) && !h.theirs.test(theirs.summary)) {
        // A defect on a page a traveller can open today is a different urgency
        // from one on an unreleased row. Both are wrong; only one is live.
        const liveTag = d.status === "live" ? "LIVE" : "unreleased";
        problems.push(
          `[${liveTag}] ${d.id} · faq #${i + 1}: the answer invokes an advisory and names ${h.name}, which ${country}'s advisory — L${theirs.lvl}, published ${theirs.published} — does not mention anywhere.`
        );
      }
    }
  }
}

console.log(`\n── ADVISORY TEXT GATE ──────────────────────`);
console.log(`compared: ${compared} countries against State's own summary   no source text on file: ${noSource}`);
console.log(`           ${faqChecked} faq answers that invoke an advisory, checked the same way`);
// Ratcheted like the other traveller-facing prose gates: a pre-existing set must
// not hold every unrelated change hostage, and the target is zero rather than a
// tolerance. A new mismatch fails immediately.
const MAX = JSON.parse(readFileSync("scripts/lib/retired-authority-baseline.json", "utf8")).advisory_text_max as number;
if (problems.length > MAX) {
  console.log(`\n✗ ${problems.length} REASON MISMATCH(ES) — the level may agree while the stated cause does not:\n`);
  for (const p of problems) console.log("  ✗ " + p);
  console.log(`\nThe reason renders on the destination card and inside the Level 3 consent screen.`);
  console.log(`A traveller told a Level 4 is a live outbreak decides differently from one told`);
  console.log(`it is crime. Rewrite ours from the source text in src/data/state-advisory-feed.json,`);
  console.log(`or drop the claim. Do not soften it — softening keeps a hazard we cannot attribute.`);
  process.exit(1);
}
const liveProblems = problems.filter((p) => p.startsWith("[LIVE]")).length;
if (problems.length) {
  console.log(`\n⚠︎ ${problems.length} REASON MISMATCH(ES) at the ratchet (${liveProblems} on LIVE pages, target 0):`);
  for (const p of problems) console.log("  · " + p);
  console.log(`\nRewrite from the source text or drop the claim. Do not soften it — softening`);
  console.log(`keeps a hazard we cannot attribute. A human writes safety prose, never a script.`);
} else {
  console.log(`\n✓ No hazard is attributed to a source that doesn't name it.`);
}
