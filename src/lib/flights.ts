/**
 * TravelWell.World — flight-search SEAM (adapter, never a vendor binding).
 *
 * The app calls `searchFlights()` and NOTHING else — it never imports or talks
 * to Duffel directly. Duffel lives only behind the `flights` Edge Function, so
 * the rail stays swappable (same rule as the voice seam in `useSpeech`/`voice`):
 * swap the provider inside the function and this interface never changes.
 *
 * SCOPE — SEARCH ONLY. No booking, no order, no payment. When booking ships,
 * the provider / Duffel Payments is merchant of record and holds the card; we
 * stay PCI SAQ A and never touch card data (payments canon). This seam returns
 * shoppable offers to render — the handoff/close step is a separate, gated build.
 *
 * TEST/sandbox until go-live. Degrades gracefully (empty offers) when Supabase
 * or the Duffel token isn't configured, so preview never breaks.
 */
import { getSupabase } from "./supabase";

/** What the app asks for. Codes are IATA (e.g. "JFK"), dates are YYYY-MM-DD.
 *  One slice = one-way; two slices = round-trip; N = multi-city. */
export interface FlightQuery {
  slices: { origin: string; destination: string; date: string }[];
  adults?: number;
  cabin?: "economy" | "premium_economy" | "business" | "first";
}

export interface FlightLeg {
  origin: string;
  destination: string;
  departsAt: string | null;
  arrivesAt: string | null;
  durationIso: string | null; // ISO-8601 duration, e.g. "PT7H30M"
  stops: number;
}

export interface FlightOffer {
  id: string;
  price: { amount: string | null; currency: string | null };
  airline: string;
  airlineCode: string | null;
  slices: FlightLeg[];
}

export interface FlightSearchResult {
  offers: FlightOffer[];
  degraded?: boolean;
  mode?: string; // "test" | "unconfigured" | undefined
}

export async function searchFlights(q: FlightQuery): Promise<FlightSearchResult> {
  const sb = getSupabase();
  if (!sb) return { offers: [], degraded: true, mode: "unconfigured" };
  try {
    // Map our clean seam shape → the function's slice shape (Duffel's
    // `departure_date` field name is contained on the far side of the seam).
    const { data, error } = await sb.functions.invoke("flights", {
      body: {
        slices: q.slices.map((s) => ({ origin: s.origin, destination: s.destination, departure_date: s.date })),
        adults: q.adults,
        cabin: q.cabin,
      },
    });
    if (error) throw error;
    const d = data as FlightSearchResult;
    return { offers: d.offers ?? [], degraded: d.degraded, mode: d.mode };
  } catch {
    return { offers: [], degraded: true };
  }
}
