/**
 * TravelWell.World — exploration tracking (public.journey_events).
 *
 * An append-only behavioral log: what a traveler views and selects as they move
 * through the flow and back. It's the substrate for two things — resuming where
 * they left off, and grounding Atlas ("you keep circling the Med for sailing but
 * haven't picked providers…").
 *
 * Batched + fire-and-forget, mirroring lib/journey.ts: localStorage/UI stay
 * snappy; events flush to Postgres on an idle timer and on tab-hide. No-ops when
 * Supabase isn't configured or tracking consent is off. Works signed-out via an
 * anon id, reconciled to the account on sign-in.
 */
import { getSupabase } from "./supabase";

export type EventKind = "view" | "select" | "deselect" | "add" | "remove" | "compare";
export type EventEntity =
  | "si" | "region" | "provider" | "activity" | "well" | "guide" | "destination" | "trip" | "page";

export interface TrackEvent {
  kind: EventKind;
  entity: EventEntity;
  entityId?: string;
  context?: Record<string, unknown>;
}

const ANON_KEY = "tww:anon";
const CONSENT_KEY = "tww:trackingConsent";

// Resolve the signed-in user + active journey at flush time. The store registers
// this (track.ts must not import the store — that would be a cycle).
let ctxProvider: () => { userId: string | null; journeyId: string | null } = () => ({
  userId: null,
  journeyId: null,
});
export function registerTrackContext(fn: typeof ctxProvider) {
  ctxProvider = fn;
}

/** Stable per-device id so pre-sign-in exploration isn't lost. */
export function getAnonId(): string {
  try {
    let id = localStorage.getItem(ANON_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

// Default on: first-party data, RLS-private to the traveler, used only to assist
// them. setTrackingConsent(false) turns it off (e.g. wired to a privacy toggle).
function enabled(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) !== "false";
  } catch {
    return true;
  }
}
export function setTrackingConsent(on: boolean) {
  try {
    localStorage.setItem(CONSENT_KEY, on ? "true" : "false");
  } catch {
    /* ignore */
  }
}

interface QueuedEvent extends TrackEvent {
  occurred_at: string;
}
let queue: QueuedEvent[] = [];
let timer: number | undefined;

export function track(e: TrackEvent) {
  if (!enabled()) return;
  queue.push({ ...e, occurred_at: new Date().toISOString() });
  if (queue.length >= 20) {
    void flush();
    return;
  }
  window.clearTimeout(timer);
  timer = window.setTimeout(() => void flush(), 4000);
}

export async function flush(): Promise<void> {
  window.clearTimeout(timer);
  if (queue.length === 0) return;
  const sb = getSupabase();
  if (!sb) {
    queue = []; // unconfigured: drop so the buffer can't grow unbounded
    return;
  }
  const batch = queue;
  queue = [];
  const { userId, journeyId } = ctxProvider();
  const anon_id = getAnonId();
  const rows = batch.map((e) => ({
    user_id: userId,
    anon_id,
    journey_id: journeyId,
    kind: e.kind,
    entity: e.entity,
    entity_id: e.entityId ?? null,
    context: e.context ?? {},
    occurred_at: e.occurred_at,
  }));
  try {
    await sb.from("journey_events").insert(rows);
  } catch {
    /* fire-and-forget: drop on failure rather than block the UI */
  }
}

/** On sign-in, attach this device's anonymous events to the account. */
export async function reconcileAnonEvents(userId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await flush(); // write any pending anon events first
  try {
    await sb.from("journey_events").update({ user_id: userId }).is("user_id", null).eq("anon_id", getAnonId());
  } catch {
    /* ignore */
  }
}

// Flush the tail of a session when the tab is hidden or unloaded.
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void flush();
  });
  window.addEventListener("pagehide", () => void flush());
}
