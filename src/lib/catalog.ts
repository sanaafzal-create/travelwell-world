/**
 * TravelWell.World — Catalog read-layer (DB → bundle).
 *
 * The bundled taxonomy (src/data) is the offline-first default and ships with
 * the app; Postgres is the source of truth when reachable. This module fetches
 * the *content* catalog that grows/changes over time — Special Interests and
 * their laddered Activities (seeded by migration 0003, world-readable RLS) —
 * and maps DB rows back to the app's typed shapes.
 *
 * The fixed nouns (wells, regions, sub-regions, providers, guides) stay bundled
 * for now: several consumers build lookup maps at module-load time, so moving
 * them to the DB is a separate, larger slice. This is the documented seam.
 *
 * Returns null (not throw) on missing config / error / empty, so callers keep
 * the bundle — mirroring the graceful-degrade contract in supabase.ts.
 */
import { getSupabase } from "./supabase";
import type { SpecialInterest, Status } from "@/data/taxonomy";
import type { Activity } from "@/data/places";

export interface DbCatalog {
  sis: SpecialInterest[];
  activities: Record<string, Activity[]>;
}

export async function fetchCatalog(): Promise<DbCatalog | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const [siRes, actRes] = await Promise.all([
      sb.from("special_interests").select("id, name, signature, status, accent, is_lux, grp"),
      sb.from("activities").select("si_id, id, name, well, line, position").order("position", { ascending: true }),
    ]);
    if (siRes.error || actRes.error) return null;
    const siRows = siRes.data ?? [];
    if (siRows.length === 0) return null; // empty catalog → keep the bundle

    const sis: SpecialInterest[] = siRows.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      sig: r.signature as string,
      status: r.status as Status,
      accent: r.accent as string,
      lux: Boolean(r.is_lux),
      group: r.grp as string,
    }));

    const activities: Record<string, Activity[]> = {};
    for (const r of actRes.data ?? []) {
      const siId = r.si_id as string;
      (activities[siId] ??= []).push({
        id: r.id as string,
        name: r.name as string,
        well: r.well as string,
        line: (r.line ?? "") as string,
      });
    }

    return { sis, activities };
  } catch {
    return null;
  }
}
