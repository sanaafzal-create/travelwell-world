import { useParams, Link } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { siById, REGIONS, REGION_SI } from "@/data/taxonomy";
import { ACTIVITIES } from "@/data/places";
import { siImg, regionImg } from "@/lib/images";
import { useStore } from "@/store/useStore";
import { Eyebrow, Pill, ButtonLink, StatusPill } from "@/components/ui/primitives";

export default function SiDetail() {
  const { id } = useParams();
  const { toggleSI, journeySIs } = useStore();
  const si = siById(id || "");

  if (!si) return <div className="container" style={{ padding: "80px 0" }}><h1 className="t-display-l">Interest not found.</h1><Link className="btn btn-primary" to="/special-interests" style={{ marginTop: 20 }}>All interests</Link></div>;

  const picked = journeySIs.includes(si.id);
  const regions = REGIONS.filter((r) => (REGION_SI[r.code] || []).includes(si.id)).slice(0, 4);
  const acts = ACTIVITIES[si.id] || [];

  return (
    <>
      <section style={{ position: "relative", minHeight: 420, display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
        <img src={siImg(si.id, 1600)} alt="" referrerPolicy="no-referrer" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: si.status !== "live" ? "saturate(.25) brightness(1.02)" : undefined }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(20,18,14,.84), rgba(20,18,14,.1) 60%)" }} />
        <div className="container" style={{ position: "relative", zIndex: 2, padding: "0 var(--gutter) 44px", color: "#fff" }}>
          <div style={{ marginBottom: 14 }}><StatusPill status={si.status} /></div>
          <h1 className="t-display-l" style={{ color: "#fff" }}>{si.name}</h1>
          <p className="t-lead" style={{ color: "rgba(255,255,255,.92)", fontStyle: "italic", marginTop: 6 }}>{si.sig}</p>
          <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
            <button className="btn btn-gold" onClick={() => toggleSI(si.id)}>
              <Icon name={picked ? "check" : "sparkle"} small /> {picked ? "Added to your journey" : "Add to my journey"}
            </button>
            <ButtonLink to="/regions" variant="secondary">See matching regions <Icon name="arrow" small /></ButtonLink>
          </div>
        </div>
      </section>

      <div className="container" style={{ padding: "48px 0 0" }}>
        <Eyebrow>Where it shines</Eyebrow>
        <h2 className="t-h2" style={{ marginTop: 8 }}>Regions made for {si.name.toLowerCase()}.</h2>
        <div className="rg-grid" style={{ marginTop: 22 }}>
          {regions.map((r) => (
            <Link key={r.code} className="rg-card" to={`/region/${r.code}`}>
              <div className="rg-card__media">
                <img src={regionImg(r.code, 700)} alt="" loading="lazy" referrerPolicy="no-referrer" />
                <div className="scrim" /><span className="rg-card__code">{r.code}</span>
                <span className="rg-card__top-badge"><Pill kind={r.status === "live" ? "live" : "preview"}>{r.status === "live" ? "Live" : "Preview"}</Pill></span>
                <span className="rg-card__name">{r.name}</span>
              </div>
              <div className="rg-card__body"><span className="rg-card__line">{r.line}</span></div>
            </Link>
          ))}
        </div>
      </div>

      {acts.length > 0 && (
        <div className="container" style={{ padding: "48px 0 80px" }}>
          <Eyebrow>What you'll do</Eyebrow>
          <h2 className="t-h2" style={{ marginTop: 8 }}>Signature experiences.</h2>
          <div className="si-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", marginTop: 22 }}>
            {acts.map((a) => (
              <div key={a.id} className="card" style={{ padding: 20, display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div className="icon-chip"><Icon name="compass" /></div>
                <div><h3 className="t-h3" style={{ fontSize: 19 }}>{a.name}</h3><p className="t-body-s" style={{ color: "var(--muted-foreground)", marginTop: 4 }}>{a.line}</p></div>
              </div>
            ))}
          </div>
          <ButtonLink to="/regions" style={{ marginTop: 28 }}>Build a journey around this <Icon name="arrow" small /></ButtonLink>
        </div>
      )}
    </>
  );
}
