/**
 * BELT — LiveKit (WebRTC). DROP-IN STUB (spike).
 *
 * The recommended belt: web-native/WebRTC-first (Atlas lives in a browser),
 * carries Safari/WebKit (critical for Japan/iPhone live audio), turn-detection
 * (semantic endpointing) built in. The belt is the ONLY piece not casually
 * swapped — the mouth/ears stay swappable slots on top of it.
 *
 * Architecture (the real build):
 *   1. Client asks our `livekit-token` edge function for a room token
 *      (LIVEKIT_API_KEY/SECRET live as Supabase secrets — never in the browser).
 *   2. Client joins the LiveKit room over WebRTC using that token + the room URL.
 *   3. A LiveKit AGENT WORKER runs server-side and hosts our stack: our Claude
 *      brain (unchanged edge logic) + the Cartesia mouth + the Deepgram ears,
 *      publishing/subscribing audio tracks into the room. Turn-taking is the
 *      belt's semantic endpointing.
 *   4. The mirror: the agent also emits the text of each Atlas turn over a data
 *      channel so the UI shows the whole answer while he speaks it.
 *
 * The brain stays OURS and outside LiveKit's format — LiveKit only moves audio +
 * turn signals. That preserves the no-welded-box rule.
 *
 * This stub connects() by explaining what's missing; with degradeToBrowser the
 * factory falls back to the browser belt so nothing breaks pre-wiring.
 */
import type { VoiceBelt, Mouth, Ears } from "./types";
import { browserMouth, browserEars } from "./browser";

export interface LiveKitBeltOpts {
  livekitUrl?: string;
  tokenEndpoint?: string;
  mouth?: Mouth;
  ears?: Ears;
}

export function createLiveKitBelt(opts: LiveKitBeltOpts): VoiceBelt {
  let connected = false;
  return {
    transport: "livekit",
    get connected() { return connected; },
    // On the belt, mouth/ears route through the room's agent; until the agent +
    // token server exist, expose the browser slots so the UI still works.
    mouth: opts.mouth ?? browserMouth,
    ears: opts.ears ?? browserEars,
    async connect() {
      if (!opts.livekitUrl || !opts.tokenEndpoint) {
        throw new Error("liveKitBelt: needs livekitUrl + tokenEndpoint (spike stub — not wired). See docs/voice-stack-spike.md");
      }
      // REAL BUILD: fetch token from tokenEndpoint → new Room() → room.connect(url, token)
      // → subscribe to the agent's audio track; publish the mic track.
      connected = false;
      throw new Error("liveKitBelt: room connect not implemented in spike");
    },
    disconnect() { connected = false; },
  };
}
