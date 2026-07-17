# Full-library roll — region-by-region checklist (the 570)

The tick-list CC + Sana follow to roll the whole dossier library into the MVP,
one region at a time, so all ~570 come out right the first time. Target shape:
`docs/dossier-ingest-shape.md`. Safety net: `scripts/pilot-check.sh` +
`scripts/validate-destinations.ts`.

## Pre-flight (once, before any region)
- [ ] Alps pilot cleared: `pilot-check.sh` green + generator dry-run on a **test** target + count-check reviewed.
- [ ] The five calls locked in the spec: draw_rank (1/2/3→anchor/core/emerging), price_band = median of `tier_range`, feel = controlled vocabulary, `confirmation_return` = provider-level (not on the dossier), jewels = full sets.
- [ ] The ~38 legacy bundle rows scheduled for renormalization to `<city>-<country>` in the same pass (one key scheme, not two).

## Per region (repeat for each of the 13)
For each region, CC normalizes → Sana validates → ingest to a **test target** → verify → only then prod.
1. [ ] **Normalize** that region's dossiers into `src/data/places.ts` `DESTINATIONS["<code>"]` per the spec (full object literals; `data` jsonb; feel from vocab).
2. [ ] **Validate:** drop into `scratchpad/pilot-places.ts` (or run against the branch) → `bash scripts/pilot-check.sh` → **zero errors.**
3. [ ] **Count-check:** normalized count == expected count for the region (table below).
4. [ ] **Safety spine:** every `verified` dossier carries `data.safety` with a valid `advisory_level` (L1–L4); L4 / L3-blocked are content-only (`booking_hold: true`). Validator flags shape; CC confirms the *level matches reality*.
5. [ ] **id scheme:** every id `<city>-<country>`, lowercase, canonical — no bare slugs, no dupes across regions.
6. [ ] **feel + tiers:** feel tags all in-vocabulary; `tier_range` full spread + `price_band` = its median.

## Per-region tracker (fill as you roll)
| Region | Expected | Normalized | Validator ✓ | Safety ✓ | ids ✓ | Ingested (test) | Prod |
|---|---|---|---|---|---|---|---|
| 01F Western Europe | | | | | | | |
| 02F The Mediterranean | | | | | | | |
| 03F Northern Europe & Nordics | | | | | | | |
| 04A Middle East & Gulf | | | | | | | |
| 05A East Africa | | | | | | | |
| 06A Southern Africa | | | | | | | |
| 07A South & Southeast Asia | | | | | | | |
| 08A East Asia | | | | | | | |
| 09P Oceania & The Pacific | | | | | | | |
| 10S Latin America | | | | | | | |
| 11C Caribbean & Atlantic | | | | | | | |
| 12A United States | | | | | | | |
| 13A Canada | | | | | | | |
| **TOTAL** | **~570** | | | | | | |

## Ingest flow (the safe path — never direct-to-DB)
1. Region normalized into `src/data/places.ts` (authored source).
2. Regenerate: `./node_modules/.bin/esbuild scripts/gen-catalog-seed.ts --bundle --platform=node --format=esm --outfile=scratchpad/gen.mjs && node scratchpad/gen.mjs`
3. Apply generated `0005_seed_destinations_guides.sql` to a **throwaway Supabase**; verify counts + spot-check rows. (`0005` self-heals the columns and self-cleans rows not in source — which is exactly why it's test-first.)
4. When all regions are in and green on test → run once on **prod**; confirm the total, then smoke-test the live site.

## Global gates before prod
- [ ] Grand total == ~570 (per-region sums match the tracker).
- [ ] Zero validator errors across the full `places.ts`.
- [ ] No duplicate ids anywhere; legacy 38 renormalized.
- [ ] `npm run build` + `tsc` green (bundle fallback stays valid).
- [ ] Safety spine present on all `verified` rows; content-only gate correct on L4/L3-blocked.
- [ ] Sana runs the single prod migration; live-site smoke test (a few regions, a few destinations, one Arabic switch).
