/**
 * TravelWell.World — Atlas orchestrator (the "walks beside you" loop).
 *
 * Wakes the (previously dormant) Whisper system: as the traveler moves along the
 * flow, this watches where they are, pulls the relevant curated signals for that
 * destination/region/SI, and surfaces ONE as a gentle, planning-stage whisper.
 * All cadence/quiet-hours/dedup discipline lives in store.showWhisper — this
 * only proposes; the store decides whether it's the right moment.
 *
 * Content comes entirely from the signals data layer (never hardcoded), so it
 * gets richer as David authors more. Renders nothing.
 */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { fetchSignals } from "@/lib/signals";
import { isActiveInMonth } from "@/data/local-signals";

// Planning-stage routes — where a whisper is a help, not an interruption.
const FLOW = new Set([
  "special-interests", "si", "regions", "region", "activities",
  "destinations", "destination", "wells-surface", "providers", "well",
]);

function flowContext(path: string, region: string | null, sis: string[]) {
  const [a, b] = path.replace(/\/+$/, "").split("/").filter(Boolean);
  if (!FLOW.has(a)) return null;
  return {
    destination: a === "destination" ? b : null,
    region: a === "region" ? b : region,
    si: a === "si" && b ? [b, ...sis] : sis,
  };
}

const kindLabel = (k: string) =>
  k === "event" ? "Happening there" : k === "opening" ? "While you're there" : "A note on timing";

export function AtlasOrchestrator() {
  const location = useLocation();
  const region = useStore((s) => s.region);
  const journeySIs = useStore((s) => s.journeySIs);
  const showWhisper = useStore((s) => s.showWhisper);
  const dial = useStore((s) => s.whisperDial);

  useEffect(() => {
    if (dial === "off") return;
    const ctx = flowContext(location.pathname, region, journeySIs);
    if (!ctx) return;
    let cancelled = false;
    // A short dwell so the whisper feels like a noticing, not a pop-up.
    const t = window.setTimeout(async () => {
      const month = new Date().getMonth() + 1;
      const signals = await fetchSignals({ ...ctx, month });
      if (cancelled || !signals.length) return;
      const pick = signals.find((s) => isActiveInMonth(s, month)) ?? signals[0];
      if (!pick) return;
      showWhisper({ id: pick.id, kind: kindLabel(pick.kind), text: pick.blurb || pick.title, href: pick.href });
    }, 4000);
    return () => { cancelled = true; window.clearTimeout(t); };
  }, [location.pathname, region, journeySIs, showWhisper, dial]);

  return null;
}
