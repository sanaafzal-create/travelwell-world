// TravelWell.World — "Flights" Edge Function (Duffel-backed flight SEARCH).
// Keeps the Duffel token server-side; the browser calls this via
// supabase.functions.invoke("flights"). The token NEVER reaches the client.
//
// SCOPE — SEARCH ONLY. This returns offers; it does NOT create an order and
// NEVER touches payment. When booking ships (funded phase, after go-live), the
// provider / Duffel Payments is merchant of record and holds the card — we stay
// PCI SAQ A and never touch card data (see the payments canon). Do not add an
// order-creation path here without that gate.
//
// TEST / sandbox only until go-live is earned (signed Services Agreement + KYC +
// US-seller terms). Use a Duffel TEST token (`duffel_test_...`).
//
// Deploy:  supabase functions deploy flights
// Secret:  supabase secrets set DUFFEL_TOKEN=duffel_test_...

const DUFFEL_BASE = "https://api.duffel.com";
const DUFFEL_VERSION = "v2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface QuerySlice { origin: string; destination: string; departure_date: string }
interface FlightQuery {
  slices: QuerySlice[];
  adults?: number;
  cabin?: "economy" | "premium_economy" | "business" | "first";
}

const IATA = /^[A-Za-z]{3}$/;             // airport/city code
const DATE = /^\d{4}-\d{2}-\d{2}$/;       // YYYY-MM-DD

/** Normalize one Duffel offer into our own flat shape (the seam boundary — no
 *  Duffel field names leak past this function). */
function normalize(o: Record<string, any>) {
  return {
    id: o.id,
    price: { amount: o.total_amount ?? null, currency: o.total_currency ?? null },
    airline: o.owner?.name ?? "—",
    airlineCode: o.owner?.iata_code ?? null,
    slices: (o.slices ?? []).map((s: Record<string, any>) => {
      const segs: Record<string, any>[] = s.segments ?? [];
      const first = segs[0] ?? {};
      const last = segs[segs.length - 1] ?? {};
      return {
        origin: s.origin?.iata_code ?? first.origin?.iata_code ?? "",
        destination: s.destination?.iata_code ?? last.destination?.iata_code ?? "",
        departsAt: first.departing_at ?? null,
        arrivesAt: last.arriving_at ?? null,
        durationIso: s.duration ?? null,   // ISO-8601, e.g. "PT7H30M"
        stops: Math.max(0, segs.length - 1),
      };
    }),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const q = (await req.json()) as FlightQuery;

    const token = Deno.env.get("DUFFEL_TOKEN");
    if (!token) {
      // Inert until wired — same graceful-degrade shape as the Atlas function.
      return Response.json(
        { offers: [], degraded: true, mode: "unconfigured", note: "Flights isn't configured yet — set DUFFEL_TOKEN (test) on the Edge Function." },
        { headers: cors, status: 200 }
      );
    }

    // Validate before we spend a Duffel call — bad codes/dates just error out.
    const slices = Array.isArray(q.slices) ? q.slices : [];
    if (!slices.length) return Response.json({ offers: [], error: "no slices" }, { headers: cors, status: 200 });
    for (const s of slices) {
      if (!IATA.test(s.origin ?? "") || !IATA.test(s.destination ?? "") || !DATE.test(s.departure_date ?? "")) {
        return Response.json({ offers: [], error: "each slice needs origin/destination IATA codes and a YYYY-MM-DD departure_date" }, { headers: cors, status: 200 });
      }
    }

    const adults = Math.min(9, Math.max(1, q.adults ?? 1));
    const passengers = Array.from({ length: adults }, () => ({ type: "adult" }));
    const body = {
      data: {
        cabin_class: q.cabin ?? "economy",
        passengers,
        slices: slices.map((s) => ({ origin: s.origin.toUpperCase(), destination: s.destination.toUpperCase(), departure_date: s.departure_date })),
      },
    };

    // return_offers=true → offers come back inline on the offer request.
    const res = await fetch(`${DUFFEL_BASE}/air/offer_requests?return_offers=true`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Duffel-Version": DUFFEL_VERSION,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("flights: duffel error", res.status, detail);
      return Response.json({ offers: [], degraded: true, mode: "test", note: `Duffel returned ${res.status}` }, { headers: cors, status: 200 });
    }

    const json = await res.json();
    const offers = ((json?.data?.offers ?? []) as Record<string, any>[])
      .map(normalize)
      .sort((a, b) => parseFloat(a.price.amount ?? "Infinity") - parseFloat(b.price.amount ?? "Infinity"))
      .slice(0, 12);

    return Response.json({ offers, mode: "test" }, { headers: cors, status: 200 });
  } catch (err) {
    console.error("flights error", err);
    return Response.json(
      { offers: [], degraded: true, note: "Couldn't reach the flight rail — try again in a moment." },
      { headers: cors, status: 200 }
    );
  }
});
