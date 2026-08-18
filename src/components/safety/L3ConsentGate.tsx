/**
 * THE LEVEL 3 CONSENT GATE.
 *
 * David's design, 2026-08-15, with one change: nothing on this screen is
 * hand-transcribed.
 *
 * ── The rule the screen exists to satisfy ──────────────────────────────────
 * Two sentences here are ours — the framing line at the top and the question at
 * the bottom — plus the insurance line, which is marked as ours where it sits.
 * Everything factual is quoted from the advisory. That is the whole safety
 * property: **we cannot get a quotation wrong, and we are not making a claim we
 * would have to defend.**
 *
 * ── Why it renders from data instead of from written screens ───────────────
 * The four screens arrived as prose, carefully assembled, by people who knew the
 * rule. Checked against State's own feed, two were wrong: three of four Cartagena
 * country-summary lines were paraphrase rather than quotation ("In some places,
 * organized crime is rampant" appears nowhere in State's text), and the Rwanda
 * framing described a superseded version of the advisory — Ebola in Ituri, a
 * level "raised from 2 to 3" — where the current one says the level did not
 * change and names crime and unrest.
 *
 * Neither was carelessness. Hand-transcription is not a reliable way to quote,
 * and a screen written per destination goes stale the moment an advisory moves,
 * silently, one destination at a time. So the advisory text comes from the stored
 * State snapshot, the Do-Not-Travel areas come from the structured `zones[]` on
 * the country row, and the emergency numbers come from the emergency-numbers
 * data. Nobody retypes an advisory again, and when a source moves, one row
 * changes and every screen follows.
 *
 * ── The three design points, all load-bearing ──────────────────────────────
 * · The ALTERNATIVES button gets focus. Equal size with continue pre-focused is
 *   still a nudge, just a quieter one.
 * · The level appears in WORDS as well as colour, so it survives greyscale,
 *   colour-blindness and a screen reader.
 * · Nothing is pre-selected, and there is no reconsider loop — no dollar figures,
 *   no second screen, no scare-and-reconvert. Declining is a complete answer.
 */
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { Button, Eyebrow } from "@/components/ui/primitives";
import { SAFE_HEADER_COLOR, stricterZones, type SafetyInfo } from "@/data/safety-data";
import { stateAdvisoryText, advisoryLinks } from "@/data/advisory-sources";
import { getEmergencyNumbers, UNIVERSAL_EMERGENCY } from "@/data/emergency-numbers";

export interface AdvisoryConsent {
  destId: string;
  destName: string;
  country: string;
  level: number;
  /** The advisory the traveller was actually shown, by its publication date.
   *  A consent recorded against an advisory that has since moved is not consent
   *  to the current one, and this is what makes that checkable later. */
  advisoryPublished: string | null;
  decision: "continued" | "alternatives";
  at: string;
}

const listOf = (xs: string[]): string =>
  xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;

export function L3ConsentGate({
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

  const state = stateAdvisoryText(dest.country);
  const doNotTravel = stricterZones(safety).filter((z) => z.lvl === 4);
  const local = iso ? getEmergencyNumbers(iso) : null;
  const stateLink = advisoryLinks(dest.country, iso).find((l) => l.source.id === "state");

  const record = (decision: AdvisoryConsent["decision"]): AdvisoryConsent => ({
    destId: dest.id, destName: dest.name, country: dest.country,
    level: safety.lvl, advisoryPublished: state?.published ?? null,
    decision, at: new Date().toISOString(),
  });

  return (
    <div className="container" style={{ padding: "72px 0", maxWidth: 720 }}>
      <div className="card l3" style={{ padding: 0, overflow: "hidden" }}>
        {/* OURS — one of the two sentences on this screen we wrote. */}
        <div className="l3__framing">
          <Eyebrow>Before you book</Eyebrow>
          <p>
            TravelWell shows every traveller the Level 1 through Level 4 travel advisory from
            the US State Department, so you can make your own informed decision about your
            travel plans.
          </p>
        </div>

        {/* The level, in words as well as colour. */}
        <div className="l3__level" style={{ background: SAFE_HEADER_COLOR[safety.lvl] }}>
          <span className="l3__lvlnum" aria-hidden="true">{safety.lvl}</span>
          <span>
            <span className="l3__country">{dest.country.toUpperCase()} TRAVEL ADVISORY</span>
            <strong className="l3__lvlword">Level {safety.lvl} of 4 &mdash; {safety.label}</strong>
            {state?.published && <span className="l3__updated">Updated {state.published}</span>}
          </span>
        </div>

        <div className="l3__body">
          {safety.inZone && (
            <p className="l3__zone">
              <Icon name="pin" small /> {dest.name} sits in <b>{safety.inZone.name}</b>, which the
              advisory carries at Level {safety.inZone.lvl}.
              {safety.inZone.except?.length ? ` The exceptions are ${listOf(safety.inZone.except)}.` : ""}
            </p>
          )}

          {/* DO NOT TRAVEL areas — structured, from the country row. Naming them
              tells a traveller where not to go AND that we don't sell those. */}
          {doNotTravel.length > 0 && (
            <section className="l3__dnt">
              <h2>Do Not Travel &mdash; areas the advisory excludes</h2>
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

          {/* THE ADVISORY'S OWN WORDS. Quoted in full, not summarised. */}
          <section className="l3__quote">
            <h2>What the advisory says, in its own words</h2>
            {state ? (
              <>
                {/* tabIndex + role so a keyboard-only reader can scroll it. axe
                    caught this and it is not a technicality: the block scrolls,
                    and without focus a keyboard user cannot reach the rest of the
                    advisory they are being asked to consent to. */}
                <blockquote tabIndex={0} role="region" aria-label={`${dest.country} travel advisory, in the words of the US Department of State`}>
                  {state.summary}
                </blockquote>
                <p className="l3__attrib">
                  US Department of State, {dest.country} Travel Advisory
                  {state.published ? `, published ${state.published}` : ""}.
                  {stateLink && (
                    <> <a href={stateLink.href} target="_blank" rel="noopener noreferrer">Read the full advisory <Icon name="arrow" small /></a></>
                  )}
                </p>
              </>
            ) : (
              // No stored text is a real state, not an edge case, and it must not
              // be papered over with a summary of our own — that is the one thing
              // this screen exists to avoid.
              <p className="l3__nosource">
                We don&rsquo;t hold the advisory text for {dest.country} on file, so there is
                nothing here we can quote to you directly. Read it at the source before you
                decide.
                {stateLink && (
                  <> <a href={stateLink.href} target="_blank" rel="noopener noreferrer">Open the advisory <Icon name="arrow" small /></a></>
                )}
              </p>
            )}
          </section>

          {/* OURS, and deliberately flat — states a fact, makes no claim about
              what any policy does. Level 3 is the threshold where standard cover
              commonly begins to exclude advisory-related claims, which is a
              financial fact a traveller wants before booking rather than after. */}
          <p className="l3__insurance">
            <Icon name="info" small /> Many travel insurance policies treat Level 3 differently.
            Worth checking whether yours still covers you.
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

        {/* OURS — the second of the two sentences. */}
        <div className="l3__choice">
          <p className="l3__question">Would you like to continue with this booking, or see alternatives?</p>
          <div className="l3__buttons">
            <Button ref={alternativesRef} onClick={() => onDecision(record("alternatives"))}>
              <Icon name="sparkles" small /> Show me alternatives
            </Button>
            <Button variant="secondary" onClick={() => onDecision(record("continued"))}>
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
