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
- **Payments: never.** Booking is an affiliate **handoff** — the provider is merchant of record, the traveler pays them directly, TravelWell never touches card data (keeps us at PCI SAQ A). There is no future tier where Atlas takes payment. Plain-language at the handoff: *"you'll book right with them,"* never *"I'll hold it for you."*
- **Safer-Informed:** we keep travelers **informed** so they can be as safe as possible — we **never promise "safe"** (an outcome we don't control). L1/L2 book freely; L3 books only if it passes all three safety gates; L4 and L3-blocked are content-only (no Book button).
- **Never commit secrets.** The repo is public. `ANTHROPIC_API_KEY` and `UNSPLASH_ACCESS_KEY` live as **Supabase secrets** — never `VITE_`, never in the repo. Never put a model identifier in commits, PRs, or code.

## Accessibility — build to WCAG AA (locked design standard)
Stylish **and** usable by everyone. The elderly and low-vision traveler are among our best-spending markets — building genuinely *for* them is a **moat** (David), not a compliance chore — and "Atlas walks beside everyone" has to be true in the pixels, so accessibility is baked in from the first screen, never bolted on later (retrofitting a hardened UI is expensive). This is standing canon, right alongside the payments-never rule and the voice rule. Hold a real, checkable AA bar:
- **Contrast** meets AA (≥ 4.5:1 body, ≥ 3:1 large text) — audit muted grays on tinted grounds; no classy-but-unreadable light-gray-on-white.
- **Text resizes** without breaking (rem units; nothing that clips on zoom); a sensible default size.
- **Tap targets** big enough for a real thumb (~44px).
- **Every control labeled** for screen readers; **visible keyboard focus**; **never color alone** for meaning; respect `prefers-reduced-motion`.
- **Checkable, not a vibe** — automated a11y checks in the build so a regression fails the build, same discipline as the dossier QC gate.

## Foundation sockets (locked canon — pour the seams now, build the machinery later)
Not built yet, but the foundation is shaped to receive them clean (a future team/Olympic universe plugs in with no rework). Detail in `docs/status-and-launch-plan.md`.
- **A traveler is a *subject*, not just a person.** One profile, captured once; a person belongs to teams/institutions by **role** (athlete, coach, medic, ops director); an entity (team, federation) can itself be a "traveler." Don't scatter person-only assumptions.
- **Consumer and institutional data stay on separate seams from day one.** Don't build the compliance machinery (minors, medical, accreditation, FERPA) until needed — just never entangle the two, because untangling later is the expensive mistake and keeping the seam clean now is nearly free.
- **One tank, many products.** The "next-task" operational OS is its **own product on the shared data tank** — same data, separate spigot — never welded into the consumer app.
- **Booking windows are absolute, multi-year dated event-series** (not season/months) — serves the marketing engine and the Olympic quad from one timing model.

## Placement & booking canon (locked — build-toward)
Shapes the experience / itinerary / provider records from the first pour so Atlas is a companion, not a catalog. Detail in `docs/status-and-launch-plan.md`.
- **Experiences carry structured fit-rules** — `duration / before / after / pairs_with / pace / time-of-day / season` as a fixed tag vocabulary, **inherited by experience type** (author "no-fly-after-diving" once for diving). Atlas *derives* the connective buffers (arrival rest, no-fly window, recovery morning) from these and **recomputes them on any reshuffle** — the safety spine is enforced, never stranded.
- **Itinerary is a first-class dated object** — ordered placed-experiences across dated days (day-number + weekday + date, always paired). **Placed ≠ booked** (idea → placed → handed-off → confirmed). One traveler owns many trips.
- **Provider capability ledger** — capability fields (commission lane, confirmation-return method) carry `source` + `last_verified` + `confidence` and are **machine-writable from day one**. Confirmation-return is an **upgradeable field** (`email-parse` everywhere to start → `api` as each provider ships it). Provider is always merchant of record; Atlas never touches payment.
- **Self-updating changelog watcher ships at launch** (narrow: the 8–12 public-API providers) as the machine-writable socket's first consumer; the full network watcher waits for the raise.

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
