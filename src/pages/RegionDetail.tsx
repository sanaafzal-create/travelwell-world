import { useParams, Link } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { regionByCode, SUBREGIONS } from "@/data/taxonomy";
import { REGION_DETAIL, DESTINATIONS, SUBREGION_TOP } from "@/data/places";
import { regionImg, img } from "@/lib/images";
import { useStore } from "@/store/useStore";
import { Eyebrow, Pill, ButtonLink } from "@/components/ui/primitives";
import { JourneyBar } from "@/components/ui/StepIndicator";

export default function RegionDetail() {
  const { code = "" } = useParams();
  const { setRegion } = useStore();
  const region = regionByCode(code);
  const detail = REGION_DETAIL[code];

  if (!region) return <div className="container" style={{ padding: "80px 0" }}><h1 className="t-display-l">Region not found.</h1><Link className="btn btn-primary" to="/regions" style={{ marginTop: 20 }}>All regions</Link></div>;

  const dests = DESTINATIONS[code] || [];
  const subs = SUBREGIONS[code];

  return (
    <>
      <JourneyBar current={2} crumbs={[{ label: "Home", to: "/" }, { label: "Regions", to: "/regions" }, { label: region.name }]} />

      <section style={{ position: "relative", minHeight: 440, display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
        <img src={regionImg(code, 1600)} alt="" referrerPolicy="no-referrer" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: region.status !== "live" ? "saturate(.25) brightness(1.02)" : undefined }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(20,18,14,.85), rgba(20,18,14,.1) 60%)" }} />
        <div className="container" style={{ position: "relative", zIndex: 2, padding: "0 var(--gutter) 44px", color: "#fff" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
            <span className="pill" style={{ background: "rgba(255,255,255,.16)", color: "#fff", border: "1px solid rgba(255,255,255,.3)", fontFamily: "var(--font-mono)" }}>{region.code}</span>
            <Pill kind={region.status === "live" ? "live" : "preview"}>{region.status === "live" ? "Live" : "Preview"}</Pill>
          </div>
          <h1 className="t-display-l" style={{ color: "#fff" }}>{region.name}</h1>
          <p className="t-lead" style={{ color: "rgba(255,255,255,.92)", marginTop: 8, maxWidth: "52ch" }}>{detail?.blurb || region.line}</p>
        </div>
      </section>

      <div className="container" style={{ padding: "40px 0 0", display: "grid", gridTemplateColumns: "1fr 300px", gap: 36, alignItems: "start" }}>
        <div>
          {detail?.season && (
            <>
              <Eyebrow>When to go</Eyebrow>
              <div className="si-grid" style={{ gridTemplateColumns: `repeat(${Math.min(3, detail.season.length)}, 1fr)`, marginTop: 14 }}>
                {detail.season.map((s) => (
                  <div key={s.l} className="card" style={{ padding: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <strong style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>{s.l}</strong>
                      <span className="t-body-s" style={{ color: "var(--primary)", fontWeight: 600 }}>{s.m}</span>
                    </div>
                    <p className="t-body-s" style={{ color: "var(--muted-foreground)", marginTop: 6 }}>{s.note}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {dests.length > 0 && (
            <section style={{ marginTop: 40 }}>
              <Eyebrow>Destinations</Eyebrow>
              <h2 className="t-h2" style={{ marginTop: 8 }}>Where to point yourself.</h2>
              <div className="dest-rail" style={{ marginTop: 18 }}>
                {dests.map((d) => (
                  <Link key={d.id} className="dest-card" to={`/destination/${d.id}`}>
                    <img src={img(d.img, 700)} alt="" loading="lazy" referrerPolicy="no-referrer" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                    <div className="dest-card__scrim" />
                    <div className="dest-card__top"><Pill kind={d.status === "live" ? "live" : "preview"}>{d.status === "live" ? "Live" : "Preview"}</Pill></div>
                    <div className="dest-card__body"><h3>{d.name}</h3><div className="meta">{d.country}</div></div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {subs && (
            <section style={{ marginTop: 40 }}>
              <Eyebrow>Travel sub-regions</Eyebrow>
              <h2 className="t-h2" style={{ marginTop: 8 }}>{region.name}, by region.</h2>
              <div className="si-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", marginTop: 18 }}>
                {subs.map((s) => (
                  <div key={s} className="card" style={{ padding: 18 }}>
                    <h3 className="t-h3" style={{ fontSize: 19 }}>{s}</h3>
                    <p className="t-body-s" style={{ color: "var(--muted-foreground)", marginTop: 6 }}>Top: {(SUBREGION_TOP[s] || []).join(" · ")}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside style={{ position: "sticky", top: 88, display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            <Eyebrow>At a glance</Eyebrow>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
              <div><div className="t-micro" style={{ color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: ".08em" }}>Countries</div><div className="t-body" style={{ fontWeight: 600 }}>{region.countries}</div></div>
              <div><div className="t-micro" style={{ color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: ".08em" }}>Gateways</div><div className="t-body" style={{ fontWeight: 600, fontFamily: "var(--font-mono)" }}>{region.gateways}</div></div>
              {detail?.countries && <div><div className="t-micro" style={{ color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: ".08em" }}>Includes</div><div className="t-body-s">{detail.countries.join(", ")}</div></div>}
            </div>
          </div>
          <ButtonLink to="/activities" onClick={() => setRegion(code)} style={{ width: "100%" }}>Continue to activities <Icon name="arrow" small /></ButtonLink>
        </aside>
      </div>
    </>
  );
}
