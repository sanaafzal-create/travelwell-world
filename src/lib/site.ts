/**
 * The canonical origin — the ONE host every absolute URL we emit must use.
 *
 * ── Why this is `www` and why it is a shared constant ──────────────────────
 * Measured 2026-08-17: `https://travelwell.world/anything` returns **308** to
 * `https://www.travelwell.world/anything`. The apex redirects; www is where the
 * site is actually served.
 *
 * Every absolute URL we emitted pointed at the apex — 121 sitemap entries, every
 * canonical tag, every `og:url`, the Organization `@id`, and the `Sitemap:` line
 * in robots.txt. So every canonical named a URL that redirects, and a sitemap of
 * 121 redirecting URLs is reported by Search Console as 121 "Page with redirect"
 * rows. That is not a ranking catastrophe — Google follows a 308 and
 * consolidates — but it is a page of noise in the exact report we are about to
 * read to find out how much of our index is real, and it arrives at the worst
 * possible moment for interpreting it.
 *
 * The constant lived in THREE places (`jsonld.ts`, `gen-static-heads.ts`,
 * `gen-sitemap.ts`), which is how a host can be right in the sitemap and wrong
 * in the canonical tag with nothing to catch it. One definition, imported.
 *
 * ── If the apex should be primary instead ──────────────────────────────────
 * That is a real alternative and an equally good one: flip the redirect in
 * Vercel so www → apex, then change this one line back. What is NOT acceptable
 * is the state we were in — metadata pointing at one host while the server
 * redirects to the other. Either direction is fine; disagreeing with the server
 * is not.
 */
export const ORIGIN = "https://www.travelwell.world";

/** An absolute URL on the canonical host. Accepts "/path" or "path". */
export const absUrl = (path: string): string =>
  `${ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
