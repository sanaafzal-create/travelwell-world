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
//   · the safety block (advisory_level, booking_hold) rides in every destination
//     payload — an agent sees the content-only switch without a human;
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
const HANDOFF_MODES = ["api", "widget", "affiliate", "first-party"];

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
export const MAX_Q_LEN = 120;     // cap free-text search length

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
const TOOLS = [
  {
    name: "search_destinations",
    description:
      "Search live TravelWell destinations. Filter by Signature Interest slug (si), region code, feel tag, " +
      "or budget band (price_band), and/or a free-text query (q) over name/country/hook. Returns a lean list " +
      "with each place's safety posture attached. Use get_destination for the full dossier.",
    inputSchema: {
      type: "object",
      properties: {
        si: { type: "string", description: "Signature Interest slug, e.g. \"safari\", \"tropical\", \"romance\"" },
        region: { type: "string", description: "13-code region, e.g. \"05A\" (East Africa), \"11C\" (Caribbean & Atlantic)" },
        feel: { type: "string", description: "feel/archetype tag, e.g. \"coastal\", \"dramatic\", \"secluded\"" },
        price_band: { type: "string", description: "one of: essential, comfort, premier, luxury, ultra" },
        q: { type: "string", description: "free-text over name/country/hook" },
        limit: { type: "number", description: "max results (default 20, max 50)" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_destination",
    description:
      "Fetch a single live destination dossier by its canonical id (\"<city>-<country>\", lowercase, hyphenated, " +
      "full country — e.g. \"cape-town-south-africa\"). Returns the hook, Signature Interests, feel tags, budget " +
      "range, and the rich `data` block (safety, timing, jewels, and the buffet block of facts/faq/quotes). " +
      "The safety block travels with the place — respect advisory_level and booking_hold before suggesting a booking.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "Canonical destination id, e.g. \"cape-town-south-africa\"" } },
      required: ["id"],
      additionalProperties: false,
    },
  },
  {
    name: "get_safety",
    description:
      "Get the safety posture for a live destination (by id) or for a country (by country name). Returns " +
      "advisory_level (L1–L4), posture, booking_hold, and notes. L4 and booking-held places are content-only — " +
      "never surface a booking action for them.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Canonical destination id" },
        country: { type: "string", description: "Country name, e.g. \"South Africa\"" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "search_providers",
    description:
      "Search curated providers (the Wells network). Filter by well, region, curation tier (prime/vetted/prospective), " +
      "budget (price), or Signature Interest. Every result carries its disclosure text — partners are disclosed and " +
      "may pay a commission at no extra cost to the traveler.",
    inputSchema: {
      type: "object",
      properties: {
        well: { type: "string", description: "Well id, e.g. \"stay\", \"activities\", \"eat\", \"move\"" },
        region: { type: "string", description: "13-code region" },
        tier: { type: "string", description: "curation tier: prime, vetted, or prospective" },
        price: { type: "string", description: "budget band: essential, comfort, premier, luxury, ultra" },
        si: { type: "string", description: "Signature Interest slug" },
        limit: { type: "number", description: "max results (default 20, max 50)" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "list_regions",
    description: "List the 13-code region scheme (code, name, hook, countries, gateways, status).",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "list_special_interests",
    description: "List Signature Interests (id, name, signature line, status, group). Optionally filter by status (live|preview).",
    inputSchema: {
      type: "object",
      properties: { status: { type: "string", description: "\"live\" or \"preview\"" } },
      additionalProperties: false,
    },
  },
  {
    name: "list_wells",
    description: "List the Wells — traveler-need categories (id, name, tag, status). 10 live + 2 soon.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "list_guides",
    description: "List editorial guides (id, type, title, lede, read-time). Optionally filter by Signature Interest (si) or region.",
    inputSchema: {
      type: "object",
      properties: {
        si: { type: "string", description: "Signature Interest slug" },
        region: { type: "string", description: "13-code region" },
      },
      additionalProperties: false,
    },
  },
];

// ── Resource registry ─────────────────────────────────────────────────────────
const RESOURCES = [
  { uri: "travelwell://taxonomy", name: "TravelWell taxonomy", description: "Controlled vocabularies: regions, Signature Interests, Wells, feel tags, budget + curation tiers, handoff modes.", mimeType: "application/json" },
  { uri: "travelwell://manifest", name: "Capability manifest", description: "What this server is and what it exposes — read-only catalog access.", mimeType: "application/json" },
];

interface McpDeps {
  getDestination: (id: string) => Promise<Record<string, unknown> | null>;
  searchDestinations: (f: Record<string, unknown>) => Promise<Record<string, unknown>[]>;
  getSafety: (f: { id?: string; country?: string }) => Promise<Record<string, unknown>[] | Record<string, unknown> | null>;
  searchProviders: (f: Record<string, unknown>) => Promise<Record<string, unknown>[]>;
  listRegions: () => Promise<Record<string, unknown>[]>;
  listSpecialInterests: (status?: string) => Promise<Record<string, unknown>[]>;
  listWells: () => Promise<Record<string, unknown>[]>;
  listGuides: (f: Record<string, unknown>) => Promise<Record<string, unknown>[]>;
}

// JSON-RPC helpers
const rpcResult = (id: unknown, result: unknown) => ({ jsonrpc: "2.0", id, result });
const rpcError = (id: unknown, code: number, message: string) => ({ jsonrpc: "2.0", id, error: { code, message } });
const textResult = (id: unknown, obj: unknown) => rpcResult(id, { content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] });

const clampLimit = (n: unknown) => Math.min(50, Math.max(1, Number(n) || 20));

async function callTool(name: string, args: any, deps: McpDeps): Promise<any> {
  switch (name) {
    case "get_destination": {
      const id = typeof args.id === "string" ? args.id.trim().toLowerCase() : "";
      if (!id) return { isError: true, content: [{ type: "text", text: "get_destination needs an `id` (\"<city>-<country>\")." }] };
      const dest = await deps.getDestination(id);
      return dest
        ? { content: [{ type: "text", text: JSON.stringify(dest, null, 2) }] }
        : { content: [{ type: "text", text: `No live destination found for id "${id}".` }] };
    }
    case "search_destinations": {
      const rows = await deps.searchDestinations({ ...args, limit: clampLimit(args.limit) });
      return { content: [{ type: "text", text: JSON.stringify({ count: rows.length, results: rows }, null, 2) }] };
    }
    case "get_safety": {
      const id = typeof args.id === "string" ? args.id.trim().toLowerCase() : undefined;
      const country = typeof args.country === "string" ? args.country.trim() : undefined;
      if (!id && !country) return { isError: true, content: [{ type: "text", text: "get_safety needs an `id` or a `country`." }] };
      const out = await deps.getSafety({ id, country });
      return { content: [{ type: "text", text: JSON.stringify(out ?? { note: "no safety record found" }, null, 2) }] };
    }
    case "search_providers": {
      const rows = await deps.searchProviders({ ...args, limit: clampLimit(args.limit) });
      return { content: [{ type: "text", text: JSON.stringify({ count: rows.length, results: rows }, null, 2) }] };
    }
    case "list_regions": return { content: [{ type: "text", text: JSON.stringify(await deps.listRegions(), null, 2) }] };
    case "list_special_interests": return { content: [{ type: "text", text: JSON.stringify(await deps.listSpecialInterests(typeof args.status === "string" ? args.status : undefined), null, 2) }] };
    case "list_wells": return { content: [{ type: "text", text: JSON.stringify(await deps.listWells(), null, 2) }] };
    case "list_guides": return { content: [{ type: "text", text: JSON.stringify(await deps.listGuides(args), null, 2) }] };
    default: return null; // signal unknown tool
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
      guardrails: ["only live destinations", "safety block rides every place", "prime/vetted providers only (no unvetted prospects)", "provider disclosure is a field", "no PII, no transactions, no writes"],
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
            "Read-only access to the TravelWell.World destination corpus. Every place carries its safety posture — " +
            "never suggest booking an L4 or booking-held destination. Partner options are disclosed and may pay a commission.",
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

// ── Default data source: PostgREST over the world-readable catalog ─────────────
import { withSafety } from "./safety-fallback.ts";

const D = (globalThis as any).Deno;

/** One place for the PostgREST call. Returns null when unconfigured (skeleton
 *  stays inert until wired); throws on a real HTTP error. */
async function pg(pathAndQuery: string): Promise<any[] | null> {
  const url = D?.env.get("SUPABASE_URL");
  const anon = D?.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) return null;
  const res = await fetch(`${url}/rest/v1/${pathAndQuery}`, { headers: { apikey: anon, Authorization: `Bearer ${anon}` } });
  if (!res.ok) throw new Error(`PostgREST ${res.status}`);
  return (await res.json()) as any[];
}

// PostgREST array-contains: si=cs.{safari}
const arrHas = (col: string, v: string) => `${col}=cs.%7B${encodeURIComponent(v)}%7D`;
const eq = (col: string, v: string) => `${col}=eq.${encodeURIComponent(v)}`;
// strip PostgREST filter-breaking chars from free text before ilike
const safe = (s: string) => s.replace(/[(),*]/g, " ").trim();

const realDeps: McpDeps = {
  getDestination: async (id) => {
    const sel = "id,name,country,line,status,depth,sub_region,si,feel,tier_range,price_band,draw_rank,data";
    const rows = await pg(`destinations?${eq("id", id)}&status=eq.live&select=${sel}&limit=1`);
    return rows?.[0] ? withSafety(rows[0]) : null;
  },
  searchDestinations: async (f) => {
    const parts = ["status=eq.live"];
    if (f.si) parts.push(arrHas("si", String(f.si)));
    if (f.feel) parts.push(arrHas("feel", String(f.feel)));
    if (f.region) parts.push(eq("region_code", String(f.region)));
    if (f.price_band) parts.push(eq("price_band", String(f.price_band)));
    if (f.q) { const q = safe(String(f.q)).slice(0, MAX_Q_LEN); if (q) parts.push(`or=(name.ilike.*${encodeURIComponent(q)}*,country.ilike.*${encodeURIComponent(q)}*,line.ilike.*${encodeURIComponent(q)}*)`); }
    const sel = "id,name,country,line,si,feel,tier_range,price_band,draw_rank,depth,safety:data->safety";
    const rows = await pg(`destinations?${parts.join("&")}&select=${sel}&order=position.asc&limit=${f.limit}`);
    return (rows ?? []).map(withSafety);
  },
  getSafety: async ({ id, country }) => {
    if (id) {
      const rows = await pg(`destinations?${eq("id", id)}&status=eq.live&select=id,name,country,safety:data->safety&limit=1`);
      return rows?.[0] ? withSafety(rows[0]) : null;
    }
    const rows = await pg(`destinations?country=ilike.${encodeURIComponent(safe(country || ""))}&status=eq.live&select=id,name,country,safety:data->safety&limit=50`);
    return (rows ?? []).map(withSafety);
  },
  searchProviders: async (f) => {
    const parts: string[] = [];
    if (f.well) parts.push(eq("well", String(f.well)));
    if (f.region) parts.push(eq("region", String(f.region)));
    if (f.price) parts.push(eq("price", String(f.price)));
    if (f.si) parts.push(arrHas("si", String(f.si)));
    // Curation guardrail: only surface prime + vetted. `prospective` is our
    // internal pipeline (unvetted) — never exposed, even if asked for by name.
    const t = String(f.tier ?? "");
    parts.push(t === "prime" || t === "vetted" ? eq("tier", t) : "tier=in.(prime,vetted)");
    // `commission` is the public FTC disclosure text (never internal economics) → `disclosure`.
    // booking_url is intentionally omitted — affiliate/tracking URLs aren't part of the read surface.
    const sel = "name,well,tier,price,mode,region,si,description,disclosure:commission";
    const rows = await pg(`providers?${parts.join("&")}&select=${sel}&limit=${f.limit}`);
    return rows ?? [];
  },
  listRegions: async () => (await pg("regions?select=code,name,line,countries,gateways,status&order=code.asc")) ?? [],
  listSpecialInterests: async (status) => {
    const filt = status ? `&${eq("status", status)}` : "";
    return (await pg(`special_interests?select=id,name,signature,status,grp,is_lux${filt}&order=id.asc`)) ?? [];
  },
  listWells: async () => (await pg("wells?select=id,name,tag,status,is_lux&order=id.asc")) ?? [],
  listGuides: async (f) => {
    const parts: string[] = [];
    if (f.si) parts.push(eq("si", String(f.si)));
    if (f.region) parts.push(eq("region", String(f.region)));
    return (await pg(`guides?${parts.length ? parts.join("&") + "&" : ""}select=id,type,title,lede,read,si,region&order=position.asc`)) ?? [];
  },
};

// ── Deno entry (guarded so importing this file off-platform never touches Deno) ──
if (D && typeof D.serve === "function") {
  D.serve((req: Request) => handleMcpRequest(req, realDeps));
}
