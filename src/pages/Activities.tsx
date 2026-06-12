import { useNavigate } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { siById, wellById } from "@/data/taxonomy";
import { ACTIVITIES } from "@/data/places";
import { useStore } from "@/store/useStore";
import { Eyebrow } from "@/components/ui/primitives";
import { JourneyBar } from "@/components/ui/StepIndicator";
import { cx } from "@/lib/utils";

export default function Activities() {
  const navigate = useNavigate();
  const { journeySIs, journeyActs, toggleAct } = useStore();
  // Show activities for chosen SIs (fall back to safari to demonstrate the surface).
  const sis = journeySIs.filter((s) => ACTIVITIES[s]?.length);
  const groups = (sis.length ? sis : ["safari"]).map((s) => ({ si: s, items: ACTIVITIES[s] || [] }));

  return (
    <>
      <JourneyBar current={3} crumbs={[{ label: "Home", to: "/" }, { label: "Interests", to: "/special-interests" }, { label: "Regions", to: "/regions" }, { label: "Activities" }]} />

      <div className="container jn-intro">
        <Eyebrow>The Dream Journey · Step 3 of 5</Eyebrow>
        <h1>What excites you most?</h1>
        <p className="lead">Pick the experiences that pull at you. Each one quietly pre-fills the right Well — so the next step is already half-built.</p>
      </div>

      <div className="container" style={{ paddingBottom: 40 }}>
        {groups.map(({ si, items }) => (
          <section className="si-group" key={si}>
            <div className="si-group__head">
              <h2 className="si-group__title">{siById(si)?.name || si}</h2>
              <span className="si-group__blurb">{siById(si)?.sig}</span>
            </div>
            <div className="si-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
              {items.map((a) => {
                const picked = journeyActs.includes(a.id);
                const w = wellById(a.well);
                return (
                  <button key={a.id} className={cx("card", picked && "pv--added")} aria-pressed={picked} onClick={() => toggleAct(a.id)}
                    style={{ padding: 20, display: "flex", gap: 14, alignItems: "flex-start", textAlign: "start", cursor: "pointer", border: picked ? "1px solid var(--primary)" : undefined }}>
                    <div className="icon-chip"><Icon name={w?.icon || "compass"} /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <h3 className="t-h3" style={{ fontSize: 18 }}>{a.name}</h3>
                        {picked && <Icon name="check" small className="" style={{ color: "var(--primary)" }} />}
                      </div>
                      <p className="t-body-s" style={{ color: "var(--muted-foreground)", marginTop: 4 }}>{a.line}</p>
                      <span className="pill pill-preview" style={{ marginTop: 10 }}>Pre-fills {w?.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="wp-continue">
        <div className="wp-continue__inner">
          <span className="wp-continue__text"><b>{journeyActs.length}</b> experiences chosen · they'll pre-fill your Wells</span>
          <button className="btn btn-primary" style={{ marginInlineStart: "auto" }} onClick={() => navigate("/wells-surface")}>Continue to the Wells <Icon name="arrow" small /></button>
        </div>
      </div>
    </>
  );
}
