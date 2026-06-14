import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { GUIDES, GUIDE_TYPES } from "@/data/places";
import { img } from "@/lib/images";
import { Eyebrow } from "@/components/ui/primitives";

const BEFORE = [
  { ic: "bag", t: "Gear-Well", pri: "", priLabel: "", s: "Trip-matched packing — layers, optics, dry-bags. Don't guess; let the list do it.", cta: "Build my packing list", to: "/well/gear" },
  { ic: "phone", t: "Stay connected", pri: "", priLabel: "", s: "Sort an eSIM, data and call plan before you fly — land already online, no roaming shocks.", cta: "Connectivity guide", to: "/guide/safari-packing" },
  { ic: "shield", t: "Insure-Well", pri: "crit", priLabel: "Don't skip", s: "Travel protection — and critically, a Med-Evac plan. The one thing you must not leave home without.", cta: "See Insure-Well", to: "/well/insure" },
  { ic: "heart", t: "Travel safety pack", pri: "soon", priLabel: "Coming soon", s: "Our own clinician-reviewed first-aid kit with a QR Safety Card. Pre-order to carry one.", cta: "Pre-order the kit", to: "/first-aid-kit" },
];

export default function Guides() {
  const [filter, setFilter] = useState("all");
  const feat = GUIDES.find((g) => g.id === "morocco-top8") || GUIDES[0];
  const types = filter === "all" ? GUIDE_TYPES : [filter];

  return (
    <div className="container">
      <div className="gx-intro">
        <Eyebrow>The TravelWell Desk</Eyebrow>
        <h1>Guides worth reading before you go.</h1>
        <p className="lead">Field guides, seasonal intel and ranked lists — written by people who've actually been, and updated when things change.</p>
        <div className="gx-filter" role="group" aria-label="Filter by type">
          <button aria-pressed={filter === "all"} onClick={() => setFilter("all")}>All guides</button>
          {GUIDE_TYPES.map((t) => <button key={t} aria-pressed={filter === t} onClick={() => setFilter(t)}>{t}</button>)}
        </div>
      </div>

      <Link className="gx-feature" to={`/guide/${feat.id}`}>
        <img src={img(feat.img, 1600)} alt="" referrerPolicy="no-referrer" />
        <span className="gx-feature__scrim" />
        <div className="gx-feature__body">
          <span className="gx-feature__type"><Icon name="compass" small /> {feat.type} · Editor's pick</span>
          <h2>{feat.title}</h2><p>{feat.lede}</p>
          <div className="gx-feature__meta"><span><Icon name="info" small /> {feat.read}</span><span>Updated {feat.updated}</span></div>
        </div>
      </Link>

      <section className="bg-whisper" aria-label="Before you go essentials">
        <div className="bg-whisper__head">
          <span className="bg-whisper__ic"><Icon name="sparkle" /></span>
          <div>
            <div className="bg-whisper__kind">A gentle whisper</div>
            <div className="bg-whisper__title">Read these before you go</div>
            <div className="bg-whisper__sub">The easy-to-forget essentials that make a trip smoother — and safer. A few minutes now saves real trouble later.</div>
          </div>
        </div>
        <div className="bg-whisper__grid">
          {BEFORE.map((b) => (
            <Link className="bg-card" to={b.to} key={b.t}>
              <span className="bg-card__ic"><Icon name={b.ic} /></span>
              <span className="bg-card__t">{b.t}{b.pri && <span className={`bg-card__pri bg-card__pri--${b.pri}`}>{b.priLabel}</span>}</span>
              <span className="bg-card__s">{b.s}</span>
              <span className="bg-card__cta">{b.cta} <Icon name="arrow" small /></span>
            </Link>
          ))}
        </div>
        <div className="bg-whisper__foot"><Icon name="info" small /> <span>Tuned to your trip once you've started one — these update as your itinerary fills.</span></div>
      </section>

      <div>
        {types.map((t) => {
          const items = GUIDES.filter((g) => g.type === t);
          if (!items.length) return null;
          return (
            <section className="gx-group" key={t}>
              <div className="gx-group__label">{t}</div>
              <div className="gx-grid">
                {items.map((g) => (
                  <Link className="gx-card" to={`/guide/${g.id}`} key={g.id}>
                    <div className="gx-card__media"><img src={img(g.img, 700)} alt="" loading="lazy" referrerPolicy="no-referrer" /><span className="gx-card__type">{g.type}</span></div>
                    <div className="gx-card__body">
                      <div className="gx-card__title">{g.title}</div>
                      <div className="gx-card__lede">{g.lede}</div>
                      <div className="gx-card__meta"><span><Icon name="info" small /> {g.read}</span><span>Updated {g.updated}</span></div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
