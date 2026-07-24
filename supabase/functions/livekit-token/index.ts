// TravelWell.World — "livekit-token" Edge Function. SPIKE SKELETON.
//
// The one server piece the LiveKit voice belt needs: mint a short-lived room
// token so the browser can join a room over WebRTC. The LIVEKIT_API_KEY /
// LIVEKIT_API_SECRET stay here as Supabase secrets — never in the client.
//
// The browser calls this, gets { url, token }, and joins. A separate LiveKit
// AGENT WORKER (not this function) hosts our Claude brain + Cartesia mouth +
// Deepgram ears in the room (see docs/voice-stack-spike.md). This function only
// hands out join credentials — it is not the agent and not the brain.
//
// Deploy:  supabase functions deploy livekit-token
// Secrets: supabase secrets set LIVEKIT_API_KEY=... LIVEKIT_API_SECRET=... LIVEKIT_URL=wss://...
//
// Mints a real join token when LIVEKIT_* secrets are set; degrades (200 +
// degraded:true) like `atlas` when they're not, so nothing breaks pre-config.

import { AccessToken } from "npm:livekit-server-sdk@^2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const D = (globalThis as any).Deno;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { room, identity } = (await req.json().catch(() => ({}))) as { room?: string; identity?: string };
    const apiKey = D?.env.get("LIVEKIT_API_KEY");
    const apiSecret = D?.env.get("LIVEKIT_API_SECRET");
    const url = D?.env.get("LIVEKIT_URL");

    if (!apiKey || !apiSecret || !url) {
      return Response.json(
        { degraded: true, note: "LiveKit not configured — set LIVEKIT_API_KEY/SECRET/URL. Voice falls back to the browser belt." },
        { headers: cors, status: 200 }
      );
    }

    const roomName = room ?? "atlas";
    const who = identity ?? `traveler-${crypto.randomUUID().slice(0, 8)}`;
    const at = new AccessToken(apiKey, apiSecret, { identity: who, ttl: "15m" });
    at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });
    return Response.json({ url, token: await at.toJwt(), room: roomName, identity: who }, { headers: cors, status: 200 });
  } catch (err) {
    console.error("livekit-token error", err);
    return Response.json({ degraded: true, note: "token error" }, { headers: cors, status: 200 });
  }
});
