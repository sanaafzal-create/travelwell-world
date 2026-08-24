/**
 * Verify every advisory DEEP link actually resolves.
 *
 * David's rule for §7B is that the link must land on that country's page. The
 * failure mode is silent: a wrong slug 404s, and a 404 looks like we checked and
 * didn't. So the slug table is checkable rather than trusted.
 *
 * NEEDS OUTBOUND NETWORK. The build sandbox has none, so this has never been run
 * green here — run it from an environment that can reach the sources (the
 * research environment), then fix any slug it flags in
 * `src/data/advisory-sources.ts`, not in a component.
 *
 *   ./node_modules/.bin/esbuild scripts/check-advisory-links.ts --bundle \
 *     --platform=node --format=esm --outfile=scratchpad/links.mjs && node scratchpad/links.mjs
 *
 * Exits non-zero if any deep link fails, so it can gate a release.
 *
 * A 403 is reported separately from a 404 on purpose: 403 means the source is
 * refusing an automated request (State did exactly this to a plain GET), which
 * says nothing about whether the slug is right. Only 404 condemns a slug.
 *
 * ── PROVENANCE IS PART OF THE ANSWER (2026-08-24) ──────────────────────────
 * First real run, from Sana's laptop on residential egress: 78 of 117 proven,
 * 39 blocked — every blocked one `state`, no 404s anywhere. Read as a count that
 * is 39 links away from being trustworthy.
 *
 * It isn't. 38 of those 39 URLs came verbatim out of State's own machine-
 * readable Atom feed (`statePublishedUrl`); exactly one — Austria — is a slug we
 * derived ourselves. The thing this checker exists to catch is OUR slug being
 * wrong, and a URL State published cannot be our slug being wrong. So the honest
 * exposure was one link, not thirty-nine.
 *
 * A number that overstates risk 38× gets discounted, and a discounted check is a
 * check nobody reads. So blocked links are now split by where the URL came from,
 * and the exit code follows the split, not the raw count.
 */
import { COUNTRY_ISO } from "../src/data/safety-data";
import { advisoryLinks, isMultiCountry, statePublishedUrl } from "../src/data/advisory-sources";
import { mergedDestinations } from "./lib/destination-batches";

/**
 * ── CHECK EVERY LINK WE EMIT, NOT EVERY LINK WE HAVE A SAFETY ROW FOR ──────
 * This iterated `COUNTRY_ISO`, so it exercised 39 countries and 117 links. The
 * site emits advisory links for every country a destination sits in — 83 — so
 * 45 countries and roughly 135 traveller-facing links were never checked at all.
 * Mexico's 54 destinations were among them.
 *
 * Third instance of the same loop this week: a check derived from the countries
 * we already hold a row for, rather than the countries we actually serve. The
 * daily advisory checker has it too. The difference is that this one is fixable
 * today — `advisoryLinks` derives an FCDO/CDC slug from the country NAME and
 * joins State's feed on the name as well, so a country with no ISO code still
 * produces checkable links. No country-code map is needed, which is what makes
 * this safe to widen and the other one not.
 */
const servedCountries = (Object.values(mergedDestinations()).flat() as { country?: string }[])
  .map((d) => d.country).filter((c): c is string => !!c);

/**
 * Links a HUMAN opened in a real browser and confirmed landed on the right page.
 *
 * State refuses this script whichever verb and whichever headers it uses, from a
 * residential IP — method and headers are both ruled out, and what passes is a
 * real browser. So for a slug we derive ourselves and cannot fetch, a person
 * opening the URL is not a workaround; it is the only measurement available, and
 * it is a better one than the script would make.
 *
 * The entry carries WHO, WHEN and HOW, because a verification with no provenance
 * is the thing this repo keeps refusing to accept from anyone else. And these are
 * never silently suppressed: the run prints them with their date, so an entry
 * that has aged is visible rather than quietly counted as fine. A slug can change
 * under a manual tick exactly as it can under an automated one.
 */
const MANUALLY_VERIFIED: Record<string, { on: string; by: string; how: string }> = {
  "Austria|state": {
    on: "2026-08-24",
    by: "Sana",
    how: "opened in a browser; landed on the Austria travel advisory page",
  },
  // The negative results belong here as much as the positives — see
  // SLUG_OVERRIDES_BY_NAME for what each one became:
  //   Monaco · state    — did not open. Slug removed, index fallback.
  //   Sint Eustatius    — the FCDO's Netherlands page declines to cover it and
  //                       says separate Dutch Caribbean pages exist. Slug unknown.
};
const VERIFY_KEY = (country: string, source: string) => `${country}|${source}`;

// A bare fetch gets bot-filtered by at least one of these sources; ask like a browser.
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-GB,en;q=0.9",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Returns the status and the method that produced it, so a run records HOW it
 * got its answer and not only what the answer was.
 *
 * The 403 retry is a HYPOTHESIS, and it is one variable: CDN bot rules in front
 * of travel.state.gov commonly reject HEAD outright while serving GET to the
 * same client. This has NOT been observed working — the sandbox cannot reach
 * State — so it is written to be falsifiable rather than asserted. If the retry
 * changes nothing, the run prints `403 (GET too)` and that is a second cell in
 * the matrix in docs/advisory-checker.md, not a reason to start tuning headers.
 * Do not stack a second change on top of this one before this one has a result.
 */
async function status(url: string): Promise<{ code: number | string; via: string }> {
  try {
    // HEAD first (cheap); some sites only answer GET.
    const head = await fetch(url, { method: "HEAD", headers: HEADERS, redirect: "follow" });
    if (head.status !== 405 && head.status !== 501 && head.status !== 403) {
      return { code: head.status, via: "HEAD" };
    }
    const res = await fetch(url, { method: "GET", headers: HEADERS, redirect: "follow" });
    return { code: res.status, via: head.status === 403 && res.status === 403 ? "GET too" : "GET" };
  } catch (err) {
    return { code: `ERR ${(err as Error).message.slice(0, 60)}`, via: "-" };
  }
}

type Row = {
  country: string; iso: string; source: string; href: string; deep: boolean;
  code: number | string; via: string;
  /** True when the URL is the source's own published one, not a slug we built. */
  attested: boolean;
};

const rows: Row[] = [];
// Every country we hold a row for, PLUS every country a destination sits in.
// A served country with no safety row has no ISO — the links still derive from
// its name, and an unchecked link on a live page is the thing this exists to
// find.
const countries: [string, string | null][] = [
  ...Object.entries(COUNTRY_ISO) as [string, string][],
  ...[...new Set(servedCountries)]
    .filter((c) => !(c in (COUNTRY_ISO as Record<string, string>)))
    .sort()
    .map((c) => [c, null] as [string, null]),
];
const withRow = Object.keys(COUNTRY_ISO).length;
console.log(`Checking ${countries.length} countries × 3 sources — ${withRow} with a safety row, ${countries.length - withRow} served but rowless…\n`);

for (const [country, iso] of countries) {
  if (isMultiCountry(country)) {
    console.log(`· ${country} — names more than one country; no single advisory page. Skipped by design.`);
    continue;
  }
  for (const l of advisoryLinks(country, iso)) {
    // Only State hands us a URL; FCDO and CDC links are always slugs we derive,
    // so for those "unreached" really does mean "unknown".
    const attested = l.source.id === "state" && statePublishedUrl(country) === l.href;
    const base = { country, iso, source: l.source.id, href: l.href, attested };
    if (!l.deep) { rows.push({ ...base, deep: false, code: "index", via: "-" }); continue; }
    const { code, via } = await status(l.href);
    rows.push({ ...base, deep: true, code, via });
    await sleep(250);                                  // be a polite client
  }
}

const deep = rows.filter((r) => r.deep);
const bad = deep.filter((r) => r.code === 404);
const blocked = deep.filter((r) => typeof r.code === "number" && (r.code === 403 || r.code === 429));
const errored = deep.filter((r) => typeof r.code === "string");
const ok = deep.filter((r) => typeof r.code === "number" && r.code >= 200 && r.code < 400);

// The split that matters: an unreached link whose URL the SOURCE published
// cannot be a slug of ours that is wrong, which is the only thing this checker
// is able to catch. An unreached link built from our own slug rule genuinely is
// unknown. Same HTTP status, different risk, so they are counted apart.
const unreached = [...blocked, ...errored];
const unreachedAttested = unreached.filter((r) => r.attested);
const unreachedOursAll = unreached.filter((r) => !r.attested);
// A human-verified link is still unreached by the script — it is NOT folded into
// the proven count, because it was not proven by this run. It is separated out so
// the "could be hiding a wrong slug" number means only what it says.
const manuallyOk = unreachedOursAll.filter((r) => MANUALLY_VERIFIED[VERIFY_KEY(r.country, r.source)]);
const unreachedOurs = unreachedOursAll.filter((r) => !MANUALLY_VERIFIED[VERIFY_KEY(r.country, r.source)]);

console.log(`\n── ADVISORY LINK CHECK ─────────────────────`);
console.log(`deep links: ${deep.length}   ok: ${ok.length}   404 (wrong slug): ${bad.length}   403/429 (blocked): ${blocked.length}   errors: ${errored.length}`);
console.log(`index fallbacks (no confirmed slug): ${rows.filter((r) => !r.deep).length}`);
if (unreached.length) {
  console.log(`of the ${unreached.length} unreached — source-published URL: ${unreachedAttested.length}   our derived slug: ${unreachedOurs.length}${manuallyOk.length ? `   hand-verified in a browser: ${manuallyOk.length}` : ""}`);
}

if (unreachedAttested.length) {
  console.log(`\n· ${unreachedAttested.length} unreached links are the source's OWN published URL (State's feed),`);
  console.log(`  so the slug is not ours to get wrong. Unreachable from this egress ≠ unknown.`);
  const viaGet = unreachedAttested.filter((r) => r.via === "GET too").length;
  if (viaGet) console.log(`  ${viaGet} refused GET as well as HEAD — the block is not the HTTP method.`);
}
if (manuallyOk.length) {
  console.log(`\n\u00b7 ${manuallyOk.length} unreached link(s) were verified BY HAND in a browser \u2014 not proven by this run:`);
  for (const r of manuallyOk) {
    const v = MANUALLY_VERIFIED[VERIFY_KEY(r.country, r.source)];
    console.log(`  ${r.country} \u00b7 ${r.source} \u2014 ${v.by}, ${v.on}: ${v.how}`);
  }
}
if (unreachedOurs.length) {
  console.log(`\n⚠︎ UNPROVEN AND OURS — derived slugs that could not be proved either way.`);
  console.log(`  These are the ones a wrong slug could be hiding in. Re-run from an allow-listed egress:`);
  for (const r of unreachedOurs) console.log(`  ${r.code}  ${r.country} · ${r.source}\n     ${r.href}`);
}
if (bad.length) {
  console.log(`\n✗ WRONG SLUGS — fix these in src/data/advisory-sources.ts (SLUG_OVERRIDES):`);
  for (const r of bad) console.log(`  ${r.country} (${r.iso}) · ${r.source}\n     ${r.href}`);
  process.exit(1);
}

// NOT PROVEN IS NOT PASSED. "No 404s" is trivially true when nothing was
// reached, and this printed a green tick on a run where all 108 links were
// blocked — the same shape as a 404 that reads as "we checked" when we didn't.
// A verifier that can return a tick without verifying anything is worse than no
// verifier, because it is the thing someone points at before shipping.
if (!ok.length) {
  console.log(`\n✗ NOTHING WAS VERIFIED — 0 of ${deep.length} deep links were reached.`);
  console.log(`  This is not a pass. Every link is still unproven. Run it from an egress`);
  console.log(`  that can reach travel.state.gov, gov.uk and cdc.gov before these go public.`);
  process.exit(2);
}
// A partial run is a partial answer, and says so.
//
// Exit 3 is reserved for the case that can still be hiding a wrong slug: one of
// OUR derived URLs went unproven. When every unproven link is the source's own
// published URL there is no slug of ours left unchecked, and that state gets its
// own code (4) rather than being folded into either a tick or an alarm.
//
// It gets its own code and not a pass because it is still not a 200 — and not a
// permanent 3 because a check that can never go green from the machine people
// actually run it on is a check people stop running.
if (unreachedOurs.length) {
  console.log(`\n⚠︎ PARTIAL — ${ok.length} of ${deep.length} proven; ${unreachedOurs.length} of OUR slugs unproven. No 404s among those reached.`);
  process.exit(3);
}
if (unreachedAttested.length) {
  console.log(`\n✓ No wrong slugs possible — ${ok.length} of ${deep.length} links proven, and all ${unreachedAttested.length} unreached are the source's own published URLs.`);
  console.log(`  Still unreachable from this egress, so liveness is unconfirmed for those.`);
  process.exit(4);
}
console.log(`\n✓ All ${ok.length} deep links resolve. None 404.`);
