/**
 * TravelWell.World — Local/temporal signals read-layer (DB → bundle).
 *
 * Reads public.local_signals (migration 0007) when Supabase is reachable, and
 * falls back to the bundled curated set in src/data/local-signals.ts otherwise
 * — same offline-first contract as the catalog. Atlas grounding and Well
 * Whispers both call fetchSignals() to learn "what's happening" where the
 * traveler is looking.
 */
import { getSupabase } from "./supabase";
import {
  LOCAL_SIGNALS,
  selectSignals,
  type LocalSignal,
  type SignalKind,
  type SignalHorizon,
} from "@/data/local-signals";

export interface SignalQuery {
  destination?: string | null;
  region?: string | null;
  si?: string[];
  month?: number; // 1-12; sorts in-season signals first
}

function rowToSignal(r: Record<string, unknown>): LocalSignal {
  return {
    id: r.id as string,
    kind: r.kind as SignalKind,
    horizon: r.horizon as SignalHorizon,
    title: r.title as string,
    blurb: (r.blurb ?? undefined) as string | undefined,
    href: (r.href ?? undefined) as string | undefined,
    destination: (r.destination_id ?? undefined) as string | undefined,
    region: (r.region_code ?? undefined) as string | undefined,
    si: (r.si ?? []) as string[],
    wells: (r.wells ?? []) as string[],
    season: (r.season ?? undefined) as string | undefined,
    recurrence: (r.recurrence ?? undefined) as LocalSignal["recurrence"],
    startsOn: (r.starts_on ?? undefined) as string | undefined,
    endsOn: (r.ends_on ?? undefined) as string | undefined,
    priority: (r.priority ?? 0) as number,
    source: (r.source ?? "curated") as LocalSignal["source"],
  };
}

export async function fetchSignals(q: SignalQuery): Promise<LocalSignal[]> {
  const sb = getSupabase();
  if (!sb) return selectSignals(LOCAL_SIGNALS, q);
  try {
    // Pull candidates that match the destination, the region, or are global
    // (no destination/region); refine + sort client-side with selectSignals.
    const ors: string[] = ["and(destination_id.is.null,region_code.is.null)"];
    if (q.destination) ors.push(`destination_id.eq.${q.destination}`);
    if (q.region) ors.push(`region_code.eq.${q.region}`);
    const { data, error } = await sb
      .from("local_signals")
      .select("id, destination_id, region_code, si, wells, kind, horizon, title, blurb, href, starts_on, ends_on, recurrence, season, source, priority")
      .or(ors.join(","));
    if (error || !data) return selectSignals(LOCAL_SIGNALS, q);
    return selectSignals(data.map(rowToSignal), q);
  } catch {
    return selectSignals(LOCAL_SIGNALS, q);
  }
}
