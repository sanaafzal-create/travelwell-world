# CLAUDE.md — TravelWell.World (MVP platform repo)

Standing conventions for anyone (human or assistant) working in this repo:
`sanaafzal-create/travelwell-world`. This is the **live MVP platform** — a
React + Vite + TypeScript + Tailwind SPA, backed by Supabase (Postgres + RLS +
Edge Functions), deployed on Vercel from `main`. It is **not** the research
library (`Travelman73/tww-research-library`) — that repo has its own rules.

## Voice & naming
- **"TravelWell" is one word.** Never "Travel Well" as the brand (that phrase is only the tagline "…Travel Well.").
- Prefer **accurate / plainly / straight** over "honest / honestly / upfront."
- Tagline: *"If it's Travel… TravelWell."*

## Canonical vocabularies (match these character-for-character)
- **Budget tiers (`price`):** `essential` · `comfort` · `premier` · `luxury` · `ultra`.
- **Provider curation (`tier`):** `prime` · `vetted` · `prospective` (distinct from price).
- **Provider handoff (`mode`):** `api` · `widget` · `affiliate` · `first-party`.
- **6 launch Signature Interests (live):** `tropical`, `romance`, `liveaboard`, `river`, `safari`, `expedition`. Everything else is `preview` (future). `ultra` is the Luxury tier/overlay, **not** a trip SI.
- **Regions:** the 13-code MVP scheme (e.g. `05A` East Africa, `11C` Caribbean & Atlantic, `10S` Latin America). It is the source of truth; confirm any external region code against it.
- **`sub_region`:** country-internal style; strings are authoritative and come verbatim from the canonical master (`docs/sub-region-master.md`) / David's dossiers, wired per region — never sketched from memory.
- **Destination key (`id`):** `<city>-<country>`, full country name spelled out, lowercase, hyphenated (e.g. `cape-town-south-africa`). Collision-proof at global scale.
- **Destination axes:** `status` = `live` | `future` (shown or not); `depth` = `verified` | `stub` | `cached` (how deep). Separate axes.

## Locked principles
- **Payments: never.** Booking is an affiliate **handoff** — the provider is merchant of record, the traveler pays them directly, TravelWell never touches card data (keeps us at PCI SAQ A). There is no future tier where Atlas takes payment. Honest-language at the handoff: *"you'll book right with them,"* never *"I'll hold it for you."*
- **Safer-Informed:** we keep travelers **informed** so they can be as safe as possible — we **never promise "safe"** (an outcome we don't control). L1/L2 book freely; L3 books only if it passes all three safety gates; L4 and L3-blocked are content-only (no Book button).
- **Never commit secrets.** The repo is public. `ANTHROPIC_API_KEY` and `UNSPLASH_ACCESS_KEY` live as **Supabase secrets** — never `VITE_`, never in the repo. Never put a model identifier in commits, PRs, or code.

## The catalog → DB pipeline (important)
- The catalog is **authored in `src/data/`** (`places.ts`, `taxonomy.ts`, `*.json`) and in provider CSVs under `src/data/providers/`.
- `scripts/gen-catalog-seed.ts` (run via esbuild) **generates** the seed SQL migrations (`0003`–`0007`). **Do not hand-edit those generated files** — change the source in `src/data/` and regenerate.
  - Regenerate: `./node_modules/.bin/esbuild scripts/gen-catalog-seed.ts --bundle --platform=node --format=esm --outfile=scratchpad/gen.mjs && node scratchpad/gen.mjs`
- The app reads the catalog **DB-first with a bundle fallback** (`src/store/useCatalog.ts` + `src/lib/catalog.ts`). Production reads Supabase; the bundle covers offline/preview.
- After changing the catalog: regenerate the seed **and** re-run the affected migration in the Supabase SQL editor. Seeds are idempotent (`on conflict do update`); some self-heal schema (add columns, swap constraints) so a single re-run reconciles.

## Working rules
- Run **`npm run build`** and **`npx tsc --noEmit`** green before committing.
- Develop on a feature branch; merge to `main` (fast-forward). Vercel deploys from `main`.
- Use the scratchpad dir for throwaway scripts; don't leave probes or unused deps in the repo.
- Planning/roadmap lives in `docs/status-and-launch-plan.md`; the sub_region canon in `docs/sub-region-master.md`.
