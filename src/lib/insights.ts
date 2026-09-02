/**
 * TravelWell.World — Atlas grounding context.
 *
 * Assembles what Atlas should know about the traveler *right now* so it can walk
 * beside them rather than answer cold: their Travel I.D., their current journey
 * (interests → region → activities → trip), what they've explored but not chosen
 * (from the journey_events log), and the curated "happenings" near where they're
 * looking. Passed as the `context` to the atlas Edge Function.
 *
 * All best-effort: every piece degrades to nothing when signed out / offline, so
 * Atlas simply knows less rather than erroring.
 */
import { getSupabase } from "./supabase";
import { fetchTravelId } from "./travelId";
import { cohortLabel, activityLabel, accessLabel } from "./identity";
import { fetchSignals } from "./signals";
import { useStore } from "@/store/useStore";
import { useCatalog } from "@/store/useCatalog";
import { resolveDestId, type Destination } from "@/data/places";
import { resolveSafety, isoForCountry, stricterZones, fcdoThreshold, fcdoQuote, zoneLvl, type SafetyZone } from "@/data/safety-data";
import { advisoryLinks } from "@/data/advisory-sources";

interface Considered {
  regions: string[];
  interests: string[];
  guides: string[];
  providers: string[];
}

/** Parse the current route into a place anchor, so Atlas knows where they are. */
function hereFrom(path: string | null): { kind: "destination" | "region" | "si"; id: string } | null {
  if (!path) return null;
  const [a, b] = path.replace(/\/+$/, "").split("/").filter(Boolean);
  if (!b) return null;
  // A legacy link still tells Atlas where they actually are.
  if (a === "destination") return { kind: "destination", id: resolveDestId(b) ?? b };
  if (a === "region") return { kind: "region", id: b };
  if (a === "si") return { kind: "si", id: b };
  return null;
}

/**
 * The safety block Atlas is given for the destination in play.
 *
 * ── ATLAS COULD NOT WARN ABOUT A LEVEL IT WAS NEVER GIVEN (2026-08-25) ─────
 * Canon has said since 2026-08-10 that Atlas surfaces the level and then solves
 * — "that area carries a Level 3 for this reason, here is where the risk sits
 * versus where you'd be, and here are three places that give you the same thing
 * at Level 1." The context carried no safety field of any kind, so the rule
 * described behaviour the model had no way to perform. The prompt said "never
 * fabricate a safety fact", which left it correctly silent and no more.
 *
 * Sana asked for exactly this on 2026-08-10: "put the level in that context, and
 * add a rule that Atlas states it the first time a destination comes into play,
 * before it starts building."
 *
 * ── BUILT FROM `resolveSafety`, NOT FROM A SECOND COPY ────────────────────
 * The research library supplied a 545-row per-destination safety file for this.
 * We read our own cascade instead, because `resolveSafety(dest, iso)` IS the
 * canonical country → destination read, and a parallel table would be a second
 * source of truth for the one fact we can least afford to hold twice. It also
 * means the backfill and any advisory move reach Atlas the same day they reach
 * the card, with nothing to re-ingest.
 *
 * ── AND IT IS NEVER TRUNCATED ─────────────────────────────────────────────
 * The library's rule, and it is right: a safety field that degrades gracefully
 * is a safety field that vanishes under load. Everything else in this file is
 * best-effort and sliced to fit; this block is whole or the destination is not
 * described as safe-to-plan at all. `unverified` is carried as itself rather
 * than collapsed to a level, because "we have not checked" and "we checked and
 * it is fine" must never arrive at the model as the same value.
 */
// Exported so it can be checked directly. The rest of this file is only
// observable by driving the app; a safety field is the one part that has to be
// verifiable on its own, without a browser and without a network.
// A zone's restriction in WORDS, never a number. Zones carrying a posture are
// FCDO-transcribed and speak the FCDO's phrase; zones that predate the re-read
// still hold our curated internal ordering, so they speak our label words —
// "Level 3" leaked into Atlas's context here for six days after the card
// stopped printing numbers, which is the same retirement missed on one surface.
const zoneRestriction = (z: SafetyZone): string =>
  z.posture === "all"
    ? "against all travel"
    : z.posture === "all-but-essential"
      ? "against all but essential travel"
      : zoneLvl(z) >= 4
        ? "do not travel (our curated reading; not yet re-read from FCDO text)"
        : "reconsider travel (our curated reading; not yet re-read from FCDO text)";

export function safetyBlockFor(dest: Destination): Record<string, unknown> {
  const iso = isoForCountry(dest.country);
  const s = resolveSafety(dest, iso);
  const quote = fcdoQuote(s);
  // The FCDO first because it is our primary source, but NOT only the FCDO: it
  // publishes nothing for the United Kingdom, and taking `find(fcdo)` alone left
  // London with a level and no advisory to point a traveller at.
  const links = advisoryLinks(dest.country, iso);
  const fcdo = links.find((l) => l.source.id === "fcdo") ?? links[0];
  return {
    destination: dest.name,
    country: dest.country,
    // ── NO NUMBER, PER DAVID'S RULING OF 2026-08-21 ─────────────────────────
    // "We don't post them anymore, we don't book on them or against them
    // anymore … Postures only." This block carried `level: 1–4` for six days;
    // it now carries the posture and the label, which order without being
    // numbered. Atlas quotes words a traveller can check against the advisory
    // link — a number was always one step away from State's retired scale.
    posture: s.unverified
      ? "unverified"
      : s.bookingHold
        ? "no-travel"
        : s.lvl >= 3
          ? "essential-only"
          : "no-restriction",
    label: s.label,
    unverified: Boolean(s.unverified),
    // We hold a level but cannot call it verified — Atlas may act on it and must
    // not present it as confirmed.
    reported: Boolean(s.reported),
    bookingHold: Boolean(s.bookingHold),
    source: s.source,
    // The founder-locked threshold, derived in ONE place (fcdoThreshold) so this
    // block, the refusal screen and the consent gate can never disagree.
    fcdoThreshold: fcdoThreshold(s),
    ...(s.inZone ? { inNamedArea: { name: s.inZone.name, restriction: zoneRestriction(s.inZone) } } : {}),
    // The advisory's OWN words, when the zone was transcribed from FCDO verbatim
    // text. Atlas QUOTES this string or does not use it — the prompt forbids
    // paraphrase, and a null here means "we cannot quote it", which Atlas says.
    ...(quote ? { fcdoArea: quote.area, fcdoVerbatim: quote.text } : {}),
    ...(s.verified ? { fcdoReviewed: s.verified } : {}),
    // The rest of the country's picture, so a no-restriction destination inside
    // a country with held areas can be described accurately rather than flatly.
    ...(stricterZones(s).length
      ? { stricterAreasElsewhereInCountry: stricterZones(s).map((z) => ({ name: z.name, restriction: zoneRestriction(z) })) }
      : {}),
    ...(fcdo ? { advisoryUrl: fcdo.href, advisoryUrlIsDeepLink: fcdo.deep } : {}),
    // The no-booking line is the SIMILAR-OFFER canon (David, 2026-08-23): the
    // block is a safety fact and the alternative is a commercial offer, and
    // they must not arrive as one sentence — Atlas ASKS, and only an explicit
    // yes brings the cousins. This replaced the earlier "alternatives in the
    // same breath" rule for held destinations; same-breath solving remains
    // right for the consent band, where planning is allowed.
    atlasMust: s.unverified
      ? "State plainly that we hold no verified advisory for this destination and point at the official advisory. Do not describe it as safe, and do not plan around a reading you do not have."
      : s.bookingHold
        ? "Say we will not book there, quote the advisory, and STOP — no alternatives in the same message. Then ask whether they would like to see similar places we can book; offer cousins only after an explicit yes."
        : s.lvl >= 3
          ? "State the advisory and the reason the first time this destination comes into play, before building. Say where the risk sits versus where they would be, and offer alternatives in the same breath."
          : "State the advisory once when this destination first comes into play. An absence of an advisory is never a statement that a place is safe.",
  };
}

/** What the traveler viewed but didn't commit to — the considered-not-chosen trail. */
async function summarizeConsidered(
  userId: string,
  heldSIs: string[],
  region: string | null,
  tripNames: Set<string>
): Promise<Considered> {
  const sb = getSupabase();
  const out: Considered = { regions: [], interests: [], guides: [], providers: [] };
  if (!sb) return out;
  try {
    const { data } = await sb
      .from("journey_events")
      .select("kind, entity, entity_id, context")
      .eq("user_id", userId)
      .order("occurred_at", { ascending: false })
      .limit(150);
    const seen = {
      regions: new Set<string>(),
      interests: new Set<string>(),
      guides: new Set<string>(),
      providers: new Set<string>(),
    };
    for (const r of data ?? []) {
      const id = r.entity_id as string | null;
      const ctx = (r.context ?? {}) as { providers?: string[] };
      if (r.kind === "view" && r.entity === "region" && id && id !== region) seen.regions.add(id);
      else if (r.kind === "view" && r.entity === "si" && id && !heldSIs.includes(id)) seen.interests.add(id);
      else if (r.kind === "view" && r.entity === "guide" && id) seen.guides.add(id);
      // Well-browse logs the top provider names it showed → "looked at, didn't add".
      else if (r.kind === "view" && r.entity === "well" && Array.isArray(ctx.providers)) {
        for (const name of ctx.providers) if (!tripNames.has(name)) seen.providers.add(name);
      }
    }
    out.regions = [...seen.regions].slice(0, 6);
    out.interests = [...seen.interests].slice(0, 6);
    out.guides = [...seen.guides].slice(0, 4);
    out.providers = [...seen.providers].slice(0, 6);
  } catch {
    /* ignore — Atlas just knows less */
  }
  return out;
}

export async function buildAtlasContext(): Promise<Record<string, unknown>> {
  const s = useStore.getState();
  const cat = useCatalog.getState();
  const nameOfSI = (id: string) => cat.sis.find((x) => x.id === id)?.name ?? id;
  const nameOfRegion = (code: string) => cat.regions.find((x) => x.code === code)?.name ?? code;

  const here = hereFrom(s.lastPath);
  const month = new Date().getMonth() + 1;
  const tripNames = new Set(s.trip.map((b) => b.name));

  // Run the independent fetches together.
  const [profileRec, considered, signals] = await Promise.all([
    s.user ? fetchTravelId(s.user.id) : Promise.resolve(null),
    s.user
      ? summarizeConsidered(s.user.id, s.journeySIs, s.region, tripNames)
      : Promise.resolve<Considered>({ regions: [], interests: [], guides: [], providers: [] }),
    fetchSignals({
      destination: here?.kind === "destination" ? here.id : null,
      region: s.region ?? (here?.kind === "region" ? here.id : null),
      si: s.journeySIs,
      month,
    }),
  ]);

  const ctx: Record<string, unknown> = {
    interests: s.journeySIs.map((id) => ({ id, name: nameOfSI(id) })),
    region: s.region ? { code: s.region, name: nameOfRegion(s.region) } : null,
    activities: s.journeyActs.length,
    trip: s.trip.slice(0, 8).map((b) => ({ well: b.well, name: b.name, status: b.status })),
    // The true length rides beside the sample: `trip` is capped at 8, and Atlas
    // must never assert a count the context silently cut.
    trip_total: s.trip.length,
  };

  if (here) ctx.viewing = here.kind === "si" ? { kind: "si", name: nameOfSI(here.id) } : here.kind === "region" ? { kind: "region", name: nameOfRegion(here.id) } : here;

  // The destination in play gets its safety block. Deliberately NOT inside the
  // try/catch that guards the rest: everything else here degrades to "Atlas knows
  // less", and a safety read must not be allowed to degrade that way. If the
  // catalogue can't produce the destination we emit nothing rather than a partial
  // block, so Atlas has no half-fact to reason from.
  if (here?.kind === "destination") {
    const dest = Object.values(cat.destinations).flat().find((d) => d.id === here.id);
    if (dest) {
      ctx.safety = safetyBlockFor(dest);
      // ── THE WAREHOUSE, NOT THE SHOP WINDOW (David, 2026-08-23) ──────────
      // The interest page shows twelve jewels for spread; the INVENTORY is the
      // whole jewel list, and Atlas could not reach it — so when a traveller
      // said "snorkeling" and Atlas expanded their vision, every specific thing
      // it named came from the model's world knowledge rather than from what we
      // actually hold and can book. That is the fabrication canon forbids for
      // prices and providers, arriving through the side door of enthusiasm.
      //
      // So the destination in play hands Atlas its FULL jewel inventory —
      // name, interests, Wells — every one an experience someone sells here.
      // Deliberately uncapped: the largest destination carries 38, which is
      // small, and a capped list would recreate the exact "first twelve in
      // file order" failure the shelf just escaped.
      const js = (dest.data?.jewels ?? []) as { name?: string; si?: string | string[]; si_all?: string[]; wells?: string[] }[];
      if (js.length) {
        ctx.jewelsHere = js.map((j) => ({
          name: j.name,
          si: Array.isArray(j.si_all) && j.si_all.length ? j.si_all : (Array.isArray(j.si) ? j.si : j.si ? [j.si] : []),
          ...(Array.isArray(j.wells) && j.wells.length ? { wells: j.wells } : {}),
        }));
      }
    }
  }

  if (profileRec) {
    ctx.profile = {
      name: profileRec.display_name ?? undefined,
      ageRange: profileRec.age_range ? cohortLabel(profileRec.age_range) : undefined,
      dream: profileRec.trip_intent ?? undefined,
      dietary: profileRec.dietary ?? undefined,
      // Safer-Informed overlay — BOTH sides. Atlas builds AROUND these, never
      // hands the traveler limitations; a stated factor overrides the age default.
      pace: activityLabel(profileRec.activity_level) ?? undefined,
      access: profileRec.access_needs?.length ? profileRec.access_needs.map(accessLabel) : undefined,
      ableTo: profileRec.capabilities ?? undefined,
      planAround: profileRec.accessibility ?? undefined,
      // Budget-by-Well, so Atlas can shape suggestions to what they'll spend.
      budget: profileRec.budget_ranges && Object.keys(profileRec.budget_ranges).length ? profileRec.budget_ranges : undefined,
    };
  }

  if (considered.regions.length || considered.interests.length || considered.guides.length || considered.providers.length) {
    ctx.considered = {
      regions: considered.regions.map(nameOfRegion),
      interests: considered.interests.map(nameOfSI),
      guides: considered.guides,
      providers: considered.providers,
    };
  }

  // The curated "happenings" Atlas may speak — never invents beyond these.
  //
  // `startsOn` rides along so Atlas can tell a DATED event from a SLOT-ONLY
  // one. Two-thirds of the event inventory has no announced date, only a
  // season — and without this field the temporal rule made Atlas either
  // silent about all of them or (worse) confident about dates it never had.
  // The library asked what Atlas should say for those; the answer needs the
  // distinction to arrive in the context first.
  ctx.happenings = signals.slice(0, 6).map((sig) => ({
    title: sig.title,
    blurb: sig.blurb,
    href: sig.href,
    season: sig.season,
    horizon: sig.horizon,
    ...(sig.startsOn ? { startsOn: sig.startsOn } : { dateAnnounced: false }),
  }));
  // Same rule as `trip_total`: the cap is 6, so the true count travels with it.
  ctx.happenings_total = signals.length;

  return ctx;
}
