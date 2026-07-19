// TravelWell.World — "mcp" Edge Function (read-only MCP server over our corpus).
//
// v0 WALKING SKELETON: a spec-compliant, STATELESS MCP endpoint (Streamable HTTP
// transport) exposing ONE real tool end-to-end — `get_destination`. Boots the
// handshake (initialize → tools/list → tools/call) so an agent (MCP Inspector,
// Claude) can connect and read a dossier. v1 fans out the rest of the tool +
// resource surface (see docs/mcp-server-scope.md).
//
// READ-ONLY. No writes, no transactions, no PII — only the world-readable
// catalog (RLS already permits public read). Payments-never holds by
// construction: there is no transactional tool to drift through.
//
// Deploy:  supabase functions deploy mcp
// Env:     SUPABASE_URL + SUPABASE_ANON_KEY are injected by Supabase at runtime.
//
// The protocol handler (`handleMcpRequest`) is pure and dependency-injected so it
// can be exercised off-platform (Node) without Deno or a DB — the Deno.serve
// entry at the bottom is guarded so importing this module never touches Deno.

const PROTOCOL_VERSIONS = new Set(["2024-11-05", "2025-03-26", "2025-06-18"]);
const DEFAULT_PROTOCOL = "2025-06-18";
const SERVER_INFO = { name: "travelwell-corpus", version: "0.0.1" };

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, mcp-session-id, mcp-protocol-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Expose-Headers": "mcp-session-id",
};

// ── Tool registry (v0: one tool) ──────────────────────────────────────────────
const TOOLS = [
  {
    name: "get_destination",
    description:
      "Fetch a single TravelWell destination dossier by its canonical id (\"<city>-<country>\", " +
      "lowercase, hyphenated, full country spelled out — e.g. \"cape-town-south-africa\"). Returns the " +
      "editorial hook, Signature Interests, feel tags, budget range, and the rich `data` block " +
      "(safety posture, timing, jewels, and the buffet block of facts/faq/quotes). Only live " +
      "destinations are returned. The safety block travels with the place — respect its advisory_level " +
      "and booking_hold before suggesting any booking.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Canonical destination id, e.g. \"cape-town-south-africa\"" },
      },
      required: ["id"],
      additionalProperties: false,
    },
  },
];

interface McpDeps {
  getDestination: (id: string) => Promise<Record<string, unknown> | null>;
}

// JSON-RPC helpers
const rpcResult = (id: unknown, result: unknown) => ({ jsonrpc: "2.0", id, result });
const rpcError = (id: unknown, code: number, message: string) => ({ jsonrpc: "2.0", id, error: { code, message } });

/** Route one JSON-RPC message. Returns the response object, or null for a
 *  notification (no id → nothing to send back). */
async function handleRpcMessage(msg: any, deps: McpDeps): Promise<any | null> {
  if (msg == null || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
    return msg?.id !== undefined ? rpcError(msg.id, -32600, "Invalid Request") : null;
  }
  const { method, id } = msg;
  const isNotification = id === undefined || id === null;

  switch (method) {
    case "initialize": {
      const asked = msg.params?.protocolVersion;
      const protocolVersion = PROTOCOL_VERSIONS.has(asked) ? asked : DEFAULT_PROTOCOL;
      return rpcResult(id, {
        protocolVersion,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions:
          "Read-only access to the TravelWell.World destination corpus. Every place carries its safety " +
          "posture — never suggest booking an L4 or booking-held destination. Partner options are disclosed and may pay a commission.",
      });
    }
    case "notifications/initialized":
    case "notifications/cancelled":
      return null; // notifications: no response
    case "ping":
      return rpcResult(id, {});
    case "tools/list":
      return rpcResult(id, { tools: TOOLS });
    case "tools/call": {
      const name = msg.params?.name;
      const args = msg.params?.arguments ?? {};
      if (name !== "get_destination") {
        return rpcError(id, -32602, `Unknown tool: ${String(name)}`);
      }
      const destId = typeof args.id === "string" ? args.id.trim().toLowerCase() : "";
      if (!destId) {
        return rpcResult(id, { isError: true, content: [{ type: "text", text: "get_destination needs an `id` (\"<city>-<country>\")." }] });
      }
      let dest: Record<string, unknown> | null = null;
      try {
        dest = await deps.getDestination(destId);
      } catch (e) {
        return rpcResult(id, { isError: true, content: [{ type: "text", text: `Couldn't reach the corpus: ${(e as Error).message}` }] });
      }
      if (!dest) {
        return rpcResult(id, { content: [{ type: "text", text: `No live destination found for id "${destId}".` }] });
      }
      return rpcResult(id, { content: [{ type: "text", text: JSON.stringify(dest, null, 2) }] });
    }
    default:
      return isNotification ? null : rpcError(id, -32601, `Method not found: ${method}`);
  }
}

/** The transport: a stateless Streamable-HTTP MCP endpoint. Pure + injectable. */
export async function handleMcpRequest(req: Request, deps: McpDeps): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  // Stateless server: no server-initiated stream, so GET has no SSE to offer.
  if (req.method === "GET") return new Response("Method Not Allowed", { status: 405, headers: cors });

  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: cors });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json(rpcError(null, -32700, "Parse error"), { headers: cors, status: 200 });
  }

  const batch = Array.isArray(body);
  const messages = batch ? body : [body];
  const responses: any[] = [];
  for (const m of messages) {
    const r = await handleRpcMessage(m, deps);
    if (r !== null) responses.push(r);
  }

  // Only notifications/responses in → nothing to return (202 Accepted).
  if (responses.length === 0) return new Response(null, { status: 202, headers: cors });

  const payload = batch ? responses : responses[0];
  return Response.json(payload, { headers: { ...cors, "Content-Type": "application/json" }, status: 200 });
}

// ── Default data source: PostgREST over the world-readable `destinations` table ──
// Only `status = live` is exposed (the scope's status gating). `data` jsonb rides
// along so the safety spine + buffet block travel with the place.
async function fetchDestinationFromDb(id: string): Promise<Record<string, unknown> | null> {
  const url = (globalThis as any).Deno?.env.get("SUPABASE_URL");
  const anon = (globalThis as any).Deno?.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) return null; // unconfigured → graceful empty (skeleton stays inert until wired)

  const select = "id,name,country,line,status,depth,sub_region,si,feel,tier_range,price_band,draw_rank,data";
  const endpoint = `${url}/rest/v1/destinations?id=eq.${encodeURIComponent(id)}&status=eq.live&select=${select}&limit=1`;
  const res = await fetch(endpoint, { headers: { apikey: anon, Authorization: `Bearer ${anon}` } });
  if (!res.ok) throw new Error(`PostgREST ${res.status}`);
  const rows = (await res.json()) as Record<string, unknown>[];
  return rows[0] ?? null;
}

// ── Deno entry (guarded so importing this file off-platform never touches Deno) ──
const D = (globalThis as any).Deno;
if (D && typeof D.serve === "function") {
  D.serve((req: Request) => handleMcpRequest(req, { getDestination: fetchDestinationFromDb }));
}
