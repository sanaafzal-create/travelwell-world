import { useParams, Link, useNavigate } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { WELLS, wellById } from "@/data/taxonomy";
import { DESTINATIONS, PROVIDERS, type Destination, type Provider } from "@/data/places";
import { img } from "@/lib/images";
import { useStore } from "@/store/useStore";
import { Eyebrow, Pill, SafetyChip, Ftc, IconChip } from "@/components/ui/primitives";
import { cap } from "@/lib/utils";

function findDest(id?: string): { dest?: Destination; code?: string } {
  for (const code of Object.keys(DESTINATIONS)) {
    const d = DESTINATIONS[code].find((x) => x.id === id);
    if (d) return { dest: d, code };
  }
  return {};
}

export default function DestinationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToTrip } = useStore();
  const { dest } = findDest(id);

  if (!dest) {
    return (
      <div className="container" style={{ padding: "80px 0" }}>
        <Eyebrow>Not found</Eyebrow>
        <h1 className="t-display-l">That destination wandered off the map.</h1>
        <Link className="btn btn-primary" to="/destinations" style={{ marginTop: 24 }}>Back to destinations</Link>
      </div>
    );
  }

  // Provider stacks by Well (using the prototype's representative Mara catalog).
  const stacks = WELLS.filter((w) => (PROVIDERS[w.id] || []).length).slice(0, 4);
  function book(p: Provider) {
    const w = wellById(p.well);
    if (p.mode === "affiliate") { navigate(`/go?to=${encodeURIComponent(p.name)}&well=${p.well}`); return; }
    addToTrip({ well: p.well, icon: w?.icon || "compass", name: p.name, meta: `${w?.name} · ${dest!.name}`, status: "pending" });
  }

  return (
    <>
      <section style={{ position: "relative", minHeight: 460, display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
        <img src={img(dest.img, 1600)} alt="" referrerPolicy="no-referrer"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(20,18,14,.82), rgba(20,18,14,.1) 60%, rgba(20,18,14,.3))" }} />
        <div className="container" style={{ position: "relative", zIndex: 2, padding: "0 var(--gutter) 48px", color: "#fff" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <Pill kind={dest.status === "live" ? "live" : "preview"}>{dest.status === "live" ? "Live" : "Preview"}</Pill>
          </div>
          <h1 className="t-display-l" style={{ color: "#fff" }}>{dest.name}</h1>
          <p className="t-lead" style={{ color: "rgba(255,255,255,.92)", marginTop: 8 }}><Icon name="pin" small /> {dest.country} · {dest.line}</p>
        </div>
      </section>

      <div className="container" style={{ padding: "40px var(--gutter) 0", display: "grid", gridTemplateColumns: "1fr 320px", gap: 36, alignItems: "start" }}>
        <div>
          <Eyebrow>Plan your stay</Eyebrow>
          <h2 className="t-h2" style={{ marginTop: 8 }}>Everything you need, by Well.</h2>
          <p className="t-lead" style={{ marginTop: 10 }}>We've stacked vetted options for {dest.name} across the Wells that matter most — Prime partners first, every commission disclosed.</p>

          {stacks.map((w) => (
            <section key={w.id} style={{ marginTop: 36 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <IconChip name={w.icon} />
                <div><h3 className="t-h3">{w.name}</h3><p className="t-body-s" style={{ color: "var(--muted-foreground)" }}>{w.tag}</p></div>
              </div>
              <div className="pv-grid">
                {(PROVIDERS[w.id] || []).slice(0, 2).map((p) => (
                  <div key={p.name} className="pv">
                    <div className="pv__body">
                      <div className="pv__top">
                        <span className="pv__name">{p.name}</span>
                        <span className={`pv__tier pv__tier--${p.tier}`}>{p.tier === "prime" ? "★ Prime" : p.tier}</span>
                      </div>
                      <p className="pv__desc">{p.desc}</p>
                      <div className="pv__attrs"><span className="pv__attr">{cap(p.price)}</span></div>
                    </div>
                    <div className="pv__foot">
                      <div className="pv__cta-row"><button className="btn btn-primary" onClick={() => book(p)}>Book It</button></div>
                      <Ftc className="pv__ftc">{p.commission}.</Ftc>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside style={{ position: "sticky", top: 88, display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="card" style={{ padding: 20 }}>
            <Eyebrow>Safety Card</Eyebrow>
            <div style={{ marginTop: 12 }}><SafetyChip level={1} /></div>
            <ul style={{ listStyle: "none", padding: 0, marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <li style={{ display: "flex", gap: 10, alignItems: "flex-start" }}><Icon name="hospital" small /> <span className="t-body-s">Nearest hospital — surfaced from your saved location.</span></li>
              <li style={{ display: "flex", gap: 10, alignItems: "flex-start" }}><Icon name="shield" small /> <span className="t-body-s">Your embassy — from your Travel ID nationality.</span></li>
              <li style={{ display: "flex", gap: 10, alignItems: "flex-start" }}><Icon name="phone" small /> <span className="t-body-s">Local emergency number, shown in your itinerary.</span></li>
            </ul>
            <Ftc className="pv__ftc" style={{ marginTop: 12 }}>Safety data is verified — never fabricated. Confirm locally.</Ftc>
          </div>
          <Link className="btn btn-secondary" to="/wells-surface" style={{ width: "100%" }}>Build the full trip <Icon name="arrow" small /></Link>
        </aside>
      </div>
    </>
  );
}
