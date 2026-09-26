// TravelWell.World — the shared read-only corpus layer.
//
// ONE authority for the tool roster and the data access that backs it, imported
// by BOTH edge functions:
//   · `mcp/index.ts`   — serves these tools to OUTSIDE agents (MCP protocol)
//   · `atlas/index.ts` — gives the SAME tools to our own Atlas (Anthropic tool use)
//
// That symmetry is the point (David's Part Five, 2026-09-24): we built the tool
// layer for other people's agents in July and never connected our own. Now both
// speak through one module, so the roster can never fork — a tool Atlas can call
// is exactly a tool the world can call, with the same guardrails, because they
// are the same code.
//
// Guardrails live in the DATA path, deliberately:
//   · only `status = live` rows are exposed;
//   · the safety block rides every destination, resolved by the SAME resolver
//     the site runs (safety-fallback.ts, generated) — words, never the retired
//     numeric scale; booking_hold in the data; provenance on every fact;
//   · providers surface prime/vetted only, with the FTC disclosure as a field.
//
// The safety authority stays DETERMINISTIC (David-locked, 2026-09-24): these
// tools RETURN the resolver's verdict; no model decides a hold. Being
// un-agentic here is the stronger position, permanently.

import { withSafety, deriveSafety } from "../mcp/safety-fallback.ts";

export const MAX_Q_LEN = 120; // cap free-text search length

// ── The tool roster (protocol-neutral) ─────────────────────────────────────────
// `schema` is plain JSON Schema. mcp/index.ts wraps it as MCP `inputSchema`;
// atlas/index.ts wraps it as Anthropic `input_schema`. One list, two dialects.
export interface ToolDef { name: string; description: string; schema: Record<string, unknown> }

export const TOOL_DEFS: ToolDef[] = [
  {
    name: "search_destinations",
    description:
      "Search live TravelWell destinations. Filter by Signature Interest slug (si), region code, feel tag, " +
      "or budget band (price_band), and/or a free-text query (q) over name/country/hook. Returns a lean list " +
      "with each place's safety posture attached. Use get_destination for the full dossier.",
    schema: {
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
      "The safety block travels with the place — read `advice` and `booking_hold` before suggesting a booking, " +
      "and cite its `source`, `read_date` and `advisory_page` when you repeat a safety fact.",
    schema: {
      type: "object",
      properties: { id: { type: "string", description: "Canonical destination id, e.g. \"cape-town-south-africa\"" } },
      required: ["id"],
      additionalProperties: false,
    },
  },
  {
    name: "get_safety",
    description:
      "Get the safety posture for a live destination (by id) or for a country (by country name). Returns the " +
      "FCDO-derived `advice` in words (no advisory against travel / against all but essential travel / against " +
      "all travel / not on file), `booking_hold`, `consent_required`, the FCDO's verbatim sentence where we hold " +
      "one, and provenance — `source`, `read_date`, `advisory_page`. Booking-held places are content-only: never " +
      "surface a booking action for them. Where consent_required is true, booking happens only on our own consent " +
      "screen after the traveler reads the complete advisory — send the human to the page, don't book around it.",
    schema: {
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
    schema: {
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
    schema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "list_special_interests",
    description: "List Signature Interests (id, name, signature line, status, group). Optionally filter by status (live|preview).",
    schema: {
      type: "object",
      properties: { status: { type: "string", description: "\"live\" or \"preview\"" } },
      additionalProperties: false,
    },
  },
  {
    name: "list_wells",
    description: "List the Wells — traveler-need categories (id, name, tag, status). THE 13 WELLS: 10 live + 3 soon.",
    schema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "list_guides",
    description: "List editorial guides (id, type, title, lede, read-time). Optionally filter by Signature Interest (si) or region.",
    schema: {
      type: "object",
      properties: {
        si: { type: "string", description: "Signature Interest slug" },
        region: { type: "string", description: "13-code region" },
      },
      additionalProperties: false,
    },
  },
];

// ── The data layer ──────────────────────────────────────────────────────────────
export interface CorpusDeps {
  getDestination: (id: string) => Promise<Record<string, unknown> | null>;
  searchDestinations: (f: Record<string, unknown>) => Promise<Record<string, unknown>[]>;
  getSafety: (f: { id?: string; country?: string }) => Promise<Record<string, unknown>[] | Record<string, unknown> | null>;
  searchProviders: (f: Record<string, unknown>) => Promise<Record<string, unknown>[]>;
  listRegions: () => Promise<Record<string, unknown>[]>;
  listSpecialInterests: (status?: string) => Promise<Record<string, unknown>[]>;
  listWells: () => Promise<Record<string, unknown>[]>;
  listGuides: (f: Record<string, unknown>) => Promise<Record<string, unknown>[]>;
}

/** Bad arguments are an ANSWER for the model/agent, not an exception — both
 *  callers render `{ tool_error }` in their own dialect. */
export class ToolArgError extends Error {}

export const clampLimit = (n: unknown) => Math.min(50, Math.max(1, Number(n) || 20));

/**
 * Run one corpus tool, returning PLAIN JSON (no protocol envelope).
 * Returns `null` for an unknown tool name — the caller decides how to refuse.
 */
export async function runTool(name: string, args: Record<string, unknown>, deps: CorpusDeps): Promise<unknown | null> {
  switch (name) {
    case "get_destination": {
      const id = typeof args.id === "string" ? args.id.trim().toLowerCase() : "";
      if (!id) throw new ToolArgError('get_destination needs an `id` ("<city>-<country>").');
      const dest = await deps.getDestination(id);
      return dest ?? { note: `No live destination found for id "${id}".` };
    }
    case "search_destinations": {
      const rows = await deps.searchDestinations({ ...args, limit: clampLimit(args.limit) });
      return { count: rows.length, results: rows };
    }
    case "get_safety": {
      const id = typeof args.id === "string" ? args.id.trim().toLowerCase() : undefined;
      const country = typeof args.country === "string" ? args.country.trim() : undefined;
      if (!id && !country) throw new ToolArgError("get_safety needs an `id` or a `country`.");
      return (await deps.getSafety({ id, country })) ?? { note: "no safety record found" };
    }
    case "search_providers": {
      const rows = await deps.searchProviders({ ...args, limit: clampLimit(args.limit) });
      return { count: rows.length, results: rows };
    }
    case "list_regions": return await deps.listRegions();
    case "list_special_interests": return await deps.listSpecialInterests(typeof args.status === "string" ? args.status : undefined);
    case "list_wells": return await deps.listWells();
    case "list_guides": return await deps.listGuides(args);
    default: return null;
  }
}

// ── Default deps: PostgREST over the world-readable catalog ─────────────────────
const D = (globalThis as { Deno?: { env: { get: (k: string) => string | undefined } } }).Deno;

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

export const realDeps: CorpusDeps = {
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
    // By country: answer from the verified country advisory DIRECTLY (works
    // whether or not we have a destination there, and regardless of how the
    // country name is spelled in the destinations table), plus any live
    // destinations we do carry in that country.
    const c = (country || "").trim();
    const rows = await pg(`destinations?country=ilike.${encodeURIComponent(safe(c))}&status=eq.live&select=id,name,country&limit=50`);
    return { country: c, safety: deriveSafety(c), destinations: rows ?? [] };
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
