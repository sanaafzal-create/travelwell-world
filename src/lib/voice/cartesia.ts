/**
 * MOUTH slot — Cartesia (Sonic) TTS. DROP-IN STUB (spike).
 *
 * Why default mouth: in live conversation latency is FELT, fidelity only admired
 * — Cartesia is ~fastest first-audio, so Atlas never reads as "I thought this
 * was AI." ElevenLabs is the fidelity swap-in later (same interface).
 *
 * Wiring (the real build): open a WebSocket to Cartesia, stream text in, receive
 * PCM/opus chunks, play through an AudioContext (or, on the LiveKit belt, publish
 * the audio track into the room). The CARTESIA_API_KEY stays SERVER-SIDE — the
 * browser calls our edge proxy / LiveKit agent, never Cartesia directly.
 *
 * Until wired, supported()=false so the factory degrades to browserMouth.
 */
import type { Mouth } from "./types";

export const cartesiaMouth: Mouth = {
  name: "cartesia-sonic",
  supported: () => false, // flip true once the WS proxy + audio playback are wired
  speak() { throw new Error("cartesiaMouth: not wired yet (spike stub — see wiring notes)"); },
  stop() { /* close the WS + stop playback when wired */ },
};
