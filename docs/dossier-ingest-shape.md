# Dossier → MVP ingest shape (the drop-in target)

The shape each conformed dossier normalizes into so it lands **drop-in ready** for
the catalog generator. Author into `src/data/places.ts` → regenerate `0005` →
run. Do **not** write rows straight to the DB (the generated `0005` has a
self-cleaning `delete … where id not in (source)` that would wipe out-of-pipeline rows).

---

## Where it lands
`src/data/places.ts` → `DESTINATIONS`, a `Record<regionCode, Destination[]>`.
The key is the **13-code MVP region scheme** (`01F`, `05A`, `11C`, …). Each
destination object goes in its region's array.

## The `Destination` object (exact fields)

```ts
{
  id:          string;   // "<city>-<country>" — REQUIRED, canonical (see rules)
  name:        string;   // display name, e.g. "Cape Town"
  country:     string;   // full country name, e.g. "South Africa"
  line:        string;   // one editorial hook (the card subtitle)
  status:      "live" | "future";                 // shown, or coming-soon (content-only)
  depth:       "verified" | "stub" | "cached";     // how deep the dossier is
  img:         string;   // image key (existing key or an Unsplash query term)
  sub_region?: string;   // country-internal string, VERBATIM from the master
  si?:         string[]; // Signature Interest slugs served (real taxonomy ids)
  feel?:       string[]; // feel/archetype tags (SI + feel used together, never alone)
  tier_range?: string[]; // budget bands present, subset of the 5 (see rules)
  price_band?: string;   // coarse overall label (one of the 5 tiers)
  draw_rank?:  "anchor" | "core" | "emerging";     // surface order
  data?:       object;   // the full rich dossier as JSON (see `data` shape below)
}
```

The generator reads every one of these fields, so emit **full object literals**
— not the `D(...)` shorthand (that only sets the first seven and is for the
legacy bundle rows).

## Field rules (the ones the DB + app enforce)
- **`id` — canonical, no exceptions.** `<city>-<country>`, full country spelled
  out, lowercase, hyphenated: `cape-town-south-africa`, `new-york-united-states`,
  `queenstown-new-zealand`. Never a bare slug (`cape-town`), never a code
  (`-za`), never `mx` for Mexico. Comes **verbatim from the conformed dossier's
  canonical key** — don't derive from memory (edge cases: `st-lucia`,
  Patagonia spanning Chile/Argentina, etc.). **Also renormalize the ~38 legacy
  bundle rows** (`paris` → `paris-france`, `masai-mara` → `maasai-mara-kenya`) so
  the table ends up on one scheme.
- **`status`** = `live` (shown now) or `future` (content-only / coming-soon). Not `stub`.
- **`depth`** = `verified` (full sourced dossier) · `stub` (a line + image) · `cached` (Atlas-written, unverified). Separate axis from status.
- **`sub_region`** = the country-internal string **verbatim** from `docs/sub-region-master.md` / the dossier — never sketched.
- **`si`** = real Signature-Interest slugs only (e.g. `safari`, `tropical`, `culinary`, `ski`). Unknown slugs won't error but won't surface.
- **`tier_range` / `price_band`** = the canonical five only: `essential` · `comfort` · `premier` · `luxury` · `ultra`.
- **`draw_rank`** = `anchor` | `core` | `emerging` (or omit).
- **`img`** = an image key already in the set if one fits, else a short Unsplash query term (the app has an Unsplash fallback).
- **region code** = correct 13-code value; it's a FK to `regions(code)`, so a bad code **errors** the ingest.

## The `data` jsonb (the rich body)
Free-form JSON — the DB stores it as-is; the app consumes it as the render/SEO/
dossier sockets ship. Keep it structured and consistent. Recommended top-level keys:

```jsonc
{
  "seo":      { "title": "...", "meta": "...", "canonical": "...", "hreflang": {...}, "jsonld": {...} },
  "safety":   { "advisory_level": "L1|L2|L3|L4", "posture": "...", "booking_hold": false, "notes": "..." },
  "jewels":   [ { "name": "...", "tier": "premier", "price_band": "...", "when": "...", "blurb": "..." } ],
  "booking":  { "windows": [...], "commission_lane": "...", "confirmation_return": "email-parse|api|none" },
  "timing":   { "season": "...", "best_months": [8,9], "notes": "..." },
  "trails":   [ ... ],   // booking lanes / provider hooks, if present
  "source":   { "last_verified": "2026-07-13", "confidence": "high" }
}
```
Only `seo`, `safety`, and `jewels` are near-term consumers (rendering + the
safety spine + the layered page); everything else can ride along. If a dossier
lacks a section, omit the key — don't fabricate.

## Worked example
```ts
"06A": [
  {
    id: "cape-town-south-africa",
    name: "Cape Town",
    country: "South Africa",
    line: "Where the mountain meets two oceans",
    status: "live",
    depth: "verified",
    img: "capeTown",
    sub_region: "Cape Town & the Winelands",
    si: ["safari", "wine", "ocean", "romance"],
    feel: ["dramatic", "cosmopolitan", "coastal"],
    tier_range: ["comfort", "premier", "luxury", "ultra"],
    price_band: "premier",
    draw_rank: "anchor",
    data: {
      seo: { title: "Cape Town Travel Guide | TravelWell", meta: "…", canonical: "/destination/cape-town-south-africa" },
      safety: { advisory_level: "L2", posture: "book-freely", booking_hold: false },
      jewels: [ { name: "Table Mountain cableway", tier: "comfort", when: "clear mornings", blurb: "…" } ],
      timing: { season: "Nov–Mar", best_months: [11,12,1,2,3] },
      source: { last_verified: "2026-07-13", confidence: "high" }
    }
  }
]
```

## Ingest flow (the clean path — no doing it twice)
1. Normalize each dossier into the object above, grouped under its region code, in `src/data/places.ts`.
2. Regenerate the seed: `./node_modules/.bin/esbuild scripts/gen-catalog-seed.ts --bundle --platform=node --format=esm --outfile=scratchpad/gen.mjs && node scratchpad/gen.mjs`
3. Sana re-runs `0005_seed_destinations_guides.sql` in Supabase (idempotent; self-heals the `data` / `sub_region` / `depth` columns and swaps the status constraint to `live|future`).

Result: `id` = `<city>-<country>`, rich body in `data` jsonb, `sub_region` + `depth` as first-class columns — the whole library on one target, in one pass.
