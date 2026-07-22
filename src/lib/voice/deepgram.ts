/**
 * EARS slot — Deepgram streaming STT. DROP-IN STUB (spike).
 *
 * Why: fast streaming words on screen (the live transcript). AssemblyAI is the
 * swap-in (same interface).
 *
 * Wiring (the real build): capture mic audio, stream it over a WebSocket to
 * Deepgram (via our edge proxy, or through the LiveKit agent), receive interim +
 * final transcripts → onPartial / onFinal. DEEPGRAM_API_KEY stays SERVER-SIDE.
 * Turn-taking is NOT done here — semantic endpointing lives in the LiveKit belt.
 *
 * Until wired, supported()=false so the factory degrades to browserEars.
 */
import type { Ears } from "./types";

export const deepgramEars: Ears = {
  name: "deepgram-nova",
  supported: () => false, // flip true once mic capture + WS streaming are wired
  start() { throw new Error("deepgramEars: not wired yet (spike stub — see wiring notes)"); },
  stop() { /* close the mic stream + WS when wired */ },
};
