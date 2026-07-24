# Atlas voice agent worker

The server process that makes Atlas talk + listen in real time. It joins a
LiveKit room and runs the real stack — **Deepgram** ears, **Cartesia** mouth,
**Claude** brain (our Atlas voice prompt), LiveKit's semantic turn-taking +
barge-in — and mirrors each spoken turn as text over a data channel.

**This is a standalone service, not part of the Vite app.** The app build never
touches it. Deploy it wherever long-running Node services live (LiveKit Cloud
agent hosting, a small container, Fly/Render, etc.).

## Status (honest)
Authored against the LiveKit Agents Node SDK docs; **not yet run** — it needs a
live LiveKit project + keys, which the build sandbox can't reach. Running it (below)
is the completing step of the voice spike: it pins exact plugin/API versions and
turns the ~3–4 week estimate into a committed date.

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
