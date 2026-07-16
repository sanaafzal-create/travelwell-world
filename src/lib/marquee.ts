/**
 * TravelWell.World — Marquee Moments (the TLEU forward calendar read-layer).
 *
 * Surfaces David's 70 curated Travel-Linked marquee events (Great Migration,
 * Oktoberfest, Rio Carnival, …) — the two-to-four-year forward calendar with
 * the booking-window intelligence (book-by / ticket-drop / sells-out) that no
 * copycat has. Reads the authored source (src/data/tleu-events.json, the same
 * file that seeds public.local_signals via 0007), so it works identically in
 * preview and production. When the machine-writable signal feed lands, this can
 * move to DB-first with this as the fallback — the shape already matches.
 */
import tleu from "@/data/tleu-events.json";
import { regionByCode } from "@/data/taxonomy";

export interface MarqueeEvent {
  id: string;
  title: string;
  blurb?: string;
  regionCode?: string;
  regionName?: string;
  startsOn?: string;
  endsOn?: string;
  season?: string;
  priority: number;
  flagship: boolean;
  bookBy?: string;
  ticketDrop?: string;
  sellsOut?: string;
  tier?: string;
}

interface RawTleu {
  region_code?: string | null;
  title: string;
  blurb?: string;
  starts_on?: string | null;
  ends_on?: string | null;
  season?: string;
  priority?: number;
  meta?: Record<string, unknown> & { flagship?: boolean; book_by?: string; ticket_drop?: string; sells_out?: string; tier?: string };
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const RAW = (tleu as RawTleu[]).map((e): MarqueeEvent => {
  const m = e.meta || {};
  return {
    id: `tleu-${slug(e.title)}`,
    title: e.title,
    blurb: e.blurb,
    regionCode: e.region_code ?? undefined,
    regionName: e.region_code ? regionByCode(e.region_code)?.name : undefined,
    startsOn: e.starts_on ?? undefined,
    endsOn: e.ends_on ?? undefined,
    season: e.season,
    priority: e.priority ?? 0,
    flagship: m.flagship === true,
    bookBy: m.book_by,
    ticketDrop: m.ticket_drop,
    sellsOut: m.sells_out,
    tier: m.tier,
  };
});

/** Flagship first, then by priority (the curated importance rank). */
export const MARQUEE_EVENTS: MarqueeEvent[] = [...RAW].sort(
  (a, b) => Number(b.flagship) - Number(a.flagship) || b.priority - a.priority
);

/** Chronological (upcoming first); undated seasons/schedules sort to the end. */
export const MARQUEE_BY_DATE: MarqueeEvent[] = [...RAW].sort((a, b) => {
  if (a.startsOn && b.startsOn) return a.startsOn.localeCompare(b.startsOn);
  if (a.startsOn) return -1;
  if (b.startsOn) return 1;
  return b.priority - a.priority;
});

/** Human "when" label — a date range if dated, else the season phrase. */
export function whenLabel(e: MarqueeEvent): string {
  if (e.startsOn) {
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
    const start = new Date(e.startsOn + "T00:00:00");
    const s = start.toLocaleDateString("en-US", opts);
    if (e.endsOn && e.endsOn !== e.startsOn) {
      const end = new Date(e.endsOn + "T00:00:00").toLocaleDateString("en-US", opts);
      return `${s} – ${end}`;
    }
    return s;
  }
  return e.season || "";
}
