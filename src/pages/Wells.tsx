import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { type Well } from "@/data/taxonomy";
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
  const [lux, setLux] = useState(false);
  const allWells = useWells();
  const wells = allWells.filter((w) => !w.lux);
  const luxWells = allWells.filter((w) => w.lux);

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
        <div className="wi-sectlabel" style={{ marginTop: 0 }}>
          The ten Wells
          <span className="wi-toggle" role="group" aria-label="Context">
            <button aria-pressed={!lux} onClick={() => setLux(false)}>Standard</button>
            <button aria-pressed={lux} onClick={() => setLux(true)}>Luxury / Ultra</button>
          </span>
        </div>
        <div className="wi-grid">
          {wells.map((w) => <WellCard key={w.id} w={w} />)}
        </div>

        <div>
          {lux ? (
            <div className="wi-lux-band">
              <div className="wi-lux-band__head">
                <span className="wi-card__ic" style={{ width: 44, height: 44, background: "color-mix(in oklch,var(--accent) 22%,white)", color: "var(--gold-deep)" }}><Icon name="sparkles" /></span>
                <div>
                  <span className="eyebrow" style={{ color: "var(--gold-deep)" }}>Luxury &amp; Ultra-Luxury only</span>
                  <h2 className="t-h3" style={{ marginTop: 2 }}>Two more Wells, when the trip calls for them</h2>
                </div>
              </div>
              <p className="wi-lux-band__note">Nanny-Well and Security-Well appear only in Luxury and Ultra-Luxury contexts — they're not shown on standard trips.</p>
              <div className="wi-grid" style={{ marginTop: 18 }}>
                {luxWells.map((w) => <WellCard key={w.id} w={w} />)}
              </div>
            </div>
          ) : (
            <div className="wi-lux-band" style={{ background: "var(--surface-alt)", borderColor: "var(--border)" }}>
              <div className="wi-lux-band__head">
                <span className="wi-card__ic" style={{ width: 44, height: 44 }}><Icon name="lock" /></span>
                <div>
                  <span className="eyebrow" style={{ color: "var(--muted-foreground)" }}>Context-aware</span>
                  <h2 className="t-h3" style={{ marginTop: 2 }}>Two Wells appear only in luxury contexts</h2>
                </div>
              </div>
              <p className="wi-lux-band__note">On Luxury and Ultra-Luxury trips, <b>Nanny-Well</b> and <b>Security-Well</b> join the set. Switch the toggle above to preview them.</p>
            </div>
          )}
        </div>
      </div>
      <div style={{ height: 80 }} />
    </main>
  );
}
