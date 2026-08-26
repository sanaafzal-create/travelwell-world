import { Link, useParams } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { REGION_SI, taglineSubject, type Region, type SiData } from "@/data/taxonomy";
import { BackBar } from "@/components/shell/BackBar";
import { Tagline } from "@/components/ui/primitives";
import { siJsonLd, useJsonLd } from "@/lib/jsonld";
import { jewelsForSi, destinationsBehind, type PlacedJewel } from "@/lib/jewels";
import { type Provider, type Activity, providerDesc } from "@/data/places";
import { siImg, regionImg } from "@/lib/images";
import { useSiImage } from "@/lib/unsplash";
import { useStore, MAX_SIS } from "@/store/useStore";
import { SiPickBar } from "@/components/ui/SiPickBar";
import { useSpecialInterests, useActivities, useRegions, useProviders, useWells, useSiCount, useDestinations } from "@/store/useCatalog";
import { cx } from "@/lib/utils";

/** Per-SI editorial copy — mirrors the design prototype's EDITORIAL map. */
const EDITORIAL: Record<string, { promise: string; intro: string[] }> = {
  safari: {
    promise: "The wild, on its own terms — and you, right there in it.",
    intro: [
      "There is a moment, just after dawn, when the plains exhale. The light goes gold, a lion calls somewhere you can't see, and the whole continent feels awake at once. A safari isn't a holiday so much as a remembering — of how small and how lucky we are.",
      "We pair you with camps that sit lightly on the land and guides who read it like a book. Whether it's your first game drive or your fortieth, we build the days around the animals' rhythm, not a schedule.",
    ],
  },
  romance: {
    promise: "Time that belongs to no one but the two of you.",
    intro: [
      "The best romantic trips aren't about grand gestures — they're about uninterrupted time. A long dinner with nowhere to be. A morning you don't set an alarm for. A view you both go quiet in front of.",
      "We design around the two of you: where you'll stay, what you'll taste, the moments worth dressing up for and the ones worth staying in. You bring the company; we'll handle the rest.",
    ],
  },
  culinary: {
    promise: "A table worth the flight — and the stories around it.",
    intro: [
      "Some trips you remember by what you saw. These you remember by what you ate, and who you ate it with. The market at opening. The grandmother's recipe. The tasting menu that took four hours and felt like one.",
      "We route you to the tables that matter — the famous and the hidden — and to the people behind them. Eat-Well does the booking; you do the savoring.",
    ],
  },
  ocean: {
    promise: "The open water, and everything alive beneath it.",
    intro: [
      "The ocean resets something in us. We chase the next set, the clearest reef, the quietest cove — and the meals that taste better with salt still on your skin.",
      "From liveaboards to barefoot beach resorts, we match the water to your mood and the season to the swell.",
    ],
  },
  wellness: {
    promise: "Come home to yourself.",
    intro: [
      "Wellness travel is permission — to slow down, to be looked after, to do less on purpose. The right retreat doesn't add to your to-do list; it quietly subtracts from it.",
      "We pair you with places built around rest, movement and nourishment, and we keep the logistics invisible so you can keep your shoulders down.",
    ],
  },
  ultra: {
    promise: "The extraordinary, made effortless.",
    intro: [
      "At the very top, luxury stops being about things and starts being about ease — the sense that everything has been handled before you thought to ask.",
      "Private villas with their own staff. Doors that don't open for others. A curator who knows your name and your preferences. With Ultra-Luxury, the Nanny-Well and Security-Well quietly join your trip when they're needed.",
    ],
  },
};

const GENERIC_INTRO = (si: { name: string; sig: string }, count: number) => [
  `${si.name} is one of the ${count} ways travelers love to move through the world — ${si.sig}. This world is being curated now.`,
];

const FALLBACK_WELLS = ["stay", "activities", "eat", "move"];
const WELL_HOW: Record<string, string> = {
  stay: "Where you'll rest, matched to the trip",
  fly: "Getting there, the easy way",
  eat: "Tables worth the trip",
  move: "Getting around once you arrive",
  gear: "What to pack and carry",
  beauty: "Looking and feeling your best",
  activities: "What you'll actually do",
  shop: "Taking a piece of it home",
  nanny: "Care for the little ones",
  security: "Discreet protection",
};

function wellsActivated(siId: string, activities: Record<string, Activity[]>): string[] {
  const acts = activities[siId];
  if (acts && acts.length) {
    const set: string[] = [];
    acts.forEach((a) => {
      if (!set.includes(a.well)) set.push(a.well);
    });
    return set;
  }
  return FALLBACK_WELLS;
}

/**
 * The regions curated for this interest.
 *
 * ── THE `slice(0, 4)` WAS TRUNCATING AN EDITORIAL LIST BY REGION NUMBER ────
 * `REGION_SI` is hand-curated — somebody decided the Caribbean is a romance
 * region — and then this cut it to four in REGIONS order, which sorts by region
 * CODE. That is not an editorial axis; `11C` was being dropped from Romance
 * because eleven is bigger than nine.
 *
 * Measured 2026-08-24, and it was hiding real affinities across the board:
 * Romance hid the Caribbean, Ski hid Canada, Adventure hid three regions
 * including the United States, Culinary hid Latin America.
 *
 * Found while adding `ski` to 02F on David's Cortina ruling — that addition
 * alone would have pushed the United States off the Ski page, because 02F sorts
 * ahead of 12A. A ruling about Italy would have silently removed America.
 *
 * Same shape as the twelve-jewel cap: a limit that was harmless when the list
 * was short became the thing deciding the page once it grew. The curated list is
 * already the selection; truncating it again adds nothing but an arbitrary
 * ordering. Seven is the largest any interest has.
 */
function featuredRegions(siId: string, regions: Region[]): Region[] {
  return regions.filter((r) => (REGION_SI[r.code] || []).includes(siId));
}

function providerRail(
  siId: string,
  activities: Record<string, Activity[]>,
  providers: Record<string, Provider[]>
): Provider[] {
  const wells = wellsActivated(siId, activities);
  const out: Provider[] = [];
  wells.forEach((w) => {
    (providers[w] || [])
      .filter((p) => p.tier !== "prospective")
      // FILTER BY THE INTEREST BEING VIEWED (David, 2026-08-12). This rail pulled
      // by Well alone and never asked which interest the reader was looking at,
      // so it showed the global first two per Well — which meant the Dive
      // Liveaboards page listed safari lodges and ski hotels. Aggressor's boats
      // could sit in the table and never appear on their own page.
      //
      // AND IT MUST NOT FALL BACK. Measured before changing it: all 58 providers
      // carry an si[] tag, but only TWO interests have any — safari 39, ski 19.
      // Six of the eight live interests have none. So this filter empties the rail
      // on most pages, and that is the correct outcome: an empty shelf says "we
      // haven't wired supply for this yet," while the old behaviour said "here are
      // your dive boats" and pointed at a lodge in the Maasai Mara. Wrong is worse
      // than absent, and a fallback would reintroduce exactly the wrong.
      .filter((p) => (p.si ?? []).includes(siId))
      // Three per Well rather than two. With eleven liveaboard rows arriving, a
      // cap of two showed four boats out of eleven on the page whose entire
      // subject is the boats.
      .slice(0, 3)
      .forEach((p) => out.push(p));
  });
  return out.slice(0, 9);
}

const MONTH = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * The dossier sections — layers 4a, 4b and 7 of the nine-layer SI dossier,
 * rendered progressively: each appears only when the dossier carries it, so a
 * dossier can land in stages and the page never shows an empty shelf. The
 * remaining layers (market, streams, sources) are in the jsonb and belong to the
 * investor surface, not the traveler's page.
 */
function DossierSections({ data }: { data?: SiData }) {
  const timing = data?.timing;
  const events = data?.events ?? [];
  const faq = data?.faq ?? [];
  if (!timing && !events.length && !faq.length) return null;

  return (
    <>
      {timing && (
        <section className="sd-section">
          <span className="eyebrow sd-section__eyebrow">When to go</span>
          <h2 className="sd-section__title">Timing, and how far ahead it books</h2>
          <div className="sd-timing">
            {timing.season && (
              <div className="sd-timing__row">
                <span className="sd-timing__ic"><Icon name="compass" small /></span>
                <div><div className="sd-timing__k">The season</div><div className="sd-timing__v">{timing.season}</div></div>
              </div>
            )}
            {!!timing.best_months?.length && (
              <div className="sd-timing__row">
                <span className="sd-timing__ic"><Icon name="calendar" small /></span>
                <div>
                  <div className="sd-timing__k">Best months</div>
                  <div className="sd-months">
                    {MONTH.slice(1).map((m, i) => (
                      <span className={cx("sd-month", timing.best_months!.includes(i + 1) && "sd-month--on")} key={m}>
                        {m}{timing.best_months!.includes(i + 1) && <span className="sr-only"> — a good month to go</span>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {timing.booking_window && (
              <div className="sd-timing__row">
                <span className="sd-timing__ic"><Icon name="check" small /></span>
                <div><div className="sd-timing__k">Booking window</div><div className="sd-timing__v">{timing.booking_window}</div></div>
              </div>
            )}
            {timing.notes && (
              <div className="sd-timing__row">
                <span className="sd-timing__ic"><Icon name="info" small /></span>
                <div><div className="sd-timing__k">Worth knowing</div><div className="sd-timing__v">{timing.notes}</div></div>
              </div>
            )}
          </div>
        </section>
      )}

      {events.length > 0 && (
        <section className="sd-section">
          <span className="eyebrow sd-section__eyebrow">The look-ahead</span>
          <h2 className="sd-section__title">Dates worth planning around</h2>
          <p className="sd-section__sub">
            Absolute dates, years out — so Atlas can raise them while there is still room to book.
          </p>
          <ol className="sd-events">
            {events.map((e, i) => (
              <li className="sd-event" key={`${e.name}-${e.year ?? e.starts_on ?? i}`}>
                <span className="sd-event__year">{e.year ?? e.starts_on?.slice(0, 4)}</span>
                <span className="sd-event__body">
                  <span className="sd-event__name">
                    {e.name}
                    {e.sold_out && <span className="sd-event__flag">Sold out</span>}
                  </span>
                  {e.place && <span className="sd-event__place"><Icon name="pin" small /> {e.place}</span>}
                  {e.starts_on && (
                    <span className="sd-event__when">
                      {new Date(e.starts_on + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                      {e.ends_on ? ` – ${new Date(e.ends_on + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short" })}` : ""}
                    </span>
                  )}
                  {e.note && <span className="sd-event__note">{e.note}</span>}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {faq.length > 0 && (
        <section className="sd-section">
          <span className="eyebrow sd-section__eyebrow">Travelers ask</span>
          <h2 className="sd-section__title">The questions that actually come up</h2>
          <div className="sd-faq">
            {faq.map((f, i) => (
              <details className="sd-faq__item" key={i}>
                <summary className="sd-faq__q">{f.q}</summary>
                <div className="sd-faq__a">{f.a}{f.source && <span className="sd-faq__src"> · {f.source}</span>}</div>
              </details>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

/**
 * THE EXPERIENCES. Authored inside destination dossiers, gathered here by the
 * jewel's own `si` tag — so a Zermatt spa jewel tagged `wellness` surfaces under
 * Wellness, not Ski. Each card links to the destination that holds it and carries
 * its own source, since a jewel on this page has left its dossier's prose behind.
 *
 * No fallback: an interest with none renders nothing. The provider rail's old
 * fallback is exactly how safari lodges ended up on the dive page.
 *
 * Rendered on BOTH the live and the preview layout, for the reason the preview
 * layout already shows its dossier: a preview interest is content-only, not empty.
 * It also has to be both, because the structured data is built from the same list
 * — baked into the served HTML by `gen-static-heads` — so a section that rendered
 * on only one layout would tell a crawler about experiences a reader can't see.
 */
function JewelsSection({ si, jewels }: { si: { name: string }; jewels: PlacedJewel[] }) {
  if (!jewels.length) return null;
  const dests = destinationsBehind(jewels);
  return (
    <section className="sd-section">
      <span className="eyebrow sd-section__eyebrow">The experiences themselves</span>
      <h2 className="sd-section__title">Don&rsquo;t-miss {si.name.toLowerCase()} experiences</h2>
      <p className="sd-section__sub">
        Researched, tiered and placed &mdash; {jewels.length} {jewels.length === 1 ? "experience" : "experiences"} across {dests} {dests === 1 ? "destination" : "destinations"}. Open a destination to see it in context.
      </p>
      <div className="sd-jewels">
        {jewels.map(({ jewel, dest }, i) => (
          <Link className="sd-jw" to={`/destination/${dest.id}`} key={`${dest.id}-${jewel.name}-${i}`}>
            <span className="sd-jw__place">
              <Icon name="pin" small /> {dest.name}, {dest.country}
            </span>
            <span className="sd-jw__name">{jewel.name}</span>
            {jewel.blurb && <span className="sd-jw__blurb">{jewel.blurb}</span>}
            <span className="sd-jw__meta">
              {jewel.tier && <span className={cx("sd-jw__tier", `sd-jw__tier--${jewel.tier}`)}>{jewel.tier}</span>}
              {jewel.when && <span className="sd-jw__when">{jewel.when}</span>}
            </span>
            {/* Provenance where we hold it. A card with no line here is covered
                by the section's footnote rather than repeating the same admission
                on every card — a disclaimer printed six times stops being read,
                and the point is that a reader can tell the two apart at a glance. */}
            {jewel.source && (
              <span className="sd-jw__src">Source: {jewel.source}{jewel.accessed ? ` \u00b7 read ${jewel.accessed}` : ""}</span>
            )}
          </Link>
        ))}
      </div>
      {jewels.some((j) => !j.jewel.source) && (
        <p className="sd-jewels__note">
          Cards without a source line are our own editorial picks. Where a card
          states a figure &mdash; a price, a distance, a time &mdash; it names where
          the figure came from.
        </p>
      )}
    </section>
  );
}

function RegionsSection({ si }: { si: { id: string; name: string } }) {
  const regions = featuredRegions(si.id, useRegions());
  if (!regions.length) return null;
  return (
    <section className="sd-section">
      <span className="eyebrow sd-section__eyebrow">Where it shines</span>
      <h2 className="sd-section__title">Best regions for {si.name}</h2>
      <div className="sd-regions">
        {regions.map((r) => (
          <Link className="sd-rg" to={`/region/${r.code}`} key={r.code}>
            <img src={regionImg(r.code, 500)} alt="" loading="lazy" referrerPolicy="no-referrer" />
            <span className="sd-rg__scrim" />
            <span className="sd-rg__code">{r.code}</span>
            <span className="sd-rg__name">{r.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function SiDetail() {
  const { id } = useParams();
  const { openPanel, showToast, journeySIs, toggleSI } = useStore();
  const sis = useSpecialInterests();
  const activities = useActivities();
  const providers = useProviders();
  const allWells = Object.fromEntries(useWells().map((w) => [w.id, w]));

  const si = sis.find((s) => s.id === id) || sis.find((s) => s.id === "safari")!;
  const isSchema = si.status !== "live";
  const ed = EDITORIAL[si.id];
  const siCount = useSiCount();
  const picked = journeySIs.includes(si.id);
  // Honors the dossier's editorial hero (data.hero) before falling back to a
  // name-matched photo — the interest's own pick wins, same rule as destinations.
  const heroPhoto = useSiImage(si, 1800, siImg(si.id, 1800));
  // TouristTrip + FAQPage + Event, straight off the dossier (layers 7 and 4b).
  const placedJewels = jewelsForSi(useDestinations(), si.id);
  useJsonLd(siJsonLd(si, typeof window !== "undefined" ? window.location.href : "", placedJewels));

  const subhead = (
    <div className="jn-subhead">
      <div className="jn-subhead__inner">
        <nav className="jn-crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="sep">/</span>
          <Link to="/special-interests">Special Interests</Link>
          <span className="sep">/</span>
          <span className="here">{si.name}</span>
        </nav>
        <Link className="btn btn-ghost" to="/special-interests">
          ← All {siCount} interests
        </Link>
      </div>
    </div>
  );
  const back = <BackBar inline />;

  const hero = (
    <section className={cx("sd-hero", isSchema && "sd-hero--schema")}>
      <div className="sd-hero__img">
        <img src={heroPhoto.src} alt={si.name} referrerPolicy="no-referrer" loading="lazy" />
      </div>
      <div className="sd-hero__scrim" />
      {heroPhoto.credit && (
        <span style={{ position: "absolute", bottom: 8, insetInlineEnd: 12, zIndex: 3, fontSize: 13, color: "rgba(255,255,255,.8)" }}>
          Photo · <a href={heroPhoto.credit.link} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>{heroPhoto.credit.name}</a> / Unsplash
        </span>
      )}
      <div className="sd-hero__accent" style={{ background: si.accent }} />
      <div className="sd-hero__inner">
        <div className="sd-hero__badges">
          {isSchema ? (
            <span className="pill pill-preview" style={{ background: "rgba(255,255,255,.86)" }}>
              Preview · coming soon
            </span>
          ) : (
            <span className="pill pill-live" style={{ background: "rgba(255,255,255,.92)" }}>
              Live now
            </span>
          )}
          {si.lux && (
            <span className="pill" style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>
              Luxury world
            </span>
          )}
        </div>
        <div className="sd-hero__sig">{si.sig.charAt(0).toUpperCase() + si.sig.slice(1)}</div>
        <h1 className="sd-hero__title">{si.name}</h1>
        <p className="sd-hero__promise">{ed ? ed.promise : si.sig}</p>
        <Tagline subject={taglineSubject(si)} className="sd-hero__tagline" />
        {/* Opening a page that can't do the one thing the traveler came for makes
            the journey longer, not richer (David-agreed) — so the add control and
            the pick counter live here too, not only on the board. */}
        {!isSchema && (
          <div className="sd-hero__pick">
            <button
              className={cx("sd-add", picked && "sd-add--on")}
              aria-pressed={picked}
              onClick={() => toggleSI(si.id)}
            >
              <Icon name={picked ? "check" : "plus"} />
              {picked ? `Added to your journey` : `Add to your journey`}
            </button>
            <span className="sd-hero__count" aria-live="polite">
              {picked
                ? `${journeySIs.length} of ${MAX_SIS} chosen`
                : journeySIs.length >= MAX_SIS
                  ? `${MAX_SIS} of ${MAX_SIS} chosen — swap one out to add this`
                  : `${journeySIs.length} of ${MAX_SIS} chosen · 1–2 is the sweet spot`}
            </span>
          </div>
        )}
      </div>
    </section>
  );

  if (isSchema) {
    return (
      <>
        {subhead}{back}
        {hero}
        <div className="sd-schema-notice">
          <div className="sd-schema-card">
            <div className="sd-schema-card__ic">
              <Icon name="compass" />
            </div>
            <h3>This world is on the way</h3>
            <p>
              {si.name} is part of our taxonomy of {siCount} ways to travel, but it isn't bookable yet — we're curating
              partners and guides for it now. It can't be added to a trip until it goes live.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 22, flexWrap: "wrap" }}>
              <button
                className="btn btn-primary"
                onClick={() => showToast(`We'll email you when ${si.name} goes live`)}
              >
                Notify me when it's live
              </button>
              <Link className="btn btn-secondary" to="/special-interests">
                Explore live interests
              </Link>
            </div>
          </div>
        </div>
        {/* A preview interest with a dossier still shows its depth — the page is
            content-only (no Book button), not empty. Same rule as an L4 destination. */}
        <JewelsSection si={si} jewels={placedJewels} />
        <DossierSections data={si.data} />
        <RegionsSection si={si} />
        <div style={{ height: 80 }} />
      </>
    );
  }

  const wells = wellsActivated(si.id, activities);
  const rail = providerRail(si.id, activities, providers);
  const intro = ed ? ed.intro : GENERIC_INTRO(si, siCount);

  return (
    <>
      {subhead}{back}
      {hero}

      <div className="sd-intro">
        {intro.map((p, i) => (
          <p className={i === 0 ? "dropcap" : ""} key={i}>
            {p}
          </p>
        ))}
      </div>

      <section className="sd-section">
        <span className="eyebrow sd-section__eyebrow">What it switches on</span>
        <h2 className="sd-section__title">The Wells a {si.name.toLowerCase()} trip activates</h2>
        <p className="sd-section__sub">
          Choose this interest and we light up the right Wells, pre-filled with matched providers.
        </p>
        <div className="sd-wells">
          {wells.map((w) => (
            <div className="sd-well" key={w}>
              <div className="sd-well__ic">
                <Icon name={allWells[w].icon} />
              </div>
              <div>
                <div className="sd-well__name">{allWells[w].name}</div>
                <div className="sd-well__how">{WELL_HOW[w] || allWells[w].tag}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <JewelsSection si={si} jewels={placedJewels} />


      {rail.length > 0 && (
        <section className="sd-section">
          <span className="eyebrow sd-section__eyebrow">A taste of our partners</span>
          <h2 className="sd-section__title">Vetted providers you'll meet</h2>
          <p className="sd-section__sub">
            Curated and scoped to your region during the journey. Prime Providers shown first.
          </p>
          <div className="sd-rail" tabIndex={0} role="group" aria-label="Vetted providers">
            {rail.map((p, i) => (
              <div className="sd-pv" key={`${p.well}-${p.name}-${i}`}>
                <div className="sd-pv__body">
                  <span className={cx("sd-pv__tier", `sd-pv__tier--${p.tier}`)}>
                    {p.tier === "prime" ? "★ Prime" : "Vetted"}
                  </span>
                  <div className="sd-pv__name">{p.name}</div>
                  <div className="sd-pv__desc">{providerDesc(p, si.id)}</div>
                </div>
                <div className="sd-pv__foot">{allWells[p.well].name}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <DossierSections data={si.data} />

      <RegionsSection si={si} />

      <div className="sd-cta">
        <div
          className="sd-cta__card"
          style={{
            background: `linear-gradient(135deg, ${si.accent}, color-mix(in oklch, ${si.accent} 60%, black))`,
          }}
        >
          <span className="eyebrow">Start the journey</span>
          <h2>Design a {si.name.toLowerCase()} trip that's truly yours.</h2>
          <p>Pick a region next and watch your Wells fill with providers matched to {si.name}.</p>
          <div className="sd-cta__actions">
            <Link
              className="btn"
              to="/regions"
              style={{ background: "#fff", color: "var(--foreground)" }}
              onClick={() => {
                try {
                  localStorage.setItem("tww:journeySIs", JSON.stringify([si.id]));
                } catch {
                  /* ignore */
                }
              }}
            >
              Choose a region →
            </Link>
            <button
              className="btn"
              style={{ background: "rgba(255,255,255,.18)", color: "#fff", border: "1px solid rgba(255,255,255,.3)" }}
              onClick={() => openPanel("concierge")}
            >
              <Icon name="sparkle" small /> Speak with Atlas
            </button>
          </div>
        </div>
      </div>
      <div style={{ height: 80 }} />
      <SiPickBar />
    </>
  );
}
