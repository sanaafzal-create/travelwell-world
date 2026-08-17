/**
 * Per-route <head> baked into static HTML — the floor under the rendering work.
 *
 *   npm run build   (runs automatically, after vite build)
 *
 * WHY (David, 2026-08-09). He fetched two of our pages the way an AI answer
 * engine does — raw HTML, no JavaScript — and got back a title and a description
 * and nothing else. Both pages returned the IDENTICAL site-wide description. His
 * suggestion: if per-page titles and descriptions are cheap, at least give an AI
 * reader something specific rather than the same sentence 114 times.
 *
 * It turned out worse than he described, and better once fixed.
 *
 * WORSE: nothing set a per-route title at all. Every page on the site carried
 * the same title and the same description for EVERY reader — Google included,
 * not only the crawlers that skip JavaScript. That is an ordinary SEO defect
 * sitting underneath the AEO one, and it needed no rendering work to fix.
 *
 * BETTER: since we are writing the head anyway, the STRUCTURED DATA can go in
 * too. The JSON-LD builders are pure functions, so a destination's
 * TouristDestination + FAQPage blocks and an interest's TouristTrip + FAQPage
 * can be computed at build time and served in raw HTML. That is the actual AEO
 * surface — the thing an answer engine quotes — and until now only the static
 * Organization block survived without JavaScript.
 *
 * WHAT THIS IS NOT. It is not server rendering and it is not a substitute for
 * it. The BODY is still an empty container: a crawler gets a correct, specific
 * head and no prose. Full static generation of the body is still the unlock, and
 * this doesn't reduce that work by an hour. It raises the floor while that waits.
 *
 * HOW IT SERVES. `vercel.json` rewrites everything to /index.html, but Vercel
 * matches a real file BEFORE applying a rewrite — so `dist/destination/x/index.html`
 * is served for `/destination/x`, and the SPA still boots from it normally
 * because the body and the script tags are untouched.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { REGIONS, SIS, boardSis } from "../src/data/taxonomy";
import { DESTINATIONS, GUIDES, type Destination } from "../src/data/places";
// The MERGED set — bundled rows plus dropped-in dossiers. Reading `DESTINATIONS`
// alone meant an ingested batch reached Postgres and the live site with no static
// <head>, no JSON-LD and no per-route description: the whole answer-engine
// surface silently skipped every destination the research library delivered.
import { mergedDestinations } from "./lib/destination-batches";
import { destinationJsonLd, siJsonLd } from "../src/lib/jsonld";
import { jewelsForSi } from "../src/lib/jewels";

const ORIGIN = "https://travelwell.world";
const DIST = "dist";
const TEMPLATE = readFileSync(join(DIST, "index.html"), "utf8");

/** Escape for an HTML attribute — descriptions carry apostrophes and dashes. */
const attr = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

interface Page {
  path: string;        // "/destination/paris-france"
  title: string;
  description: string;
  jsonLd?: object[];
}

const pages: Page[] = [];
const ALL_DESTINATIONS = mergedDestinations() as unknown as Record<string, Destination[]>;

// ── Destinations ───────────────────────────────────────────────────────────
for (const [code, list] of Object.entries(ALL_DESTINATIONS)) {
  const region = REGIONS.find((r) => r.code === code);
  for (const d of list) {
    pages.push({
      path: `/destination/${d.id}`,
      title: `${d.name}, ${d.country} — TravelWell.World`,
      // The destination's own line, which is real editorial copy rather than a
      // template. If it ever isn't there, fall back to something true.
      description: d.line || `${d.name} in ${d.country} — what to know before you go.`,
      jsonLd: destinationJsonLd(d, region?.name ?? "", `${ORIGIN}/destination/${d.id}`),
    });
  }
}

// ── Signature Interests ────────────────────────────────────────────────────
for (const si of boardSis(SIS)) {
  pages.push({
    path: `/si/${si.id}`,
    title: `${si.name} — TravelWell.World`,
    description: si.sig ? `${si.name} — ${si.sig}.` : si.name,
    // The same jewels the page renders. This is the route David asked about in
    // decision 2 — the one the Organization record already uses: baked into the
    // served <head>, so an answer engine that runs no JavaScript still reads
    // every experience. Client-side injection alone reached Google and nothing
    // else.
    jsonLd: siJsonLd(si, `${ORIGIN}/si/${si.id}`, jewelsForSi(ALL_DESTINATIONS, si.id)),
  });
}

// ── Regions ────────────────────────────────────────────────────────────────
for (const r of REGIONS) {
  pages.push({
    path: `/region/${r.code}`,
    title: `${r.name} — TravelWell.World`,
    description: (r as { blurb?: string }).blurb || `Travel in ${r.name}.`,
  });
}

// ── Guides ─────────────────────────────────────────────────────────────────
for (const g of GUIDES) {
  pages.push({
    path: `/guide/${g.id}`,
    title: `${g.title} — TravelWell.World`,
    description: g.lede || g.title,
  });
}

// ── The hub pages ──────────────────────────────────────────────────────────
const HUBS: Array<[string, string, string]> = [
  ["/special-interests", "The 35 Signature Interests", "Every world we build a trip around — from safari to river cruising to winter."],
  ["/regions", "The 13 World Regions", "Every destination belongs to one of thirteen regions. Start with where."],
  ["/destinations", "Destinations", "Every destination we cover, with the safety read that comes with it."],
  ["/guides", "Read Before Travel", "Field guides, seasonal timing and how-to — read before you go."],
  ["/wells", "The 13 Wells", "Fly-Well, Stay-Well, Eat-Well and the rest — how a trip is actually assembled."],
];
for (const [path, name, description] of HUBS) {
  pages.push({ path, title: `${name} — TravelWell.World`, description });
}

/** Swap the head fields, leaving body and scripts untouched. */
function render(p: Page): string {
  const canonical = `${ORIGIN}${p.path}`;
  let html = TEMPLATE
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${attr(p.title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${attr(p.description)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${attr(p.title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${attr(p.description)}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${attr(canonical)}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${attr(p.title)}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${attr(p.description)}$2`);

  // Canonical: replace if present, otherwise add.
  html = /<link rel="canonical"/.test(html)
    ? html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${attr(canonical)}$2`)
    : html.replace("</head>", `  <link rel="canonical" href="${attr(canonical)}" />\n  </head>`);

  // The structured data, marked so the runtime injector can remove it rather
  // than emit a second copy for a reader that DOES run JavaScript.
  if (p.jsonLd?.length) {
    const blocks = p.jsonLd
      .map((o) => `<script type="application/ld+json" data-static-ld>${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`)
      .join("\n    ");
    html = html.replace("</head>", `  ${blocks}\n  </head>`);
  }
  return html;
}

let written = 0, withLd = 0;
for (const p of pages) {
  const out = join(DIST, p.path.replace(/^\//, ""), "index.html");
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, render(p));
  written++;
  if (p.jsonLd?.length) withLd++;
}

/**
 * The 404 page Vercel serves for an unmatched path.
 *
 * Paired with the generated rewrite list (`gen-vercel-routes`): a path that is
 * neither a real file nor a known route now falls through to here with a real
 * 404 status, instead of returning 200 carrying the home page.
 *
 * `noindex` matters as much as the status code. Some crawlers reach a body
 * before they reach a status, and a page that looks like the home page and
 * carries no directive is exactly how a dead URL keeps its place in an index —
 * which is the thing this whole change exists to end.
 */
const notFound = render({
  path: "/404",
  title: "Page not found — TravelWell.World",
  description: "That page wandered off the map. Every destination, interest and Well is one click away from here.",
}).replace("</head>", '  <meta name="robots" content="noindex, follow" />\n  </head>')
  // A canonical pointing at /404 would ask a crawler to index the 404 itself.
  .replace(/\n?\s*<link rel="canonical"[^>]*>/, "");
writeFileSync(join(DIST, "404.html"), notFound);

console.log(`Wrote ${written} static <head> pages — ${withLd} carrying JSON-LD in raw HTML, plus 404.html (noindex).`);
