import { useState } from "react";
import { Icon } from "@/lib/icons";
import { Eyebrow } from "@/components/ui/primitives";

const LIFE = [
  { ic: "shield", t: "Tourniquet & trauma dressing", s: "Stop severe bleeding fast — the single most important item in any kit." },
  { ic: "heart", t: "Emergency medication card", s: "Antihistamine, aspirin, rehydration salts, and your allergy info on hand." },
  { ic: "phone", t: "Safety Card QR", s: "One scan to the nearest hospital, your embassy, and local emergency numbers." },
];

const CATS = [
  { ic: "shield", t: "Wound care", items: ["Assorted plasters", "Sterile gauze & tape", "Antiseptic wipes", "Blister dressings", "Tweezers & scissors"] },
  { ic: "heart", t: "Medication", items: ["Pain & fever relief", "Antihistamine", "Anti-diarrheal", "Rehydration salts", "Motion-sickness tabs"] },
  { ic: "sun", t: "Climate & skin", items: ["SPF 50 sachets", "After-sun gel", "Insect repellent", "Bite relief", "Lip balm"] },
  { ic: "compass", t: "Travel essentials", items: ["Digital thermometer", "Safety pins", "Emergency blanket", "Nitrile gloves", "First-aid guide"] },
];

const PROFILES = [
  { icon: "compass", t: "The adventurer", s: "Trekking, safari, remote places far from a pharmacy." },
  { icon: "heart", t: "The family", s: "Scrapes, fevers and sniffles — handled, anywhere." },
  { icon: "globe", t: "The solo traveler", s: "Self-reliant and prepared, wherever you wander." },
  { icon: "plane", t: "The frequent flyer", s: "Slips in a carry-on; ready for the next departure." },
];

const FAQ = [
  { q: "Is it airline carry-on friendly?", a: "Yes — every item meets TSA and international carry-on rules. No liquids over the limit, no sharp items that won't pass security. It's designed to fly in the cabin with you." },
  { q: "How does the QR Safety Card work?", a: "Each kit has a unique QR code printed inside the lid. Scan it with any phone camera and TravelWell opens the live Safety Card for your current location — nearest hospital, embassy, local emergency number, and any active advisories. No app required." },
  { q: "Can I customize what's inside?", a: "At launch you'll be able to add prescription pouches and destination-specific modules (e.g. high-altitude or tropical add-ons). The base kit covers the essentials for any trip." },
  { q: "What's the shelf life?", a: "Three years from ship date. We'll send a gentle reminder before anything expires, with an easy refill option." },
  { q: "When does it ship, and when am I charged?", a: "We're finishing production now. Pre-orders are free to place — you're only charged when secure checkout opens at launch and your kit is ready to ship." },
];

export default function FirstAidKit() {
  const [openFaq, setOpenFaq] = useState(0);
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [successMsg, setSuccessMsg] = useState("We'll email you the moment the kit ships.");
  const [invalid, setInvalid] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    setSuccessMsg("We'll email " + v + " the moment the kit ships.");
    setDone(true);
  };

  return (
    <main id="main">
      <section className="fa-hero">
        <div className="fa-hero__inner">
          <div className="fa-hero__copy">
            <Eyebrow>First Aid · A TravelWell Product</Eyebrow>
            <h1>The Travel First Aid Kit.</h1>
            <p>Compact, comprehensive, and built for the road — the things you hope you never need, organized so you can find them in seconds. With a QR code that links straight to your destination's live Safety Card.</p>
            <div className="fa-hero__price"><span className="amt">$89</span><span className="note">free shipping · ships at launch</span></div>
            <div className="fa-hero__actions">
              <a className="btn btn-primary" href="#preorder" style={{ height: 52, padding: "0 28px", fontSize: 16 }}>Pre-order now</a>
              <a className="btn btn-secondary" href="#inside" style={{ height: 52 }}>See what's inside</a>
            </div>
            <div className="fa-hero__trust">
              <span><Icon name="shield" small /> Clinician-reviewed</span>
              <span><Icon name="box" small /> TSA-friendly</span>
              <span><Icon name="info" small /> 3-year shelf life</span>
            </div>
          </div>
          <div className="fa-product">
            <div className="fa-kit"><div className="fa-kit__cross"></div><div className="fa-kit__brand">TravelWell</div></div>
          </div>
        </div>
      </section>

      {/* life-saving items */}
      <section className="fa-section">
        <div className="fa-lifesaving">
          <Eyebrow>The ones that matter most</Eyebrow>
          <h2>Three things that can save a life.</h2>
          <div className="fa-life-grid">
            {LIFE.map((l) => (
              <div className="fa-life" key={l.t}>
                <div className="fa-life__ic"><Icon name={l.ic} /></div>
                <div>
                  <div className="fa-life__t">{l.t}</div>
                  <div className="fa-life__s">{l.s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* what's inside */}
      <section className="fa-section" id="inside">
        <div className="fa-shead"><Eyebrow>What's inside</Eyebrow><h2>Forty-plus items, four clear categories.</h2><p>Everything labeled, everything findable — no rummaging when it matters.</p></div>
        <div className="fa-cats">
          {CATS.map((c) => (
            <div className="fa-cat" key={c.t}>
              <div className="fa-cat__ic"><Icon name={c.ic} /></div>
              <div className="fa-cat__t">{c.t}</div>
              <div className="fa-cat__items">
                {c.items.map((i) => (
                  <div className="fa-cat__item" key={i}><span className="dot"></span>{i}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* QR integration */}
      <section className="fa-section">
        <div className="fa-qr">
          <div className="fa-qr__visual"><div className="fa-qr__code"><div className="grid"></div></div></div>
          <div className="fa-qr__copy">
            <Eyebrow>The digital part</Eyebrow>
            <h2>One scan to your destination's Safety Card.</h2>
            <p>Every kit carries a QR code. Scan it and TravelWell pulls up the live Safety Card for wherever you are — nearest hospital, your embassy, the local emergency number, and current advisories. The physical kit, connected to the platform.</p>
            <div className="fa-qr__steps">
              <span className="fa-qr__step"><span className="n">1</span> Scan the kit</span>
              <span className="fa-qr__step"><span className="n">2</span> Confirm your location</span>
              <span className="fa-qr__step"><span className="n">3</span> Help, instantly</span>
            </div>
          </div>
        </div>
      </section>

      {/* target profiles */}
      <section className="fa-section">
        <div className="fa-shead"><Eyebrow>Who it's for</Eyebrow><h2>Made for how you travel.</h2></div>
        <div className="fa-profiles">
          {PROFILES.map((p) => (
            <div className="fa-profile" key={p.t}>
              <div className="fa-profile__ic"><Icon name={p.icon} /></div>
              <div className="fa-profile__t">{p.t}</div>
              <div className="fa-profile__s">{p.s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="fa-section">
        <div className="fa-shead"><Eyebrow>Questions</Eyebrow><h2>Good to know.</h2></div>
        <div className="fa-faq">
          {FAQ.map((f, i) => (
            <div className="fa-faq__item" data-open={openFaq === i} key={f.q}>
              <button className="fa-faq__q" onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                <Icon name="info" small /> {f.q} <span className="chev"><Icon name="chev" small /></span>
              </button>
              <div className="fa-faq__a">{f.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* preorder */}
      <section className="fa-section" id="preorder">
        <div className="fa-preorder" data-state={done ? "done" : "browse"}>
          <div className="fa-preorder__prompt">
            <span className="eyebrow" style={{ color: "rgba(255,255,255,.85)" }}>Pre-order</span>
            <h2>Be first to carry one.</h2>
            <p>We're finishing production now. Leave your email and we'll reserve yours and let you know the moment it ships — no charge until then.</p>
          </div>
          <form className="fa-preorder__form" onSubmit={submit} noValidate>
            <input
              type="email"
              placeholder="you@email.com"
              aria-label="Email for pre-order"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={invalid ? { outline: "2px solid #fff" } : undefined}
            />
            <button className="btn btn-gold" type="submit" style={{ height: "auto", padding: "0 24px" }}>Reserve mine</button>
          </form>
          <p className="fa-preorder__note">Email pre-order now · secure checkout opens at launch · cancel anytime</p>
          <div className="fa-preorder__success">
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,.18)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
              <Icon name="check" style={{ width: 32, height: 32, stroke: "#fff" }} />
            </div>
            <h2>You're on the list.</h2>
            <p>{successMsg}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
