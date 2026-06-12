import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { SIS, WELLS } from "@/data/taxonomy";
import { useStore } from "@/store/useStore";
import { Eyebrow } from "@/components/ui/primitives";
import { cx } from "@/lib/utils";

const STEPS = [
  { n: 1, t: "You", s: "Name & email" },
  { n: 2, t: "Age range", s: "Safe & private" },
  { n: 3, t: "Interests", s: "1–3 that move you" },
  { n: 4, t: "The dream", s: "Where & when" },
  { n: 5, t: "Needs", s: "Dietary & access" },
  { n: 6, t: "Budgets", s: "Per Well" },
];

const AGE_RANGES = ["18–24", "25–34", "35–44", "45–54", "55–64", "65+"];
const BUDGET_RANGES = ["Luxury", "High-End", "Mid-Range", "Family Friendly", "Budget Conscious"];
const FLY_RANGES = ["First", "Business", "Coach"];

export default function SignUp() {
  const navigate = useNavigate();
  const { journeySIs, toggleSI, openPanel } = useStore();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [dream, setDream] = useState("");
  const [budgets, setBudgets] = useState<Record<string, string>>({});

  const next = () => (step < 6 ? setStep(step + 1) : navigate("/profile"));
  const back = () => step > 1 && setStep(step - 1);
  const progress = (step / 6) * 100;

  return (
    <div className="act" style={{ display: "grid", gridTemplateColumns: "380px 1fr", minHeight: "calc(100vh - 68px)" }}>
      {/* Left rail */}
      <aside className="band-dark" style={{ padding: "56px 40px", display: "flex", flexDirection: "column" }}>
        <Eyebrow>Sign up · build your Travel ID</Eyebrow>
        <h1 className="t-display-l" style={{ color: "#fff", marginTop: 14, fontSize: 36 }}>Let's design the trip of a lifetime.</h1>
        <p className="t-body" style={{ color: "var(--dark-band-muted)", marginTop: 14 }}>A few easy questions — no jargon, no commitment. By the end you'll have a Travel ID and a dream trip already started.</p>

        <div className="card" style={{ marginTop: 28, padding: 20, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.14)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="sparkle" small style={{ color: "var(--accent)" }} />
            <span className="eyebrow" style={{ color: "var(--accent)" }}>Travel Intelligence</span>
          </div>
          <p className="t-body-s" style={{ color: "var(--dark-band-muted)", marginTop: 10 }}>As you answer, our Travel Intelligence System quietly builds your <b style={{ color: "#fff" }}>Travel Personality</b> — so every suggestion fits you.</p>
        </div>

        <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 4 }}>
          {STEPS.map((s) => (
            <button key={s.n} onClick={() => setStep(s.n)} className="act-dot-row"
              style={{ display: "flex", gap: 12, alignItems: "center", padding: "8px 0", background: "none", border: 0, cursor: "pointer", textAlign: "start", opacity: s.n <= step ? 1 : 0.5 }}>
              <span style={{ width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center", flex: "none", fontWeight: 700, fontSize: 13, background: s.n < step ? "var(--accent)" : s.n === step ? "#fff" : "transparent", color: s.n <= step ? "var(--foreground)" : "var(--dark-band-muted)", border: s.n > step ? "1.5px solid rgba(255,255,255,.3)" : 0 }}>
                {s.n < step ? "✓" : s.n}
              </span>
              <span><span style={{ color: "#fff", fontWeight: 600, display: "block", fontSize: 14 }}>{s.t}</span><span className="t-micro" style={{ color: "var(--dark-band-muted)" }}>{s.s}</span></span>
            </button>
          ))}
        </div>
      </aside>

      {/* Right form */}
      <section style={{ padding: "32px 56px", maxWidth: 760 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1, height: 6, background: "var(--border)", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ width: `${progress}%`, height: "100%", background: "var(--primary)", transition: "width .3s ease" }} />
          </div>
          <span className="t-body-s" style={{ color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>Step {step} of 6</span>
          <button className="btn btn-ghost" onClick={() => openPanel("concierge")}><Icon name="sparkle" small /> Walk me through it</button>
        </div>

        <div style={{ marginTop: 40 }}>
          {step === 1 && (
            <>
              <Eyebrow>First, the basics</Eyebrow>
              <h2 className="t-h2" style={{ marginTop: 8 }}>Who's dreaming?</h2>
              <div className="jn-context" style={{ marginTop: 18 }}><div className="jn-context__ic"><Icon name="globe" small /></div><div>Your name personalizes everything; your email is just for your magic link. <b>No password, ever.</b></div></div>
              <Field label="Your name"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Amara Okonkwo" /></Field>
              <Field label="Email" hint="We'll send a one-tap magic link here — nothing to remember."><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" /></Field>
            </>
          )}
          {step === 2 && (
            <>
              <Eyebrow>Your party</Eyebrow>
              <h2 className="t-h2" style={{ marginTop: 8 }}>Roughly, what's your age range?</h2>
              <p className="t-body-s" style={{ color: "var(--muted-foreground)", marginTop: 8 }}>We never ask your birthday — only a range, and you can change it anytime.</p>
              <div className="chip-pick" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
                {AGE_RANGES.map((r) => (
                  <button key={r} className="wp-fchip" aria-pressed={age === r} onClick={() => setAge(r)}>{r}</button>
                ))}
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <Eyebrow>Travel personality</Eyebrow>
              <h2 className="t-h2" style={{ marginTop: 8 }}>What moves you? Pick 1–3.</h2>
              <div className="chip-pick" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
                {SIS.filter((s) => s.status === "live").map((s) => (
                  <button key={s.id} className="wp-fchip" aria-pressed={journeySIs.includes(s.id)} onClick={() => toggleSI(s.id)}>{s.name}</button>
                ))}
              </div>
            </>
          )}
          {step === 4 && (
            <>
              <Eyebrow>The dream</Eyebrow>
              <h2 className="t-h2" style={{ marginTop: 8 }}>Describe your perfect trip.</h2>
              <Field label="In your own words" hint="Atlas reads this to shape suggestions — there are no wrong answers.">
                <textarea value={dream} onChange={(e) => setDream(e.target.value)} rows={5} placeholder="An unhurried anniversary safari — golden-hour game drives, candlelit dinners under the stars…" style={{ resize: "vertical" }} />
              </Field>
            </>
          )}
          {step === 5 && (
            <>
              <Eyebrow>Travel well</Eyebrow>
              <h2 className="t-h2" style={{ marginTop: 8 }}>Anything we should plan around?</h2>
              <p className="t-body-s" style={{ color: "var(--muted-foreground)", marginTop: 8 }}>Dietary needs, accessibility, anything at all. Optional, and always editable.</p>
              <Field label="Dietary & accessibility"><textarea rows={3} placeholder="Vegetarian · step-free access preferred" style={{ resize: "vertical" }} /></Field>
            </>
          )}
          {step === 6 && (
            <>
              <Eyebrow>Budget ranges</Eyebrow>
              <h2 className="t-h2" style={{ marginTop: 8 }}>Set a comfort range per Well.</h2>
              <p className="t-body-s" style={{ color: "var(--muted-foreground)", marginTop: 8 }}>Pick a range for each Well — Fly-Well uses cabin classes. You can change these anytime.</p>
              <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
                {WELLS.filter((w) => w.status === "live").map((w) => {
                  const ranges = w.id === "fly" ? FLY_RANGES : BUDGET_RANGES;
                  return (
                    <div key={w.id} className="card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <div className="icon-chip" style={{ width: 36, height: 36 }}><Icon name={w.icon} small /></div>
                      <strong style={{ minWidth: 110 }}>{w.name}</strong>
                      <select value={budgets[w.id] || ""} onChange={(e) => setBudgets({ ...budgets, [w.id]: e.target.value })}
                        style={{ marginInlineStart: "auto", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)", background: "var(--card)", fontFamily: "var(--font-sans)", fontSize: 14 }}>
                        <option value="">Choose…</option>
                        {ranges.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div style={{ marginTop: 36, display: "flex", gap: 12, alignItems: "center" }}>
          {step > 1 && <button className="btn btn-secondary" onClick={back}><Icon name="chev" small style={{ transform: "rotate(90deg)" }} /> Back</button>}
          <button className={cx("btn btn-primary")} onClick={next} style={{ marginInlineStart: "auto" }}>
            {step === 6 ? "Create my Travel ID" : "Continue"} <Icon name="arrow" small />
          </button>
        </div>
        <p className="ftc" style={{ marginTop: 24 }}><Icon name="shield" small /> No password needed — we'll send a magic link. We never ask your birthday, only an age range. You can edit or delete everything later.</p>
      </section>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", marginTop: 22 }}>
      <span style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{label}</span>
      <div className="su-field" style={{ display: "contents" }}>{children}</div>
      {hint && <span className="t-body-s" style={{ color: "var(--muted-foreground)", display: "block", marginTop: 6 }}>{hint}</span>}
    </label>
  );
}
