/**
 * Sitemap generator — writes `public/sitemap.xml` from the live catalog.
 *
 * Why this exists: robots.txt already points crawlers at /sitemap.xml, but the
 * file was only ever going to be produced by the SSG build (still gated on
 * funding) — so the URL 404'd and nothing told Google our destination pages
 * exist. This generates it from the same bundled catalog the app reads, so it's
 * correct today and stays correct as the catalog grows.
 *
 * Public content only. Private/gated/transactional routes are deliberately
 * excluded (a traveler's profile or a gated demo must never be indexed).
 *
 * Run:  npm run gen:sitemap        (also runs automatically before `npm run build`)
 */
import { writeGenerated, VOLATILE_DATE } from "./lib/write-generated";
import { REGIONS, SIS } from "../src/data/taxonomy";
import { GUIDES, type Destination } from "../src/data/places";
import { mergedDestinations } from "./lib/destination-batches";
import { ORIGIN, isIndexableDestination } from "../src/lib/site";

// THE MERGED CATALOG, NOT THE BUNDLE. This read `DESTINATIONS` from
// `src/data/places` — the 44 hand-authored rows — while `gen:heads` and
// `prerender` had already been moved onto `mergedDestinations()`. So the build
// rendered 590 pages and told Google about 121 of them: every one of the 459
// ingested dossiers was crawlable, prerendered, carrying its FAQPage JSON-LD,
// and listed nowhere.
//
// This is the third time the same shape has bitten (see the header of
// `scripts/lib/destination-batches.ts`): not a crash, but one more consumer of
// the catalog that nobody remembered was a consumer. `grep -rl mergedDestinations
// scripts/` is the check — if a generator reads the catalog and is not on that
// list, ask why before assuming it is deliberate.
const ALL_DESTINATIONS = mergedDestinations() as unknown as Record<string, Destination[]>;



/** Public, indexable routes. Ordered roughly by importance. */
const STATIC_ROUTES: { path: string; priority: number; changefreq: string }[] = [
  { path: "/", priority: 1.0, changefreq: "weekly" },
  { path: "/special-interests", priority: 0.9, changefreq: "weekly" },
  { path: "/regions", priority: 0.9, changefreq: "weekly" },
  { path: "/destinations", priority: 0.9, changefreq: "weekly" },
  { path: "/guides", priority: 0.8, changefreq: "weekly" },
  { path: "/wells", priority: 0.8, changefreq: "monthly" },
  { path: "/plan", priority: 0.7, changefreq: "monthly" },
  { path: "/providers", priority: 0.6, changefreq: "weekly" },
  { path: "/calendar", priority: 0.6, changefreq: "weekly" },
  { path: "/luxury", priority: 0.6, changefreq: "monthly" },
  { path: "/first-aid-kit", priority: 0.6, changefreq: "monthly" },
  { path: "/about", priority: 0.5, changefreq: "monthly" },
  { path: "/contact", priority: 0.3, changefreq: "yearly" },
  { path: "/disclosure", priority: 0.3, changefreq: "yearly" },
  { path: "/privacy", priority: 0.2, changefreq: "yearly" },
  { path: "/terms", priority: 0.2, changefreq: "yearly" },
];

// NEVER indexed: traveler-private, auth, gated, or hand-off routes.
// (/profile /itinerary /signin /signup /verify /activation /welcome-back
//  /vc-demo /go — a person's trip and a gated investor demo stay out of search.)

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

type Url = { loc: string; priority: number; changefreq: string };
const urls: Url[] = STATIC_ROUTES.map((r) => ({ loc: ORIGIN + r.path, ...r }));

// Signature Interests — a landing page per way-to-travel.
for (const si of SIS) {
  urls.push({ loc: `${ORIGIN}/si/${si.id}`, priority: si.status === "live" ? 0.8 : 0.5, changefreq: "weekly" });
}
// Regions.
for (const r of REGIONS) {
  urls.push({ loc: `${ORIGIN}/region/${r.code}`, priority: r.status === "live" ? 0.8 : 0.5, changefreq: "weekly" });
}
// Destinations — the dossier pages. These carry the Q&A + FAQPage JSON-LD, so
// they're the ones that matter most for search and AI citation.
let destCount = 0;
for (const list of Object.values(ALL_DESTINATIONS)) {
  for (const d of list) {
    // Unreleased destinations stay out — and `gen:heads` reads the SAME
    // predicate to stamp them `noindex`, because leaving a URL out of a sitemap
    // does not stop anything indexing it.
    if (!isIndexableDestination(d)) continue;
    // ── PRIORITY FOLLOWS THE CONTENT, NOT THE LABEL ───────────────────────
    // This read `depth === "verified"` alone. `depth` is a claim about how far we
    // went, and 13 rows claim `verified` while carrying no dossier at all — the
    // original hand-authored anchors: Bali, Kyoto, Tokyo, Bangkok, Bora Bora,
    // Banff, Queenstown, Turks & Caicos, The Alps and four more. Real pages, but
    // a fraction of the text of a row with a dossier behind it.
    //
    // So the sitemap was telling Google that our thinnest pages were our most
    // important ones, at 0.9. Found from the Search Console report: the single
    // real page in the duplicate-without-canonical bucket is
    // `swiss-alps-switzerland`, which is first on that list of 13.
    //
    // `depth` is deliberately NOT changed to fix this. It drives rendering — a
    // non-verified row takes the preview/no-providers path — so relabelling these
    // to `stub` would visibly downgrade thirteen live pages to fix a number in an
    // XML file. The label stays; the claim we broadcast is what gets corrected.
    const hasDossier = !!(d.data && Object.keys(d.data as object).length);
    urls.push({
      loc: `${ORIGIN}/destination/${d.id}`,
      priority: d.depth === "verified" && hasDossier ? 0.9 : 0.6,
      changefreq: "monthly",
    });
    destCount++;
  }
}
// Guides.
for (const g of GUIDES) urls.push({ loc: `${ORIGIN}/guide/${g.id}`, priority: 0.7, changefreq: "monthly" });

const today = process.env.SITEMAP_DATE || new Date().toISOString().slice(0, 10);
const body = urls
  .map((u) => `  <url>\n    <loc>${esc(u.loc)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority.toFixed(1)}</priority>\n  </url>`)
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemap.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
  .replace("http://www.sitemap.org", "http://www.sitemaps.org"); // correct namespace

// Written through `writeGenerated` so the date stamp only moves when the URL set
// moves. Two reasons, and the second is the one that reaches Google:
//
//  1. A raw write made this generator non-idempotent, which is the one thing
//     `check:generated` cannot tolerate: it asserts "run every generator and the
//     repo is unchanged". With `lastmod` = today, that assertion failed on the
//     FIRST commit of every calendar day — and the failure told you to
//     `git add public/sitemap.xml`, a file .gitignore refuses, so the only ways
//     past it were running the check twice or `--no-verify`. A check that cries
//     wolf at midnight is a check people learn to skip, and then it catches
//     nothing. Found 2026-08-20, on the first run of the day.
//  2. `lastmod` is supposed to mean "when this page last changed", not "when
//     somebody last ran the build". Re-stamping 590 URLs with today's date on
//     every deploy tells a crawler the entire site changed daily, which is both
//     untrue and self-defeating — a lastmod that is always today carries no
//     information, and Google stops trusting the field.
const wrote = writeGenerated("public/sitemap.xml", xml, VOLATILE_DATE);
console.log(`sitemap.xml → ${urls.length} urls  (${destCount} destinations, ${SIS.length} interests, ${REGIONS.length} regions, ${GUIDES.length} guides, ${STATIC_ROUTES.length} static)${wrote === "unchanged" ? "  [unchanged — kept its lastmod]" : ""}`);
