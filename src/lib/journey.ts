/**
 * TravelWell — Journey + trip-block persistence (public.journeys / trip_blocks,
 * RLS by auth.uid()).
 *
 * A journey = chosen interests → region → activities, plus an ordered list of
 * trip blocks (the itinerary). We keep ONE primary journey per traveler for
 * now. No-ops gracefully when Supabase isn't configured, so the design-preview
 * (localStorage-only) experience is unchanged for signed-out visitors.
 *
 * trip_blocks doesn't store the display icon — it's derived from the well via
 * the taxonomy on read, keeping the catalog the single source of truth.
 */
import { getSupabase } from "./supabase";
import { wellById, type IconName } from "@/data/taxonomy";
import type { TripBlock, BlockStatus } from "@/store/useStore";

export interface JourneySnapshot {
  id: string;
  interests: string[];
  region: string | null;
  activities: string[];
  trip: TripBlock[];
  lastPath: string | null;
}

const iconFor = (well: string): IconName => wellById(well)?.icon ?? "compass";

/** Fetch the traveler's primary journey + its ordered trip blocks (newest journey wins). */
export async function fetchJourney(userId: string): Promise<JourneySnapshot | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data: j, error } = await sb
    .from("journeys")
    .select("id, interests, region_code, activities, last_path")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !j) return null;

  const { data: rows } = await sb
    .from("trip_blocks")
    .select("well, name, meta, status, whom, position")
    .eq("journey_id", j.id)
    .order("position", { ascending: true });

  const trip: TripBlock[] = (rows ?? []).map((b) => ({
    well: b.well,
    icon: iconFor(b.well),
    name: b.name,
    meta: b.meta ?? "",
    status: b.status as BlockStatus,
    ...(b.whom ? { whom: b.whom } : {}),
  }));

  return {
    id: j.id,
    interests: j.interests ?? [],
    region: j.region_code ?? null,
    activities: j.activities ?? [],
    trip,
    lastPath: j.last_path ?? null,
  };
}

/** Persist the traveler's last position (route) so they resume where they left off. */
export async function saveJourneyPosition(journeyId: string, lastPath: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("journeys").update({ last_path: lastPath, updated_at: new Date().toISOString() }).eq("id", journeyId);
}

/** Create the traveler's first journey from their current (local) state. Returns its id. */
export async function createJourney(
  userId: string,
  seed: { interests: string[]; region: string | null; activities: string[]; trip: TripBlock[] }
): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("journeys")
    .insert({ user_id: userId, interests: seed.interests, region_code: seed.region, activities: seed.activities })
    .select("id")
    .single();
  if (error || !data) return null;
  await replaceBlocks(data.id, userId, seed.trip);
  return data.id as string;
}

/** Persist journey meta (interests / region / activities). Fire-and-forget from the store. */
export async function saveJourneyMeta(
  journeyId: string,
  meta: { interests: string[]; region: string | null; activities: string[] }
): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb
    .from("journeys")
    .update({
      interests: meta.interests,
      region_code: meta.region,
      activities: meta.activities,
      updated_at: new Date().toISOString(),
    })
    .eq("id", journeyId);
}

/** Replace all trip blocks for a journey with `trip` (full sync, preserves order). */
export async function replaceBlocks(journeyId: string, userId: string, trip: TripBlock[]): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("trip_blocks").delete().eq("journey_id", journeyId);
  if (trip.length === 0) return;
  const rows = trip.map((b, i) => ({
    journey_id: journeyId,
    user_id: userId,
    well: b.well,
    name: b.name,
    meta: b.meta,
    whom: b.whom ?? null,
    status: b.status,
    position: i,
  }));
  await sb.from("trip_blocks").insert(rows);
}
