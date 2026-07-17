#!/usr/bin/env bash
# One-shot pilot check — validate a normalized dossier places.ts against the
# spec and print the count-check. SAFE: reads only the pilot + writes only to
# scratchpad/. Never touches prod migrations or any database.
#
# Usage:
#   1. Drop the pilot's places.ts here:  scratchpad/pilot-places.ts
#      (it must export `DESTINATIONS`; strip any @/ imports it doesn't need —
#       the validator only reads the DESTINATIONS object.)
#   2. Run:  bash scripts/pilot-check.sh
set -e
cd "$(dirname "$0")/.."

PILOT="scratchpad/pilot-places.ts"
if [ ! -f "$PILOT" ]; then
  echo "✗ No pilot found at $PILOT"
  echo "  → Drop the pilot's places.ts there (exporting DESTINATIONS), then re-run."
  exit 1
fi

echo "▸ Validating $PILOT against docs/dossier-ingest-shape.md …"
./node_modules/.bin/esbuild scripts/validate-destinations.ts \
  --bundle --platform=node --format=esm --define:import.meta.env='{}' \
  --outfile=scratchpad/val.mjs >/dev/null
node scratchpad/val.mjs

echo ""
echo "▸ If the shape is clean above, the full generator dry-run is:"
echo "    cp $PILOT src/data/places.ts   # ON A TEST BRANCH ONLY"
echo "    ./node_modules/.bin/esbuild scripts/gen-catalog-seed.ts --bundle --platform=node --format=esm --outfile=scratchpad/gen.mjs && node scratchpad/gen.mjs"
echo "    # inspect supabase/migrations/0005_*.sql — apply ONLY to a throwaway Supabase, never prod"
echo "    git checkout src/data/places.ts   # restore the real catalog"
