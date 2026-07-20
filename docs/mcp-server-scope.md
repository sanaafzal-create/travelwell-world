# Read-only MCP server — build scope

**Status: GREENLIT + BUILT (v1 + safety fallback).** David gave the go (Jul 2026).
v0 skeleton and v1 full surface are in `supabase/functions/mcp/index.ts`; the
country-level safety fallback is in `supabase/functions/mcp/safety-fallback.ts`
(generated from `src/data/safety.json`, so `get_safety` and the safety block on
every place are lit even before the dossier ingest populates `data.safety` —
marked `derived:true` so it's never mistaken for dossier-grade). Hardening is in too: per-IP rate limit + body-size/batch caps + free-text length
cap, and the provider curation review (only prime/vetted surfaced — never unvetted
`prospective`; `booking_url` dropped from the read surface). 32/32 protocol +
dispatch + fallback + hardening assertions pass under Node (stubbed corpus).
**Remaining: deploy + connect a real agent client (Sana), and a live smoke-test
against the deployed URL.** This doc is the reference for what was built and what's left.

Note on rate limiting: it's an in-memory per-isolate window (throttles a single
hammering caller on one instance). A cross-instance global cap would need a shared
store (a Supabase table / KV) — a follow-up only if abuse volume warrants it.

## Goal
Expose our clean catalog corpus over **MCP** so any AI agent can *read* TravelWell
— search destinations, pull a dossier, see the safety posture — the same public
surface our pages + `llms.txt` already publish, in the protocol agents speak.
This is the cheap wedge from the horizon scan: the "clearest data wins" bet, made
agent-reachable. It's the same structured-data work as the AEO/SEO fix, pointed at
agents instead of crawlers.

## Non-goals (the risk stays out)
- **No transactions.** No booking, no payment, no cart. Read-only. (Transactional
  MCP reopens merchant-of-record + PII + liability — a separate, gated build.)
- **No PII / no auth-walled data.** Only world-readable catalog — nothing from
  `travel_ids`, journeys, parties, or any user row.
- **No writes.** The agent cannot mutate anything.
- **Not welded to a vendor.** MCP is an open protocol behind our own seam; the
  brain (Atlas) stays ours. This server is a *data window*, not an agent runtime.

## Why this is ~1 week for us and $25K–120K for the 89%
Those numbers are for wiring agents into messy legacy systems. We're the opposite:
- The corpus is **already clean + structured** (dossiers, one controlled vocab).
- It **already has a read layer** — `src/lib/catalog.ts` maps the world-readable
  tables (`destinations`, `regions`, `special_interests`, `wells`, `providers`,
  `guides`, `sub_regions`) to typed shapes; `destinations.data` jsonb already
  carries safety + the buffet block (`facts`/`faq`/`quotes`) + seo + jewels.
- The **agent-readiness data work is done** (`llms.txt`, `robots.txt`, JSON-LD in
  `src/lib/jsonld.ts`).
We're wrapping data we already serve in a protocol — not building data.

## Architecture
- **A new Supabase Edge Function `mcp`** (Deno), speaking MCP over the
  **Streamable HTTP transport**, using `@modelcontextprotocol/sdk`. Same deploy +
  secret model as `atlas` and `flights`; no new hosting. (Alt: a Vercel serverless
  function — decide at build time; edge function is the default for consistency.)
- Reads the **world-readable catalog tables** through the existing Supabase client
  (RLS already permits public read — the server exposes nothing the anon key can't
  already see). **DB-first with the bundled catalog as fallback**, mirroring
  `catalog.ts`, so a DB blip degrades instead of blanking.
- Stateless, read-only, cacheable. Public endpoint (the data is already public);
  protection is **rate-limiting + payload caps**, not auth.

## Tool surface (v1 — grounded in real tables)
| Tool | Input | Returns |
|---|---|---|
| `search_destinations` | `si?`, `region?`, `feel?`, `price_band?`, `q?`, `limit?` | matching live destinations (id, name, country, line, si, feel, tier_range, price_band, draw_rank, status, depth) |
| `get_destination` | `id` (`<city>-<country>`) | full destination **incl. `data`**: safety, seo, jewels, timing, and the **buffet block** (`facts`/`faq`/`quotes`) — the material built to be cited |
| `list_regions` | — | the 13-code scheme (code, name, line, countries, gateways, status) |
| `list_special_interests` | `status?` | SIs (id, name, sig, group, status, lux) — filter live vs preview |
| `list_wells` | — | the 10 live + 2 soon (id, name, tag, status) |
| `search_providers` | `well?`, `region?`, `tier?`, `si?` | curated providers (name, well, tier, mode, description, region, si) **+ the disclosure field** (see guardrails) |
| `get_safety` | `id` or `country` | safety spine (advisory_level, posture, booking_hold, notes) |
| `list_guides` | `si?`, `region?` | editorial guides (id, type, title, lede, read, si, region) |

## Resource surface
- **`taxonomy`** — the controlled vocabularies (regions, SIs, wells, the `feel`
  set, budget tiers) so an agent self-describes against our schema, not guesses.
- **`llms.txt`** + a small **capability manifest** — what we are, what's callable.
These make the corpus *discoverable*, not just queryable.

## Guardrails baked into the DATA layer (horizon-scan Reef #4)
When the consumer is a machine, our UI guardrails vanish — so they travel *in the
data*:
- **Safety spine rides every place.** `get_destination`/`search_destinations`
  always carry `safety` (advisory_level, booking_hold). An agent can't surface a
  bookable action for an **L4 / L3-blocked** place because the content-only switch
  is in the payload — Safer-Informed survives with no human looking.
- **Monetization is self-disclosing.** Provider results carry the disclosure
  ("partners disclosed; may earn a commission, no extra cost") as a **field**, not
  UI chrome — so the FTC line survives agent-to-agent.
- **Status/depth gating.** Only `status: live` exposed by default; `future`/
  preview hidden. `depth: cached` (Atlas-written, unverified) flagged as
  unverified so an agent never treats it as sourced fact.
- **Payments-never holds by construction** — there is no transactional tool to
  drift through.

## Three ways it works (now · near-future · horizon)
- **Now:** a read-only window an agent (Claude, ChatGPT-with-MCP, an OTA's agent)
  can point at and get clean, safety-aware answers about our destinations — and a
  live demo for the raise ("ask any agent about our corpus, watch it answer").
- **Near-future:** add the **capability manifest**, then **A2A** once Atlas can
  transact — the read server is the reachable-data layer A2A stands on.
- **Horizon:** the same server grows a *separate, gated* transactional surface
  (book-through-agent) once the booking toolbox + a deliberate merchant-of-record
  decision land. Read-only now captures most of the positioning at none of the risk.

## Friction pass (poke holes)
- **Rendering is still #1.** MCP reaches MCP-speaking agents; the broad "be
  citable/reachable" payoff still gates on the SSG socket. This is *additive*, not
  a substitute — must not pull hours off rendering.
- **Provider fields need a curation review** — expose curation tier + mode +
  disclosure; do **not** expose internal commission economics or unpublished
  prospects. One pass over what's safe to surface.
- **Abuse surface** — public endpoint ⇒ rate-limit + payload caps + no expensive
  unbounded queries (cap `limit`, index the filter columns).
- **Schema drift** — the tool shapes must track the catalog; reuse `catalog.ts`
  types so a data change surfaces as a type error, not a silent break.

## Hours (honest, phased)
- **v0 walking skeleton** — `mcp` edge function boots, Streamable HTTP handshake,
  one real tool (`get_destination`) end-to-end, testable in MCP Inspector: **~6–8h**
- **v1 tool + resource surface** — the 8 tools + 2 resources against the existing
  read layer, with the data-layer guardrails: **~12–16h**
- **Hardening** — rate-limit/caps, curation-field review, error/degrade paths,
  deploy, test with a real agent client (Claude): **~8–12h**
- **Total: ~25–40h (~1 focused week to demoable + hardened).**

## Done / how we demo
- MCP Inspector lists all tools/resources; each returns real data.
- **Claude (or any MCP client) connects and answers a cold question** — "find me a
  safari destination in East Africa that suits a premier budget, and is it safe to
  book?" — pulling `search_destinations` + `get_safety`, refusing to push a booking
  on an L4 place. That refusal-with-no-human is the proof the guardrails moved into
  the data.

## Dependencies & what it does NOT block
- Depends on: nothing new — the tables, RLS, and read layer already exist.
- Does **not** touch or block: the rendering socket (stays #1), the itinerary
  engine, the booking toolbox, payments. Fully parallel, fully reversible.

## Open decisions for the joint call
1. Go / no-go + when (it's ~1 week, all upside, zero risk — my read is go).
2. Host: Supabase Edge Function (default) vs Vercel function.
3. Provider curation-field review — who confirms what's safe to surface.
4. Public-open vs a light key for the beta (data's public either way; a key just
   helps us see who's calling).
