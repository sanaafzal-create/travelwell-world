/**
 * TravelWell.World — global client state.
 * Journey (chosen SIs → activities → trip blocks), locale/RTL, and the global
 * shell panels (mega-menu, Concierge, Your-Trip tray, Emergency, Whisper).
 * Persists the same `tww:*` localStorage keys the prototype used so design
 * sessions carry over: journeySIs, journeyActs, whisperDial, trip, locale, io.
 */
import { create } from "zustand";
import { LOCALES } from "@/data/taxonomy";
import type { IconName } from "@/data/taxonomy";
import { fetchJourney, createJourney, saveJourneyMeta, replaceBlocks, saveJourneyPosition } from "@/lib/journey";
import { track, reconcileAnonEvents, registerTrackContext } from "@/lib/track";

export type BlockStatus = "idea" | "pending" | "confirmed";
export interface TripBlock {
  well: string;
  icon: IconName;
  name: string;
  meta: string;
  status: BlockStatus;
  whom?: string;
}

export type Panel = "mega" | "concierge" | "tray" | "emergency" | null;
export type IoMode = "read" | "hear" | "both";
export type WhisperDial = "off" | "rare" | "balanced" | "active";

const KEY = (k: string) => "tww:" + k;
function load<T>(k: string, fallback: T): T {
  try {
    const v = localStorage.getItem(KEY(k));
    return v === null ? fallback : (JSON.parse(v) as T);
  } catch {
    return fallback;
  }
}
function save(k: string, v: unknown) {
  try {
    localStorage.setItem(KEY(k), JSON.stringify(v));
  } catch {
    /* ignore quota / private-mode */
  }
}

const DEFAULT_TRIP: TripBlock[] = [
  { well: "activities", icon: "compass", name: "Great Migration game drives", meta: "Activities-Well · Maasai Mara", status: "confirmed" },
  { well: "stay", icon: "bed", name: "Angama Mara", meta: "Stay-Well · 4 nights", status: "pending" },
  { well: "fly", icon: "plane", name: "Nairobi → Mara airstrip", meta: "Fly-Well", status: "idea" },
];

export interface Whisper { id?: string; kind: string; text: string; href?: string; }
/** Where the traveler was on the flow before a whisper/idea pulled them off it. */
export interface Anchor { path: string; label: string; scrollY: number; }

interface State {
  // journey
  journeySIs: string[];
  journeyActs: string[];
  region: string | null;
  // last route visited, for "pick up where you left off"
  lastPath: string | null;
  // trip
  trip: TripBlock[];
  // prefs
  locale: string;
  io: IoMode;
  whisperDial: WhisperDial;
  // ui
  panel: Panel;
  toast: string | null;
  whisper: Whisper | null;
  // Anchor: the warm way back to the flow after wandering off it (null = on-flow)
  anchor: Anchor | null;
  // auth (null until Supabase is configured + signed in)
  user: { id: string; email: string | null } | null;
  // the signed-in traveler's persisted journey (null until hydrated/created)
  journeyId: string | null;

  // actions
  setUser: (u: { id: string; email: string | null } | null) => void;
  hydrateJourney: (userId: string) => Promise<void>;
  toggleSI: (id: string) => void;
  setActs: (ids: string[]) => void;
  toggleAct: (id: string) => void;
  setRegion: (code: string | null) => void;
  setLastPath: (path: string) => void;
  addToTrip: (b: TripBlock) => void;
  removeFromTrip: (name: string) => void;
  setLocale: (code: string) => void;
  setIo: (m: IoMode) => void;
  setWhisperDial: (d: WhisperDial) => void;
  openPanel: (p: Panel) => void;
  closePanel: () => void;
  showToast: (msg: string) => void;
  clearToast: () => void;
  showWhisper: (w: Whisper) => void;
  hideWhisper: () => void;
  setAnchor: (a: Anchor) => void;
  clearAnchor: () => void;
}

export const MAX_SIS = 3;

// Whisper cadence/quiet-hours gates (the v1 canon: more relevant, not more
// frequent). Min gap between whispers by dial; suppressed during sleep hours;
// never the same idea twice in a session.
const WHISPER_GAP_MS: Record<WhisperDial, number> = {
  off: Infinity, rare: 15 * 60_000, balanced: 5 * 60_000, active: 90_000,
};
let _lastWhisperAt = 0;
const _shownWhisperIds = new Set<string>();
const inQuietHours = () => { const h = new Date().getHours(); return h >= 22 || h < 7; };

// Fire-and-forget write-through to Postgres. localStorage stays the immediate
// source of truth for snappy UI; these durably sync the signed-in traveler's
// journey so it resumes on any device. No-op when signed out / unconfigured.
function persistMeta(g: () => State) {
  const { user, journeyId, journeySIs, region, journeyActs } = g();
  if (user && journeyId) void saveJourneyMeta(journeyId, { interests: journeySIs, region, activities: journeyActs });
}
function persistBlocks(g: () => State) {
  const { user, journeyId, trip } = g();
  if (user && journeyId) void replaceBlocks(journeyId, user.id, trip);
}

export const useStore = create<State>((set, get) => ({
  journeySIs: load<string[]>("journeySIs", []),
  journeyActs: load<string[]>("journeyActs", []),
  region: load<string | null>("region", null),
  lastPath: load<string | null>("lastPath", null),
  trip: load<TripBlock[]>("trip", DEFAULT_TRIP),
  locale: load<string>("locale", "en"),
  io: load<IoMode>("io", "read"),
  whisperDial: load<WhisperDial>("whisperDial", "rare"),
  panel: null,
  toast: null,
  whisper: null,
  anchor: null,
  user: null,
  journeyId: null,

  setUser: (u) => set(u ? { user: u } : { user: null, journeyId: null }),

  // On sign-in: load this account's journey from Postgres (cross-device resume),
  // or migrate the current on-device state up if this is its first sign-in.
  hydrateJourney: async (userId) => {
    // Attach this device's pre-sign-in exploration to the account.
    void reconcileAnonEvents(userId);
    const snap = await fetchJourney(userId);
    if (snap) {
      save("journeySIs", snap.interests);
      save("journeyActs", snap.activities);
      save("region", snap.region);
      save("trip", snap.trip);
      if (snap.lastPath) save("lastPath", snap.lastPath);
      set({
        journeyId: snap.id,
        journeySIs: snap.interests,
        journeyActs: snap.activities,
        region: snap.region,
        trip: snap.trip,
        ...(snap.lastPath ? { lastPath: snap.lastPath } : {}),
      });
      return;
    }
    const { journeySIs, journeyActs, region, trip } = get();
    const id = await createJourney(userId, { interests: journeySIs, region, activities: journeyActs, trip });
    if (id) set({ journeyId: id });
  },

  toggleSI: (id) => {
    const cur = get().journeySIs;
    if (cur.includes(id)) {
      const next = cur.filter((x) => x !== id);
      save("journeySIs", next);
      set({ journeySIs: next });
      persistMeta(get);
      track({ kind: "deselect", entity: "si", entityId: id });
      return;
    }
    if (cur.length >= MAX_SIS) {
      get().showToast(`You can pick up to ${MAX_SIS} — 1–2 is the sweet spot.`);
      return;
    }
    const next = [...cur, id];
    save("journeySIs", next);
    set({ journeySIs: next });
    persistMeta(get);
    track({ kind: "select", entity: "si", entityId: id, context: { region: get().region } });
  },
  setActs: (ids) => {
    save("journeyActs", ids);
    set({ journeyActs: ids });
    persistMeta(get);
  },
  toggleAct: (id) => {
    const cur = get().journeyActs;
    const adding = !cur.includes(id);
    const next = adding ? [...cur, id] : cur.filter((x) => x !== id);
    save("journeyActs", next);
    set({ journeyActs: next });
    persistMeta(get);
    track({ kind: adding ? "select" : "deselect", entity: "activity", entityId: id, context: { region: get().region } });
  },
  setRegion: (code) => {
    save("region", code);
    set({ region: code });
    persistMeta(get);
    if (code) track({ kind: "select", entity: "region", entityId: code, context: { sis: get().journeySIs } });
  },
  setLastPath: (path) => {
    if (get().lastPath === path) return;
    save("lastPath", path);
    set({ lastPath: path });
    // Debounced write-through to Postgres (routes change often; don't spam).
    const { user, journeyId } = get();
    if (user && journeyId) {
      window.clearTimeout((useStore as unknown as { _p?: number })._p);
      (useStore as unknown as { _p?: number })._p = window.setTimeout(() => {
        const s = get();
        if (s.journeyId) void saveJourneyPosition(s.journeyId, s.lastPath ?? path);
      }, 1500);
    }
  },
  addToTrip: (b) => {
    const next = [...get().trip, b];
    save("trip", next);
    set({ trip: next });
    persistBlocks(get);
    track({ kind: "add", entity: "trip", entityId: b.name, context: { well: b.well, status: b.status, region: get().region } });
    get().showToast(`Added to your trip · ${b.name}`);
  },
  removeFromTrip: (name) => {
    const next = get().trip.filter((b) => b.name !== name);
    save("trip", next);
    set({ trip: next });
    persistBlocks(get);
    track({ kind: "remove", entity: "trip", entityId: name });
  },
  setLocale: (code) => {
    const L = LOCALES.find((l) => l.code === code) || LOCALES[0];
    save("locale", code);
    document.documentElement.lang = code;
    document.documentElement.dir = L.dir;
    set({ locale: code });
    get().showToast(`Language · ${L.native}${L.dir === "rtl" ? " · RTL" : ""}`);
  },
  setIo: (m) => {
    save("io", m);
    set({ io: m });
  },
  setWhisperDial: (d) => {
    save("whisperDial", d);
    set({ whisperDial: d });
  },
  openPanel: (p) => set({ panel: p }),
  closePanel: () => set({ panel: null }),
  showToast: (msg) => {
    set({ toast: msg });
    window.clearTimeout((useStore as unknown as { _t?: number })._t);
    (useStore as unknown as { _t?: number })._t = window.setTimeout(() => set({ toast: null }), 2600);
  },
  clearToast: () => set({ toast: null }),
  showWhisper: (w) => {
    // Cadence > frequency: respect the dial, sleep hours, the min gap, one at a
    // time, and never the same idea twice in a session.
    const dial = get().whisperDial;
    if (dial === "off" || inQuietHours() || get().whisper) return;
    if (w.id && _shownWhisperIds.has(w.id)) return;
    const now = Date.now();
    if (now - _lastWhisperAt < WHISPER_GAP_MS[dial]) return;
    _lastWhisperAt = now;
    if (w.id) _shownWhisperIds.add(w.id);
    set({ whisper: w });
    track({ kind: "view", entity: "whisper", entityId: w.id, context: { href: w.href } });
    window.clearTimeout((useStore as unknown as { _w?: number })._w);
    (useStore as unknown as { _w?: number })._w = window.setTimeout(() => set({ whisper: null }), 12000);
  },
  hideWhisper: () => set({ whisper: null }),
  setAnchor: (a) => set({ anchor: a }),
  clearAnchor: () => set({ anchor: null }),
}));

// Let the tracker resolve the current user + journey at flush time, without
// track.ts importing the store (which would be a cycle).
registerTrackContext(() => {
  const s = useStore.getState();
  return { userId: s.user?.id ?? null, journeyId: s.journeyId };
});

/** Apply persisted locale/dir to <html> on first load. */
export function applyInitialLocale() {
  const code = load<string>("locale", "en");
  const L = LOCALES.find((l) => l.code === code) || LOCALES[0];
  document.documentElement.lang = code;
  document.documentElement.dir = L.dir;
}
