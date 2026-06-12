import { Link } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { REGIONS } from "@/data/taxonomy";
import { DESTINATIONS } from "@/data/places";
import { img } from "@/lib/images";
import { Eyebrow, Pill } from "@/components/ui/primitives";
import { cx } from "@/lib/utils";

export default function Destinations() {
  return (
    <>
      <div className="container jn-intro">
        <Eyebrow>Where it leads</Eyebrow>
        <h1>Destinations, by region.</h1>
        <p className="lead">Live destinations are ready to design around. Preview destinations show the shape of what's coming — honestly desaturated until they're real.</p>
      </div>

      <div className="container" style={{ paddingBottom: 80 }}>
        {REGIONS.filter((r) => DESTINATIONS[r.code]?.length).map((r) => (
          <section className="si-group" key={r.code}>
            <div className="si-group__head">
              <h2 className="si-group__title">{r.name}</h2>
              <span className="si-group__blurb">{r.line}</span>
              <Link className="si-group__count" to={`/region/${r.code}`}>{r.code}</Link>
            </div>
            <div className="dest-rail">
              {DESTINATIONS[r.code].map((d) => (
                <Link key={d.id} className={cx("dest-card", d.status !== "live" && "is-preview")} to={`/destination/${d.id}`}>
                  <img className={d.status !== "live" ? "media" : ""} src={img(d.img, 700)} alt="" loading="lazy" referrerPolicy="no-referrer"
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                  <div className="dest-card__scrim" />
                  <div className="dest-card__top"><Pill kind={d.status === "live" ? "live" : "preview"}>{d.status === "live" ? "Live" : "Preview"}</Pill></div>
                  <div className="dest-card__body">
                    <h3>{d.name}</h3>
                    <div className="meta"><Icon name="pin" small /> {d.country} · {d.line}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
