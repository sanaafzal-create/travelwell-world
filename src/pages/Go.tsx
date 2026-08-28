import { useState } from "react";
import { Link, useSearchParams, useNavigate, Navigate } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { useStore } from "@/store/useStore";
import { useWellById, useProviders, useDestinations, useCatalogSettled } from "@/store/useCatalog";
import { Eyebrow, Button, Ftc } from "@/components/ui/primitives";
import { resolveDestId } from "@/data/places";
import { resolveSafety, isoForCountry, fcdoThreshold, fcdoQuote, THRESHOLD_TEXT } from "@/data/safety-data";
import { ConsentGate, type AdvisoryConsent } from "@/components/safety/ConsentGate";
import { recordAdvisoryConsent } from "@/lib/consent";
import { advisoryLinks } from "@/data/advisory-sources";

/** The refusal acknowledgement — David's words, 2026-08-23. ATTORNEY-PENDING on
 *  exact wording; the record stores what it said on the day. */
const REFUSAL_STATEMENT = "I have read and understood this complete safety advisory.";

/**
 * Affiliate redirect interstitial — straight handoff + "mark as booked" return.
 *
 * AND THE SAFETY CHOKEPOINT. `/go` is the single door out to a partner, which
 * makes it the one place a safety rule can be enforced once instead of on every
 * booking control. Gating buttons does not hold: they multiply, and one gets
 * missed — which is exactly what happened with Level 4, where the safety card
 * said "not bookable" while every Book It button below it stayed live.
 *
 * `?dest=<id>` carries WHICH destination is being booked. Without it this page
 * knows a provider and a Well and nothing about where in the world the traveller
 * is going, so it cannot look up an advisory even in principle.
 *
 * HONEST LIMIT, stated because it matters more than the code: no caller supplies
 * `dest` yet. `WellsSurface` and `Providers` are Well- and region-scoped and
 * genuinely don't know a destination, and the destination page's Book It opens
 * Atlas rather than routing through here. So today this is a capability with one
 * live consumer — a hand-built or shared link — not yet a gate across the
 * product. Making it one means deciding whether destination-originated bookings
 * should route through `/go`, which is a product call, not plumbing.
 *
 * TWO RULES ARE ENFORCED HERE, and the difference between them is the point —
 * the two thresholds, founder-locked (David, 2026-08-23). AGAINST ALL TRAVEL
 * NEVER BOOKS — no consent override, no way to agree past it; the advisory
 * shown verbatim, two boxes, nothing sold. AGAINST ALL BUT ESSENTIAL TRAVEL
 * BOOKS ONLY AFTER AN INFORMED CHOICE: the traveller is shown the advisory in
 * its own words, ticks the acknowledgement, and picks — with the alternatives
 * option holding focus. One is a refusal, the other is a gate; conflating them
 * would either sell a held trip or refuse a bookable one.
 */
export default function Go() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { addToTrip, openPanel } = useStore();
  const destinations = useDestinations();
  const toParam = params.get("to");
  const to = toParam ?? "";
  const wellId = params.get("well") || "stay";
  const well = useWellById(wellId);
  // Real affiliate redirect when the provider has a booking URL (David's intel);
  // otherwise Atlas offers to connect the traveler directly — a working handoff,
  // never a dead end.
  const providers = useProviders();
  const bookingUrl = (providers[wellId] || []).find((p) => p.name === to)?.bookingUrl;

  // Resolve the destination if one was passed. Legacy slugs resolve too, since a
  // shared or saved link may carry a pre-rename id.
  const destId = resolveDestId(params.get("dest") || undefined);
  const dest = destId
    ? Object.values(destinations).flat().find((d) => d.id === destId)
    : undefined;
  const safety = dest ? resolveSafety(dest, isoForCountry(dest.country)) : null;
  const catalogSettled = useCatalogSettled();
  // Above the early returns so hook order is stable whichever branch renders —
  // the same crash this file already carries a comment about.
  const [consented, setConsented] = useState(false);
  // The refusal screen's first box. Ticking it is recorded; the second box
  // (similar options) stays inert until it is ticked — the block is a safety
  // fact and the alternative is a commercial offer, and they must not arrive
  // as one gesture.
  const [ackHold, setAckHold] = useState(false);

  // GUARD: /go is a mid-booking handoff — only meaningful when a provider was
  // passed in. Reached cold (a restored tab, a bare /go URL) it has no partner to
  // hand off to, so it must not strand the visitor on an orphaned "Continuing to
  // our partner" screen. Home instead.
  //
  // BELOW THE HOOKS DELIBERATELY. This return used to sit above `useWellById`,
  // `useProviders` and now `useDestinations` — so a render that took it called
  // three fewer hooks than one that didn't. That is stable while the URL never
  // changes under a mounted component and breaks the moment it does (navigating
  // /go?to=X → /go), which is React's "rendered fewer hooks than expected" crash.
  // Latent, not theoretical, and cheaper to fix while the file is open.
  if (!toParam) return <Navigate to="/" replace />;

  // A DESTINATION WE CANNOT RESOLVE MUST NOT HAND OFF (2026-08-28). The caller
  // named a destination, which means this booking HAS an advisory to check —
  // and until the catalog answers, or if it answers without that row, we cannot
  // check it. Proceeding anyway is the silent fail-open: the bundle carries 43
  // rows and the database carries every ingested one, so offline or pre-
  // hydration, /go?dest=<ingested id> found nothing, `safety` stayed null, and
  // BOTH gates were skipped — a held destination handed straight to a partner.
  // Of the two available mistakes, refusing a bookable place is recoverable and
  // selling a held one is not.
  if (destId && !dest) {
    return (
      <div className="container" style={{ padding: "96px 0", maxWidth: 560 }}>
        <div className="card" style={{ padding: 32 }}>
          <Eyebrow>{catalogSettled ? "We’ve stopped this booking" : "One moment"}</Eyebrow>
          <h1 className="t-h2" style={{ marginTop: 8 }}>
            {catalogSettled
              ? "We can’t check the travel advisory for this destination right now."
              : "Checking the travel advisory…"}
          </h1>
          <p className="t-body" style={{ marginTop: 12 }}>
            {catalogSettled
              ? "This booking names a destination we couldn’t look up, so we can’t confirm what its advisory says — and we don’t hand a booking to a partner without that check. Try again in a moment, or from the destination’s own page."
              : "We’re looking up the official advisory for this destination before handing you to our partner."}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
            <Link className="btn btn-primary" to="/">Back to TravelWell <Icon name="arrow" small /></Link>
          </div>
        </div>
      </div>
    );
  }

  // AGAINST ALL TRAVEL NEVER BOOKS. Refused here as well as at the button,
  // deliberately — the button block is the first line of defence and this is the
  // one that holds when a link is shared, restored from a tab, or reached by a
  // path nobody predicted. Belt and braces is the correct posture for the rule
  // David called absolute.
  //
  // THE REFUSAL SCREEN (founder-locked, 2026-08-23): the advisory shown verbatim
  // when we hold it, in the advisory's own words never a number, and TWO boxes —
  // "read and understood", then "show me similar options", the second inert
  // until the first is ticked. The block is a safety fact and the alternative is
  // a commercial offer, and they must not arrive as one sentence. Nothing sold.
  // The advisory text renders in English in every locale — a translated
  // quotation is a paraphrase wearing quotation marks.
  if (safety?.bookingHold) {
    const quote = fcdoQuote(safety);
    const fcdoLink = advisoryLinks(dest!.country, isoForCountry(dest!.country)).find((l) => l.source.id === "fcdo");
    return (
      <div className="container" style={{ padding: "96px 0", maxWidth: 620 }}>
        <div className="card" style={{ padding: 32 }}>
          <Eyebrow>We&rsquo;ve stopped this booking</Eyebrow>
          <h1 className="t-h2" style={{ marginTop: 8 }}>
            {quote
              ? <>The advisory {THRESHOLD_TEXT["no-travel"]} where {dest!.name} sits.</>
              : <>{dest!.name} is under an advisory we won&rsquo;t book against.</>}
          </h1>
          <p className="t-body" style={{ marginTop: 12 }}>
            We don&rsquo;t sell trips to a place while an official advisory says do not
            travel there, and there&rsquo;s no way to agree past this one.
          </p>
          {quote ? (
            <blockquote className="l3__verbatim" style={{ marginTop: 16 }}>{quote.text}</blockquote>
          ) : (
            <p className="t-body" style={{ marginTop: 12 }}>
              <b>{safety.label}.</b> {safety.summary}
            </p>
          )}
          <p className="t-body" style={{ marginTop: 12, color: "var(--muted-foreground)" }}>
            The page stays up so you can read the situation for yourself
            {fcdoLink && (
              <>
                , including the{" "}
                <a href={fcdoLink.href} target="_blank" rel="noopener noreferrer">official advisory</a>
              </>
            )}
            {" "}and what it says about specific areas.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
            <label className="l3__ack">
              <input
                type="checkbox"
                checked={ackHold}
                onChange={(e) => {
                  setAckHold(e.target.checked);
                  // Recorded on the tick itself — the acknowledgement is the
                  // event, whatever they do next. Not awaited: a safety
                  // acknowledgement never waits on a network round-trip.
                  if (e.target.checked) {
                    void recordAdvisoryConsent({
                      destId: dest!.id, destName: dest!.name, country: dest!.country,
                      level: safety.lvl, threshold: "no-travel",
                      fcdoArea: quote?.area ?? safety.inZone?.name ?? null,
                      advisoryText: quote?.text ?? null,
                      advisoryUrl: fcdoLink?.href ?? null,
                      statement: REFUSAL_STATEMENT,
                      advisoryPublished: safety.verified ?? null,
                      decision: "acknowledged-hold", at: new Date().toISOString(),
                    });
                  }
                }}
              />
              <span>{REFUSAL_STATEMENT}</span>
            </label>
            <label className="l3__ack" aria-disabled={!ackHold}>
              <input
                type="checkbox"
                checked={false}
                disabled={!ackHold}
                onChange={() => { openPanel("concierge"); navigate(`/destination/${dest!.id}`); }}
              />
              <span>I would like to see similar options in an area we can book.</span>
            </label>
            <Link className="btn btn-secondary" to={`/destination/${dest!.id}`}>
              Read more about {dest!.name} <Icon name="arrow" small />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // AGAINST ALL BUT ESSENTIAL TRAVEL — the consent gate. Shown once per visit to
  // this handoff; a decision does not persist across a fresh arrival, because an
  // advisory can move between one booking and the next and stale consent is not
  // consent. The condition is the derived THRESHOLD, not a number — same
  // derivation the refusal, the card and Atlas's context read.
  if (safety && fcdoThreshold(safety) === "essential-only" && !consented) {
    return (
      <ConsentGate
        dest={dest!}
        safety={safety}
        iso={isoForCountry(dest!.country)}
        onDecision={(c: AdvisoryConsent) => {
          // RECORDED BOTH WAYS, not only on the decline. A record that exists
          // only when someone declines tells you nothing about the ones who
          // continued — which is the half you would actually need.
          //
          // `void` because the promise is deliberately not awaited: a traveller
          // must never wait on a network round-trip to act on a safety decision
          // they have already made. It writes locally before it touches the
          // network and never rejects, so nothing is lost by not waiting.
          void recordAdvisoryConsent(c);
          if (c.decision === "alternatives") { openPanel("concierge"); navigate(`/destination/${dest!.id}`); }
          else setConsented(true);
        }}
      />
    );
  }

  return (
    <div className="container" style={{ padding: "96px 0", maxWidth: 540 }}>
      <div className="card" style={{ padding: 32, textAlign: "center" }}>
        <div className="icon-chip" style={{ margin: "0 auto 16px", width: 56, height: 56 }}><Icon name="arrow" /></div>
        <Eyebrow>Heading off-site</Eyebrow>
        <h1 className="t-h2" style={{ marginTop: 8 }}>Continuing to {to}</h1>
        <p className="t-body" style={{ color: "var(--muted-foreground)", marginTop: 10 }}>
          You're being handed to a disclosed affiliate partner to complete this booking. When you're done, come back and mark it as booked — we'll add it to your trip.
        </p>
        <Ftc style={{ justifyContent: "center", marginTop: 18 }}>
          This is an affiliate link. We may earn a commission at no extra cost to you.
        </Ftc>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
          {/* `sponsored` is not optional decoration. The page says it in words a
              few lines up — "This is an affiliate link" — and Google's link
              policy requires monetised links to say the same thing in markup.
              Declaring it in prose and not in `rel` is the shape of an
              undisclosed link scheme even when the intent is the opposite. */}
          {bookingUrl ? (
            <a className="btn btn-primary" href={bookingUrl} target="_blank" rel="sponsored nofollow noopener noreferrer">Continue to {to} <Icon name="arrow" small /></a>
          ) : (
            <Button onClick={() => openPanel("concierge")}><Icon name="sparkles" small /> Ask Atlas to connect you with {to}</Button>
          )}
          <Button variant="secondary" onClick={() => { addToTrip({ well: wellId, icon: well?.icon || "compass", name: to, meta: `${well?.name || "Booked"} · affiliate`, status: "confirmed" }); navigate("/itinerary"); }}>
            <Icon name="check" small /> I booked it — add to my trip
          </Button>
          <Button variant="ghost" onClick={() => navigate(-1)}>Cancel, take me back</Button>
        </div>
      </div>
    </div>
  );
}
