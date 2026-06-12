import { Link } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { SIS } from "@/data/taxonomy";
import { DESTINATIONS } from "@/data/places";
import { img, siImg, regionImg } from "@/lib/images";
import { useStore } from "@/store/useStore";
import { ButtonLink, Button, Eyebrow, Pill } from "@/components/ui/primitives";
import { SiPickBar } from "@/components/ui/SiPickBar";
import { cx } from "@/lib/utils";

const STEPS = [
  { n: 1, icon: "sparkle", title: "Start with a feeling", body: "Pick the Special Interests that move you — safari, romance, a table worth the flight." },
  { n: 2, icon: "pin", title: "Find your place", body: "We rank 13 regions by how well they fit the way you love to travel." },
  { n: 3, icon: "compass", title: "Cover your Wells", body: "Ten Wells — Fly, Stay, Eat and more — scoped to your trip and budget." },
  { n: 4, icon: "check", title: "Book it, beautifully", body: "Vetted partners, disclosed every time. You always choose; we never book for you." },
];

const ATLAS_FEATS = [
  { icon: "message", b: "Type or talk", s: "Plan from a single sentence, or just keep company while you browse." },
  { icon: "sound", b: "Read or hear", s: "Atlas can speak its answers back — your choice, remembered." },
  { icon: "globe", b: "Always honest", s: "Real, in-system options with reasons. It never books for you." },
  { icon: "stop", b: "You're in control", s: "Say “stop” anytime and Atlas steps back gracefully." },
];

export default function Home() {
  const { journeySIs, toggleSI, openPanel } = useStore();
  const liveSIs = SIS.filter((s) => s.status === "live").slice(0, 4);
  const featuredDest = [DESTINATIONS["05A"][0], DESTINATIONS["02F"][0], DESTINATIONS["04A"][0]];

  return (
    <>
      {/* ---- Hero ---- */}
      <section className="hero band-ivory">
        <div className="hero__inner">
          <div className="hero__copy">
            <Eyebrow>A Travel Operating System</Eyebrow>
            <h1 style={{ marginTop: 14 }}>
              Your next journey,<br /><span className="accent">designed around you.</span>
            </h1>
            <p className="hero__lead">
              Tell us what moves you. We route you from a single spark — an interest, a place, a feeling —
              all the way to a booked, beautifully organized trip. One clear step at a time.
            </p>
            <div className="hero__cta">
              <ButtonLink to="/special-interests">Design Your Dream Journey</ButtonLink>
              <Button variant="secondary" onClick={() => openPanel("concierge")}>Not sure? Speak with Atlas</Button>
            </div>
            <div className="hero__taps">
              4–5 taps from here to a booked trip <span className="dot" /> No account needed to start
            </div>
          </div>
          <div className="hero__media">
            <img className="m1" src={img("safariJeep", 1200)} alt="A safari vehicle at golden hour in East Africa"
              style={{ position: "absolute", inset: "48px 0", width: "auto", height: "auto", objectFit: "cover", borderRadius: "var(--radius-lg)", boxShadow: "var(--e2)" }} />
            <div className="m-tag">
              <div className="ic-chip"><Icon name="plane" /></div>
              <div className="txt">
                <div className="t">Safari &amp; Wildlife · East Africa</div>
                <div className="s">Your journey, ready to design</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- What is TravelWell ---- */}
      <section className="section band-linen">
        <div className="container what">
          <div className="what__head">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="what__title">From a feeling to a booked trip, in a few clear steps.</h2>
            <p className="what__lead">
              TravelWell.World is the operating system for a great trip — it connects the dots between what you love,
              where you go, and everything you need once you're there.
            </p>
          </div>
          <div className="what__steps">
            {STEPS.map((s) => (
              <div className="what__step" key={s.n}>
                <span className="what__step-n">{s.n}</span>
                <div className="what__step-ic"><Icon name={s.icon} /></div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
          <div className="what__cta">
            <ButtonLink to="/special-interests">Start with what moves you</ButtonLink>
            <span className="what__cta-note">No account needed · everything is saved as you go.</span>
          </div>
        </div>
      </section>

      {/* ---- Special Interests (selectable) ---- */}
      <section className="section band-ivory">
        <div className="container">
          <div className="section__head">
            <div>
              <Eyebrow>Begin here</Eyebrow>
              <h2>How do you love to travel?</h2>
              <p>Pick up to 3 — 1–2 is the sweet spot. Your choices carry through the whole journey.</p>
            </div>
            <Link className="section__link" to="/special-interests">All 25 interests <Icon name="arrow" small /></Link>
          </div>
          <div className="si-rail">
            {liveSIs.map((s) => {
              const picked = journeySIs.includes(s.id);
              return (
                <div
                  key={s.id} className={cx("si-card", picked && "is-picked")} data-sipick role="button"
                  tabIndex={0} aria-pressed={picked}
                  onClick={() => toggleSI(s.id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSI(s.id); } }}
                >
                  <div className="si-card__media" style={{ position: "relative" }}>
                    <img src={siImg(s.id, 700)} alt="" loading="lazy" referrerPolicy="no-referrer"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <span className="si-card__pill"><Pill kind="live">Live</Pill></span>
                    <span className="si-card__check">{picked ? journeySIs.indexOf(s.id) + 1 : ""}</span>
                  </div>
                  <div className="si-card__body">
                    <h3>{s.name}</h3>
                    <p className="sig">{s.sig}</p>
                    <div className="si-card__foot">
                      <span>{picked ? "Added to your journey" : "Tap to choose"}</span>
                      <Icon name={picked ? "check" : "arrow"} small />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---- Atlas / Talk feature ---- */}
      <section className="section band-linen">
        <div className="container">
          <div className="talk">
            <div className="talk__inner">
              <div>
                <span className="talk__eyebrow eyebrow"><span className="dot" /> Your Concierge</span>
                <h2>Meet <em>Atlas</em> — plan out loud.</h2>
                <p className="talk__lead">
                  Atlas listens, suggests, and shapes your trip in plain language — then hands you clean, honest options.
                  Powered by Claude.
                </p>
                <div className="talk__feats">
                  {ATLAS_FEATS.map((f) => (
                    <div className="talk__feat" key={f.b}>
                      <div className="fic"><Icon name={f.icon} small /></div>
                      <div><b>{f.b}</b><span>{f.s}</span></div>
                    </div>
                  ))}
                </div>
                <div className="talk__cta-row">
                  <Button onClick={() => openPanel("concierge")}><Icon name="sparkles" small /> Speak with Atlas</Button>
                  <span className="note">Powered by Claude · it never books for you.</span>
                </div>
              </div>
              <div className="talk__demo">
                <div className="talk__demo-head">
                  <div className="talk__demo-av"><Icon name="sparkles" small /></div>
                  <div>
                    <div className="talk__demo-title">Atlas</div>
                    <div className="talk__demo-sub"><span className="dot" /> Online · powered by Claude</div>
                  </div>
                  <span className="talk__demo-tag">Live demo</span>
                </div>
                <div className="talk__demo-body">
                  <div className="talk-msg talk-msg--user" style={{ animationDelay: ".1s" }}>We want a safari for our anniversary in July.</div>
                  <div className="talk-msg talk-msg--bot" style={{ animationDelay: ".5s" }}>July is peak Great Migration — perfect timing. Here are three camps that lean romantic:</div>
                  {[
                    { n: 1, name: "Angama Mara", why: "Clifftop suites over the Mara triangle — <b>matches luxury + safari</b>." },
                    { n: 2, name: "Mahali Mzuri", why: "Branson's tented camp — <b>great for a romance-leaning safari</b>." },
                    { n: 3, name: "Governors' Camp", why: "Front-row migration access — <b>fits your July dates</b>." },
                  ].map((r, i) => (
                    <div className="talk-rec" key={r.n} style={{ animationDelay: `${0.9 + i * 0.25}s` }}>
                      <div className="talk-rec__num">{r.n}</div>
                      <div>
                        <div className="talk-rec__name">{r.name}</div>
                        <div className="talk-rec__why" dangerouslySetInnerHTML={{ __html: r.why }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="talk__demo-foot">
                  <div className="talk__demo-input">Tell me your dream…<span className="caret" /></div>
                  <div className="talk__demo-mic"><Icon name="mic" small /></div>
                  <div className="talk__demo-send"><Icon name="send" small /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Featured destinations ---- */}
      <section className="section band-ivory">
        <div className="container">
          <div className="section__head">
            <div>
              <Eyebrow>Where it leads</Eyebrow>
              <h2>Destinations worth designing around.</h2>
            </div>
            <Link className="section__link" to="/destinations">All destinations <Icon name="arrow" small /></Link>
          </div>
          <div className="dest-rail">
            {featuredDest.map((d) => (
              <Link key={d.id} className="dest-card" to={`/destination/${d.id}`}>
                <img src={img(d.img, 800)} alt="" loading="lazy" referrerPolicy="no-referrer"
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
        </div>
      </section>

      {/* ---- OS stats band ---- */}
      <section className="section band-ivory" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="os-band">
            <div className="os-band__inner">
              <div>
                <Eyebrow>The system underneath</Eyebrow>
                <h2>One operating system for the whole trip.</h2>
                <p>
                  Twenty-five ways to travel, thirteen regions, ten Wells, and a vetted partner network —
                  all connected, all honest about what's live today.
                </p>
                <img src={regionImg("05A", 80)} alt="" style={{ display: "none" }} />
              </div>
              <div className="os-stats">
                {[
                  { n: "25", l: "Special Interests", b: "ways to travel" },
                  { n: "13", l: "Regions", b: "01F – 13A" },
                  { n: "10", l: "Wells", b: "+2 luxury" },
                  { n: "200+", l: "Partners", b: "vetted · disclosed" },
                ].map((s) => (
                  <div className="os-stat" key={s.l}>
                    <div className="n">{s.n}</div>
                    <div className="l">{s.l}</div>
                    <div className="b">{s.b}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiPickBar />
    </>
  );
}
