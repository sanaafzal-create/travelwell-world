import { useState } from "react";
import { Icon } from "@/lib/icons";
import { Eyebrow, ButtonLink, Ftc } from "@/components/ui/primitives";

const STATS = [
  { n: "25", l: "Special Interests", b: "ways to travel" },
  { n: "13", l: "Regions", b: "global coverage" },
  { n: "10+2", l: "Wells", b: "needs, monetized" },
  { n: "200+", l: "Partners", b: "vetted · disclosed" },
];

// Illustrative placeholders — MUST be replaced with audited figures before real investor use.
const ECONOMICS = [
  { model: "Commission on bookings", take: "8–18%", note: "Stay, Fly, Move, Activities — paid by partners" },
  { model: "Affiliate referrals", take: "3–10%", note: "Gear, Shop — disclosed via /go handoff" },
  { model: "Premium tiers", take: "Subscription", note: "Luxury / Ultra concierge & curation" },
];

export default function Demo({ gated = false }: { gated?: boolean }) {
  const [unlocked, setUnlocked] = useState(!gated);
  const [code, setCode] = useState("");
  const [err, setErr] = useState(false);

  if (gated && !unlocked) {
    return (
      <div className="container inv-gate" style={{ maxWidth: 480, padding: "96px 0" }}>
        <div className="inv-gate__card card" style={{ padding: 32, textAlign: "center" }}>
          <div className="inv-gate__ic icon-chip" style={{ margin: "0 auto 16px", width: 56, height: 56 }}><Icon name="lock" /></div>
          <Eyebrow>Investor access</Eyebrow>
          <h1 className="t-h2" style={{ marginTop: 8 }}>VC Demo</h1>
          <p className="t-body-s" style={{ color: "var(--muted-foreground)", marginTop: 8 }}>Enter your access code to continue.</p>
          <form onSubmit={(e) => { e.preventDefault(); if (code.trim().toUpperCase() === "TWW2026") { setUnlocked(true); setErr(false); } else setErr(true); }}
            style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            <input className="inv-gate__field" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Access code"
              style={{ padding: "12px 16px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: 15, textAlign: "center", letterSpacing: ".1em" }} />
            {err && <div className="inv-gate__err" style={{ color: "var(--destructive)", fontSize: 13 }}>That code didn't match. Try again.</div>}
            <button className="btn btn-primary" type="submit">Unlock the demo</button>
            <span className="inv-gate__hint t-micro" style={{ color: "var(--muted-foreground)" }}>Hint for reviewers: TWW2026</span>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="inv-hero band-dark" style={{ padding: "72px 0" }}>
        <div className="container">
          <Eyebrow>{gated ? "Investor demo" : "The opportunity"}</Eyebrow>
          <h1 className="t-display-l" style={{ color: "#fff", marginTop: 12, maxWidth: "18ch" }}>A Travel Operating System.</h1>
          <p className="t-lead" style={{ color: "var(--dark-band-muted)", marginTop: 14, maxWidth: "52ch" }}>
            We route a traveler from a feeling to a booked trip — monetized through disclosed partners across ten Wells of need.
          </p>
          <div className="os-stats" style={{ marginTop: 32, maxWidth: 720 }}>
            {STATS.map((s) => (
              <div className="os-stat" key={s.l}><div className="n">{s.n}</div><div className="l">{s.l}</div><div className="b">{s.b}</div></div>
            ))}
          </div>
        </div>
      </section>

      <div className="container" style={{ padding: "56px 0 0" }}>
        <Eyebrow>Unit economics</Eyebrow>
        <h2 className="t-h2" style={{ marginTop: 8 }}>How the system earns — honestly.</h2>
        <div className="inv-rev" style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 12 }}>
          {ECONOMICS.map((e) => (
            <div key={e.model} className="card inv-rev__row" style={{ padding: 20, display: "flex", gap: 16, alignItems: "center" }}>
              <div className="inv-rev__ic icon-chip"><Icon name="bag2" /></div>
              <div style={{ flex: 1 }}>
                <div className="inv-rev__name" style={{ fontWeight: 600, fontFamily: "var(--font-display)", fontSize: 18 }}>{e.model}</div>
                <div className="inv-rev__model t-body-s" style={{ color: "var(--muted-foreground)" }}>{e.note}</div>
              </div>
              <div className="inv-rev__take" style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 22, color: "var(--gold-deep)" }}>{e.take}</div>
            </div>
          ))}
        </div>

        <div className="inv-disclaimer card" style={{ marginTop: 24, padding: 18, background: "var(--surface-alt)" }}>
          <Ftc>Investor economics shown here are <b>illustrative placeholders</b> — they must be replaced with audited figures before any real investor use.</Ftc>
        </div>
      </div>

      <div className="container" style={{ padding: "40px 0 80px", display: "flex", gap: 12, flexWrap: "wrap" }}>
        <ButtonLink to="/special-interests">Walk the traveler flow <Icon name="arrow" small /></ButtonLink>
        <ButtonLink to="/about" variant="secondary">Read the architecture</ButtonLink>
      </div>
    </>
  );
}
