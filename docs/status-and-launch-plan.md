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
- **Voice** — Web Speech input works; degrades cleanly where unsupported.
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
4. **SEO rendering** (prerender/SSR + per-route meta + sitemap + JSON-LD). 🏋️ **Socket 1 status: ✅ spike-passed · tool locked (`vite-react-ssg`, no fallback needed) · ready to build · gated on rung-2 funding.** No unknowns to re-litigate — when funded, we build straight through.
5. **Test + CI** baseline; analytics **attribution socket** + **marketing-permission fields** on the profile (room, not sends).
6. **Booking = affiliate handoff, locked** — provider is merchant of record; Atlas surfaces → hands off → confirmation returns. No payments to build. Bake the plain-language rule into Atlas ("you'll book right with them," never "I'll hold it for you").

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

### 14-day launch-surface assessment (Jul 2026 — "what's genuinely flippable")
David's question: past the 6-SI soft launch, how much more can go *genuinely* live in ~14 days for a VC demo — real, not planned. Audited the catalog. **The core finding: `live` vs `preview` is almost entirely a status decision, not a content gap.** Every preview region carries the same depth as the live ones (each ~2–4 destinations, mostly 2–3 `verified` + 1 `stub`); the only region with a real provider roster is 05A (39, safari) + 11C (~23 CSV, Caribbean) — and the *live* regions launched without per-region provider rosters too. So the fastest real wins are flipping content we already built and filling the empty rooms in what's already live — not new build.

Prioritized by impact ÷ effort:
1. **Fill hollow spots in what's already live (do first — a live-but-empty room is the worst VC look).** **12A United States is live with 0 destination dossiers** (10 sub-regions, no places) — ingest 3–4 US city dossiers from the stockpile. Upgrade `stub` destinations toward `verified` where the stockpile allows (12 stubs across the catalog).
2. **Flip the content-ready preview regions (near one-line flips + a QC pass).** 06A Southern Africa (2 verified + heavy TLEU coverage: Cape Town whale/festive, Vic Falls, safari dry season), 03F Nordics (aurora/Lapland), 08A East Asia, 09P Oceania, 13A Canada. Each is at content-parity with the 7 live regions. **Hold 10S until the Mexico anchor lands (David's call).** This takes the live world from **7 → up to 12 regions.** Gate each flip on: QC the existing dossiers + a working affiliate handoff, so it's not a hollow flip.
3. **Flip 3–4 high-appeal, content-backed SIs.** `wine` (6 acts), `culinary` (5), `culture` (4), `wellness` (4) all have activities + map onto already-live regions — widens the funnel cheaply. (Live SIs don't depend on the ACTIVITIES map, so this is a QC-and-flip, not a build.)
4. **Surface the TLEU forward calendar.** 70 events are ingested but nothing renders them yet — a modest region/SI-page module ("marquee moments + book-by windows") turns banked data into a *visible*, unique differentiator. Medium effort, high demo value.

**Ski — the honest read (David wants it as a launch target):** ski is the *least* ready of the obvious candidates. **0 ski activities, 0 ski destination dossiers, 0 ski providers** — the only ski data is 2 TLEU lookahead events (Alps, Lapland) that don't surface. Flipping ski genuinely live needs real content (Alps/Japan/Rockies dossiers) + supply (chalet/lift/instructor providers) + activities. It's a **fast-follow ingest, not a status flip** — achievable in the window *only if* the 370-dossier stockpile already holds ski dossiers ready to drop in. Don't promise it day-1 live without confirming that stock.

**Two accuracy guardrails for the VC framing (so we show real, not planned):**
- **"Ranking" is not yet live.** The dossiers are built, but SEO/SSG rendering is unshipped (gated on the raise; proven by spike). Frame as: rich live product now, the ranking engine is the near-term build the raise funds — don't say "ranking today."
- **Languages are not a live asset.** i18n is a locale/RTL *switcher* only — no translated content (Part 2, item 9). "Live in 4 languages" isn't true yet.

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

### Booking hand-off — retention design ("don't lose them to the net jungle")
The moment a traveler leaves to book with a provider is where we can lose them. Design principle: **keep the commission and keep the traveler are separable problems** — solve each with the right tool, don't compromise one for the other.
- **Hard constraint (name it so we don't chase a dead end):** a *web app* cannot put a "Back to TravelWell" bar over a provider's page. Booking sites block iframing (`X-Frame-Options` / CSP `frame-ancestors`), and framing would also break their payment flow **and** our affiliate attribution (the network needs a direct click). So the framed-window idea is not a web option.
- **Keep the commission:** the clean **direct new-tab redirect** to the provider's affiliate URL (what `/go` does today) is exactly what the network wants — don't touch it.
- **Keep the traveler — via our data + our tab, not their screen:**
  1. **Deep-link the hand-off** — carry region + dates + activity so they land on the exact property/charter, not a homepage (per-provider URL templating; biggest always-works win).
  2. **New-tab open keeps our tab alive** (already the case) — home is one tab-switch away; the `/go` return surface waits there.
  3. **Capture the placement *before* they leave** — placed ≠ booked, so the item is in the itinerary marked "handed-off" the instant they tap book. Even if they vanish, **we don't lose the trip.**
  4. **Atlas backstop + self-filing confirmation** — Atlas re-engages ("did you lock in the dive?"), and the confirmation-return field (email-parse → API) files the booking back into the itinerary on its own — the trip completes even if they never click back.
- **Roadmap — the true framed bar:** the "provider opens in an in-app browser with our bar + a Done→Atlas button and a dismiss callback" is a **native-app / installable-PWA** capability (`SFSafariViewController` iOS / `Chrome Custom Tabs` Android). That's David's exact vision — build it when we ship the app/PWA shell, not as a web hack.

### Return & confirmation flow (itinerary-engine spec — phone-first, non-tech traveler as the lens)
From David's cold-test. Three small, high-leverage fixes turn this from fragile to solid. **All three confirmed by David (Jul 2026) — locked to build.** Build gating: it gets its **own itinerary-engine run**, deliberately *not* colliding with the European node builds — David pings when that session opens. Build in the order below.
- **Save at hand-off, not on return (the gap to close).** The trip already lives server-side and reloads on sign-in (`hydrateJourney`/`replaceBlocks`) ✅ — but today the *affiliate* path only writes the item when they come back and tap "I booked it." Write the placement as **"handed-off / pending" the instant they tap book, before the redirect**, so the trip remembers even if they never return. (`placed ≠ booked`.)
- **Never "confirmed" without real details (a live bug today).** The current "I booked it" button flips the item to `confirmed` with *no* details — a hollow record. Add detail fields to the itinerary item (**date, time, party size, confirmation number, price**) and gate the `confirmed` status on them. "Yeah I did it" *starts* the capture, never closes it. Capture manually via Atlas **one question at a time, conversational — not a form** (email-parse / API fill it automatically where available).
- **Return = a magic-link email into the loaded trip** (the phone-first primary path). We already sign in by magic link, so the return email is that same link pointed at `/itinerary` — one tap, no password, lands them right where they left off. The *send* (reactivation: "did you lock in that dinner?") rides the EmailEventBus. Better than any browser-based return, because email is a channel we control.
- **Per-lane commission — where the money actually sits:** **affiliate** (CJ/AWIN/Viator/GYG) commission fires on the *network's* cookie at click time, so we get paid even if we miss details — missing detail only costs the *itinerary record + our reconciliation*. **Direct/DMC** (the 15–21% host-IATA lane) tracking is often *ours*, so detail-capture can be tied to *claiming/proving* the commission — **this is the real revenue risk**, and another reason detail-capture matters most on the high-commission bookings.
- **Device-aware return directions** — trivial to detect (we already read the viewport), but *largely unnecessary* if the magic-link email is the primary return, since one tap works on every device. A small enhancement, not a need. The true framed in-app "back to TravelWell" bar remains a native/PWA feature (see above).

### Collect & Build Together (itinerary behavior — traveler authors, Atlas guides)
The itinerary engine is **NOT an auto-optimizer** — it's a collect-pile → guided placement → traveler-decided sequencing. Slots onto the model we already have:
- **Collect pile = the `idea` status we already have.** A loved-but-unplaced option is `idea`; placing it is `idea → placed` (then handed-off → confirmed). So "grab everything you love, no pick-one pressure" needs no new state — flag as `idea`.
- **The load-bearing line: the timing/fit data *informs* Atlas's suggestions; the traveler *decides*.** The engine **enforces only the safety spine** — the derived buffers from fit-rules (no-fly-after-diving, arrival rest, recovery morning). *Everything discretionary* (which day the vineyard, morning vs afternoon light, what pairs with what) is a **suggestion the traveler places**, never an auto-arrange. Atlas offers what he knows ("prettiest in afternoon light," "good table only Tuesday" — from fit-rules + `local_signals` timing), proposes, then asks.
- **Feel-checks from a light density signal.** The engine can compute a day's "how packed" (count + pace/intensity fit-tags) to *prompt* Atlas's "starting to feel crowded? / does this flow?" — but it **never auto-rebalances**; it surfaces and asks, and reshapes only on the traveler's word.
- **Traveler-decided sequencing.** The itinerary is a canvas the traveler arranges; on any reshuffle only the **derived safety buffers recompute** — the traveler's chosen order stands. Atlas keeps the pen in their hand.
- **Guardrail (into Atlas's prompt):** never say "I'll set your itinerary at the best time and order" as if he decides it; never hand back a finished trip they didn't shape; never rush the feel-checks.

### Atlas conversational layer — locked doctrine (build at the conversational/itinerary-engine phase)
Two locked docs: the **Atlas Opening** (dream-first intake → a structured *vision object*: SI primary/secondary, feel/archetype, region-pull, style→tier) and the **Content-Only Redirect Protocol** (L1/L2 book freely; L3 books only if it passes all three safety gates; L4 & L3-blocked are content-only — talk about it, no Book button).
- **Rides on what's built:** the persistent Atlas spine (holds the vision), the subject-based profile (the vision object seeds identity), and the dossier's `advisory_level` + `posture` (`booking_hold` = the content-only switch).
- **New data field:** a `feel` / `archetype` tag on destinations — the redirect matches on **SI + feel + region proximity** (never one axis alone; SI-only offers a bad cousin). We carry SI + region but not feel yet — add it to the destination record.
- **New build:** the conversational intake + vision-object schema; the layered-match ranking (rank by layers shared); the **two-tone** explanation branch (L4 brief/firm; L3-blocked reasoned + sourced).
- **Locked life-safety language** goes verbatim into Atlas's system prompt — speak "safety" plainly, keep travelers **informed**, and **never promise the outcome "safe."** Spec together with David when the engine is ready.

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
- **Destination key convention (locked):** `<city>-<country>`, **full country name spelled out, lowercase, hyphenated** — e.g. `cape-town-south-africa` (never `cape-town`, `-za`, or `-SA`; `mexico`, never `mx`). Collision-proof at global scale (many Valladolids, San Josés, Córdobas). The key comes verbatim from each conformed dossier as the library lands — don't derive from memory (edge cases like "St. Lucia / St. Lucia" or "Patagonia / Chile-Argentina" need the dossier's canonical, not a naive slug). Cape Town is renamed to `cape-town-south-africa` as the locked template anchor; the rest adopt the key as their dossiers conform.

---

## Recommended starting points
- **SEO rendering** — highest-risk blocker for the whole traffic thesis; universally underestimated. **De-risked by a spike (Jul 2026):** a server-render of a real content page (`/region/06A`) produced ~6.8 KB of crawlable HTML with the region, destinations, and blurb in the markup, and per-page `<head>` (title/meta/canonical/hreflang/`TouristDestination` JSON-LD) generates cleanly from the dossier `seo` fields. The app is **SSR-safe** (guarded `localStorage`, `useUnsplashImage` fallback, synchronous bundle catalog — no crashes in Node). SSG is the confirmed approach, and the tool is decided: **`vite-react-ssg`** — a contained spike (Jul 2026) ran `vite-react-ssg build` over the real app and produced crawlable static HTML for **every route** (all 13 regions + 38 destinations via `getStaticPaths`, plus home/legal/SI pages), content in the markup, client hydration intact, zero SSR crashes. **No Vike fallback needed.** Host stays **Vercel** (Cloudflare move dropped — a separate cost conversation, not coupled to the render fix). Remaining full-socket work: routes-as-data + `getStaticPaths` wired into the real entry, **per-page `<head>` from the dossier `seo` fields** (proven separately), the **content-change → rebuild** trigger (below), and switching the production build command over.

**The rebuild trigger — tie it to the real content flow.** New dossiers land in the research library (`Travelman73/tww-research-library`) and a monthly sweep adds more. The flow to wire: **content lands → ingested into the MVP DB (Supabase) → a Vercel Deploy Hook fires → SSG rebuilds → new pages go crawlable**, with no manual step. Both sources — a fresh dossier *and* the monthly sweep — call the same deploy hook, so David never has to think about it: content lands, the site rebuilds, the bots see the new pages. (Later, when cache-back writes atlas-sourced pages, they ride the same hook.)

**Why rendering is the highest-leverage socket — the stockpile.** ~**370 destination dossiers are already built** in the research library — organic runway already paid for by the deep-build work, that can't earn until the pages are live. The day SSG ships and the corpus is ingested, **all 370 go crawlable and start their Google indexing/ranking clocks at once** — banking runway, not creating it. So rendering-early isn't just "look legit for reviewers"; it's what gives every page the weeks-to-months of runway to be ranking *by the time its demand wave stirs* (the organic clock starts before the paid fire_date). The first rebuild prerenders the full corpus — SSG handles the scale easily (the spike built ~50 pages in seconds; 370 is still a fast static build).
- **Destination data model** — every other piece (dossiers, cache-back, sweep, World-Engine) hangs off it.
- **i18n** — consciously scheduled *last* before full launch, resourced as its own workstream; prove the engine in English first.
