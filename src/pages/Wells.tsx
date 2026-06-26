import { Link } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { type Well, WELL_AUDIENCE } from "@/data/taxonomy";
import { WELL_DETAIL } from "@/data/places";
import { useWells } from "@/store/useCatalog";
import { Eyebrow } from "@/components/ui/primitives";
import { cx } from "@/lib/utils";

function WellCard({ w }: { w: Well }) {
  const det = WELL_DETAIL[w.id] || {};
  const soon = w.status === "soon";
  const cats = (det.cats || []).slice(0, 4);
  return (
    <Link
      className={cx("wi-card", soon && "wi-card--soon", w.lux && "wi-card--lux")}
      to={soon ? "#" : `/well/${w.id}`}
      aria-disabled={soon || undefined}
      onClick={soon ? (e) => e.preventDefault() : undefined}
    >
      <div className="wi-card__ic"><Icon name={w.icon} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="wi-card__name">
          {w.name}{" "}
          {soon
            ? <span className="pill pill-soon">Activated at Launch</span>
            : <span className="wi-card__body-tag">{w.body}</span>}
        </div>
        <div className="wi-card__tag">{w.tag}</div>
        <div className="wi-card__cats">
          {cats.map((c) => <span key={c} className="wi-card__cat">{c}</span>)}
        </div>
        {soon
          ? <div className="wi-card__foot" style={{ color: "var(--muted-foreground)" }}><Icon name="info" small /> Coming at launch — partners being vetted now</div>
          : <div className="wi-card__foot">Meet the partners <Icon name="arrow" small /></div>}
      </div>
    </Link>
  );
}

export default function Wells() {
  const allWells = useWells();
  const wells = allWells.filter((w) => !w.lux); // the core ten
  const universalExtras = allWells.filter((w) => WELL_AUDIENCE[w.id] === "universal"); // Nanny — every family
  const ultraExtras = allWells.filter((w) => WELL_AUDIENCE[w.id] === "ultra"); // Security — Ultra only

  return (
    <main id="main">
      <section className="wi-hero">
        <div className="wi-hero__inner">
          <Eyebrow>The TravelWell Ecosystem</Eyebrow>
          <h1>Every need a trip has, in its own Well.</h1>
          <p>We organized travel the way the body works — ten interconnected systems, each covering one part of your journey, all feeding one itinerary. Pick a Well to meet its vetted partners.</p>
          <p className="wi-hero__sig">A Travel Operating System. <span className="tw">Travel Well.</span></p>
        </div>
      </section>

      <div className="wi-body">
        <div className="wi-sectlabel" style={{ marginTop: 0 }}>The ten Wells</div>
        <div className="wi-grid">
          {wells.map((w) => <WellCard key={w.id} w={w} />)}
        </div>

        {/* The +2 Wells beyond the core ten, each tiered to the need (David's call):
            Nanny is universal (every family); Security is Ultra-only. NOTE: copy
            here is first-pass — flagged for David's wordsmith in the review. */}
        <div className="wi-lux-band" style={{ marginTop: 22 }}>
          <div className="wi-lux-band__head">
            <span className="wi-card__ic" style={{ width: 44, height: 44, background: "color-mix(in oklch,var(--accent) 22%,white)", color: "var(--gold-deep)" }}><Icon name="sparkles" /></span>
            <div>
              <span className="eyebrow" style={{ color: "var(--gold-deep)" }}>Two more Wells, tiered to the need</span>
              <h2 className="t-h3" style={{ marginTop: 2 }}>Beyond the core ten</h2>
            </div>
          </div>
          <p className="wi-lux-band__note">
            <b>Nanny-Well</b> is for every family, on any trip (we just never go cheap on who watches the kids).
            {" "}<b>Security-Well</b> — discreet close protection — is reserved for Ultra-Luxury, where it's genuinely needed.
          </p>
          <div className="wi-grid" style={{ marginTop: 18 }}>
            {[...universalExtras, ...ultraExtras].map((w) => (
              <div key={w.id} style={{ position: "relative" }}>
                <span className="pill" style={{ position: "absolute", top: 10, insetInlineEnd: 10, zIndex: 2, background: WELL_AUDIENCE[w.id] === "ultra" ? "var(--accent)" : "var(--secondary)", color: WELL_AUDIENCE[w.id] === "ultra" ? "var(--accent-foreground)" : "var(--primary)" }}>
                  {WELL_AUDIENCE[w.id] === "ultra" ? "Ultra-Luxury" : "Every family"}
                </span>
                <WellCard w={w} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ height: 80 }} />
    </main>
  );
}
