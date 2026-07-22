# LiveKit voice spike — outcome + integration plan

The spike David asked for, to scope the voice build honestly. Given the sandbox
has no vendor keys and blocks the vendor endpoints, the spike is what a spike
should be: **prove the integration *shape* and size the real build** — not a live
call. What it produced is real and on `main`.

## What the spike built (verified: build + tsc + 10/10 factory tests green)
The **swappable voice seam** — `src/lib/voice/`:
- `types.ts` — the contract: a **belt** carrying two swappable slots, **mouth** (TTS)
  and **ears** (STT).
- `browser.ts` — the browser belt (Web Speech mouth + ears). The guaranteed floor.
- `cartesia.ts` / `deepgram.ts` — the premium slots, as drop-in stubs with the exact
  wiring notes.
- `livekit.ts` — the LiveKit belt (WebRTC), stub with the full architecture.
- `index.ts` — `createVoiceSession(config)`: **the one place a slot swaps.**
- `supabase/functions/livekit-token/` — the token-server edge-function skeleton.

**The swap is literally one line**, as David wants:
```ts
createVoiceSession();                                    // browser (today)
createVoiceSession({ transport: "livekit",
  mouth: "cartesia", ears: "deepgram",
  livekitUrl, tokenEndpoint });                          // the real stack
```
Anything unwired **degrades to the browser slot** (unless `degradeToBrowser:false`),
so the traveler is never left mute — and the on-screen mirror always carries the text.

## Architecture (the real build)
```
Browser (Atlas UI)  ──►  VoiceBelt (our seam)  ──►  mouth / ears slots
     │                        │
     │  1. asks our           │  belt = "livekit"
     │  livekit-token edge fn │
     ▼                        ▼
 { url, token }        LiveKit room (WebRTC, carries Safari)
                              │
                              ▼
                    LiveKit AGENT WORKER (server-side)
                      ├─ our Claude brain  (UNCHANGED edge logic — stays ours)
                      ├─ Cartesia mouth    (publishes audio track)
                      ├─ Deepgram ears     (subscribes mic, streams transcript)
                      ├─ semantic endpointing (turn-taking, built into LiveKit)
                      └─ data channel → the MIRROR (text of each turn to the UI)
```
The brain never lives inside a vendor's agent format — LiveKit only moves audio +
turn signals. That keeps the no-welded-box rule.

## Config vs real build (the honest split)
- **Config / one-line (done or trivial):** which belt + slots; the degrade behavior;
  the seam the UI talks to.
- **Real build (the work, needs accounts + keys):**
  1. **LiveKit account + `livekit-token` live** — enable the SDK import + minting in the
     skeleton, set `LIVEKIT_API_KEY/SECRET/URL` secrets. *Small once the account exists.*
  2. **The LiveKit agent worker** — the server process that runs our brain + Cartesia +
     Deepgram in the room. *This is the largest piece — it's a new deployable service,
     not an edge function.*
  3. **Cartesia mouth** — WS streaming TTS → audio track, key server-side. *Medium.*
  4. **Deepgram ears** — mic capture → WS streaming STT → transcript, key server-side. *Medium.*
  5. **The mirror** — agent emits each turn's text over a data channel; UI shows it while
     Atlas speaks. *Small-medium (the UI half is mostly there).*
  6. **Wire the Concierge UI to `createVoiceSession`** instead of calling `speak()` directly.
     *Small.*

## Browser test targets (David's two engines)
- **Chromium** (Chrome + Edge — same engine; the "Chrome won't open, Edge does" report is a
  config glitch, not incompatibility).
- **WebKit** (Safari — the fussy one for live audio; **named iPhone/Safari target, especially
  for Japan**). LiveKit carries both; this is the reason to pick LiveKit over Pipecat.

## Demo-readiness path (shortest route to a live voice demo)
1. Stand up a LiveKit account; flip on `livekit-token` (secrets + SDK import). *Free tier fine.*
2. Build the agent worker with our brain + Cartesia + Deepgram. **← the long pole.**
3. Wire the Concierge to the seam; turn on the mirror.
4. Test on Chromium + a real iPhone Safari.

Slots 3–5 are known, well-trodden vendor integrations; the agent worker is the piece to
start now and protect the schedule around. Everything else is assembly on the seam that's
already poured.

## Honest sizing headline
The seam (the thing that could have been architecturally risky) is **done and de-risked**.
The remaining build is **one new service (the agent worker) + two vendor slot integrations +
the mirror** — all known quantities, none research-y. The date hinges on the agent worker;
give me a LiveKit account and I can spike *that* against real infra and return a firm number.
