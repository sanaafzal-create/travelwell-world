# Atlas voice agent worker

The server process that makes Atlas talk + listen in real time. It joins a
LiveKit room and runs the real stack — **Deepgram** ears, **Cartesia** mouth,
**Claude** brain (our Atlas voice prompt), LiveKit's semantic turn-taking +
barge-in — and mirrors each spoken turn as text over a data channel.

**This is a standalone service, not part of the Vite app.** The app build never
touches it. Deploy it wherever long-running Node services live (LiveKit Cloud
agent hosting, a small container, Fly/Render, etc.).

## The prompt reads the live catalog

Atlas's voice prompt is built at start-up from `src/data/taxonomy.ts` — the same
source the website renders — so the interests, regions and Wells it offers can
never drift from what we actually sell. Watch for this line on the first job:

```
[atlas] voice prompt built from the live catalog — 8 interests, 13 regions, 10 live Wells
```

If you instead see `COULD NOT READ THE LIVE CATALOG`, the worker still runs but
on a static fallback list that may be out of date — fix it before a demo.

## Status — the spike is PROVEN; what remains is a deployment
**Superseded 2026-08-20.** This section used to read *"not yet run"*, and it was
still saying so long after the worker had been run against a live LiveKit project
and debugged there. The evidence is in the history: `the transcript mirror never
published — reliable is required` and `don't say "live" until the AGENT joins —
the empty-room bug` are both faults you can only find by talking to it. Atlas
hears and answers aloud, brain ours.

That matters more than a tidy doc. A stale *"not yet run"* is what turns a
committable date back into the old ~3–4 week estimate, because the next person to
size this reads the README, not the log.

**What is actually left is operational, not a build:**
1. **A host for this process.** It runs wherever someone starts it — today, a
   laptop. Nothing is deployed anywhere, so live voice dies when that shell
   closes. This is the whole gap between "proven" and "up".
2. **Paid vendor tiers.** The keys below are free-tier dev keys.
3. **`LIVEKIT_*` as Supabase secrets** as well as in `.env` — see the warning
   below; this one has bitten before.
4. **Cartesia vs ElevenLabs**, decided by ear on our real lines (`VITE_TWW_MOUTH`).

**Known gap, sized honestly:** `llm: new anthropic.LLM()` gives voice Atlas our
prompt but NOT the per-traveler context the typed Atlas receives — Travel I.D.,
the current journey, happenings, the capabilities overlay. Voice Atlas is
prompt-only. It is not wrong, it is less aware, and a tester who has used the
typed Atlas will feel the difference. See the brain-stays-ours upgrade below.

## Run it (the spike's live step)
```bash
cd voice-agent
npm install
cp .env.example .env    # then fill in the keys below
npm run dev             # connects to your LiveKit project, waits for rooms
```

`.env` (all free-tier dev keys):
```
LIVEKIT_URL=wss://travelwell-atlas-xxxx.livekit.cloud
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
DEEPGRAM_API_KEY=...
CARTESIA_API_KEY=...
ANTHROPIC_API_KEY=...        # the brain — same key family as the atlas edge fn
```

## ⚠️ The LiveKit keys live in TWO places (easy to miss)
Filling in `.env` below powers **this worker** only — it runs on your machine.
The **browser** gets its room token from the `livekit-token` Supabase edge
function, which runs on Supabase's servers and cannot see this file. So the same
three values must ALSO be set as **Supabase secrets**:

```bash
supabase secrets set LIVEKIT_URL=wss://... LIVEKIT_API_KEY=... LIVEKIT_API_SECRET=...
# or, no CLI: Dashboard → Project Settings → Edge Functions → Secrets
```
Only the three `LIVEKIT_*` values are needed there — Deepgram/Cartesia/Anthropic
stay with the worker. Symptom of missing them: the app's live-voice button says
*"Live voice isn't switched on yet"* even though the worker is running fine.

## How it connects to the app
1. Browser asks the **`livekit-token`** Supabase edge function for a room token
   (LIVEKIT_* live as Supabase secrets there).
2. Browser joins the room over WebRTC (the client LiveKit belt in
   `src/lib/voice/livekit.ts`), publishes mic, subscribes to Atlas's audio.
3. **This worker** is already in that room doing STT→LLM→TTS + turn-taking, and
   publishing transcript text on the `transcript` data topic (the mirror).

## Pin-at-run notes
- Confirm the exact `@livekit/agents` version's API for `voice.AgentSession` /
  plugin constructors (the SDK moves fast) and adjust names if needed.
- To audition **ElevenLabs** vs Cartesia: swap the `cartesia` TTS line for the
  elevenlabs plugin — one line, per the swappable-slot rule.
- Brain-stays-ours upgrade: replace the `anthropic.LLM` node with a custom LLM
  that calls our `atlas` edge function, so context + safety logic stay in one place.
