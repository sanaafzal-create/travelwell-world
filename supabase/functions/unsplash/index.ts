// TravelWell.World — Unsplash image proxy (Edge Function, Deno).
//
// Keeps the Unsplash Access Key server-side (never in the browser bundle or the
// repo). The client calls this with a query (e.g. a destination name); we search
// Unsplash, return one photo's URL + required attribution, and trigger the
// download endpoint per Unsplash's API Guidelines.
//
// Deploy:  supabase functions deploy unsplash
// Secret:  supabase secrets set UNSPLASH_ACCESS_KEY=...   (the Access Key only;
//          the Secret Key is for OAuth and is NOT used here)
//
// Degrades gracefully: with no key / on any error it returns { degraded:true }
// and the client keeps its bundled fallback image — nothing breaks.

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const UTM = "?utm_source=travelwell&utm_medium=referral";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { query, orientation = "landscape" } = (await req.json()) as { query: string; orientation?: string };
    const key = Deno.env.get("UNSPLASH_ACCESS_KEY");
    if (!key || !query) return Response.json({ degraded: true }, { headers: cors, status: 200 });

    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=${orientation}&per_page=1&content_filter=high`;
    const res = await fetch(url, { headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" } });
    if (!res.ok) return Response.json({ degraded: true }, { headers: cors, status: 200 });

    const data = await res.json();
    const photo = data?.results?.[0];
    if (!photo) return Response.json({ photo: null }, { headers: cors, status: 200 });

    // Unsplash API Guideline: trigger the download endpoint when a photo is used.
    if (photo.links?.download_location) {
      fetch(photo.links.download_location, { headers: { Authorization: `Client-ID ${key}` } }).catch(() => {});
    }

    return Response.json(
      {
        photo: {
          url: photo.urls?.raw ?? photo.urls?.regular,
          alt: photo.alt_description ?? query,
          credit: {
            name: photo.user?.name ?? "Unsplash",
            link: (photo.user?.links?.html ?? "https://unsplash.com") + UTM,
          },
        },
      },
      { headers: cors, status: 200 }
    );
  } catch (err) {
    console.error("unsplash error", err);
    return Response.json({ degraded: true }, { headers: cors, status: 200 });
  }
});
