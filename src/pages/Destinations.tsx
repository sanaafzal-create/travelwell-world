import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { DESTINATIONS, type Destination } from "@/data/places";
import { REGIONS } from "@/data/taxonomy";
import { img } from "@/lib/images";
import { Eyebrow } from "@/components/ui/primitives";
import { cx } from "@/lib/utils";

interface DestWithRegion extends Destination {
  region: string;
}

function allDests(): DestWithRegion[] {
  const out: DestWithRegion[] = [];
  Object.entries(DESTINATIONS).forEach(([code, list]) => {
    list.forEach((d) => out.push({ ...d, region: code }));
  });
  return out;
}

function regionsWithDests() {
  return REGIONS.filter((r) => DESTINATIONS[r.code]);
}

export default function Destinations() {
  const [params] = useSearchParams();
  const [activeRegion, setActiveRegion] = useState(params.get("r") || "all");

  const list: DestWithRegion[] =
    activeRegion === "all"
      ? allDests()
      : (DESTINATIONS[activeRegion] || []).map((d) => ({ ...d, region: activeRegion }));
  const R = REGIONS.find((r) => r.code === activeRegion);

  const select = (code: string) => {
    setActiveRegion(code);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <div className="jn-subhead">
        <div className="jn-subhead__inner">
          <nav className="jn-crumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span className="sep">/</span>
            <Link to="/regions">Regions</Link>
            <span className="sep">/</span>
            <span className="here" id="crumb">
              {R ? `${R.name} · Destinations` : "Destinations"}
            </span>
          </nav>
        </div>
      </div>

      <main id="main">
        <div className="container">
          <div className="dx-intro">
            <Eyebrow>Destinations</Eyebrow>
            <h1 id="dx-title">{R ? `Destinations in ${R.name}` : "Places worth the journey."}</h1>
            <p className="lead" id="dx-lead">
              Every destination sits inside its region — so you can browse without losing your place in the trip you're building.
            </p>
            <div className="dx-region-strip" id="dx-region-strip">
              <button
                className="dx-region-chip"
                aria-pressed={activeRegion === "all"}
                onClick={() => select("all")}
              >
                All regions
              </button>
              {regionsWithDests().map((r) => (
                <button
                  key={r.code}
                  className="dx-region-chip"
                  aria-pressed={activeRegion === r.code}
                  onClick={() => select(r.code)}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>
          <div className="dx-grid" id="dx-grid">
            {list.map((d) => (
              <Link
                key={`${d.region}-${d.id}`}
                className={cx("dx-card", d.status === "stub" && "dx-card--stub")}
                to={`/destination/${d.id}`}
              >
                <img src={img(d.img, 700)} alt="" loading="lazy" referrerPolicy="no-referrer" />
                <span className="dx-card__scrim" />
                <span className="dx-card__badge">
                  {d.status === "live" ? (
                    <span className="pill pill-live" style={{ background: "rgba(255,255,255,.92)" }}>Live</span>
                  ) : (
                    <span className="pill pill-preview" style={{ background: "rgba(255,255,255,.86)" }}>Preview</span>
                  )}
                </span>
                <span className="dx-card__body">
                  <span className="dx-card__country">{d.country}</span>
                  <span className="dx-card__name">{d.name}</span>
                  <span className="dx-card__line">{d.line}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
