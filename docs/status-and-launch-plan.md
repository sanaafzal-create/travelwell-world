# TravelWell — Status Read & Launch-Plan Shape

*Engineering foundation status + the shape of the road to launch. Living document — evolves with the build. Owner: Sana (engineering).*

---

## PART 1 — Where the foundation actually stands

### ✅ Built and solid (in production)
- **Data spine & catalog read-layer** — Postgres + RLS, DB-served catalog with a bundle fallback (migrations 0001–0010). 13 regions, 32 SIs (6 live), 12 Wells, 62 providers, 38 destinations, 9 guides, sub-regions, local signals. One canonical vocabulary end-to-end: one SI list, one region scheme, the 5 budget tiers, the commission-gate set, the live/future switch.
- **The matching keystone** — providers filter by SI + region with graceful fallback; verified live on the Caribbean set (tropical+11C → 15 stays; region-less airlines pass; wellness narrows correctly).
- **Atlas (the messenger)** — Claude-backed Edge Function, grounded in the live journey; **persistent conversation spine** shipped (survives navigation + reload — the narrative-continuity foundation).
- **Traveler journey & Travel I.D.** — persisted to the DB, resumes across devices; age *ranges*, never birthdays (privacy by design).
- **Auth** — Supabase magic-link (sign-up → verify → activation).
- **Images** — server-side Unsplash proxy with a cache table (consistent, rate-safe).
- **Provider ingest pipeline** — the seed generator ingests provider CSVs directly; new sets drop in by adding a file.
- **Deploy** — Vercel from `main`.

### 🟡 Half-built / stubbed (works, not finished)
- **Booking** — affiliate **handoff** (`/go` → `booking_url`) with a checkout UI shell (3 tracks). No real payment processing. Fine for soft launch if we commit to handoff.
- **Atlas guided journey** — the *spine* is built; **Guided Mode** (Atlas driving page-to-page, pre-setting choices, the glow/spotlight) is Phase 2–4, not built.
- **Content depth** — destinations are shallow (a line + image). The **deep dossier model** (jsonb: jewels, safety, SEO, booking-window) is validated (Cape Town ingest test passed) but not built/ingested. Providers cover ~2 regions partially.
- **Voice** — Web Speech input works; degrades honestly where unsupported.
- **Analytics** — event logging to DB exists; no attribution or outbound.

### 🔴 Still ahead before soft launch
- **Guided Mode (Phase 2)** — the guided walk; the product promise.
- **Destination data model + first real dossiers** for the live-6 SIs in launch regions.
- **SEO rendering** — we are a client-rendered SPA; crawlers get one static title/meta for every route. The ATTRACT/SEO landing-page strategy needs server-render or prerender + per-route meta + structured data + sitemap. **The biggest launch-blocker for the traffic model.**
- **Test suite + CI** — none today.
- **Analytics/attribution socket** + basic observability.

---

## PART 2 — The full-launch plan (shape)

**Phase A — Foundation hardening & sockets (pre-soft-launch)**
1. Destination **data model + ingest** (jsonb: sub_region, depth, booking-window designed in now, empty until research lands). 🏋️
2. First **real dossiers** for the live-6 SIs in 2–3 launch regions.
3. **Guided Mode Phase 2** — Atlas leads the journey. 🏋️
4. **SEO rendering** (prerender/SSR + per-route meta + sitemap + JSON-LD). 🏋️ *Highest risk — start early.*
5. **Test + CI** baseline; analytics **attribution socket** + **marketing-permission fields** on the profile (room, not sends).
6. Confirm **booking = affiliate handoff** for launch (defer payments).

**Phase B — Soft launch** — live-6 SIs, launch regions, English, handoff booking, guided flow, real content depth, SEO pages ranking. Prove the engines.

**Phase C — The self-building world (World-Engine)**
7. **Cache-back** (Atlas writes researched places back; precedent live in the image cache).
8. **1st-of-month verification sweep** + **founder-confirm queue** (safety/booking/commission gated). 🏋️ *Automation-heavy: scheduler, resumability, per-field gating.*

**Phase D — Full launch scale-out**
9. **i18n / 9 languages** — today a locale/RTL *switcher* only, no translated content. Full launch = translate all UI + content, Atlas in-language, RTL QA. 🏋️🏋️ *Biggest single lift.*
10. **Marketing outbound** — email/SMS reactivation, permission + timing on the profile.
11. **Content at scale** — top-12 deep per sub-region across regions; provider coverage across all wells.
12. **Real booking / payments** — only if we go beyond handoff.
13. Hardening, observability, trust/safety verification at scale, trademark filings.

**Heavy lifts / where people concentrate:** i18n, SEO rendering, the monthly-sweep automation, content production at scale.

---

## PART 3 — Sockets to hold open now (cheap now, expensive later)
- **Soul / lifetime loop** → the **traveler profile is the seed**: identity + history + evolving intent, not a signup form. Rank and reach out for lifetime over booking.
- **Team/Olympic universe** → make "traveler" an entity that could be a person *or* a team/institution; keep the SI board pluggable (the 8 sports SIs slot in). Schema seam now, not a build.
- **Atlas** → the vessel. Spine done; Guided Mode + narrative continuity + live-research (cache-back) make him carry the relationship.
- **Marketing socket** → attribution (ad lane in) + permission/timing (reach back out), both on the profile. Leave the fields; don't build the sends yet.

---

## Recommended starting points
- **SEO rendering** — highest-risk blocker for the whole traffic thesis; universally underestimated.
- **Destination data model** — every other piece (dossiers, cache-back, sweep, World-Engine) hangs off it.
- **i18n** — consciously scheduled *last* before full launch, resourced as its own workstream; prove the engine in English first.
