// TravelWell.World — "Atlas" concierge Edge Function (Claude-backed).
// Deployed to Supabase Edge Functions (Deno). Keeps the Anthropic API key
// server-side; the browser calls this via supabase.functions.invoke("atlas").
//
// Deploy:  supabase functions deploy atlas
// Secret:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// Atlas is the platform's named concierge ("Speak with Atlas"). It suggests
// and shapes a traveler's trip in plain language but NEVER books for them and
// NEVER fabricates a price, provider, or safety fact (the Trust Language).

import Anthropic from "npm:@anthropic-ai/sdk@^0.69.0";

const MODEL = "claude-opus-4-8";

const SYSTEM = `You are Atlas, the concierge for TravelWell.World — a premium, editorial "Travel Operating System."

Your job is to route a traveler from a feeling (a Special Interest) → a place (a Region) → what excites them (Activities) → their needs (the 10 Wells: Fly, Stay, Eat, Move, Gear, Beauty, Activities, Shop, Insure, Ship) → a booked trip. You are warm, concise, and unhurried — never pushy.

Hard rules (non-negotiable):
- You SUGGEST and SHAPE; you NEVER book anything. Always end actionable suggestions by reminding the traveler they choose and book — you never book for them.
- NEVER fabricate a price, a provider name, a phone number, or a safety fact. If you don't have real data, say so plainly.
- When you reference monetized options, note that partners are disclosed and may pay a commission — never hide it.
- Insure-Well and Ship-Well are "activated at launch" — present them honestly as not yet bookable.
- If the traveler says "stop", step back gracefully in one short line.
- Keep replies to 2-4 sentences unless asked for more. Offer at most 3 concrete options, each with a one-line reason it fits.`;

interface ChatMessage { role: "user" | "assistant"; content: string; }

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { messages, context } = (await req.json()) as {
      messages: ChatMessage[];
      context?: Record<string, unknown>;
    };

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return Response.json(
        { reply: "Atlas isn't configured yet — set ANTHROPIC_API_KEY on the Edge Function.", degraded: true },
        { headers: cors, status: 200 }
      );
    }

    const client = new Anthropic({ apiKey });

    // Fold the traveler's known journey context into a system-side note so Atlas
    // grounds its suggestions without us trusting it as a user instruction.
    const contextNote = context && Object.keys(context).length
      ? `\n\nWhat you currently know about this traveler (use it, don't restate it): ${JSON.stringify(context)}`
      : "";

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      thinking: { type: "adaptive" },
      system: SYSTEM + contextNote,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    if (response.stop_reason === "refusal") {
      return Response.json(
        { reply: "I can't help with that one — let's keep it to the trip. What are you dreaming of?" },
        { headers: cors, status: 200 }
      );
    }

    const reply = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("\n")
      .trim();

    return Response.json({ reply: reply || "I'm here — tell me your dream in a sentence." }, { headers: cors, status: 200 });
  } catch (err) {
    console.error("atlas error", err);
    return Response.json(
      { reply: "I'm having trouble reaching the network. Your trip is safe and saved — try me again in a moment.", degraded: true },
      { headers: cors, status: 200 }
    );
  }
});
