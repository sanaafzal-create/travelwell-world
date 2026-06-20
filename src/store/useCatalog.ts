/**
 * TravelWell.World — Catalog store (the dynamic read-layer for components).
 *
 * Seeded synchronously from the bundled taxonomy, so the first render is
 * instant and works fully offline (the bundle is the fallback). On app boot
 * `hydrate()` pulls the catalog from Postgres and, if present, folds it in:
 * DB rows win on conflict, bundle entries fill any gaps — so we never lose
 * shipped content, and SIs/activities added or edited in the DB show up after
 * a refresh without a redeploy.
 *
 * Components read SIs/activities through this store (useCatalog) instead of
 * importing the bundle directly, so the swap to DB-served content is invisible
 * to them. Bundle order is preserved (it drives grouped display); DB-only SIs
 * are appended.
 */
import { create } from "zustand";
import { SIS as BUNDLE_SIS, type SpecialInterest } from "@/data/taxonomy";
import { ACTIVITIES as BUNDLE_ACTIVITIES, type Activity } from "@/data/places";
import { fetchCatalog } from "@/lib/catalog";

interface CatalogState {
  sis: SpecialInterest[];
  activities: Record<string, Activity[]>;
  /** Where the live catalog came from — useful for debugging / a future badge. */
  source: "bundle" | "db";
  hydrate: () => Promise<void>;
}

export const useCatalog = create<CatalogState>((set) => ({
  sis: BUNDLE_SIS,
  activities: BUNDLE_ACTIVITIES,
  source: "bundle",
  hydrate: async () => {
    const db = await fetchCatalog();
    if (!db) return; // offline / unconfigured / empty → keep the bundle

    // DB authoritative, bundle fills gaps. A Map keyed by id preserves bundle
    // order (re-setting a key keeps its slot) and appends DB-only SIs.
    const byId = new Map(BUNDLE_SIS.map((s) => [s.id, s]));
    for (const s of db.sis) byId.set(s.id, s);

    set({
      sis: [...byId.values()],
      activities: { ...BUNDLE_ACTIVITIES, ...db.activities },
      source: "db",
    });
  },
}));

/** Reactive helpers mirroring the old taxonomy/places call-sites. */
export const useSpecialInterests = () => useCatalog((s) => s.sis);
export const useActivities = () => useCatalog((s) => s.activities);
