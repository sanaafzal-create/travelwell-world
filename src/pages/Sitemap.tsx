import { Link } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { Eyebrow } from "@/components/ui/primitives";

const SPINE = [
  { step: 1, t: "Interests", to: "/special-interests" },
  { step: 2, t: "Region", to: "/regions" },
  { step: 3, t: "Activities", to: "/activities" },
  { step: 4, t: "The Wells", to: "/wells-surface" },
  { step: 5, t: "Itinerary · Book", to: "/itinerary" },
];

const GROUPS: { kind: string; title: string; links: { label: string; to: string }[] }[] = [
  { kind: "core", title: "Entry & Home", links: [{ label: "Home", to: "/" }, { label: "Plan Your Trip", to: "/plan" }] },
  { kind: "account", title: "Onboarding · Travel ID", links: [{ label: "Sign Up (6-step)", to: "/signup" }, { label: "Sign In", to: "/signin" }, { label: "Verify Email", to: "/verify" }, { label: "Activation", to: "/activation" }, { label: "Profile", to: "/profile" }] },
  { kind: "core", title: "Dream Journey", links: [{ label: "Special Interests", to: "/special-interests" }, { label: "Regions", to: "/regions" }, { label: "Activities", to: "/activities" }, { label: "Wells Surface", to: "/wells-surface" }, { label: "Destinations", to: "/destinations" }] },
  { kind: "core", title: "Wells & Partners", links: [{ label: "Wells index", to: "/wells" }, { label: "Providers", to: "/providers" }, { label: "Affiliate handoff (go)", to: "/go" }] },
  { kind: "core", title: "Content & Premium", links: [{ label: "Guides", to: "/guides" }, { label: "Luxury & Ultra", to: "/luxury" }, { label: "First Aid Kit", to: "/first-aid-kit" }] },
  { kind: "system", title: "Investor / System", links: [{ label: "Public Demo", to: "/demo" }, { label: "VC Demo (gated)", to: "/vc-demo" }, { label: "About / Architecture", to: "/about" }] },
];

const KIND_COLOR: Record<string, string> = { core: "var(--primary)", account: "var(--accent)", system: "var(--foreground)" };

export default function Sitemap() {
  return (
    <div className="container" style={{ padding: "56px 0 80px" }}>
      <Eyebrow>Reference · navigation</Eyebrow>
      <h1 className="t-display-l" style={{ marginTop: 12 }}>TravelWell.World — <em style={{ fontStyle: "italic", color: "var(--gold-deep)" }}>site map</em>.</h1>
      <p className="t-lead" style={{ marginTop: 14, maxWidth: "60ch" }}>Every screen, grouped by area. The teal spine is the core “Dream Journey” — the path most visitors take.</p>

      <div className="card band-dark" style={{ marginTop: 32, padding: 32, borderRadius: "var(--radius-lg)" }}>
        <Eyebrow>The experience spine</Eyebrow>
        <h2 style={{ color: "#fff", marginTop: 8, fontSize: 28 }}>How a traveler moves from a feeling to a booked trip</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginTop: 24 }}>
          {SPINE.map((s) => (
            <Link key={s.step} to={s.to} className="card" style={{ padding: 18, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.14)", color: "#fff" }}>
              <div className="eyebrow" style={{ color: "var(--accent)" }}>Step {s.step}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 20, marginTop: 6 }}>{s.t}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="si-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", marginTop: 28 }}>
        {GROUPS.map((g) => (
          <div key={g.title} className="card" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: KIND_COLOR[g.kind], flex: "none" }} />
              <h3 className="t-h3" style={{ fontSize: 20 }}>{g.title}</h3>
            </div>
            <ul style={{ listStyle: "none", padding: 0, marginTop: 12, display: "flex", flexDirection: "column", gap: 2 }}>
              {g.links.map((l) => (
                <li key={l.to}><Link className="tw-mega__link" to={l.to}><Icon name="arrow" small /> {l.label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
