import { Link } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { WELLS, LUX_WELLS } from "@/data/taxonomy";
import { WELL_DETAIL } from "@/data/places";
import { Eyebrow, StatusPill, IconChip, ButtonLink } from "@/components/ui/primitives";

export default function Wells() {
  return (
    <>
      <div className="container jn-intro">
        <Eyebrow>The architecture</Eyebrow>
        <h1>Ten Wells, one body.</h1>
        <p className="lead">Every need on a trip maps to a Well — a part of the body. Together they make a journey that's whole: nothing forgotten, everything disclosed.</p>
      </div>

      <div className="container" style={{ paddingBottom: 40 }}>
        <div className="si-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
          {WELLS.map((w) => {
            const d = WELL_DETAIL[w.id];
            return (
              <Link key={w.id} id={w.id} className="card" to={`/well/${w.id}`} style={{ padding: 24, display: "flex", gap: 18, alignItems: "flex-start", color: "inherit" }}>
                <IconChip name={w.icon} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <h3 className="t-h3">{w.name}</h3>
                    <StatusPill status={w.status} />
                  </div>
                  <p className="t-body-s" style={{ color: "var(--muted-foreground)", marginTop: 2 }}>{w.tag} · the <b>{w.body}</b></p>
                  <p className="t-body-s" style={{ marginTop: 10 }}>{d?.purpose}</p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="si-group__head" style={{ marginTop: 44 }}>
          <h2 className="si-group__title">Luxury &amp; Ultra only</h2>
          <span className="si-group__blurb">Appear only in Luxury / Ultra contexts.</span>
        </div>
        <div className="si-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", marginTop: 16 }}>
          {LUX_WELLS.map((w) => (
            <div key={w.id} className="card" style={{ padding: 24, display: "flex", gap: 18, alignItems: "flex-start" }}>
              <IconChip name={w.icon} className="wb-chip--lux" />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <h3 className="t-h3">{w.name}</h3>
                  <span className="pill pill-gold">Luxury</span>
                </div>
                <p className="t-body-s" style={{ color: "var(--muted-foreground)", marginTop: 2 }}>{w.tag} · the <b>{w.body}</b></p>
                <p className="t-body-s" style={{ marginTop: 10 }}>{WELL_DETAIL[w.id]?.purpose}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 40 }}>
          <ButtonLink to="/providers">Browse all providers <Icon name="arrow" small /></ButtonLink>
        </div>
      </div>
    </>
  );
}
