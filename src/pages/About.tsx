import { Link } from "react-router-dom";
import { WELLS } from "@/data/taxonomy";
import { Eyebrow } from "@/components/ui/primitives";

const LAYERS = [
  { num: "01", name: "Demand layer", chips: ["25 Special Interests", "13 Regions", "Activities graph", "Seasonal logic"] },
  { num: "02", name: "Fulfillment layer", chips: WELLS.map((w) => w.name).concat(["Nanny-Well", "Security-Well"]) },
  { num: "03", name: "Engine layer", chips: ["Concierge (Claude)", "Provider matching", "Itinerary sync", "Safety Cards", "Book-It tracks"] },
  { num: "04", name: "Data layer", chips: ["Travel ID", "Itinerary blocks", "Provider catalog", "Commission ledger", "Consent & locale"] },
];

const LAWS = [
  { t: "Honest content", s: "Real vs. placeholder is always visually distinct." },
  { t: "Disclosed economics", s: "FTC disclosure sits beside every monetized action." },
  { t: "One itinerary", s: "Everything a traveler adds lands in a single saved trip." },
  { t: "Safety first", s: "The Emergency Button and Safety Card travel everywhere." },
  { t: "Accessible to all", s: "WCAG AA, full keyboard paths, read-or-hear, type-or-talk." },
  { t: "The traveler chooses", s: "The Concierge suggests; the traveler always decides." },
];

export default function About() {
  return (
    <div className="ab">
      <div className="ab-hero">
        <Eyebrow>About · Architecture</Eyebrow>
        <h1>A travel platform, specified like an operating system.</h1>
        <p>TravelWell is built spec-first: every layer — the taxonomy, the Wells, the engines, the schemas — is defined and agreed before a line of UI is written. This is what makes it legible, defensible, and honest.</p>
      </div>

      <section className="ab" style={{ padding: 0, marginTop: 28 }}>
        <div className="ab-stat-row">
          <div className="ab-stat"><div className="ab-stat__v">25</div><div className="ab-stat__k">Special Interests</div></div>
          <div className="ab-stat"><div className="ab-stat__v">13</div><div className="ab-stat__k">World Regions</div></div>
          <div className="ab-stat"><div className="ab-stat__v">10</div><div className="ab-stat__k">Wells (+2 luxury)</div></div>
          <div className="ab-stat"><div className="ab-stat__v">6</div><div className="ab-stat__k">Time blocks / day</div></div>
        </div>
      </section>

      <section className="rd-section" style={{ maxWidth: "none", padding: "56px 0 0" }}>
        <div className="rd-section__head"><div><h2 className="t-h2">The OS layers</h2><p>Demand flows down; fulfillment and economics flow back up.</p></div></div>
        <div className="ab-layers">
          {LAYERS.map((l) => (
            <div className="ab-layer" key={l.num}>
              <div className="ab-layer__n"><div className="num">LAYER {l.num}</div><div className="name">{l.name}</div></div>
              <div className="ab-layer__chips">{l.chips.map((c) => <span className="ab-chip" key={c}>{c}</span>)}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rd-section" style={{ maxWidth: "none", padding: "56px 0 0" }}>
        <div className="rd-section__head"><div><h2 className="t-h2">The spec-first philosophy</h2></div></div>
        <div className="ab-philosophy">
          <h3>Specification before implementation.</h3>
          <p>Most travel sites grow as a pile of pages. TravelWell starts as a written specification — entities, fields, states, and the unbreakable laws — so the product is consistent by construction. The design you've been reviewing is the spec, made visible.</p>
        </div>
        <div className="ab-laws" style={{ marginTop: 20 }}>
          {LAWS.map((l, i) => (
            <div className="ab-law" key={l.t}>
              <span className="ab-law__n">{i + 1}</span>
              <div><div className="ab-law__t">{l.t}</div><div className="ab-law__s">{l.s}</div></div>
            </div>
          ))}
        </div>
      </section>

      <section className="ab-close">
        <div className="ab-close__bg" aria-hidden="true" />
        <div className="ab-close__inner">
          <Eyebrow className="ab-close__eyebrow">See it working</Eyebrow>
          <h2 className="ab-close__title">The architecture,<br />in a <span className="ab-close__em">live platform</span>.</h2>
          <p className="ab-close__sub">Everything you've read here is built. Walk the investor demo, or step into the traveler's journey from the very first screen.</p>
          <div className="ab-close__actions">
            <Link className="btn btn-gold" to="/special-interests" style={{ height: 56, padding: "0 32px", fontSize: 16 }}>Start the journey →</Link>
            <Link className="btn ab-close__ghost" to="/demo">Walk the platform demo</Link>
          </div>
          <div className="ab-close__stats">
            <span><b>25</b> interests</span><span className="ab-close__dot" />
            <span><b>13</b> regions</span><span className="ab-close__dot" />
            <span><b>10</b> Wells</span><span className="ab-close__dot" />
            <span><b>1</b> itinerary</span>
          </div>
          <p className="ab-close__sig">However far you go — <span className="tw">Travel Well.</span></p>
        </div>
      </section>
    </div>
  );
}
