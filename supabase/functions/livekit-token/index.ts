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
// Spike status: skeleton. Uncomment the SDK import + minting once the LiveKit
// account exists; until then it degrades (200 + degraded:true), like `atlas`.

// import { AccessToken } from "npm:livekit-server-sdk@^2";

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

    // REAL BUILD (once the account + SDK import are in):
    //   const at = new AccessToken(apiKey, apiSecret, { identity: identity ?? crypto.randomUUID(), ttl: "10m" });
    //   at.addGrant({ roomJoin: true, room: room ?? "atlas", canPublish: true, canSubscribe: true });
    //   return Response.json({ url, token: await at.toJwt() }, { headers: cors });
    return Response.json(
      { degraded: true, note: "livekit-token skeleton — enable the SDK import + minting to go live.", room: room ?? "atlas", identity: identity ?? "traveler" },
      { headers: cors, status: 200 }
    );
  } catch (err) {
    console.error("livekit-token error", err);
    return Response.json({ degraded: true, note: "token error" }, { headers: cors, status: 200 });
  }
});
