import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { WELL_DETAIL, type Provider, type Price } from "@/data/places";
import { useStore } from "@/store/useStore";
import { useWells, useProviders, useRegionByCode } from "@/store/useCatalog";
import { Eyebrow, Ftc } from "@/components/ui/primitives";
import { JourneyBar } from "@/components/ui/StepIndicator";
import { cx, cap } from "@/lib/utils";

const BUDGETS: { id: Price | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "value", label: "Value" },
  { id: "comfort", label: "Comfort" },
  { id: "premium", label: "Premium" },
  { id: "ultra", label: "Ultra" },
];
const TIER_RANK: Record<string, number> = { prime: 0, vetted: 1, prospective: 2 };

function ProviderCard({ p, added, onBook }: { p: Provider; added: boolean; onBook: () => void }) {
  return (
    <div className={cx("pv", added && "pv--added")}>
      <div className="pv__body">
        <div className="pv__top">
          <span className="pv__name">{p.name}</span>
          <span className={cx("pv__tier", `pv__tier--${p.tier}`)}>{p.tier === "prime" ? "★ Prime" : p.tier}</span>
        </div>
        <p className="pv__desc">{p.desc}</p>
        <div className="pv__attrs">
          <span className="pv__attr pv__attr--match"><span className="dot" style={{ background: "var(--primary)" }} />{cap(p.price)}</span>
          <span className="pv__attr">{p.mode === "api" ? "Instant book" : p.mode === "widget" ? "Partner widget" : p.mode === "first-party" ? "First-party" : "Affiliate"}</span>
        </div>
      </div>
      <div className="pv__foot">
        <div className="pv__cta-row">
          {added ? (
            <span className="pv__added-tag"><Icon name="check" small /> Added to your trip</span>
          ) : (
            <button className="btn btn-primary" onClick={onBook}>Book It</button>
          )}
          <span className="pv__mode"><Icon name="info" small /> {p.mode === "affiliate" ? "Off-site" : "In-platform"}</span>
        </div>
        <Ftc className="pv__ftc">{p.commission} — disclosed every time, at no extra cost to you.</Ftc>
      </div>
    </div>
  );
}

export default function WellsSurface() {
  const params = useParams();
  const navigate = useNavigate();
  const { region, trip, addToTrip } = useStore();
  const [active, setActive] = useState<string>(params.id || "stay");
  const [budget, setBudget] = useState<Price | "all">("all");
  const [showAll, setShowAll] = useState(false);

  const allWells = useWells();
  const providersByWell = useProviders();
  const standardWells = allWells.filter((w) => !w.lux);
  const well = allWells.find((w) => w.id === active) || standardWells[0];
  const detail = WELL_DETAIL[active];
  const regionName = useRegionByCode(region || "05A")?.name || "East Africa";
  const isPreLaunch = well.status === "soon";

  let providers = (providersByWell[active] || []).filter((p) => budget === "all" || p.price === budget);
  providers = [...providers].sort((a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier]);
  const prime = providers.filter((p) => p.tier === "prime");
  const rest = providers.filter((p) => p.tier !== "prime");
  const visibleRest = showAll ? rest : rest.slice(0, Math.max(0, 6 - prime.length));

  const wellCount = (id: string) => trip.filter((b) => b.well === id).length;
  const covered = new Set(trip.map((b) => b.well)).size;

  function book(p: Provider) {
    if (p.mode === "affiliate") { navigate(`/go?to=${encodeURIComponent(p.name)}&well=${active}`); return; }
    addToTrip({ well: active, icon: well.icon, name: p.name, meta: `${well.name} · ${cap(p.price)}`, status: "pending" });
  }

  return (
    <>
      <JourneyBar current={4} crumbs={[{ label: "Home", to: "/" }, { label: "Interests", to: "/special-interests" }, { label: "Regions", to: "/regions" }, { label: "Activities", to: "/activities" }, { label: "The Wells" }]} />

      {/* always-visible Wells bar */}
      <div className="wb">
        <div className="wb__inner">
          <span className="wb__label">Your Wells</span>
          <div className="wb__rail">
            {allWells.map((w) => {
              const n = wellCount(w.id);
              const soon = w.status === "soon";
              return (
                <button
                  key={w.id}
                  className={cx("wb-chip", soon && "wb-chip--soon", w.lux && "wb-chip--lux")}
                  aria-selected={active === w.id}
                  onClick={() => { setActive(w.id); setShowAll(false); }}
                >
                  <span className="wb-chip__ic"><Icon name={w.icon} small /></span>
                  {w.name.replace("-Well", "")}
                  {soon ? <span className="wb-chip__soon">Soon</span> : n > 0 ? <span className="wb-chip__count">{n}</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container jn-intro" style={{ paddingBottom: 8 }}>
        <Eyebrow>The Dream Journey · Step 4 of 5</Eyebrow>
        <h1>Build your trip, Well by Well.</h1>
        <p className="lead">Each Well covers one need. We've scoped the options to your region and pre-filled them from your activities. Add what you love — you'll book in the next step.</p>
      </div>

      <div className="wp">
        <div className="wp__head">
          <div className="wp__ic"><Icon name={well.icon} /></div>
          <div>
            <h2 className="wp__title">{well.name}</h2>
            <p className="wp__tag">{well.tag} · the <b>{well.body}</b> of your trip</p>
          </div>
          <div className="wp__meta">
            <span className="wp__budget"><Icon name="bag2" small /> Your budget: Comfort</span>
            <span className="wp__scope">Scoped to {regionName}</span>
          </div>
        </div>

        {detail && <p className="t-body" style={{ color: "var(--muted-foreground)", maxWidth: "62ch", marginTop: 4 }}>{detail.purpose}</p>}

        {isPreLaunch ? (
          <div className="wp-empty">
            <div className="wp-empty__ic"><Icon name={well.icon} /></div>
            <h3>{well.name} is activated at launch.</h3>
            <p>{detail?.use}</p>
            <span className="pill pill-soon">Activated at Launch</span>
          </div>
        ) : (
          <>
            <div className="wp__filters">
              <span className="sortlabel">Budget</span>
              {BUDGETS.map((b) => (
                <button key={b.id} className="wp-fchip" aria-pressed={budget === b.id} onClick={() => { setBudget(b.id); setShowAll(false); }}>{b.label}</button>
              ))}
              <span className="wp__count-note">{providers.length} options · scoped to {regionName}</span>
            </div>

            {prime.length > 0 && (
              <>
                <div className="pv-section-label">Prime providers — vetted &amp; recommended first</div>
                <div className="pv-grid">
                  {prime.map((p) => <ProviderCard key={p.name} p={p} added={trip.some((b) => b.name === p.name)} onBook={() => book(p)} />)}
                </div>
              </>
            )}
            {visibleRest.length > 0 && (
              <>
                <div className="pv-section-label">More vetted options</div>
                <div className="pv-grid">
                  {visibleRest.map((p) => <ProviderCard key={p.name} p={p} added={trip.some((b) => b.name === p.name)} onBook={() => book(p)} />)}
                </div>
              </>
            )}
            {!showAll && rest.length > visibleRest.length && (
              <div className="wp__more">
                <button className="btn btn-secondary" onClick={() => setShowAll(true)}>See {rest.length - visibleRest.length} more <Icon name="chev" small /></button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="wp-continue">
        <div className="wp-continue__inner">
          <div className="wp-continue__summary">
            <div className="wp-continue__cov" aria-label={`${covered} of 10 Wells covered`}>
              {standardWells.map((w) => <i key={w.id} className={trip.some((b) => b.well === w.id) ? "on" : ""} />)}
            </div>
            <span className="wp-continue__text"><b>{covered}/10 Wells</b> covered · {trip.length} in your trip</span>
          </div>
          <button className="btn btn-primary" onClick={() => navigate("/itinerary")}>Continue to Book It <Icon name="arrow" small /></button>
        </div>
      </div>
    </>
  );
}
