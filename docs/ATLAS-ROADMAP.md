# Atlas — Roadmap & Deferred Features

Tracks what's built and what's intentionally deferred, so flagged-for-later ideas
aren't lost. Sequencing per David's vision docs + Sana's tiering.

## Shipped
- **Signals data layer** (`src/data/local-signals.ts` → `local_signals`, migration `0007`) — curated, DB-served, bundle fallback.
- **Grounded Atlas** — Travel I.D. + journey + considered + happenings as context; temporal-honesty rule in the edge function.
- **Well Whispers v2** — planning-stage, signal-driven, real `href`, cadence/quiet-hours gates.
- **Anchor** — the warm way back (path + scroll), voice per David's Voice Guide.
- **Curated content** — Batch 1 (Sana's 5 + David's 20: dive / honeymoon / tropical / river + hurricane-awareness).

## Deferred — Tier B (feed-fed), later
- **Live events feeds** — festivals/markets/concerts keyed by destination + date, to keep dated-events fresh without hand-authoring.

## Deferred — Tier C (provider real-time) / feed phase
- **Live Marine Conditions layer** *(David — TWW-Feature-Marine-Conditions, 2026-06-22)* — current + forecast **wind, wave height, swell, tide, current, water temp, visibility** for water destinations, for the water SIs (Dive Liveaboards, the water side of Tropical/Honeymoons, future Sailing/Yacht).
  - **Tools David wants:** (1) **Windy** embed/link with a sliding forecast timeline + plain "how to read it" directions for non-mariners (offshore-wind trap, wind-against-current); (2) a **global tides source** (NOAA Tides & Currents for US/Caribbean; WorldTides/Tide-Forecast global) — slack vs running, when it turns. The lived danger: narrow cuts running 7–9 kt.
  - **Presentation rule (David):** lead plain + reassuring for ALL travelers ("Today off Grace Bay: calm, light winds, easy swimming"), optional "go deeper" numbers for divers/sailors, honest framing when rough, never fabricate (show source + timestamp; "no current readings" beats a made-up number).
  - **The two layers:** the *stable seasonal* conditions already live in `LocalSignal.blurb` (done); this is the *live* layer that says "and right now, here's what it's actually doing." Lives alongside, surfaced by Atlas in the friend voice.
  - ⚠️ Check Windy + tide-source embed/API terms and free-vs-paid tiers at build.

## Deferred — later
- **Notification / delivery keystone** — outbound reach-outs at open moments; the 2-and-4-year lookahead planning horizon.
- **Provider/compare whisper hooks** — non-route exploration signals (provider expand, region compare).
- **Anon→account event reconciliation polish** and cross-device position resume edge cases.
