// TravelWell.World — "mcp" Edge Function (read-only MCP server over our corpus).
//
// v1: a spec-compliant, STATELESS MCP endpoint (Streamable HTTP transport)
// exposing the read-only tool + resource surface from docs/mcp-server-scope.md.
//
// READ-ONLY. No writes, no transactions, no PII — only the world-readable
// catalog (RLS already permits public read). Payments-never holds by
// construction: there is no transactional tool to drift through.
//
// Guardrails live in the DATA path, so they survive when the reader is a machine
// with no UI in the loop:
//   · only `status = live` rows are exposed;
//   · the safety block rides in every destination payload, resolved by the SAME
//     resolver the site runs (see safety-fallback.ts, generated) — FCDO advice
//     in words (never the retired numeric scale), booking_hold, and provenance
//     (source + read date + the official advisory page) on every fact;
//   · provider results carry the FTC disclosure text as a field, not UI chrome.
//
// Deploy:  supabase functions deploy mcp
// Env:     SUPABASE_URL + SUPABASE_ANON_KEY are injected by Supabase at runtime.
//
// The protocol handler (`handleMcpRequest`) is pure and dependency-injected so it
// can be exercised off-platform (Node) without Deno or a DB.

const PROTOCOL_VERSIONS = new Set(["2024-11-05", "2025-03-26", "2025-06-18"]);
const DEFAULT_PROTOCOL = "2025-06-18";
const SERVER_INFO = { name: "travelwell-corpus", version: "0.1.0" };

// Controlled vocabularies (the taxonomy resource; match the catalog canon).
const FEEL_VOCAB = ["dramatic","serene","rugged","refined","wild","polished","cosmopolitan","buzzy","festive","romantic","secluded","family-friendly","coastal","alpine","historic","tropical","urban","remote","pastoral","adventurous"];
const PRICE_TIERS = ["essential", "comfort", "premier", "luxury", "ultra"];
const CURATION_TIERS = ["prime", "vetted", "prospective"];
const HANDOFF_MODES = ["api", "widget", "affiliate", "first-party", "email-parse", "request-to-book", "lead"];

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, mcp-session-id, mcp-protocol-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Expose-Headers": "mcp-session-id",
};

// ── Abuse guards (public endpoint, read-only, no auth) ─────────────────────────
const RATE_MAX = 60;              // requests per window, per client IP
const RATE_WINDOW_MS = 60_000;
const MAX_BODY_BYTES = 64 * 1024; // reject oversized payloads
const MAX_BATCH = 20;             // cap JSON-RPC batch size
// MAX_Q_LEN re-exported from _shared/corpus.ts (see Tool registry below)

// In-memory sliding window. NOTE: per-isolate, not global — it throttles a single
// hammering caller hitting one instance; a cross-instance cap would need a shared
// store (Supabase table / KV). Good enough as a first guard on a read-only endpoint.
const hits = new Map<string, { n: number; resetAt: number }>();
function rateRetryAfter(ip: string, now: number): number | null {
  const e = hits.get(ip);
  if (!e || now >= e.resetAt) { hits.set(ip, { n: 1, resetAt: now + RATE_WINDOW_MS }); return null; }
  if (++e.n > RATE_MAX) return Math.ceil((e.resetAt - now) / 1000);
  return null;
}
function sweep(now: number) { if (hits.size > 5000) for (const [k, v] of hits) if (now >= v.resetAt) hits.delete(k); }

// ── Tool registry ─────────────────────────────────────────────────────────────
// ONE roster, shared with Atlas (see _shared/corpus.ts): what our own concierge
// can call is exactly what an outside agent can call, because it is the same
// list and the same handlers. MCP dialect: `inputSchema`.
import { TOOL_DEFS, runTool, realDeps as corpusDeps, ToolArgError, MAX_Q_LEN as CORPUS_MAX_Q } from "../_shared/corpus.ts";
export const MAX_Q_LEN = CORPUS_MAX_Q;

const TOOLS = TOOL_DEFS.map((t) => ({ name: t.name, description: t.description, inputSchema: t.schema }));

// ── Resource registry ─────────────────────────────────────────────────────────
const RESOURCES = [
  { uri: "travelwell://taxonomy", name: "TravelWell taxonomy", description: "Controlled vocabularies: regions, Signature Interests, Wells, feel tags, budget + curation tiers, handoff modes.", mimeType: "application/json" },
  { uri: "travelwell://manifest", name: "Capability manifest", description: "What this server is and what it exposes — read-only catalog access.", mimeType: "application/json" },
];

type McpDeps = import("../_shared/corpus.ts").CorpusDeps;

// JSON-RPC helpers
const rpcResult = (id: unknown, result: unknown) => ({ jsonrpc: "2.0", id, result });
const rpcError = (id: unknown, code: number, message: string) => ({ jsonrpc: "2.0", id, error: { code, message } });
const textResult = (id: unknown, obj: unknown) => rpcResult(id, { content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] });

async function callTool(name: string, args: any, deps: McpDeps): Promise<any> {
  // Thin MCP envelope over the SHARED tool logic (_shared/corpus.ts) — the same
  // runTool Atlas calls. Bad arguments come back as isError content; an unknown
  // tool stays null so the RPC layer answers -32602 exactly as before.
  try {
    const out = await runTool(name, args ?? {}, deps);
    if (out === null) return null; // unknown tool
    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
  } catch (e) {
    if (e instanceof ToolArgError) return { isError: true, content: [{ type: "text", text: e.message }] };
    throw e;
  }
}

async function buildResource(uri: string, deps: McpDeps): Promise<any | null> {
  if (uri === "travelwell://taxonomy") {
    const [regions, sis, wells] = await Promise.all([deps.listRegions(), deps.listSpecialInterests(), deps.listWells()]);
    return { regions, special_interests: sis, wells, feel_vocabulary: FEEL_VOCAB, price_tiers: PRICE_TIERS, curation_tiers: CURATION_TIERS, handoff_modes: HANDOFF_MODES };
  }
  if (uri === "travelwell://manifest") {
    return {
      name: SERVER_INFO.name, version: SERVER_INFO.version, access: "read-only",
      corpus: "TravelWell.World destination catalog (world-readable)",
      tools: TOOLS.map((t) => t.name),
      guardrails: ["only live destinations", "safety block rides every place, resolved by the same resolver the site runs", "every safety fact carries source + read date + the official advisory page", "booking_hold is in the data — a held place cannot be surfaced as bookable", "prime/vetted providers only (no unvetted prospects)", "provider disclosure is a field", "no PII, no transactions, no writes"],
      site: "https://travelwell.world",
    };
  }
  return null;
}

/** Route one JSON-RPC message. Returns the response object, or null for a
 *  notification (no id → nothing to send back). */
async function handleRpcMessage(msg: any, deps: McpDeps): Promise<any | null> {
  if (msg == null || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
    return msg?.id !== undefined ? rpcError(msg.id, -32600, "Invalid Request") : null;
  }
  const { method, id } = msg;
  const isNotification = id === undefined || id === null;

  try {
    switch (method) {
      case "initialize": {
        const asked = msg.params?.protocolVersion;
        const protocolVersion = PROTOCOL_VERSIONS.has(asked) ? asked : DEFAULT_PROTOCOL;
        return rpcResult(id, {
          protocolVersion,
          capabilities: { tools: { listChanged: false }, resources: { listChanged: false } },
          serverInfo: SERVER_INFO,
          instructions:
            "Read-only access to the TravelWell.World destination corpus. Every place carries its safety block, " +
            "resolved from the UK FCDO's advisory: never surface a booking action where booking_hold is true — " +
            "where the FCDO advises against all travel, we don't sell, so offer bookable alternatives instead. " +
            "Every safety fact carries its source, the date we read it, and the official advisory page — cite " +
            "them when you repeat it. Partner options are disclosed and may pay a commission.",
        });
      }
      case "notifications/initialized":
      case "notifications/cancelled":
        return null;
      case "ping":
        return rpcResult(id, {});
      case "tools/list":
        return rpcResult(id, { tools: TOOLS });
      case "tools/call": {
        const result = await callTool(msg.params?.name, msg.params?.arguments ?? {}, deps);
        return result === null ? rpcError(id, -32602, `Unknown tool: ${String(msg.params?.name)}`) : rpcResult(id, result);
      }
      case "resources/list":
        return rpcResult(id, { resources: RESOURCES });
      case "resources/read": {
        const uri = msg.params?.uri;
        const body = await buildResource(uri, deps);
        return body === null
          ? rpcError(id, -32602, `Unknown resource: ${String(uri)}`)
          : rpcResult(id, { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(body, null, 2) }] });
      }
      default:
        return isNotification ? null : rpcError(id, -32601, `Method not found: ${method}`);
    }
  } catch (e) {
    return isNotification ? null : rpcError(id, -32603, `Internal error: ${(e as Error).message}`);
  }
}

/** The transport: a stateless Streamable-HTTP MCP endpoint. Pure + injectable. */
export async function handleMcpRequest(req: Request, deps: McpDeps): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method === "GET") return new Response("Method Not Allowed", { status: 405, headers: cors });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: cors });

  // Rate limit per client IP.
  const now = Date.now();
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  sweep(now);
  const retry = rateRetryAfter(ip, now);
  if (retry) return new Response(JSON.stringify(rpcError(null, -32000, "Rate limit exceeded")), { status: 429, headers: { ...cors, "Content-Type": "application/json", "Retry-After": String(retry) } });

  // Body-size cap (read as text so we can measure before parsing).
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return new Response(JSON.stringify(rpcError(null, -32600, "Request too large")), { status: 413, headers: { ...cors, "Content-Type": "application/json" } });

  let body: any;
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json(rpcError(null, -32700, "Parse error"), { headers: cors, status: 200 });
  }

  const batch = Array.isArray(body);
  if (batch && body.length > MAX_BATCH) return new Response(JSON.stringify(rpcError(null, -32600, "Batch too large")), { status: 413, headers: { ...cors, "Content-Type": "application/json" } });
  const messages = batch ? body : [body];
  const responses: any[] = [];
  for (const m of messages) {
    const r = await handleRpcMessage(m, deps);
    if (r !== null) responses.push(r);
  }

  if (responses.length === 0) return new Response(null, { status: 202, headers: cors });
  return Response.json(batch ? responses : responses[0], { headers: { ...cors, "Content-Type": "application/json" }, status: 200 });
}

// ── Default data source ────────────────────────────────────────────────────────
// The PostgREST data layer moved to _shared/corpus.ts so Atlas and this server
// read the corpus through IDENTICAL code (guardrails included: live-only rows,
// resolver-backed safety, prime/vetted-only providers, disclosure as a field).
const realDeps: McpDeps = corpusDeps;

// ── Deno entry (guarded so importing this file off-platform never touches Deno) ──
const D = (globalThis as any).Deno;
if (D && typeof D.serve === "function") {
  D.serve((req: Request) => handleMcpRequest(req, realDeps));
}
