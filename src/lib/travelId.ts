/**
 * TravelWell — Travel ID persistence (public.travel_ids, RLS by auth.uid()).
 *
 * Read/write the signed-in traveler's profile. No-ops gracefully when Supabase
 * isn't configured. The shape mirrors the 0001_init migration so a row maps
 * straight onto the Profile screen and the Sign Up wizard output.
 */
import { getSupabase } from "./supabase";

export interface TravelIdRecord {
  user_id: string;
  display_name: string | null;
  age_range: string | null;
  trip_intent: string | null; // the free-text "dream"
  interests: string[];        // 1–3 special-interest ids
  budget_ranges: Record<string, string[]>; // { wellId: ranges[] }
  dietary: string | null;
  accessibility: string | null;
  consent: boolean;
}

export async function fetchTravelId(userId: string): Promise<TravelIdRecord | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from("travel_ids").select("*").eq("user_id", userId).maybeSingle();
  if (error) return null;
  return (data as TravelIdRecord) ?? null;
}

export async function saveTravelId(
  rec: Partial<TravelIdRecord> & { user_id: string }
): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "unconfigured" };
  const { error } = await sb
    .from("travel_ids")
    .upsert({ ...rec, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  return error ? { ok: false, error: error.message } : { ok: true };
}

/* ---- Pending Travel ID (passwordless flow) -------------------------------
 * Sign Up collects the Travel ID before the user has a session. We stash it
 * locally, send a magic link, and flush it to Postgres once they verify and a
 * session exists (see Shell). */
const PENDING_KEY = "tww:pendingTravelId";
export type PendingTravelId = Omit<TravelIdRecord, "user_id">;

export function savePendingTravelId(rec: PendingTravelId): void {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(rec)); } catch { /* ignore */ }
}
export function loadPendingTravelId(): PendingTravelId | null {
  try { const v = localStorage.getItem(PENDING_KEY); return v ? (JSON.parse(v) as PendingTravelId) : null; } catch { return null; }
}
export function clearPendingTravelId(): void {
  try { localStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
}

/** Once signed in, write any pending Travel ID to the DB and clear it. */
export async function flushPendingTravelId(userId: string): Promise<boolean> {
  const pending = loadPendingTravelId();
  if (!pending) return false;
  const { ok } = await saveTravelId({ user_id: userId, ...pending });
  if (ok) clearPendingTravelId();
  return ok;
}

