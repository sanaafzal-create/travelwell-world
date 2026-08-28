/**
 * THE CONSENT GATE — the "against all but essential travel" screen.
 *
 * David's design, 2026-08-15, rebuilt to the founder-locked thresholds of
 * 2026-08-23: "If it's the level under it — essential travel only is advised —
 * they get shown the entire safety notice, verbatim, and have to check the box:
 * I have read the complete safety advisory and I choose to continue my travel
 * to this destination. Informed traveler."
 *
 * ── The rule the screen exists to satisfy ──────────────────────────────────
 * A few sentences here are ours — the framing line at the top, the question at
 * the bottom, the insurance line. Everything factual is quoted from the
 * advisory. That is the whole safety property: **we cannot get a quotation
 * wrong, and we are not making a claim we would have to defend.**
 *
 * ── Why it renders from data instead of from written screens ───────────────
 * The four screens arrived as prose, carefully assembled, by people who knew
 * the rule; checked against the source's own feed, two were wrong (invented
 * sentences, a superseded advisory). Hand-transcription is not a reliable way
 * to quote, and a screen written per destination goes stale the moment an
 * advisory moves. So the advisory words come from the structured zone rows on
 * the country record — transcribed once from FCDO verbatim text, joined by
 * exact name — and when a source moves, one row changes and every screen
 * follows.
 *
 * ── The acknowledgement is a TICK, not a button (2026-08-24) ────────────────
 * The v2 screen showed both buttons with nothing between the advisory and the
 * sale. Now Continue is INERT until the box is ticked, and the record stores
 * the statement itself word-for-word — the box label is attorney-pending, so
 * it WILL change, and a log storing `consented = true` proves nothing after
 * the label is edited. (BOX LABELS: David's words, attorney-pending on exact
 * wording.)
 *
 * ── No retired scale ────────────────────────────────────────────────────────
 * This screen printed "Level 3 of 4" until 2026-08-24. The number is retired
 * (David, 2026-08-21): the band speaks the advisory's own threshold phrase,
 * and colour still comes from the internal ordering, which is ours.
 *
 * ── One language rule (S-11) ────────────────────────────────────────────────
 * The advisory text renders in ENGLISH, always — it is a quotation, and a
 * translation of a quotation is a paraphrase wearing quotation marks. A locale
 * may explain around it; it must never replace it.
 *
 * ── The three design points, all load-bearing ──────────────────────────────
 * · The ALTERNATIVES button gets focus. Equal size with continue pre-focused
 *   is still a nudge, just a quieter one.
 * · The threshold appears in WORDS as well as colour, so it survives greyscale,
 *   colour-blindness and a screen reader.
 * · Nothing is pre-ticked, and there is no reconsider loop — no dollar figures,
 *   no second screen, no scare-and-reconvert. Declining is a complete answer.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { Button, Eyebrow } from "@/components/ui/primitives";
import {
  SAFE_HEADER_COLOR, stricterZones, fcdoQuote, fcdoThreshold, THRESHOLD_TEXT,
  type SafetyInfo, ZONE_POSTURE_TEXT,
} from "@/data/safety-data";
import { advisoryLinks } from "@/data/advisory-sources";
import { getEmergencyNumbers, UNIVERSAL_EMERGENCY } from "@/data/emergency-numbers";

/** The consent statement — David's words, 2026-08-23. ATTORNEY-PENDING on exact
 *  wording; the record stores whatever this said on the day, so an edit here
 *  never orphans an old record. */
export const CONSENT_STATEMENT =
  "I have read the complete safety advisory and I choose to continue my travel to this destination.";

export interface AdvisoryConsent {
  destId: string;
  destName: string;
  country: string;
  /** Internal ordering only — never rendered. Kept because an old record whose
   *  level is absent and one whose level was never held must stay different. */
  level: number;
  /** WHICH threshold applied — the founder-locked line the decision crossed. */
  threshold: string;
  /** The named FCDO area, when the destination resolved into one. */
  fcdoArea: string | null;
  /** The exact advisory text shown, verbatim — null when we held none to show,
   *  which is itself a fact the record keeps. */
  advisoryText: string | null;
  advisoryUrl: string | null;
  /** The statement beside the ticked box, word-for-word as it read that day. */
  statement: string;
  /** The advisory the traveller was actually shown, by its review date.
   *  A consent recorded against an advisory that has since moved is not consent
   *  to the current one, and this is what makes that checkable later. */
  advisoryPublished: string | null;
  decision: "continued" | "alternatives" | "acknowledged-hold";
  at: string;
}

const listOf = (xs: string[]): string =>
  xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;

export function ConsentGate({
  dest, safety, iso, onDecision,
}: {
  dest: { id: string; name: string; country: string };
  safety: SafetyInfo;
  iso: string | null;
  onDecision: (c: AdvisoryConsent) => void;
}) {
  const alternativesRef = useRef<HTMLButtonElement>(null);
  // Focus the alternatives button, not continue. Done on mount rather than with
  // autoFocus so it survives the card mounting inside an already-scrolled page.
  useEffect(() => { alternativesRef.current?.focus(); }, []);
  // NOTHING PRE-TICKED. Continue is inert until this is true — the tick is the
  // acknowledgement, and a button that works without it is the v2 defect back.
  const [acknowledged, setAcknowledged] = useState(false);

  const quote = fcdoQuote(safety);
  const threshold = fcdoThreshold(safety);
  const doNotTravel = stricterZones(safety).filter((z) => z.lvl === 4);
  const local = iso ? getEmergencyNumbers(iso) : null;
  const fcdoLink = advisoryLinks(dest.country, iso).find((l) => l.source.id === "fcdo");

  const record = (decision: AdvisoryConsent["decision"]): AdvisoryConsent => ({
    destId: dest.id, destName: dest.name, country: dest.country,
    level: safety.lvl,
    threshold,
    fcdoArea: quote?.area ?? safety.inZone?.name ?? null,
    advisoryText: quote?.text ?? null,
    advisoryUrl: fcdoLink?.href ?? null,
    statement: decision === "continued" ? CONSENT_STATEMENT : "",
    // The FCDO page date when the row carries one; null is a fact (we held
    // none), distinguishable from a date we failed to record.
    advisoryPublished: safety.verified ?? null,
    decision, at: new Date().toISOString(),
  });

  return (
    <div className="container" style={{ padding: "72px 0", maxWidth: 720 }}>
      <div className="card l3" style={{ padding: 0, overflow: "hidden" }}>
        {/* OURS — one of the sentences on this screen we wrote. */}
        <div className="l3__framing">
          <Eyebrow>Before you book</Eyebrow>
          <p>
            TravelWell shows every traveller the official travel advisory for their
            destination, in full and unchanged, so the decision is theirs to make.
          </p>
        </div>

        {/* The threshold, in words as well as colour. NO NUMBER — the scale is
            retired; colour keys off the internal ordering, which is ours. */}
        <div className="l3__level" style={{ background: SAFE_HEADER_COLOR[safety.lvl] }}>
          <span>
            <span className="l3__country">{dest.country.toUpperCase()} TRAVEL ADVISORY</span>
            <strong className="l3__lvlword">
              {quote
                ? `The FCDO ${THRESHOLD_TEXT[threshold]} where ${dest.name} sits`
                : safety.label}
            </strong>
          </span>
        </div>

        <div className="l3__body">
          {safety.inZone && (
            <p className="l3__zone">
              <Icon name="pin" small /> {dest.name} sits in <b>{safety.inZone.name}</b>, which the
              {safety.inZone.posture ? ` ${ZONE_POSTURE_TEXT[safety.inZone.posture]} to` : ` advisory restricts for`} this area.
              {safety.inZone.except?.length ? ` The exceptions are ${listOf(safety.inZone.except)}.` : ""}
            </p>
          )}

          {/* Areas the advisory holds at against-all-travel — structured, from
              the country row. Naming them tells a traveller where not to go AND
              that we don't sell those. */}
          {doNotTravel.length > 0 && (
            <section className="l3__dnt">
              <h2>Against all travel &mdash; areas the advisory excludes</h2>
              <ul>
                {doNotTravel.map((z) => (
                  <li key={z.name}>
                    <b>{z.name}</b>
                    {z.except?.length ? <> &mdash; except {listOf(z.except)}, which {z.except.length > 1 ? "sit" : "sits"} at the country level</> : null}
                    {z.note ? <span className="l3__dntnote"> &middot; {z.note}</span> : null}
                  </li>
                ))}
              </ul>
              <p className="l3__dntfoot">We don&rsquo;t sell trips into any area listed above.</p>
            </section>
          )}

          {/* THE ADVISORY'S OWN WORDS — quoted, never summarised, and rendered
              in English in every locale: a translated quotation is a paraphrase
              wearing quotation marks. When we hold no verbatim text, the screen
              says so plainly and points at the source — summarising the advisory
              ourselves to fill the gap is the single thing this screen exists
              to prevent. */}
          <section className="l3__quote">
            <h2>What the advisory says, in its own words</h2>
            {quote ? (
              <>
                {/* quote.text begins "FCDO advises…" — the attribution is part
                    of the transcribed sentence, so nothing is prefixed here. */}
                <blockquote className="l3__verbatim">{quote.text}</blockquote>
                {fcdoLink && (
                  <p className="l3__nosource">
                    Read the advisory in full before you decide &mdash; any part of it may be
                    the thing that changes your mind.{" "}
                    <a href={fcdoLink.href} target="_blank" rel="noopener noreferrer">Open the FCDO advisory <Icon name="arrow" small /></a>
                  </p>
                )}
              </>
            ) : (
              <p className="l3__nosource">
                We don&rsquo;t hold the advisory text for {dest.country} on file, so there is
                nothing here we can quote to you directly. Read the full advisory at the
                source before you decide &mdash; any part of it may be the thing that
                changes your mind.
                {fcdoLink && (
                  <> <a href={fcdoLink.href} target="_blank" rel="noopener noreferrer">Open the FCDO advisory <Icon name="arrow" small /></a></>
                )}
              </p>
            )}
          </section>

          {/* OURS, and deliberately flat — states a fact, makes no claim about
              what any policy does. This threshold is where standard cover
              commonly begins to exclude advisory-related claims, which is a
              financial fact a traveller wants before booking rather than after. */}
          <p className="l3__insurance">
            <Icon name="info" small /> Many travel insurance policies treat a destination under
            an advisory like this one differently. Worth checking whether yours still covers you.
          </p>

          {local && (
            <p className="l3__emergency">
              <Icon name="phone" small /> <b>Emergency in {dest.country}:</b>{" "}
              <a href={`tel:${local.emergency || UNIVERSAL_EMERGENCY}`}>{local.emergency || UNIVERSAL_EMERGENCY}</a>
              {local.emergency && local.emergency !== UNIVERSAL_EMERGENCY && (
                <> &middot; <a href={`tel:${UNIVERSAL_EMERGENCY}`}>{UNIVERSAL_EMERGENCY}</a></>
              )}
            </p>
          )}
        </div>

        {/* OURS — the acknowledgement and the choice. The tick sits BETWEEN the
            advisory and the sale; Continue without it is the defect this screen
            was rebuilt to remove. */}
        <div className="l3__choice">
          <label className="l3__ack">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
            />
            <span>{CONSENT_STATEMENT}</span>
          </label>
          <p className="l3__question">Would you like to continue with this booking, or see alternatives?</p>
          <div className="l3__buttons">
            <Button ref={alternativesRef} onClick={() => onDecision(record("alternatives"))}>
              <Icon name="sparkles" small /> Show me alternatives
            </Button>
            <Button variant="secondary" disabled={!acknowledged} onClick={() => onDecision(record("continued"))}>
              Continue with this booking
            </Button>
          </div>
          <p className="l3__readmore">
            Or <Link to={`/destination/${dest.id}`}>read more about {dest.name}</Link> first.
          </p>
        </div>
      </div>
    </div>
  );
}
