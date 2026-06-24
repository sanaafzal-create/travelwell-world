import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { siImg, img } from "@/lib/images";
import { useStore } from "@/store/useStore";
import { useSpecialInterests } from "@/store/useCatalog";
import { ButtonLink, Button, Eyebrow } from "@/components/ui/primitives";
import { cx } from "@/lib/utils";

/* ---- "How it works" steps (mirrors the design's custom inline SVGs) ---- */
const STEPS = [
  { n: 1, icon: "sparkle", title: "Tell us what moves you", body: "Pick the ways you love to travel — safari, romance, culinary, and more. Or just speak with Atlas." },
  { n: 2, icon: "globe", title: "Choose where in the world", body: "Thirteen regions, each with researched destinations and an honest Safety Card you can trust." },
  { n: 3, icon: "menu", title: "Move through the Wells", body: "Flights, stays, dining, transport, activities — each Well surfaces the best 6 providers, matched to you." },
  { n: 4, icon: "shield", title: "Book it — all in one trip", body: "Everything lands in a single itinerary, always saved. You always choose, and you always book." },
];

/* ---- Featured SIs: David's 6, paired by row ---- */
const FEAT_ORDER = ["romance", "tropical", "safari", "expedition", "ultra", "river"];

/* ---- The four cinematic "Operating System" feature bands ---- */
const OS_BANDS = [
  {
    side: "left", num: "25", numSub: "", eyebrow: "Ways to travel", title: "Special Interests",
    body: "Twenty-five reasons to go — from Safari & Wildlife to Culinary Journeys to Wellness. Pick one or two, and the system shapes everything else around them.",
    chips: ["Safari & Wildlife", "Culinary Journeys", "Wellness & Spa", "+22 more"], to: "/special-interests", cta: "Explore all 25",
    bg: "radial-gradient(120% 90% at 25% 15%, #d8b35e 0%, transparent 55%), linear-gradient(120deg, #8a5a2a 0%, #4a3019 55%, #28190d 100%)",
    image: "desertDunes",
  },
  {
    side: "right", num: "10", numSub: "", eyebrow: "Every travel need, met", title: "The Wells",
    body: "Each Well maps to a need the way an organ maps to the body — Fly, Stay, Eat, Move, and more. Fill them as you go; the journey is whole when they are.",
    chips: ["Fly-Well", "Stay-Well", "Eat-Well"], soonChip: "Insure-Well · soon", to: "/wells", cta: "Discover the Wells",
    bg: "radial-gradient(120% 90% at 75% 20%, #56a89c 0%, transparent 55%), linear-gradient(240deg, #2c6e68 0%, #1c4541 55%, #102825 100%)",
    image: "oceanAerial",
  },
  {
    side: "left", num: "13", numSub: "", eyebrow: "From 01F to 13A", title: "World Regions",
    body: "The whole map, organized — Western Europe to the Caribbean, each region scored for safety and stitched into your route, never a detour off it.",
    chips: ["01F · Western Europe", "05A · East Africa", "11C · Caribbean", "+10 more"], to: "/regions", cta: "Browse all 13 regions",
    bg: "radial-gradient(120% 90% at 25% 15%, #7b91c4 0%, transparent 55%), linear-gradient(120deg, #3a4f7a 0%, #25304f 55%, #141a2e 100%)",
    image: "mountainValley",
  },
  {
    side: "right", num: "6", numSub: "to choose from", eyebrow: "Curated, never overwhelming", title: "The best matches, not endless lists",
    body: "Six best recommendations for each part of your trip — matched to you and your budget. Want more? Tap “See more.” And if a booking earns us a commission, we say so right there.",
    chips: ["Top picks first", "Honest about commissions", "You decide & book"], to: "/wells-surface", cta: "See how it works",
    bg: "radial-gradient(120% 90% at 75% 20%, #cf9468 0%, transparent 55%), linear-gradient(240deg, #9c5b3b 0%, #5e3520 55%, #2e1a10 100%)",
    image: "luxuryPool",
  },
] as const;

/* ============================================================================
   Atlas "live looping demo" — faithful React port of the prototype's script.
   Sequence: greet → user types in the input → user bubble → typing dots →
   bot reply → 3 reco cards → closing line → loop. Honors reduced-motion and
   only starts when scrolled into view.
   ========================================================================== */
type DemoItem =
  | { t: "bot" | "user"; html: string }
  | { t: "typing" }
  | { t: "reco"; n: number; name: string; why: string };

const RECOS: [string, string][] = [
  ["Angama Mara", "Clifftop suites over the Mara — <b>romance + safari</b>"],
  ["Governors’ Camp", "Front-row Great Migration — <b>fits your July dates</b>"],
  ["Mahali Mzuri", "Branson’s tented camp — <b>made for two</b>"],
];
const USER_TEXT = "A safari for our anniversary in July";

function TalkDemo() {
  const [items, setItems] = useState<DemoItem[]>([]);
  const [typed, setTyped] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [items]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let token = 0;
    let cancelled = false;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

    async function run() {
      const mine = ++token;
      setItems([]);
      setTyped("");

      if (reduce) {
        setItems([
          { t: "bot", html: "Hi! Tell me your dream in a sentence — I’ll start building it." },
          { t: "user", html: USER_TEXT + " 🦁" },
          { t: "bot", html: "The Great Migration peaks then. Here are <b>3 that fit you</b>:" },
          ...RECOS.map(([name, why], i) => ({ t: "reco" as const, n: i + 1, name, why })),
          { t: "bot", html: "Want me to add these to your trip? ✨" },
        ]);
        return;
      }

      await wait(500); if (mine !== token || cancelled) return;
      setItems([{ t: "bot", html: "Hi! Tell me your dream in a sentence — I’ll start building it." }]);
      await wait(900); if (mine !== token || cancelled) return;

      for (let i = 0; i <= USER_TEXT.length; i++) {
        if (mine !== token || cancelled) return;
        setTyped(USER_TEXT.slice(0, i));
        await wait(34);
      }
      await wait(450); if (mine !== token || cancelled) return;
      setTyped("");
      setItems((p) => [...p, { t: "user", html: USER_TEXT + " 🦁" }]);
      await wait(650); if (mine !== token || cancelled) return;

      setItems((p) => [...p, { t: "typing" }]);
      await wait(1300); if (mine !== token || cancelled) return;
      setItems((p) => {
        const c = [...p];
        c[c.length - 1] = { t: "bot", html: "The Great Migration peaks then. Here are <b>3 that fit you</b>:" };
        return c;
      });

      for (let i = 0; i < RECOS.length; i++) {
        await wait(520); if (mine !== token || cancelled) return;
        setItems((p) => [...p, { t: "reco", n: i + 1, name: RECOS[i][0], why: RECOS[i][1] }]);
      }
      await wait(650); if (mine !== token || cancelled) return;
      setItems((p) => [...p, { t: "bot", html: "Want me to add these to your trip? ✨" }]);

      await wait(3600); if (mine !== token || cancelled) return;
      run(); // loop
    }

    let started = false;
    const begin = () => { if (started) return; started = true; run(); };
    let obs: IntersectionObserver | undefined;
    try {
      obs = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) begin(); }, { threshold: 0.3 });
      if (rootRef.current) obs.observe(rootRef.current);
    } catch { /* ignore */ }
    const safety = setTimeout(begin, 1200);

    return () => { cancelled = true; token++; clearTimeout(safety); obs?.disconnect(); };
  }, []);

  return (
    <div className="talk__demo" aria-hidden="true" ref={rootRef}>
      <div className="talk__demo-head">
        <div className="talk__demo-av"><Icon name="sparkles" small /></div>
        <div>
          <div className="talk__demo-title">Speak with Atlas</div>
          <div className="talk__demo-sub"><span className="dot" /> Your Concierge · online</div>
        </div>
        <span className="talk__demo-tag">Live demo</span>
      </div>
      <div className="talk__demo-body" ref={bodyRef}>
        {items.map((it, idx) => {
          if (it.t === "reco") {
            return (
              <div className="talk-rec" key={idx}>
                <div className="talk-rec__num">{it.n}</div>
                <div>
                  <div className="talk-rec__name">{it.name}</div>
                  <div className="talk-rec__why" dangerouslySetInnerHTML={{ __html: it.why }} />
                </div>
              </div>
            );
          }
          if (it.t === "typing") {
            return <div className="talk-msg talk-msg--bot" key={idx}><span className="talk-typing"><span /><span /><span /></span></div>;
          }
          return <div className={`talk-msg talk-msg--${it.t}`} key={idx} dangerouslySetInnerHTML={{ __html: it.html }} />;
        })}
      </div>
      <div className="talk__demo-foot">
        <div className="talk__demo-input"><span>{typed}</span><span className="caret" /></div>
        <div className="talk__demo-mic"><Icon name="mic" small /></div>
        <div className="talk__demo-send"><Icon name="send" small /></div>
      </div>
    </div>
  );
}

/* ============================================================================ */
export default function Home() {
  const { openPanel } = useStore();
  const sis = useSpecialInterests();
  const featured = FEAT_ORDER.map((id) => sis.find((s) => s.id === id)).filter(Boolean) as NonNullable<ReturnType<typeof sis.find>>[];

  const TALK_FEATS = [
    { icon: "message", b: "Type or talk", s: "Chat by keyboard or just speak — whatever feels easy." },
    { icon: "sound", b: "Read or hear it", s: "It answers in text, or reads replies aloud to you." },
    { icon: "sparkle", b: "It knows your trip", s: "Sees your interests, region & plan — so advice fits you." },
    { icon: "check", b: "You're in control", s: "It suggests; you always choose and book. Say “stop” anytime." },
  ];

  return (
    <>
      {/* ---- HERO ---- */}
      <section className="hero band-ivory">
        <div className="hero__inner">
          <div className="hero__copy">
            <Eyebrow>A Travel Operating System</Eyebrow>
            <h1 style={{ marginTop: 14 }}>Your next journey, <span className="accent">designed around you.</span></h1>
            <p className="hero__lead t-lead" style={{ color: "var(--foreground)" }}>
              Tell us what moves you. We route you from a single spark — an interest, a place, a feeling — all the way to a booked, beautifully organized trip. One clear step at a time.
            </p>
            <div className="hero__cta">
              <ButtonLink to="/special-interests" style={{ height: 52, padding: "0 28px", fontSize: 16 }}>Design Your Dream Journey</ButtonLink>
              <Button variant="secondary" style={{ height: 52 }} onClick={() => openPanel("concierge")}>Not sure? Speak with Atlas</Button>
            </div>
            <p className="hero__taps"><span>4–5 taps from here to a booked trip</span><span className="dot" /><span>No account needed to start</span></p>
          </div>
          <div className="hero__media">
            <div className="m1" style={{ position: "absolute", inset: "48px 0", borderRadius: "var(--radius-lg)", boxShadow: "var(--e2)", overflow: "hidden" }}>
              <img src={img("safariGiraffe", 1100)} alt="" referrerPolicy="no-referrer"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
            <div className="m-tag">
              <div className="ic-chip"><Icon name="plane" /></div>
              <div className="txt"><div className="t">Safari &amp; Wildlife · East Africa</div><div className="s"><span className="live-dot" /> A live journey, ready to design</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- WHAT IS TRAVELWELL ---- */}
      <section className="section band-linen what">
        <div className="container">
          <div className="what__head">
            <Eyebrow>What is TravelWell</Eyebrow>
            <h2 className="what__title">A travel operating system that designs the whole trip — <span className="accent">around you.</span></h2>
            <p className="what__lead">
              Most sites sell you one booking and leave the rest to you. TravelWell starts with what moves you, then assembles every piece — flights, stays, dining, transport, activities and more — into one beautifully organized journey you actually control.
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
            <ButtonLink to="/special-interests" style={{ height: 52, padding: "0 28px", fontSize: 16 }}>Start designing — it's free</ButtonLink>
            <span className="what__cta-note">4–5 taps to a booked trip · no account needed to start</span>
          </div>
        </div>
      </section>

      {/* ---- FEATURED SPECIAL INTERESTS (selectable) ---- */}
      <section className="section band-ivory">
        <div className="container">
          <div className="section__head">
            <div>
              <Eyebrow>Start with what moves you</Eyebrow>
              <h2>Pick up to 3. Two is the sweet spot.</h2>
              <p>Tap the ways you love to travel — they light up as you go. Most journeys shine with 1–2, but some need 3 (Family + Tropical + Romance, say). You can fine-tune anytime.</p>
            </div>
            <Link className="section__link" to="/special-interests">All 25 interests <Icon name="arrow" small /></Link>
          </div>
          <div className="si-rail">
            {featured.map((s) => {
              const live = s.status === "live";
              const media = {
                backgroundImage: `linear-gradient(150deg, color-mix(in oklch, ${s.accent} 30%, transparent), rgba(20,18,14,.55)), url('${siImg(s.id, 800)}')`,
                backgroundSize: "cover", backgroundPosition: "center",
              };
              return (
                <div key={s.id} className={cx("si-card", !live && "is-preview")}>
                  <div className="si-card__media" style={media}>
                    <span className={cx("si-card__pill pill", live ? "pill-live" : "pill-preview")} style={{ background: "rgba(255,255,255,.92)" }}>{live ? "Live" : "Preview"}</span>
                  </div>
                  <div className="si-card__body">
                    <h3>{s.name}</h3>
                    <p className="sig">If it's {s.sig}… <span className="tw">Travel Well.</span></p>
                    <div className="si-card__foot">
                      <span>{s.lux ? "Luxury & Ultra" : "All travelers"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---- A TRAVEL OPERATING SYSTEM — cinematic bands ---- */}
      <section className="section band-ivory" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="os-intro">
            <Eyebrow>How it all fits together</Eyebrow>
            <h2>A Travel Operating <em>System</em>.</h2>
            <p>Behind the calm surface, an organized engine routes every traveler from a spark of interest, to a place, to what excites them, to every need met — ending in a vetted, booked plan. Four moving parts, one effortless journey.</p>
          </div>

          {OS_BANDS.map((b) => (
            <article key={b.title} className={`os-feature os-feature--${b.side}`}>
              <div className="os-feature__bg" style={{ background: b.bg }} />
              <img src={img(b.image, 1500)} alt="" referrerPolicy="no-referrer"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 1 }} />
              <div className="os-feature__scrim" />
              <div className="os-feature__content">
                <div className="os-feature__num">{b.num}{b.numSub && <span style={{ fontSize: ".42em", fontWeight: 600, verticalAlign: "middle", opacity: 0.85 }}> {b.numSub}</span>}</div>
                <Eyebrow>{b.eyebrow}</Eyebrow>
                <h3>{b.title}</h3>
                <p>{b.body}</p>
                <div className="os-feature__chips">
                  {b.chips.map((c) => <span key={c} className="os-feature__chip">{c}</span>)}
                  {"soonChip" in b && b.soonChip && <span className="os-feature__chip soon">{b.soonChip}</span>}
                </div>
                <Link className="os-feature__cta" to={b.to}>{b.cta} <Icon name="arrow" small /></Link>
              </div>
            </article>
          ))}

          <div style={{ textAlign: "center", marginTop: 40 }}>
            <ButtonLink to="/about" variant="gold" style={{ height: 50, padding: "0 28px", fontSize: 15 }}>See the full architecture</ButtonLink>
          </div>
        </div>
      </section>

      {/* ---- TALK TO ME — Atlas feature + looping demo ---- */}
      <section className="section band-ivory" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="talk">
            <div className="talk__inner">
              <div className="talk__copy">
                <span className="eyebrow talk__eyebrow"><span className="dot" /> Meet your Concierge</span>
                <h2>Don't know where to start? <em>Just talk to me.</em></h2>
                <p className="talk__lead">Your Concierge is a travel expert that lives on every page. Tell it your dream in plain words — by typing or speaking — and watch a real, bookable trip take shape in seconds. No forms, no jargon.</p>
                <div className="talk__feats">
                  {TALK_FEATS.map((f) => (
                    <div className="talk__feat" key={f.b}>
                      <div className="fic"><Icon name={f.icon} /></div>
                      <div><b>{f.b}</b><span>{f.s}</span></div>
                    </div>
                  ))}
                </div>
                <div className="talk__cta-row">
                  <Button onClick={() => openPanel("concierge")} style={{ height: 52, padding: "0 26px", fontSize: 16 }}>
                    <Icon name="sparkles" small /> Try the Concierge
                  </Button>
                  <span className="note">Free to try · no account needed · powered by Atlas</span>
                </div>
              </div>
              <TalkDemo />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
