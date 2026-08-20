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
 * ── DECIDED: www is primary (Sana, 2026-08-17) ─────────────────────────────
 * The apex was an equally workable choice — flip the Vercel redirect, change one
 * line here — and it was put as an open question rather than assumed. The answer
 * is **www stays primary**, so this constant is now settled canon rather than a
 * pending alternative.
 *
 * Recording the ruling and not just the value, because the value on its own reads
 * like something somebody typed. The next person to notice the apex redirecting
 * should find a decision here, not a coin toss they might re-flip.
 *
 * What was never acceptable, and is the actual bug this file closed: metadata
 * naming one host while the server redirects to the other. Either direction is
 * fine. Disagreeing with the server is not.
 */
export const ORIGIN = "https://www.travelwell.world";

/** An absolute URL on the canonical host. Accepts "/path" or "path". */
export const absUrl = (path: string): string =>
  `${ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;

/**
 * Is this destination one we want in the index?
 *
 * `status` is the shown/not-shown axis, so a `future` destination is one we have
 * not released. The sitemap has always skipped them — but skipping a URL from a
 * sitemap is a hint, not an instruction, and the page itself was prerendered and
 * served at 200 with a full dossier and no `robots` tag. Six unreleased pages
 * (four Uganda parks, two Mozambique islands, all `depth: verified`) were
 * therefore indexable while being deliberately unlisted.
 *
 * Both consumers now read THIS, so the sitemap and the `noindex` tag cannot
 * drift apart into "unlisted but indexable" again — the same one-definition
 * argument as ORIGIN above, which existed in three copies and disagreed.
 *
 * Note this deliberately does NOT extend to Signature Interests or regions: a
 * `preview` SI is an announced future way-to-travel and we want it found. Only a
 * `future` destination is unreleased content.
 */
export const isIndexableDestination = (d: { status?: string }): boolean => d.status === "live";
