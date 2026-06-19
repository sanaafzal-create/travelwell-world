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
import { fetchJourney, createJourney, saveJourneyMeta, replaceBlocks } from "@/lib/journey";

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

export interface Whisper { kind: string; text: string; }

interface State {
  // journey
  journeySIs: string[];
  journeyActs: string[];
  region: string | null;
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
}

export const MAX_SIS = 3;

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
  trip: load<TripBlock[]>("trip", DEFAULT_TRIP),
  locale: load<string>("locale", "en"),
  io: load<IoMode>("io", "read"),
  whisperDial: load<WhisperDial>("whisperDial", "rare"),
  panel: null,
  toast: null,
  whisper: null,
  user: null,
  journeyId: null,

  setUser: (u) => set(u ? { user: u } : { user: null, journeyId: null }),

  // On sign-in: load this account's journey from Postgres (cross-device resume),
  // or migrate the current on-device state up if this is its first sign-in.
  hydrateJourney: async (userId) => {
    const snap = await fetchJourney(userId);
    if (snap) {
      save("journeySIs", snap.interests);
      save("journeyActs", snap.activities);
      save("region", snap.region);
      save("trip", snap.trip);
      set({ journeyId: snap.id, journeySIs: snap.interests, journeyActs: snap.activities, region: snap.region, trip: snap.trip });
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
  },
  setActs: (ids) => {
    save("journeyActs", ids);
    set({ journeyActs: ids });
    persistMeta(get);
  },
  toggleAct: (id) => {
    const cur = get().journeyActs;
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    save("journeyActs", next);
    set({ journeyActs: next });
    persistMeta(get);
  },
  setRegion: (code) => {
    save("region", code);
    set({ region: code });
    persistMeta(get);
  },
  addToTrip: (b) => {
    const next = [...get().trip, b];
    save("trip", next);
    set({ trip: next });
    persistBlocks(get);
    get().showToast(`Added to your trip · ${b.name}`);
  },
  removeFromTrip: (name) => {
    const next = get().trip.filter((b) => b.name !== name);
    save("trip", next);
    set({ trip: next });
    persistBlocks(get);
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
    if (get().whisperDial === "off") return;
    set({ whisper: w });
    window.clearTimeout((useStore as unknown as { _w?: number })._w);
    (useStore as unknown as { _w?: number })._w = window.setTimeout(() => set({ whisper: null }), 9000);
  },
  hideWhisper: () => set({ whisper: null }),
}));

/** Apply persisted locale/dir to <html> on first load. */
export function applyInitialLocale() {
  const code = load<string>("locale", "en");
  const L = LOCALES.find((l) => l.code === code) || LOCALES[0];
  document.documentElement.lang = code;
  document.documentElement.dir = L.dir;
}
