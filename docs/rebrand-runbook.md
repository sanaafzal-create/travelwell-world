# Rebrand runbook — TravelWell.World → TravelVisions.World

*Written 2026-09-10, on David's confirmation that the trademark attorney found
infringement issues with TravelWell (TravelVisions is clear), and that the
entity converts from TravelWell.World LLC (NC) to TravelVisions.World INC
(Delaware C-Corp), targeted October. This is the one-day flip plan, prepared
while it's cheap. **Nothing here executes before the filing is through** — see
the gate below.*

## The gate (already built)

`BRAND_SWITCHED` in `scripts/check-brand.mjs` flips both brand rules
atomically: today TravelWell is enforced and TravelVisions must not ship; on
filing day one constant flip inverts the pair with no middle state. The
research library carries the same constant under the same name. **Do not flip
until (a) the filing is through AND (b) the library flips in the same window.**
Until then the demo, the site, and every email run as TravelWell — the
unreleased-name gate has already caught one dossier shipping TravelVisions
early (lalibela-ethiopia), and it stays on duty.

## Open attorney questions — resolve BEFORE filing day

1. **Does the ruling touch only the house mark, or also the "-Well" family?**
   The 13 Wells (Stay-Well, Eat-Well, …) are David-locked brand architecture in
   nine markets. If "TravelWell" infringes but "-Well" compounds are clear, the
   Wells survive the rebrand untouched; if not, that is a much larger decision
   and we need to know now, not in October.
2. **Does the slogan family re-file as "If It's [X]… TravelVisions.™"?** The
   construction (ellipsis + full stop + one-word mark) is the filing strategy;
   the closing mark is currently the infringing word. `docs/tagline-family.md`
   regenerates from source for whichever mark the attorney files
   (`npm run gen:taglines` — the `MARK` constant in `scripts/gen-tagline-list.ts`
   and the `Tagline`/`BrandMark` primitives are the single render path).

## Flip-day surfaces — in the repo (one planned day)

Everything URL-shaped derives from **one constant**: `ORIGIN` in
`src/lib/site.ts` (canonicals, og:url, sitemap, robots' Sitemap line, the
Organization `@id`). The name itself lives in a short list:

| Surface | Where | Note |
|---|---|---|
| `ORIGIN` | `src/lib/site.ts` | the one URL edit; sitemap/heads regenerate from it |
| Logo | `src/components/shell/Logo.tsx` + footer logo in `Footer.tsx` | the rendered wordmark |
| PWA manifest | `vite.config.ts` (`name`, `short_name`) | home-screen name |
| Interface copy | `src/lib/i18n.ts` (~11 mentions, 5 languages each) | brand stays untranslated |
| Slogan mark | `scripts/gen-tagline-list.ts` `MARK` + `Tagline`/`BrandMark` primitives | pending attorney answer #2 |
| Atlas's canon | `supabase/functions/atlas` + `voice-agent` prompts | redeploy both |
| Edge functions | `advisory-check`, `mcp`, `unsplash`, `flights`, `livekit-token` carry the name in headers/UA strings | redeploy after edit |
| Static text files | `public/llms.txt`, `public/robots.txt` | hand-carried, not generated |
| Contact email | `src/pages/Contact.tsx` (`hello@…`) | pairs with the Resend move below |
| The brand gate | `scripts/check-brand.mjs` `BRAND_SWITCHED` → `true` | **LAST repo edit**, same window as the library |

Then: `npm run build` + every generator (`check:generated` forces this), and
`npm run gen:taglines` for the new filing evidence.

## Flip-day surfaces — outside the repo

- **Domain**: point travelvisions.world at Vercel; **travelwell.world 308s to
  it permanently and is never dropped** — every printed link, indexed page and
  emailed magic link keeps resolving (same rule as apex→www; `LEGACY_DEST_ID`
  thinking, applied to the host).
- **Vercel**: add the new domain as primary, keep the old as redirect.
- **Supabase Auth**: Site URL and the `/verify` Redirect URL move to the new
  origin (both hosts allowlisted during the transition).
- **Resend**: verify travelvisions.world as a SECOND domain and move the sender
  (hello@travelvisions.world). **Do not wait for this to verify
  travelwell.world now** — login is needed for the demo, which comes before
  October; Resend holds multiple verified domains happily.
- **Search Console**: register the new property, submit the regenerated
  sitemap, use the change-of-address tool.
- **Collateral**: one-pagers, the VC build-to-launch doc, auth email templates,
  socials — re-export after the repo flip so nothing carries two brands.

## Sequencing truth

The demo precedes the October conversion, so **the demo runs as
TravelWell.World** — polished, consistent, one brand. The flip is one planned
day after the filing clears, not a drift; the gate guarantees no page ever
carries both names.
