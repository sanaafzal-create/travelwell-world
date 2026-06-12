import { useParams, Link } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { GUIDES, MOROCCO_TOP8 } from "@/data/places";
import { img } from "@/lib/images";
import { Eyebrow, ButtonLink } from "@/components/ui/primitives";

export default function GuideDetail() {
  const { id } = useParams();
  const guide = GUIDES.find((g) => g.id === id);
  if (!guide) return <div className="container" style={{ padding: "80px 0" }}><h1 className="t-display-l">Guide not found.</h1><Link className="btn btn-primary" to="/guides" style={{ marginTop: 20 }}>All guides</Link></div>;

  const isMorocco = guide.id === "morocco-top8";

  return (
    <>
      <section style={{ position: "relative", minHeight: 420, display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
        <img src={img(guide.img, 1600)} alt="" referrerPolicy="no-referrer" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(20,18,14,.85), rgba(20,18,14,.05) 65%)" }} />
        <div className="container" style={{ position: "relative", zIndex: 2, padding: "0 var(--gutter) 44px", color: "#fff" }}>
          <span className="pill pill-gold" style={{ marginBottom: 12 }}>{guide.type}</span>
          <h1 className="t-display-l" style={{ color: "#fff", maxWidth: "20ch" }}>{guide.title}</h1>
          <p className="t-lead" style={{ color: "rgba(255,255,255,.9)", marginTop: 8 }}>{guide.read} · Updated {guide.updated}</p>
        </div>
      </section>

      <article className="container" style={{ maxWidth: "var(--reading-max)", padding: "48px 0 40px" }}>
        <p className="t-lead" style={{ color: "var(--foreground)" }}>{guide.lede}</p>
        <p className="t-body" style={{ marginTop: 20, color: "var(--muted-foreground)" }}>
          This is a representative guide body from the design prototype. In production, guide content is authored in the
          CMS / Supabase and rendered here — with live provider and destination links woven through the prose.
        </p>

        {isMorocco && (
          <div style={{ marginTop: 32 }}>
            <Eyebrow>The ranked route</Eyebrow>
            <ol style={{ listStyle: "none", padding: 0, marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {MOROCCO_TOP8.map((s) => (
                <li key={s.rank} className="card" style={{ padding: 18, display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <span style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--accent)", color: "var(--accent-foreground)", display: "grid", placeItems: "center", fontWeight: 700, flex: "none" }}>{s.rank}</span>
                  <div><strong style={{ fontFamily: "var(--font-display)", fontSize: 19 }}>{s.name}</strong><p className="t-body-s" style={{ color: "var(--muted-foreground)", marginTop: 4 }}>{s.note}</p></div>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div style={{ marginTop: 36, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <ButtonLink to="/special-interests">Design a trip around this <Icon name="arrow" small /></ButtonLink>
          <ButtonLink to="/guides" variant="secondary">More guides</ButtonLink>
        </div>
      </article>
    </>
  );
}
