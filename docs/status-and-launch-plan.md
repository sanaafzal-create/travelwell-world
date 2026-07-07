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
- **Booking** — affiliate **handoff** (`/go` → `booking_url`) with a checkout UI shell (3 tracks). **Locked as the permanent model** (David): the provider is merchant of record, the traveler books and pays them directly, Atlas never touches payment. Keeps us at PCI SAQ A, off the liability hook — a feature, not a gap. No payment processing to build, ever.
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
1. Destination **data model + ingest** (jsonb: sub_region, depth, booking-window designed in now) — **and experiences carry structured fit-rules** so Atlas can architect, not just recommend. 🏋️ *(see the trip-architect data requirements below)*
2. First **real dossiers** for the live-6 SIs in 2–3 launch regions.
3. **Guided Mode Phase 2** — Atlas leads the journey. 🏋️
4. **SEO rendering** (prerender/SSR + per-route meta + sitemap + JSON-LD). 🏋️ *Highest risk — start early.*
5. **Test + CI** baseline; analytics **attribution socket** + **marketing-permission fields** on the profile (room, not sends).
6. **Booking = affiliate handoff, locked** — provider is merchant of record; Atlas surfaces → hands off → confirmation returns. No payments to build. Bake the honest-language rule into Atlas ("you'll book right with them," never "I'll hold it for you").

**Phase B — Soft launch** — live-6 SIs, launch regions, English, handoff booking, guided flow, real content depth, SEO pages ranking. Prove the engines.

**Phase C — The self-building world (World-Engine)**
7. **Cache-back** (Atlas writes researched places back; precedent live in the image cache).
8. **1st-of-month verification sweep** + **founder-confirm queue** (safety/booking/commission gated). 🏋️ *Automation-heavy: scheduler, resumability, per-field gating.*

**Phase D — Full launch scale-out**
9. **i18n / 9 languages** — today a locale/RTL *switcher* only, no translated content. Full launch = translate all UI + content, Atlas in-language, RTL QA. 🏋️🏋️ *Biggest single lift.*
10. **Marketing outbound** — email/SMS reactivation, permission + timing on the profile.
11. **Content at scale** — top-12 deep per sub-region across regions; provider coverage across all wells.
12. Hardening, observability, trust/safety verification at scale, trademark filings.

> **Payments are permanently out of scope.** Atlas guides and organizes; the traveler always books and pays the provider directly (redirect-with-return, provider = merchant of record). There is no future tier where TravelWell touches payment — locked by David. This is why we stay at PCI SAQ A.

**Heavy lifts / where people concentrate:** i18n, SEO rendering, the monthly-sweep automation, content production at scale.

---

## PART 3 — Sockets to hold open now (cheap now, expensive later)
- **Soul / lifetime loop** → the **traveler profile is the seed**: identity + history + evolving intent, not a signup form. Rank and reach out for lifetime over booking.
- **Team/Olympic universe** → make "traveler" an entity that could be a person *or* a team/institution; keep the SI board pluggable (the 8 sports SIs slot in). Schema seam now, not a build.
- **Atlas** → the vessel. Spine done; Guided Mode + narrative continuity + live-research (cache-back) make him carry the relationship.
- **Marketing socket** → attribution (ad lane in) + permission/timing (reach back out), both on the profile. Leave the fields; don't build the sends yet.

### Concrete foundation choices to keep it pluggable
Derived from the Olympic/team-travel synthesis. These shape *how* we pour the
profile and the World-Engine fields — not new build, just the right shape.
- **Subject, not user.** Model the profile as a *subject* (person is the default) and allow a person to belong to 0..N entities with a **role** (athlete, coach, medic, ops director). Avoids a rewrite when a "traveler" becomes a team or institution. *Touches the profile schema — decide before it hardens.*
- **Multi-year dated event-series.** Build the booking-window fields as **absolute dated windows with an arbitrary look-ahead horizon** (years out) + lead-time — not season/months only. The Olympic quad needs 2–4 year look-ahead; cheap to design in, a migration to retrofit.
- **Trips can have participants with roles.** Extend the existing `TripBlock.whom` hint toward role-scoped participants, so "show each person only their next task" has a home later without reshaping the trip model.
- **Universe dimension on the catalog.** Keep the tank universe-taggable so a universe (TWW-main / Ultra / Sports / TLEU) filters the shared data — "one tank, many front doors."

**Deliberately NOT pre-fit** (they attach to the core, they don't reshape it): the Equipment Intelligence Engine (carnets, chain-of-custody) and the 12 team-travel engines (Academic Constraint, Compliance, …). Keep the Wells/matching/booking core generic; don't contort the foundation guessing at them.

### Provider capability ledger + confirmation return (confirmed)
From the trip-architect thread — how a booking confirmation lands back in the itinerary without Atlas ever touching payment.
- **Confirmation return is an upgradeable field, not a fixed mechanism** — `api` where the provider supports it (clean + instant into the living itinerary), `email-parse` as the universal fallback (TripIt-style), `none` otherwise. Provider is always merchant of record; the method upgrades over time (email → API), tracked like the affiliate → embedded-commission upgrade.
- **Capability fields carry provenance, not just a flag.** On the provider record, each capability (commission lane, confirmation-return method) carries `source` + `last_verified` (date) + `confidence` — so we always know *when* we last confirmed it and *where* it came from.
- **Machine-writable from day one.** These fields are writable by an automated process, not only a human — so a watcher plugs in clean (human-edit-only would force a migration later).
- **Launch-phase consumer, not "someday":** a narrow autonomous **changelog sweep** on the 8–12 top providers with public API docs (Expedia, Booking, Viator, GetYourGuide tier) fetches their public changelog on a schedule, diffs it with AI, and writes capability upgrades (e.g., "shipped an API") into the ledger on its own. The full network watcher (newsletters, whole provider base) comes with the raise. So the machine-writable socket has a real consumer at launch — and it's a VC proof point (the platform watching its own supply and self-updating).

**Confirmed with David (locked):**
- **One profile with memberships** — capture the human once; every team they're on hangs off that one profile, by role.
- **Institutional data stays architecturally separable from consumer data — from day one.** We don't build the compliance machinery yet (minors, medical, accreditation, FERPA), but the profile is poured so the two never have to be pulled apart later.
- **The "next-task" operational layer is a separate product on the shared tank** — not welded into the consumer app. Kept apart at the seam even when they share the data.

### Trip-architect & living-itinerary data (fold into the data-model phase)
From the Atlas Trip-Architect / Living-Itinerary doc. These are what make Atlas a *companion*, not a catalog — and they must be in the schema from day one, or Atlas can only recommend, never architect or accompany.
- **Fit-rules on every experience** — `duration` (door-to-door), `before` (arrival buffer / acclimatization / prerequisite), `after` (e.g. no-fly-after-diving, recovery), `pairs_with`, `pace/intensity`, `time-of-day`, `season`. Author as a **small canonical vocabulary** (tags Atlas can reason over), not prose. **Inherit by experience type** — e.g. "no-fly-after-diving" authored once for diving, overridable per instance; cleaner for Atlas and less to research.
- **Itinerary = first-class dated object** — an ordered set of placed experiences across dated days; **every day carries day-number + weekday + date** (people anchor to the weekday). Viewable (≈ quarter-screen, read alongside Atlas), Atlas-held (read / update / surface any day), with proactive "tomorrow" surfacing on an afternoon/evening trigger.
- **Separate placed from booked** — a placement lives in the trip before booking; booking is a state (idea → placed → handed-off → confirmed), the confirmation returning from the provider. Arrival buffers / recovery mornings are **derived** from fit-rules, so re-sequencing recomputes them rather than stranding them.
- **Trips are plural** — one traveler owns many trips across the lifetime loop; design the itinerary per-trip, and ready for later role-scoped participants (the team socket).
- **The layered page needs almost no new data** — the dossier already carries the calm surface (hook, ~5 facts, safety card, the "know more" gate) and the depth (jewels = curated Layer 1, trails = booking lanes; "our best first" = order by curation tier). It's a reveal-on-demand UI over data we've already shaped.

---

## Recommended starting points
- **SEO rendering** — highest-risk blocker for the whole traffic thesis; universally underestimated. **De-risked by a spike (Jul 2026):** a server-render of a real content page (`/region/06A`) produced ~6.8 KB of crawlable HTML with the region, destinations, and blurb in the markup, and per-page `<head>` (title/meta/canonical/hreflang/`TouristDestination` JSON-LD) generates cleanly from the dossier `seo` fields. The app is **SSR-safe** (guarded `localStorage`, `useUnsplashImage` fallback, synchronous bundle catalog — no crashes in Node). SSG is the confirmed approach; likely tool `vite-react-ssg` (fits our react-router app with least churn), Vike as fallback. Remaining work is toolchain wiring: routes-as-data + `getStaticPaths` from the catalog + head integration + a **content-change → rebuild** trigger (the monthly sweep calls it) + deploy target. Ship the render fix on the current host first; treat a Cloudflare move as a separate cost step.
- **Destination data model** — every other piece (dossiers, cache-back, sweep, World-Engine) hangs off it.
- **i18n** — consciously scheduled *last* before full launch, resourced as its own workstream; prove the engine in English first.
