/**
 * TravelWell.World — Atlas voice AGENT WORKER (LiveKit Agents, Node).
 *
 * This is the "long pole" from the voice spike: the server process that lives in
 * a LiveKit room and runs the real stack — Deepgram ears, Cartesia mouth, our
 * Atlas brain, semantic turn-taking + barge-in from LiveKit — and mirrors each
 * spoken turn as text over a data channel. The browser stays thin; this does the
 * heavy lifting.
 *
 * BRAIN STAYS OURS (canon): the LLM is Claude with OUR Atlas voice prompt +
 * safety language. LiveKit only moves audio + turn signals — Atlas's logic is
 * never inside a vendor's agent format. (v2: swap this LLM node to call our own
 * `atlas` edge function behind the same interface — the seam again.)
 *
 * ── HONEST STATUS ──────────────────────────────────────────────────────────
 * AUTHORED against the LiveKit Agents Node SDK docs. It has NOT been run — my
 * build sandbox can't reach LiveKit/Deepgram/Cartesia. Running this against a
 * live LiveKit project (`npm i && npm run dev`) is the completing step of the
 * spike and pins exact plugin/API versions. Everything up to that is done here.
 * ───────────────────────────────────────────────────────────────────────────
 */
import { type JobContext, WorkerOptions, cli, defineAgent, voice } from "@livekit/agents";
import * as deepgram from "@livekit/agents-plugin-deepgram";
import * as cartesia from "@livekit/agents-plugin-cartesia";
import * as anthropic from "@livekit/agents-plugin-anthropic";
import * as silero from "@livekit/agents-plugin-silero";
import { fileURLToPath } from "node:url";

// Lean VOICE-MODE Atlas prompt (canonical prompt lives in supabase/functions/atlas).
// Voice needs ~60–70% shorter answers than text — 2 sentences, warm beat → fact →
// hand back, never speak lists, never fabricate, never book, never promise "safe".
const ATLAS_VOICE_PROMPT = `You are Atlas, TravelWell.World's concierge, speaking aloud.
Keep every turn to at most two short sentences. One warm beat, then the fact, then hand the turn back.
Never read lists aloud — they're on the traveler's screen; point to them instead.
Never invent a price, provider, or safety fact. If you don't have it, say so plainly.
You suggest and shape; you NEVER book — the traveler always chooses and books.
Speak safety straight and keep them informed; never promise the outcome "safe".`;

// Hard words to bias the recognizer (from docs/atlas-demo-script.md Appendix A).
const KEYTERMS = [
  "Maasai Mara", "Serengeti", "Ngorongoro", "Angama Mara", "Mahali Mzuri",
  "Governors' Camp", "Sossusvlei", "AlUla", "Nairobi", "liveaboard",
];

export default defineAgent({
  entry: async (ctx: JobContext) => {
    await ctx.connect();

    const session = new voice.AgentSession({
      vad: await silero.VAD.load(),
      // EARS — Deepgram, with keyterm prompting so accents/place-words resolve.
      stt: new deepgram.STT({ model: "nova-3", keyterms: KEYTERMS }),
      // BRAIN — Claude, our prompt. (Swap to our atlas edge fn behind this seam later.)
      llm: new anthropic.LLM({ model: "claude-sonnet-5" }),
      // MOUTH — Cartesia Sonic (fastest first-audio). Audition ElevenLabs by ear;
      // it's a one-line swap here (cartesia -> elevenlabs plugin), never an app edit.
      tts: new cartesia.TTS({ model: "sonic-2" }),
      // Turn-taking (semantic endpointing) + barge-in are the belt's job, not ours.
    });

    // THE MIRROR: forward each turn's text over the room data channel so the UI
    // shows Atlas's whole answer while he speaks it (accessibility + dialect net).
    session.on("conversation_item_added", (item: { role: string; textContent?: string }) => {
      if (!item.textContent) return;
      const payload = new TextEncoder().encode(JSON.stringify({ role: item.role, text: item.textContent }));
      ctx.room.localParticipant?.publishData(payload, { topic: "transcript" });
    });

    await session.start({
      agent: new voice.Agent({ instructions: ATLAS_VOICE_PROMPT }),
      room: ctx.room,
    });
  },
});

// `node index.js dev` connects to your LiveKit project and waits for rooms.
cli.runApp(new WorkerOptions({ agent: fileURLToPath(import.meta.url) }));
