/**
 * Generate the Vercel rewrite list from the router, so an unknown path 404s.
 *
 *   npm run gen:routes   → vercel.json (rewrites block only)
 *
 * ── THE BUG THIS FIXES ─────────────────────────────────────────────────────
 * The config was one line: `{ source: "/(.*)", destination: "/index.html" }`.
 * That is the standard SPA catch-all, and on a site with a search-visible past
 * it is actively harmful. **Every unknown path returned HTTP 200 carrying the
 * home page shell** — `/en/regions`, a locale prefix we have never had, served
 * 200 with the home title, the home description and `og:url` pointing at the
 * root (David, 2026-08-15, measured live).
 *
 * A 404 tells a search engine to drop the URL. A 200 tells it the page is alive,
 * so dead URLs from a previous build stay indexed indefinitely and compete with
 * the real site. Ours still serve a cached "11 Global Regions" — a count that
 * has been 13 for months — and a fully indexed destination page for a place that
 * does not exist in our data. The catch-all is why they cannot age out.
 *
 * ── WHY IT IS GENERATED ────────────────────────────────────────────────────
 * The list has to equal the router's route table or a real page 404s, which is
 * far worse than the bug being fixed. Nobody remembers to update a hosting
 * config when they add a route, so it is read FROM `src/App.tsx` and checked by
 * `check:generated` — add a route, forget to regenerate, the commit is refused.
 *
 * Static files (the 106 pre-rendered `<head>` pages, sitemap.xml, robots.txt,
 * assets) are matched by Vercel BEFORE rewrites, so they are unaffected: a real
 * destination page still serves its own pre-rendered HTML.
 *
 * That ordering is not assumed — it is the only reading consistent with the
 * measurement. Under the OLD `/(.*)` catch-all, which rewrote literally every
 * path, a live fetch of a destination page still returned that page's own meta
 * tags rather than the home page's. If rewrites beat the filesystem, that could
 * not happen. This change only narrows the same mechanism, so it cannot make
 * that worse.
 */
import { readFileSync } from "node:fs";
import { writeGenerated } from "./lib/write-generated";

const APP = "src/App.tsx";
const app = readFileSync(APP, "utf8");

const paths = [...app.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]);
if (paths.length < 10) {
  // A regex that quietly matches nothing would emit an empty rewrite list and
  // 404 the entire site. Fail loudly instead.
  throw new Error(`${APP}: found only ${paths.length} routes — the route table is not where this expects it. Refusing to emit a rewrite list that would 404 the site.`);
}

const wildcard = paths.filter((p) => p === "*");
const real = paths.filter((p) => p !== "*");
if (!wildcard.length) {
  throw new Error(`${APP}: no <Route path="*"> catch-all. A path that reaches the app with no route renders nothing — keep the in-app 404 as well as the hosting one.`);
}

// React Router's `:param` is Vercel's `:param` too, so a route translates
// unchanged. Sorted for a stable diff.
const rewrites = real
  .map((p) => (p === "/" ? "/" : p.replace(/\/+$/, "")))
  .sort()
  .map((source) => ({ source, destination: "/index.html" }));

const config = {
  $schema: "https://openapi.vercel.sh/vercel.json",
  buildCommand: "npm run build",
  outputDirectory: "dist",
  framework: "vite",
  // GENERATED — see scripts/gen-vercel-routes.ts. Anything not listed here and
  // not a real file on disk gets Vercel's 404 (our branded dist/404.html), which
  // is what lets a dead URL from an old build fall out of the index.
  rewrites,
};

writeGenerated("vercel.json", JSON.stringify(config, null, 2) + "\n");
console.log(`Wrote vercel.json — ${rewrites.length} rewrites from ${APP}; every other path now 404s.`);
