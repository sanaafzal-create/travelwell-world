import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { WELLS, wellById } from "@/data/taxonomy";
import { PROVIDERS, type Provider } from "@/data/places";
import { useStore } from "@/store/useStore";
import { Eyebrow, Ftc } from "@/components/ui/primitives";
import { cx, cap } from "@/lib/utils";

const TIER_RANK: Record<string, number> = { prime: 0, vetted: 1, prospective: 2 };

export default function Providers() {
  const navigate = useNavigate();
  const { trip, addToTrip } = useStore();
  const [well, setWell] = useState<string>("all");

  const all = useMemo(() => {
    const flat: Provider[] = Object.values(PROVIDERS).flat();
    const filtered = well === "all" ? flat : flat.filter((p) => p.well === well);
    return [...filtered].sort((a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier]);
  }, [well]);

  function book(p: Provider) {
    const w = wellById(p.well);
    if (p.mode === "affiliate") { navigate(`/go?to=${encodeURIComponent(p.name)}&well=${p.well}`); return; }
    addToTrip({ well: p.well, icon: w?.icon || "compass", name: p.name, meta: `${w?.name || p.well} · ${cap(p.price)}`, status: "pending" });
  }

  return (
    <>
      <div className="container jn-intro">
        <Eyebrow>The network</Eyebrow>
        <h1>Vetted partners, Prime-first.</h1>
        <p className="lead">Every provider is labeled by tier and disclosed by commission. Prime partners are vetted and surfaced first — never hidden, never fabricated.</p>
        <div className="jn-filter" style={{ marginTop: 22 }}>
          <button aria-pressed={well === "all"} onClick={() => setWell("all")}>All Wells</button>
          {WELLS.filter((w) => (PROVIDERS[w.id] || []).length).map((w) => (
            <button key={w.id} aria-pressed={well === w.id} onClick={() => setWell(w.id)}>{w.name.replace("-Well", "")}</button>
          ))}
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 80 }}>
        <div className="pv-grid">
          {all.map((p) => {
            const added = trip.some((b) => b.name === p.name);
            return (
              <div key={p.name} className={cx("pv", added && "pv--added")}>
                <div className="pv__body">
                  <div className="pv__top">
                    <span className="pv__name">{p.name}</span>
                    <span className={cx("pv__tier", `pv__tier--${p.tier}`)}>{p.tier === "prime" ? "★ Prime" : p.tier}</span>
                  </div>
                  <p className="pv__desc">{p.desc}</p>
                  <div className="pv__attrs">
                    <span className="pv__attr pv__attr--match"><span className="dot" style={{ background: "var(--primary)" }} />{wellById(p.well)?.name}</span>
                    <span className="pv__attr">{cap(p.price)}</span>
                    <span className="pv__attr">{p.mode === "affiliate" ? "Off-site" : "In-platform"}</span>
                  </div>
                </div>
                <div className="pv__foot">
                  <div className="pv__cta-row">
                    {added ? <span className="pv__added-tag"><Icon name="check" small /> Added</span> : <button className="btn btn-primary" onClick={() => book(p)}>Book It</button>}
                  </div>
                  <Ftc className="pv__ftc">{p.commission} — disclosed every time.</Ftc>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
