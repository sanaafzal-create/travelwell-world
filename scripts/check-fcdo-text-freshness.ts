/**
 * Ask the FCDO whether our verbatim consent-text store has gone stale.
 *
 * `src/data/fcdo-consent-text.json` holds the threshold quotes the consent and
 * refusal screens render — 226 countries, byte-exact, fetched once. Nothing
 * watched it: the daily advisory checker covers only countries we serve, so
 * the other ~140 rows could drift forever and the first sign would be a
 * traveller reading last quarter's sentence on the highest-stakes screen we
 * have. The research library's SANA-9 delta (2026-08-29) proved the class by
 * arriving from outside: eight pages had moved since our fetch. (All eight
 * checked out harmless — zero threshold changes against the store — but the
 * next one is found by THIS, not by their delta file.)
 *
 * What this does: for every country in the store, GET the gov.uk Content API
 * (`/api/content/foreign-travel-advice/<slug>` — the machine-readable
 * endpoint, per the do-not-scrape rule) and compare `public_updated_at`
 * against the store's. A moved date is REPORTED, never auto-ingested — the
 * quotes are updated by a human read of the page, because safety text is not
 * a machine's call.
 *
 * NEEDS OUTBOUND NETWORK. The build sandbox has none — run from a networked
 * environment (Sana's laptop):
 *
 *   ./node_modules/.bin/esbuild scripts/check-fcdo-text-freshness.ts --bundle \
 *     --platform=node --format=esm --outfile=scratchpad/fcdofresh.mjs && node scratchpad/fcdofresh.mjs
 *
 * ── A BLOCKED RUN IS NOT A PASSING RUN (same law as check:advisory-links) ──
 * exit 0 = every page reached, none moved · exit 1 = pages moved (the list is
 * the output) · exit 2 = NOTHING was reachable, nothing was verified ·
 * exit 3 = only some pages were reached; the unreached are named.
 */
import { readFileSync } from "node:fs";

interface StoreCountry {
  slug: string;
  country: string;
  url: string;
  public_updated_at?: string | null;
  etag?: string | null;
  quotes: { form: string; text: string }[];
}

const store = JSON.parse(readFileSync("src/data/fcdo-consent-text.json", "utf8")) as {
  countries: Record<string, StoreCountry>;
};
const rows = Object.values(store.countries);

// Browser-like headers: gov.uk's API is public but bot-blocks a bare fetch
// (same posture as the advisory sources; documented in docs/advisory-checker.md).
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  Accept: "application/json",
};

const day = (s: string | null | undefined) => (s ?? "").slice(0, 10);

async function check(row: StoreCountry): Promise<"fresh" | "moved" | "unreached"> {
  try {
    const res = await fetch(`https://www.gov.uk/api/content/foreign-travel-advice/${row.slug}`, { headers: HEADERS });
    if (!res.ok) {
      console.log(`  ? ${row.slug} — HTTP ${res.status} (unreached, not a pass)`);
      return "unreached";
    }
    const body = (await res.json()) as { public_updated_at?: string };
    if (day(body.public_updated_at) === day(row.public_updated_at)) return "fresh";
    console.log(`  ✗ ${row.slug} — page moved: store has ${day(row.public_updated_at) || "(no date)"}, FCDO says ${day(body.public_updated_at)} → re-read the page and update the quotes by hand`);
    return "moved";
  } catch (e) {
    console.log(`  ? ${row.slug} — ${(e as Error).message} (unreached, not a pass)`);
    return "unreached";
  }
}

// Sequential-ish with small batches: 226 requests, be a polite client.
const BATCH = 6;
const results: ("fresh" | "moved" | "unreached")[] = [];
for (let i = 0; i < rows.length; i += BATCH) {
  const chunk = await Promise.all(rows.slice(i, i + BATCH).map(check));
  results.push(...chunk);
}

const moved = results.filter((r) => r === "moved").length;
const unreached = results.filter((r) => r === "unreached").length;
const fresh = results.filter((r) => r === "fresh").length;

console.log(`\nfcdo-consent-text freshness: ${fresh} fresh · ${moved} moved · ${unreached} unreached, of ${rows.length}`);

if (unreached === rows.length) {
  console.log("✗ BLOCKED — nothing was reached, so nothing was verified. This is not a pass.");
  process.exit(2);
}
if (unreached > 0) {
  console.log(`⚠ PARTIAL — ${unreached} pages were never reached; their freshness is unknown, not confirmed.`);
  process.exit(3);
}
if (moved > 0) {
  console.log("✗ pages moved since our fetch — each needs a human re-read before the store is current.");
  process.exit(1);
}
console.log("✓ every page reached; the store matches the FCDO's own page dates.");
