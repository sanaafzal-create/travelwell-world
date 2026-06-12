import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { SIS, SI_GROUPS } from "@/data/taxonomy";
import { siImg } from "@/lib/images";
import { useStore } from "@/store/useStore";
import { Eyebrow } from "@/components/ui/primitives";
import { JourneyBar } from "@/components/ui/StepIndicator";
import { SiPickBar } from "@/components/ui/SiPickBar";
import { cx } from "@/lib/utils";

type Filter = "all" | "live" | "soon";

export default function SpecialInterests() {
  const { journeySIs, toggleSI } = useStore();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("all");

  const match = (status: string) =>
    filter === "all" || (filter === "live" && status === "live") || (filter === "soon" && status !== "live");

  return (
    <>
      <JourneyBar current={1} crumbs={[{ label: "Home", to: "/" }, { label: "Special Interests" }]} />

      <div className="container jn-intro">
        <Eyebrow>The Dream Journey · Step 1 of 5</Eyebrow>
        <h1>How do you love to travel?</h1>
        <p className="lead">
          Start with the feeling, not the place. Pick the ways of traveling that pull at you —
          we'll shape everything else around them.
        </p>

        <div className="jn-toolbar">
          <span className="jn-sweet"><Icon name="sparkle" small /> Choose up to 3 — <b style={{ color: "var(--foreground)" }}>1–2 is the sweet spot</b> for a focused trip.</span>
          <div className="jn-filter" role="group" aria-label="Filter interests">
            <button aria-pressed={filter === "all"} onClick={() => setFilter("all")}>All 25</button>
            <button aria-pressed={filter === "live"} onClick={() => setFilter("live")}>Ready now</button>
            <button aria-pressed={filter === "soon"} onClick={() => setFilter("soon")}>Coming soon</button>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 80 }}>
        {SI_GROUPS.map((group) => {
          const items = SIS.filter((s) => s.group === group.id && match(s.status));
          if (!items.length) return null;
          const live = SIS.filter((s) => s.group === group.id && s.status === "live").length;
          const total = SIS.filter((s) => s.group === group.id).length;
          return (
            <section className="si-group" key={group.id}>
              <div className="si-group__head">
                <h2 className="si-group__title">{group.name}</h2>
                <span className="si-group__blurb">{group.blurb}</span>
                <span className="si-group__count">{live} live · {total} total</span>
              </div>
              <div className="si-grid">
                {items.map((s) => {
                  const isSoon = s.status !== "live";
                  const picked = journeySIs.includes(s.id);
                  const order = journeySIs.indexOf(s.id) + 1;
                  return (
                    <button
                      key={s.id}
                      className={cx("si-tile", isSoon && "si-tile--soon")}
                      aria-pressed={isSoon ? undefined : picked}
                      aria-disabled={isSoon || undefined}
                      onClick={() => (isSoon ? navigate(`/si/${s.id}`) : toggleSI(s.id))}
                    >
                      <span className="si-tile__img">
                        <img src={siImg(s.id, 700)} alt="" loading="lazy" referrerPolicy="no-referrer" />
                      </span>
                      <span className="si-tile__scrim" />
                      <span className="si-tile__accent" style={{ background: s.accent }} />
                      <span className="si-tile__top">
                        {isSoon ? (
                          <><span /><span className="si-soon-badge">Coming soon</span></>
                        ) : (
                          <>
                            <span className="si-tile__order">{picked ? order : ""}</span>
                            <span />
                            <span className="si-check" aria-hidden="true"><Icon name="check" small /></span>
                          </>
                        )}
                      </span>
                      <span className="si-tile__body">
                        <span className="si-tile__name">{s.name}</span>
                        <span className="si-tile__sig">{s.sig.charAt(0).toUpperCase() + s.sig.slice(1)}</span>
                      </span>
                      <span className="si-tile__view">{isSoon ? "Preview" : "View"} <Icon name="arrow" small /></span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <SiPickBar />
    </>
  );
}
