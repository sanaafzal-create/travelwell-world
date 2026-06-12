import { Link } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { siById, WELLS } from "@/data/taxonomy";
import { useStore } from "@/store/useStore";
import { Eyebrow, ButtonLink } from "@/components/ui/primitives";

const PARTY = [
  { id: "A", name: "Amara", tag: "Trip lead · books & pays · 35–44", role: "You" },
  { id: "J", name: "Jhumur", tag: "Partner · 35–44", role: "Adult" },
];

export default function Profile() {
  const { journeySIs, trip } = useStore();
  const interests = (journeySIs.length ? journeySIs : ["safari", "romance", "culinary"]).map((s) => siById(s)?.name || s);

  return (
    <div className="container" style={{ padding: "48px 0 80px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
        <div>
          <Eyebrow>Your Travel ID</Eyebrow>
          <h1 className="t-display-l" style={{ marginTop: 8 }}>Amara's travel identity</h1>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <ButtonLink to="/signup" variant="secondary"><Icon name="arrow" small /> Rebuild from scratch</ButtonLink>
          <ButtonLink to="/itinerary">Open my trip <Icon name="arrow" small /></ButtonLink>
        </div>
      </div>

      {/* Passport-style Identity Card */}
      <div className="idp band-dark" style={{ marginTop: 24, borderRadius: "var(--radius-lg)", overflow: "hidden", padding: 32 }}>
        <div className="idp__top" style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div className="idp__seal" style={{ width: 56, height: 56, borderRadius: "50%", border: "2px solid rgba(255,255,255,.4)", display: "grid", placeItems: "center", flex: "none" }}><Icon name="globe" /></div>
          <div>
            <div className="idp__kicker eyebrow" style={{ color: "var(--accent)" }}>TravelWell · Identity Card</div>
            <div className="idp__title t-h2" style={{ color: "#fff" }}>Romantic getaway</div>
          </div>
        </div>
        <div className="idp__sig" style={{ marginTop: 18, display: "flex", gap: 28, flexWrap: "wrap", fontFamily: "var(--font-mono)", fontSize: 12.5, letterSpacing: ".08em", color: "var(--dark-band-muted)", textTransform: "uppercase" }}>
          <span>ID · TW–2A9F–K3</span><span>Party · 2</span><span>Window · July 2026</span><span>Since · Jun 2026</span>
        </div>
      </div>

      <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
        <section>
          <Eyebrow>Traveling party</Eyebrow>
          <div className="idp-party" style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            {PARTY.map((p) => (
              <div key={p.id} className="card idp-member" style={{ padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
                <div className="idp-member__av icon-chip">{p.id}</div>
                <div style={{ flex: 1 }}><div className="idp-member__name" style={{ fontWeight: 600 }}>{p.name}</div><div className="idp-member__meta t-body-s" style={{ color: "var(--muted-foreground)" }}>{p.tag}</div></div>
                <span className="pill pill-preview">{p.role}</span>
              </div>
            ))}
          </div>

          <h3 className="eyebrow" style={{ marginTop: 24, display: "block" }}>Travels for</h3>
          <div className="idp-chips" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            {interests.map((i) => <span key={i} className="pill pill-live">{i}</span>)}
          </div>
        </section>

        <section>
          <Eyebrow>The dream</Eyebrow>
          <blockquote className="idp-dream card" style={{ marginTop: 14, padding: 20, borderInlineStart: "4px solid var(--accent)", fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 19, lineHeight: 1.5 }}>
            “An unhurried anniversary safari — golden-hour game drives, candlelit dinners under the stars, and a few slow mornings with coffee and a view.”
          </blockquote>

          <h3 className="eyebrow" style={{ marginTop: 24, display: "block" }}>Budget ranges</h3>
          <div className="pf-budget" style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {WELLS.filter((w) => w.status === "live").slice(0, 5).map((w, i) => (
              <div key={w.id} className="pf-budget__row" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="pf-budget__name t-body-s" style={{ minWidth: 96 }}>{w.name}</span>
                <div className="pf-budget__track" style={{ flex: 1, height: 8, background: "var(--surface-alt)", borderRadius: 999, overflow: "hidden" }}>
                  <div className="pf-budget__fill" style={{ width: `${60 + i * 8}%`, height: "100%", background: "var(--primary)" }} />
                </div>
                <span className="pf-budget__tier t-micro" style={{ color: "var(--muted-foreground)", minWidth: 80, textAlign: "end" }}>{["Comfort", "Premium", "Comfort", "Value", "Premium"][i]}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="pf-danger card" style={{ marginTop: 32, padding: 20, display: "flex", alignItems: "center", gap: 16, borderColor: "color-mix(in oklch, var(--destructive) 30%, var(--border))" }}>
        <Icon name="shield" />
        <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>Your data, your call</div><div className="t-body-s" style={{ color: "var(--muted-foreground)" }}>Edit or delete everything, anytime. We store an age range, never a birthday.</div></div>
        <Link className="btn btn-secondary" to="/signup">Manage</Link>
      </div>

      <p className="t-body-s" style={{ marginTop: 20, color: "var(--muted-foreground)" }}>Trip in progress: <b>{trip.length}</b> blocks across your Wells. <Link to="/itinerary">Open the itinerary →</Link></p>
    </div>
  );
}
