import { Icon } from "@/lib/icons";
import { Eyebrow, ButtonLink } from "@/components/ui/primitives";

const LAWS = [
  { icon: "globe", t: "Every fact is real", s: "We never fabricate a price, a provider, or a safety number. Preview is labeled Preview." },
  { icon: "info", t: "Every link is disclosed", s: "FTC disclosure sits adjacent to every monetized CTA — never hidden." },
  { icon: "compass", t: "You always choose", s: "Atlas suggests and shapes, but it never books for you. You're in control." },
  { icon: "shield", t: "Safety, surfaced", s: "Level + number + label, nearest hospital, embassy and local emergency line." },
];

const ARCH = [
  { n: "25", t: "Special Interests", s: "Ways of traveling — the feeling you start from." },
  { n: "13", t: "Regions", s: "Places, ranked by how well they fit you." },
  { n: "10+2", t: "Wells", s: "Every need on a trip, mapped to the body." },
  { n: "200+", t: "Providers", s: "Vetted partners, Prime-first, all disclosed." },
];

export default function About() {
  return (
    <>
      <section className="ab-hero band-dark" style={{ padding: "80px 0" }}>
        <div className="container" style={{ maxWidth: "var(--reading-max)" }}>
          <Eyebrow>About / Architecture</Eyebrow>
          <h1 className="t-display-l" style={{ color: "#fff", marginTop: 12 }}>A Travel Operating System.</h1>
          <p className="t-lead" style={{ color: "var(--dark-band-muted)", marginTop: 16 }}>
            TravelWell.World routes a traveler from a feeling — a Special Interest — to a place, to what excites them,
            to their needs across the ten Wells, all the way to a booked, beautifully organized trip.
          </p>
        </div>
      </section>

      <div className="container" style={{ padding: "56px 0 0" }}>
        <Eyebrow>The architecture</Eyebrow>
        <div className="si-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginTop: 18 }}>
          {ARCH.map((a) => (
            <div key={a.t} className="card" style={{ padding: 24 }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 40, color: "var(--gold-deep)" }}>{a.n}</div>
              <h3 className="t-h3" style={{ fontSize: 19, marginTop: 6 }}>{a.t}</h3>
              <p className="t-body-s" style={{ color: "var(--muted-foreground)", marginTop: 6 }}>{a.s}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="container ab-philosophy" style={{ padding: "56px 0 80px" }}>
        <Eyebrow>The trust language — non-negotiable</Eyebrow>
        <div className="si-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", marginTop: 18 }}>
          {LAWS.map((l) => (
            <div key={l.t} className="card" style={{ padding: 24, display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div className="icon-chip"><Icon name={l.icon} /></div>
              <div><h3 className="t-h3" style={{ fontSize: 19 }}>{l.t}</h3><p className="t-body-s" style={{ color: "var(--muted-foreground)", marginTop: 6 }}>{l.s}</p></div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 36, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <ButtonLink to="/special-interests">Try the traveler flow <Icon name="arrow" small /></ButtonLink>
          <ButtonLink to="/sitemap" variant="secondary">See the full sitemap</ButtonLink>
        </div>
      </div>
    </>
  );
}
