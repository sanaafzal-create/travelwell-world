/**
 * TravelWell.World — automated accessibility gate (WCAG 2.1 A/AA).
 *
 * Canon (CLAUDE.md): "Checkable, not a vibe — automated a11y checks in the build
 * so a regression fails the build, same discipline as the dossier QC gate." This
 * loads the built app and runs axe-core across the key routes; ANY WCAG 2 A/AA
 * violation exits non-zero so CI fails.
 *
 * Run against a served build:
 *   npm run build && npm run preview &   # serves http://localhost:4173
 *   npm run a11y                         # scans it, exits 1 on any violation
 *
 * Env:
 *   A11Y_BASE       base URL (default http://localhost:4173)
 *   PW_EXECUTABLE   Chromium executable path (for sandboxes with a prebuilt browser)
 */
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { existsSync } from "node:fs";

const BASE = process.env.A11Y_BASE || "http://localhost:4173";
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

// The demo-critical routes plus a spread of page shapes. Add routes here as pages ship.
const ROUTES = [
  "/", "/special-interests", "/regions", "/region/05A",
  "/destination/maasai-mara-kenya", "/destination/zermatt-switzerland",
  "/itinerary", "/flights", "/wells-surface", "/luxury",
  // The Level 3 consent gate — a safety screen, so it is audited like one. The
  // scrollable advisory quote failed `scrollable-region-focusable` on the first
  // build: a keyboard-only reader could not scroll to the rest of the advisory
  // they were being asked to consent to.
  "/go?to=Test%20Partner&well=stay&dest=cartagena-colombia",
  "/guides", "/providers", "/about", "/first-aid-kit",
];

// Prefer an explicit override, then the browser this container ships with, then
// whatever Playwright resolves for itself. A gate that only runs on one machine
// gets skipped on the others, and an accessibility check people skip is not a
// standard — it's a preference.
const PRE_INSTALLED = "/opt/pw-browsers/chromium";
const browser = await chromium.launch({
  executablePath: process.env.PW_EXECUTABLE || (existsSync(PRE_INSTALLED) ? PRE_INSTALLED : undefined),
  args: ["--no-sandbox"],
});
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
// Skip the first-visit cookie banner so it doesn't mask the page under test.
await context.addInitScript(() => { try { localStorage.setItem("tww:consent", "1"); } catch {} });
const page = await context.newPage();

let total = 0;
// UNREACHABLE IS NOT A VIOLATION, AND SAYING SO WAS A LIE (2026-08-25).
// A route that failed to load used to add 1 to `total`, so a run with the
// preview server down printed "❌ a11y gate FAILED — 15 violation node(s)".
// Zero nodes had been examined. The number was not an overstatement, it was a
// fabrication, and it is the mirror of the rule this repo already wrote for the
// advisory checker: a verifier that reports a result it did not measure is worse
// than no verifier, because someone points at it before shipping.
//
// Both outcomes still fail — an unreachable route is a real problem — but they
// fail as different things, with different exit codes, so "the server wasn't up"
// can never be read as "the pages have accessibility defects".
let unreachable = 0;
const byRule = {};
for (const route of ROUTES) {
  try {
    await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 20000 });
  } catch {
    console.error(`  ✗ could not load ${route}`);
    unreachable += 1;
    continue;
  }
  await page.waitForTimeout(700); // let React settle / lazy chunk mount
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const count = violations.reduce((n, v) => n + v.nodes.length, 0);
  total += count;
  if (count === 0) {
    console.log(`  ✓ ${route}`);
  } else {
    console.log(`  ✗ ${route} — ${count} violation node(s)`);
    for (const v of violations) {
      byRule[v.id] = (byRule[v.id] || 0) + v.nodes.length;
      console.log(`      [${v.impact}] ${v.id} (${v.nodes.length}) — ${v.help}`);
      v.nodes.slice(0, 3).forEach((n) => console.log(`         ${JSON.stringify(n.target)}`));
    }
  }
}

await browser.close();

console.log("\n────────────────────────────────────────");
const audited = ROUTES.length - unreachable;
if (unreachable === ROUTES.length) {
  // Nothing was read, so nothing is known. Exit 2, not 1: a build that treats
  // this as "accessibility broke" sends someone hunting a defect that isn't there.
  console.log(`⚠️  a11y gate DID NOT RUN — all ${ROUTES.length} routes unreachable at ${BASE}`);
  console.log(`   Nothing was audited, so this is not a pass and not a violation count.`);
  console.log(`   Start the server first:  npm run build && npm run preview`);
  process.exit(2);
}
if (unreachable > 0) {
  console.log(`❌ a11y gate FAILED — ${unreachable} of ${ROUTES.length} routes unreachable at ${BASE}`);
  console.log(`   ${audited} route(s) were audited and found ${total} violation node(s).`);
  for (const [rule, n] of Object.entries(byRule).sort((a, b) => b[1] - a[1])) console.log(`   ${rule}: ${n}`);
  process.exit(3);
}
if (total === 0) {
  console.log(`✅ a11y gate PASSED — ${ROUTES.length} routes, 0 WCAG 2 A/AA violations`);
  process.exit(0);
}
console.log(`❌ a11y gate FAILED — ${total} violation node(s) across ${ROUTES.length} routes`);
for (const [rule, n] of Object.entries(byRule).sort((a, b) => b[1] - a[1])) console.log(`   ${rule}: ${n}`);
process.exit(1);
