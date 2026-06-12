import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { GUIDES, GUIDE_TYPES } from "@/data/places";
import { img } from "@/lib/images";
import { Eyebrow } from "@/components/ui/primitives";

export default function Guides() {
  const [type, setType] = useState<string>("all");
  const guides = type === "all" ? GUIDES : GUIDES.filter((g) => g.type === type);

  return (
    <>
      <div className="container jn-intro">
        <Eyebrow>Read before you go</Eyebrow>
        <h1>Travel guides, written to be useful.</h1>
        <p className="lead">Field guides, seasonal timing, ranked lists and how-tos — the honest briefings that turn a good trip into a great one.</p>
        <div className="jn-filter" style={{ marginTop: 22 }}>
          <button aria-pressed={type === "all"} onClick={() => setType("all")}>All</button>
          {GUIDE_TYPES.map((t) => <button key={t} aria-pressed={type === t} onClick={() => setType(t)}>{t}</button>)}
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 80 }}>
        <div className="si-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          {guides.map((g) => (
            <Link key={g.id} className="card" to={`/guide/${g.id}`} style={{ overflow: "hidden", color: "inherit", display: "flex", flexDirection: "column" }}>
              <div style={{ height: 180, position: "relative" }}>
                <img src={img(g.img, 700)} alt="" loading="lazy" referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <span className="pill pill-gold" style={{ position: "absolute", top: 12, left: 12 }}>{g.type}</span>
              </div>
              <div style={{ padding: "18px 20px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
                <h3 className="t-h3" style={{ fontSize: 20 }}>{g.title}</h3>
                <p className="t-body-s" style={{ color: "var(--muted-foreground)", marginTop: 8, flex: 1 }}>{g.lede}</p>
                <div className="si-card__foot" style={{ marginTop: 14 }}>
                  <span><Icon name="read" small /> {g.read}</span>
                  <span>Updated {g.updated}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
