import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { useStore } from "@/store/useStore";
import { Eyebrow } from "@/components/ui/primitives";
import { cx } from "@/lib/utils";

const EMAIL = "amara@email.com";
const STEPS = ["verify", "location", "channel", "whisper"] as const;
const STEP_LABELS = ["Email", "Safety", "Contact", "Pace", "Done"];
const NEXT_LABELS = ["Next: Safety", "Next: Contact", "Next: Your pace"];

type Results = { verify: string | null; location: string | null; channel: string | null; whisper: string | null };
const locLabel = (v: string | null) => (v === "granted" ? "Live location" : v === "itinerary" ? "Itinerary city" : "Skipped");
const chLabel = (v: string) => (v === "email" ? "Email" : v === "sms" ? "SMS" : "Email + SMS");
const whLabel = (v: string) => (v === "often" ? "Often" : v === "rare" ? "Rare" : "Off");

function Card({ eyebrow, ic, title, why, children, foot }: { eyebrow: string; ic: string; title: string; why: ReactNode; children?: ReactNode; foot: ReactNode }) {
  return (
    <>
      <div className="act__inner">
        <div className="act__ic"><Icon name={ic} /></div>
        <div className="act__step-eyebrow">{eyebrow}</div>
        <h2 className="act__title">{title}</h2>
        <p className="act__why">{why}</p>
        {children}
      </div>
      <div className="act__foot">{foot}</div>
    </>
  );
}

function ResultBox({ text, ok }: { text: string; ok: boolean }) {
  return <div className={cx("act-result", ok ? "act-result--ok" : "act-result--off")}><Icon name={ok ? "check" : "info"} small /> {text}</div>;
}

export default function Activation() {
  const navigate = useNavigate();
  const { showToast, setWhisperDial } = useStore();
  const [step, setStep] = useState(0);
  const [results, setResults] = useState<Results>({ verify: null, location: null, channel: null, whisper: null });
  const [channel, setChannel] = useState("email");
  const [whisper, setWhisper] = useState("rare");
  const isDone = step >= STEPS.length;

  const dots = STEPS.concat(["done" as never]).map((_, i) => {
    const st = i < step ? "done" : i === step ? "current" : "todo";
    return (
      <span className="act__dot-wrap" key={i}>
        <span className="act__dot" data-state={st} /><span className="act__dot-lbl" data-state={st}>{STEP_LABELS[i]}</span>
      </span>
    );
  });

  function next() {
    setResults((r) => ({ ...r, ...(step === 1 && !r.location ? { location: "skipped" } : {}), ...(step === 2 ? { channel } : {}) }));
    setStep((s) => s + 1);
  }
  function skip() { setResults((r) => ({ ...r, [STEPS[step]]: "skipped" })); setStep((s) => s + 1); }
  function back() { setStep((s) => Math.max(0, s - 1)); }

  let body: ReactNode = null;
  if (!isDone && STEPS[step] === "verify") {
    const done = results.verify === "verified";
    body = (
      <Card eyebrow="Step 1 of 4 · Secure your account" ic="message" title="Verify your email"
        why={<>We sent a one-tap magic link to confirm it's you. Verifying secures your trip and lets you pick up where you left off on any device — <b>still no password</b>.</>}
        foot={done
          ? <><button className="act__skip" onClick={back}>← Back</button><button className="btn btn-primary" onClick={next}>Continue · <span className="act__next">{NEXT_LABELS[0]}</span> →</button></>
          : <><button className="act__skip" onClick={() => showToast(`Magic link re-sent to ${EMAIL}`)}>Resend link</button>
              <div style={{ display: "flex", gap: 10 }}><button className="btn btn-secondary" onClick={() => showToast("You can change your email in Profile")}>Change email</button><button className="btn btn-primary" onClick={() => { setResults((r) => ({ ...r, verify: "verified" })); showToast("Email verified"); }}>I've verified ✓</button></div></>}>
        <div className="act-mail">
          <div className="act-mail__ic"><Icon name="message" /></div>
          <div><div className="act-mail__from">TravelWell.World</div><div className="act-mail__sub">Confirm your email to secure your trip</div></div>
          <div className="act-mail__to">to<br />{EMAIL}</div>
        </div>
        {done && <div className="act-result act-result--ok"><Icon name="check" small /> Email verified — you're secured.</div>}
      </Card>
    );
  } else if (!isDone && STEPS[step] === "location") {
    const r = results.location;
    body = (
      <Card eyebrow="Step 2 of 4 · Safety" ic="pin" title="Turn on location for the Emergency Button"
        why={<>If anything ever goes wrong, the Emergency Button surfaces the <b>nearest hospital, your embassy and the local emergency number</b> — instantly. Prefer not to share live location? We'll use your itinerary's city instead.</>}
        foot={r
          ? <><button className="act__skip" onClick={back}>← Back</button><button className="btn btn-primary" onClick={next}>Continue · <span className="act__next">{NEXT_LABELS[1]}</span> →</button></>
          : <><button className="act__skip" onClick={back}>← Back</button><button className="act__skip" onClick={skip}>Skip this step</button></>}>
        {r ? (
          <ResultBox ok={r !== "skipped"} text={r === "granted" ? "Location on — Emergency is ready to find help near you." : r === "itinerary" ? "We'll use your itinerary's city for Emergency. You can switch to live location anytime." : "Skipped — Emergency will ask for your location only if you ever need it."} />
        ) : (
          <div className="act-opts">
            {[
              { v: "granted", ic: "pin", t: "Allow live location", s: "Most accurate help, only used for Emergency & safety." },
              { v: "itinerary", ic: "compass", t: "Use my itinerary instead", s: "We'll use the city you're visiting — no live tracking." },
            ].map((o) => (
              <button key={o.v} className="act-opt" onClick={() => { setResults((rr) => ({ ...rr, location: o.v })); showToast("Saved"); }}>
                <span className="act-opt__ic"><Icon name={o.ic} /></span>
                <span><span className="act-opt__t">{o.t}</span><span className="act-opt__s">{o.s}</span></span>
                <span className="act-opt__arrow"><Icon name="arrow" /></span>
              </button>
            ))}
            <button className="act-opt act-opt--ghost" onClick={() => { setResults((rr) => ({ ...rr, location: "skipped" })); showToast("Skipped — you can enable later"); }}>
              <span className="act-opt__ic"><Icon name="close" /></span>
              <span><span className="act-opt__t">Not now</span><span className="act-opt__s">Decide later in Profile.</span></span>
            </button>
          </div>
        )}
      </Card>
    );
  } else if (!isDone && STEPS[step] === "channel") {
    body = (
      <Card eyebrow="Step 3 of 4 · Staying in touch" ic="message" title="How should we reach you?"
        why={<>Only what matters for your trip — booking confirmations, a price drop you asked about, a safety note for your destination. <b>Never marketing spam.</b></>}
        foot={<><button className="act__skip" onClick={back}>← Back</button><button className="btn btn-primary" onClick={next}>Continue · <span className="act__next">{NEXT_LABELS[2]}</span> →</button></>}>
        <div className="act-channels" role="group" aria-label="Notification channel">
          {[{ v: "email", t: "Email", s: "Quietly, in your inbox", ic: "message" }, { v: "sms", t: "SMS", s: "Time-sensitive only", ic: "phone" }, { v: "both", t: "Both", s: "Belt and braces", ic: "check" }].map((o) => (
            <button key={o.v} className="act-channel" aria-pressed={channel === o.v} onClick={() => setChannel(o.v)}>
              <span className="act-channel__ic"><Icon name={o.ic} /></span>
              <div className="act-channel__t">{o.t}</div><div className="act-channel__s">{o.s}</div>
            </button>
          ))}
        </div>
        <p className="fld__hint" style={{ marginTop: 14 }}><Icon name="info" small /> Children in your party are never notified. A partner can set their own channel from Profile.</p>
      </Card>
    );
  } else if (!isDone && STEPS[step] === "whisper") {
    body = (
      <Card eyebrow="Step 4 of 4 · Your pace" ic="sun" title="Gentle nudges — how often?"
        why={<>Whispers are soft, dismissible suggestions — a free hour to slow down, a sunset you both have open. <b>You set the volume</b>, and can change it anytime.</>}
        foot={<><button className="act__skip" onClick={back}>← Back</button><button className="btn btn-primary" onClick={() => { setResults((r) => ({ ...r, whisper })); setStep((s) => s + 1); }}>Finish setup →</button></>}>
        <div className="act-dial" role="group" aria-label="Whisper frequency">
          {[{ v: "often", t: "Often", s: "A gentle idea most times I visit." }, { v: "rare", t: "Rare", s: "Only when it really helps. (Recommended)" }, { v: "off", t: "Off", s: "No Whispers — I'll ask if I want one." }].map((o) => (
            <button key={o.v} className="act-dial__opt" aria-pressed={whisper === o.v} onClick={() => { setWhisper(o.v); setWhisperDial(o.v === "often" ? "active" : o.v === "off" ? "off" : "rare"); }}>
              <span className="act-dial__radio" />
              <span><span className="act-dial__t">{o.t}</span><span className="act-dial__s">{o.s}</span></span>
            </button>
          ))}
        </div>
      </Card>
    );
  } else {
    const rows = [
      { ic: "message", name: "Email", val: results.verify === "verified" ? "Verified" : "Not verified", ok: results.verify === "verified" },
      { ic: "pin", name: "Emergency location", val: locLabel(results.location), ok: !!results.location && results.location !== "skipped" },
      { ic: "message", name: "Notifications", val: results.channel === "skipped" ? "Skipped" : chLabel(channel), ok: results.channel !== "skipped" },
      { ic: "sun", name: "Whispers", val: results.whisper === "skipped" ? "Skipped" : whLabel(whisper), ok: results.whisper !== "skipped" && whisper !== "off" },
    ];
    body = (
      <div className="act__inner act-done">
        <div className="build__burst"><Icon name="check" /></div>
        <Eyebrow>All set</Eyebrow>
        <h2 className="act__title" style={{ fontSize: 30 }}>You're ready, Amara. Let's design your trip.</h2>
        <p className="act__why" style={{ maxWidth: "46ch", marginInline: "auto" }}>Your account is set up and your dream trip is waiting. Everything below is editable anytime in Profile.</p>
        <div className="act-summary">
          {rows.map((r) => (
            <div className="act-summary__row" key={r.name}>
              <div className="act-summary__ic"><Icon name={r.ic} /></div>
              <div style={{ flex: 1 }}><div className="act-summary__name">{r.name}</div><div className="act-summary__val">{r.val}</div></div>
              <span className={cx("act-summary__status pill", r.ok ? "pill-live" : "pill-preview")}>{r.ok ? "On" : "Off"}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 30, flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={() => navigate("/special-interests")} style={{ height: 52, padding: "0 28px", fontSize: 16 }}>Start designing your trip →</button>
          <button className="btn btn-secondary" onClick={() => navigate("/itinerary")} style={{ height: 52 }}>Open your trip</button>
        </div>
      </div>
    );
  }

  return (
    <div className="act">
      <div className="act__head">
        <Eyebrow>Activation · Finish setting up</Eyebrow>
        <h1>You're almost there, Amara.</h1>
        <p>Four quick switches — each one optional. Turn on what helps; skip the rest. You can change any of these later in Profile.</p>
        <div className="act__dots" aria-hidden="true">{dots}</div>
      </div>
      <div className="act__card" key={step}>{body}</div>
    </div>
  );
}
