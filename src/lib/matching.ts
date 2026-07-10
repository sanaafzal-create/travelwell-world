/**
 * TravelWell.World — provider matching (the convergence keystone, Step 2).
 *
 * Filters a Well's providers to those that serve the traveler's chosen Special
 * Interests and region — the thing the product promises and the Core Engine
 * audit flagged as mocked. Region-less providers (e.g. airlines) always pass the
 * region test.
 *
 * Graceful fallback: while the real multi-region catalog (Step 3, David's
 * provider intel) is still being seeded, a query that matches nothing returns
 * the full pool with `fellBack: true` so the UI can show a straight note instead
 * of an empty list.
 */
import type { Provider } from "@/data/places";

export function matchProviders(
  pool: Provider[],
  q: { si?: string[]; region?: string | null }
): { matched: Provider[]; fellBack: boolean } {
  const wantSi = q.si?.length ? new Set(q.si) : null;
  let out = pool;
  if (wantSi) out = out.filter((p) => p.si.some((s) => wantSi.has(s)));
  if (q.region) out = out.filter((p) => !p.region || p.region === q.region);
  if (out.length) return { matched: out, fellBack: false };
  return { matched: pool, fellBack: true };
}
