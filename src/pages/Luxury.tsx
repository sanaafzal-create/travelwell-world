import { useSearchParams, useNavigate } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { LUX_WELLS } from "@/data/taxonomy";
import { WELL_DETAIL } from "@/data/places";
import { img } from "@/lib/images";
import { Eyebrow, ButtonLink } from "@/components/ui/primitives";
import { cx } from "@/lib/utils";

type Tier = "luxury" | "ultra";

export default function Luxury() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const tier: Tier = params.get("tier") === "ultra" ? "ultra" : "luxury";
  const setTier = (t: Tier) => setParams({ tier: t });

  const isUltra = tier === "ultra";

  return (
    <>
      <section className="lx-hero" style={{ position: "relative", minHeight: 520, display: "flex", alignItems: "center", overflow: "hidden" }}>
        <img className="lx-hero__img" src={img("luxuryPool", 1800)} alt="" referrerPolicy="no-referrer" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div className="lx-hero__scrim" style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg, rgba(10,12,14,.9), rgba(10,12,14,.45) 70%)" }} />
        <div className="container lx-hero__inner" style={{ position: "relative", zIndex: 2, color: "#fff" }}>
          <span className="lx-hero__eyebrow eyebrow" style={{ color: "var(--accent)" }}><Icon name="sparkle" small /> {isUltra ? "Ultra-Luxury World" : "Luxury World"}</span>
          <h1 className="t-display-xl" style={{ color: "#fff", marginTop: 14, maxWidth: "16ch" }}>
            {isUltra ? "When only extraordinary will do." : "Travel, perfected to the last detail."}
          </h1>
          <p className="t-lead" style={{ color: "rgba(255,255,255,.92)", marginTop: 16, maxWidth: "48ch" }}>
            {isUltra
              ? "The rarest experiences on earth, arranged so completely that all you do is arrive. A dedicated curator, every door open, nothing left to chance."
              : "Considered choices, vetted partners and a concierge who knows your taste. The finest of everything, without the friction."}
          </p>
          <div className="lx-hero__tierswitch lx-chooser__tabs" style={{ marginTop: 28, display: "inline-flex", background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.28)", borderRadius: "var(--radius-pill)", padding: 4 }}>
            <button className={cx("lx-chooser__tab")} onClick={() => setTier("luxury")} aria-pressed={!isUltra}
              style={{ padding: "8px 18px", borderRadius: "var(--radius-pill)", border: 0, cursor: "pointer", fontWeight: 600, background: !isUltra ? "#fff" : "transparent", color: !isUltra ? "var(--foreground)" : "#fff" }}>Luxury</button>
            <button className={cx("lx-chooser__tab")} onClick={() => setTier("ultra")} aria-pressed={isUltra}
              style={{ padding: "8px 18px", borderRadius: "var(--radius-pill)", border: 0, cursor: "pointer", fontWeight: 600, background: isUltra ? "var(--accent)" : "transparent", color: isUltra ? "var(--accent-foreground)" : "#fff" }}>Ultra-Luxury</button>
          </div>
        </div>
      </section>

      <div className="container" style={{ padding: "56px 0 0" }}>
        <Eyebrow>Beyond the ten Wells</Eyebrow>
        <h2 className="t-h2" style={{ marginTop: 8 }}>Two Wells, reserved for these worlds.</h2>
        <p className="t-lead" style={{ marginTop: 10 }}>Nanny-Well and Security-Well appear only in Luxury and Ultra-Luxury — discreet by design.</p>
        <div className="si-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", marginTop: 22 }}>
          {LUX_WELLS.map((w) => (
            <div key={w.id} className="card" style={{ padding: 24, display: "flex", gap: 18, alignItems: "flex-start" }}>
              <div className="icon-chip wb-chip--lux" style={{ color: "var(--gold-deep)" }}><Icon name={w.icon} /></div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}><h3 className="t-h3">{w.name}</h3><span className="pill pill-gold">Luxury</span></div>
                <p className="t-body-s" style={{ color: "var(--muted-foreground)", marginTop: 2 }}>{w.tag}</p>
                <p className="t-body-s" style={{ marginTop: 10 }}>{WELL_DETAIL[w.id]?.purpose}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container" style={{ padding: "48px 0 80px" }}>
        <div className="os-band">
          <div className="os-band__inner">
            <div>
              <Eyebrow>Your curator awaits</Eyebrow>
              <h2 style={{ color: "#fff" }}>{isUltra ? "A dedicated curator, on call." : "A concierge who knows your taste."}</h2>
              <p>Atlas hands you to a human curator for the rarest requests — private islands, closed museums after hours, a chef flown in for one night.</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <ButtonLink to="/special-interests" variant="gold">Begin a {isUltra ? "Ultra-Luxury" : "Luxury"} journey <Icon name="arrow" small /></ButtonLink>
              <button className="btn btn-secondary" onClick={() => navigate("/itinerary")}>See an example itinerary</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
