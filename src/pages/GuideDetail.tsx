import { Link, useParams } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { MOROCCO_TOP8 } from "@/data/places";
import { useSpecialInterests, useRegions, useGuides } from "@/store/useCatalog";
import { img } from "@/lib/images";

const PROSE: Record<string, string> = {
  "migration-timing": `<p>The Great Migration isn't an event so much as a year-long circuit — nearly two million wildebeest, zebra and gazelle following the rains in a vast clockwise loop through the Serengeti and the Maasai Mara.</p><h2>Month by month</h2><p>From <b>July to October</b>, the herds mass in the northern Serengeti and the Mara, and the famous river crossings happen — heart-stopping, crocodile-lined, and impossible to schedule precisely. <b>January to March</b> brings calving season in the southern Serengeti: gentler, greener, and extraordinary for predators.</p><p>The honest truth: nature doesn't read calendars. Give yourself a window of several days in the right region, and let your guide chase the movement.</p>`,
  "safari-packing": `<p>The single biggest packing mistake on safari is bringing too much. Soft duffel, neutral layers, and a good pair of binoculars will carry you further than a suitcase of options.</p><h2>The non-negotiables</h2><p>Layers for cold dawns and hot middays. A wide-brim hat. Real sunscreen. And the three things first-timers always forget: a headtorch, a dust-proof bag for your camera, and twice as many memory cards as you think you need.</p>`,
};

export default function GuideDetail() {
  const { id } = useParams();
  const sis = useSpecialInterests();
  const regions = useRegions();
  const guides = useGuides();
  const G = guides.find((x) => x.id === id) || guides.find((x) => x.id === "morocco-top8")!;

  const isTop = G.type === "Top List" && G.id === "morocco-top8";
  const region = regions.find((r) => r.code === G.region);
  const si = sis.find((s) => s.id === G.si);

  const prose = isTop
    ? ""
    : PROSE[G.id] ||
      `<p>${G.lede}</p><p>This guide is part of the TravelWell desk's growing library — practical, honest, and written by people who've made the trip themselves. We update it whenever the on-the-ground reality changes.</p><h2>Why it matters</h2><p>Great trips are built on small, well-timed decisions. The right month, the right base, the right order of days. That's what these guides are for.</p>`;

  const related = guides.filter((x) => x.id !== G.id).slice(0, 3);

  const inlineLinks = (
    <>
      {region && (
        <Link className="gd-inline-link" to={`/region/${region.code}`}>
          <span className="gd-inline-link__ic"><Icon name="globe" /></span>
          <span>
            <span className="gd-inline-link__k">Region</span>
            <span className="gd-inline-link__t">{region.name}</span>
          </span>
          <span className="gd-inline-link__arrow"><Icon name="arrow" small /></span>
        </Link>
      )}
      {si && (
        <Link className="gd-inline-link" to="/special-interests">
          <span className="gd-inline-link__ic"><Icon name="compass" /></span>
          <span>
            <span className="gd-inline-link__k">Special interest</span>
            <span className="gd-inline-link__t">{si.name}</span>
          </span>
          <span className="gd-inline-link__arrow"><Icon name="arrow" small /></span>
        </Link>
      )}
    </>
  );

  return (
    <>
      <section className="gd-hero">
        <img src={img(G.img, 1800)} alt="" referrerPolicy="no-referrer" />
        <span className="gd-hero__scrim" />
        <div className="gd-hero__inner">
          <span className="gd-hero__type"><Icon name="compass" small /> {G.type}</span>
          <h1>{G.title}</h1>
          <div className="gd-hero__meta">
            <span><Icon name="info" small /> {G.read} read</span>
            <span>Updated {G.updated}</span>
            {region && <span><Icon name="pin" small /> {region.name}</span>}
          </div>
        </div>
      </section>

      <div className="gd-body">
        <p className="gd-lede">{G.lede}</p>
        {isTop ? (
          <>
            <div className="gd-prose">
              <p>Morocco rewards a loop, not a single base. Here's the route we'd send a first-timer on — ranked, with why each stop earns its place. Tap any region or interest to start building it into your own trip.</p>
            </div>
            {inlineLinks}
            <div className="gd-rank">
              {MOROCCO_TOP8.map((s) => (
                <div className="gd-rank__item" key={s.rank}>
                  <span className="gd-rank__num">{s.rank}</span>
                  <div>
                    <div className="gd-rank__name">{s.name}</div>
                    <div className="gd-rank__note">{s.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="gd-prose" dangerouslySetInnerHTML={{ __html: prose }} />
            {inlineLinks}
          </>
        )}
        <div className="gd-share">
          <Icon name="sparkle" small />{" "}
          <span>
            Written by the TravelWell desk · Want this as a trip?{" "}
            <Link to="/special-interests" style={{ color: "var(--primary)", fontWeight: 600 }}>Start designing →</Link>
          </span>
        </div>
      </div>

      <div className="gd-related">
        <h2>More from the desk</h2>
        <div className="gd-rel-grid">
          {related.map((r) => (
            <Link className="gd-rel" to={`/guide/${r.id}`} key={r.id}>
              <img src={img(r.img, 500)} alt="" loading="lazy" referrerPolicy="no-referrer" />
              <div className="gd-rel__b">
                <div className="gd-rel__t">{r.title}</div>
                <div className="gd-rel__m">{r.type} · {r.read}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div style={{ height: 80 }} />
    </>
  );
}
