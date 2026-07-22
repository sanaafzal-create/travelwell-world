# VC demo — honest build assessment (true state vs the WOW note)

Response to David's VC WOW note + presentation spec (2026-07-17). The governing
rule is his: **build it right, and size it honestly — no faking for a calendar.**
So this is the true state of every piece, verified against the live code on
`main`, not a smoothed version.

## ⚠️ Two things believed "already built" that are NOT in this repo
David's note calls two items done. Neither is in `sanaafzal-create/travelwell-world`:

1. **The pet-safety every-30-days engine** (airline pet rules + destination-country
   import rules, refreshed monthly). **Not present** — no pet data, no pet panel,
   no refresh job, no pet button. Every "pet" string in the tree is "petty crime"
   or "Petra." *If it lives in the research library or a separate prototype, point
   me at it and I'll wire it in. If it was a concept/mockup, treat it as a net-new
   build (see sizing).* This is the biggest gap between the note and reality.
2. **The Luxury Paris day-1→7 commission-stacked itinerary.** **Not present.**
   `/itinerary` today is a generic Day 1–3 view driven by whatever blocks the user
   added — no full week, no commissions/pricing reveal, no Paris sample. Paris
   exists only as one thin bundle destination row. *Same ask: if the "wonderful
   Paris itinerary" was a real artifact, where does it live? If it was a design, the
   sample + hidden commission reveal is a build (sized below).*

Flagging now, plainly, is exactly how we honor "the line I won't cross" — better to
find this today than on demo day.

## True-state inventory

| Piece (from the note) | State | Notes |
|---|---|---|
| Atlas **text** chat | ✅ LIVE | Claude edge function + Concierge UI, persistent, multilingual |
| Atlas **voice** (speak/listen) | 🟡 BASIC | Browser Web Speech today (`useSpeech`/`voice.ts`) — works, but not the low-latency "finished product" feel |
| Real voice stack (LiveKit+Cartesia+Deepgram) | ❌ NOT BUILT | The centerpiece upgrade; longest pole |
| The **mirror** (speak + show same text) | 🟡 PARTIAL | TTS mirror exists; not the full loud/defined live-words experience |
| **Choreography** (Atlas lights the path) | 🟡 PARTIAL | ONE scripted path built + verified (Stay-Well pulse). "Drives any element, voice-synced" = build, and it needs the real voice stack to truly sync |
| Green-cross **human safety** button | ✅ LIVE | `SafetyFab` → Emergency panel |
| **Red emergency** (global, numbers) | ✅ LIVE | Emergency panel, verified emergency-numbers data |
| **Talk to Atlas** button | ✅ LIVE | Concierge FAB + header |
| **Itinerary/Trip** button | ✅ LIVE | Header "Your Trip" → tray + `/itinerary` page |
| Green-cross **pet safety** button + engine | ❌ NOT BUILT | See flag #1 |
| **Two distinct** green crosses, always-on floating placement | 🟡 PARTIAL | Human safety exists; needs arranging as David's exact 5-button layout |
| **Onboarding = clean 4 steps** (vision/activities/pace/budget) | 🟡 PARTIAL | Today ~2 beats (dream → vision card → confirm); captures vision + SIs, NOT activities/pace/budget as steps. Needs building to the clean 1-2-3-4 |
| **Real options surface** from onboarding picks (Layer 1) | 🟡 PARTIAL | Catalog + SI/region/feel/tier data exist and are rich for Safari; the *personalized live surfacing* ("responds to ME") is the gap |
| **Median 3-tier** budget display | ❌ NOT BUILT | Profile has per-Well budget prefs; the "pick 2/3/4 → three priced options, middle = median" demo view is new |
| **Commission/monetization reveal** on the sample itinerary | ❌ NOT BUILT | The VC-only hidden view |
| **First-aid / safety kit** page | ✅ LIVE | `FirstAidKit.tsx` pre-order page (bleed/breathe framing, QR safety card). Price ($189) + commission/drop-ship specifics TBD |
| **Ad-tracking** end-to-end + live on screen | 🟡 PARTIAL | `journey_events` server-side spine is built (the hard, right part). Wiring out to Meta CAPI / Google enhanced conversions + a live "watch the dollar flow" display = build |
| 9-language demo path | ✅ LIVE | Home/Regions/SIs/Wells/catalog names in-language |
| MCP read-only server (agent-reads-us) | ✅ LIVE | Deployed; bonus WOW surface |

## The deepest SI today is **Safari / East Africa (05A)**, not Winter/Ski
The note floats Winter/Ski as the star. **In the MVP, `ski` is still `preview` with
zero destinations** — the alpine dossiers live in the research library and need the
ingest-then-flip first. **Safari/East Africa is the provider-complete SI right now**
(39-provider roster, real safety spine, MCP-verified). Recommendation: **make Safari
the flawless star** unless the Alps ingest lands cleanly before demo day. "One SI
done perfectly" → pick the one that's actually deep today.

## Framework call: **LiveKit** (my builder's read, decisive)
Over Pipecat, for us specifically:
- **Atlas lives in a browser.** LiveKit is web-native/WebRTC-first; Pipecat is
  Python-first and heavier to run browser-side.
- **Safari/WebKit is non-negotiable** (Japan skews iPhone). LiveKit carries WebKit;
  it's the fussy engine for live audio and LiveKit is proven there.
- **Turn-detection built in** (semantic endpointing) — don't roll our own.
- **It fits our locked voice canon** — LiveKit is just the "belt"; the brain stays
  ours (Claude in our edge function), TTS/STT are swappable slots. No welded box.
Pipecat wins for telephony / custom Python pipelines — not our shape. **LiveKit.**

## Honest sizing (relative; the true unknowns named)
Not fake-precise hours. Grouped by effort, longest poles called out.

- **Small (assembly of existing parts):** the 5-button layout arrangement; the
  commission-reveal view on a *curated* sample itinerary; the First-Aid kit
  price/drop-ship finish.
- **Medium:** onboarding → clean 4 steps (extend the vision flow to capture
  activities/pace/budget); the median 3-tier option display; Layer-1 personalized
  option surfacing for Safari (data exists; it's the surfacing UI); extending the
  choreography from one scripted path to the full Wells-walk.
- **Large / longest poles (start these first, they gate the date):**
  1. **Real voice stack** (LiveKit belt + Cartesia + Deepgram, loaded live, mirror,
     Safari-tested). This is the centerpiece and the biggest integration.
  2. **Pet-safety engine** *if net-new* (airline rules × destination import rules,
     monthly refresh, data sourcing). Could be the single largest item — hinges
     entirely on flag #1 (does it exist somewhere?).
  3. **Ad-tracking end-to-end** — wiring `journey_events` out to Meta CAPI + Google
     + a live display. Spine's done; the wiring + demo dashboard is real work.

The date can't be set until we resolve flag #1/#2 (do the pet engine and Paris
itinerary exist elsewhere?) and until the voice-stack integration is scoped against
a real LiveKit spike. Everything else is knowable and mostly assembly.

## Build first — highest WOW-per-hour
**The single-SI end-to-end personalized spine on Safari/East Africa**, because it's
the "hands on the wheel, it responds to ME" moment (Layer 1) and it's mostly
*assembly of parts we already have* (rich catalog + safety + the hero-pulse seam):
onboarding(4 steps) → pick Safari → pick region → real options matched to their picks
→ 3-tier median → itinerary reveal with the hidden commission view. That's the whole
"wow, this sucker works" arc on proven data.

**In parallel, start the LiveKit voice spike immediately** — it's the longest pole
and the centerpiece; it must not be discovered late. Voice + the personalized spine,
converging on the one Safari journey, is the demo.

**Sequence:** personalized Safari spine (assembly) → LiveKit voice on that spine →
full choreography across it → commission itinerary reveal → the 5-button polish +
pet (pending flag #1) + ad-tracking display.
