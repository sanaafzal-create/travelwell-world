import { useState, useRef, useEffect } from "react";
import { Icon } from "@/lib/icons";
import { useStore, type IoMode } from "@/store/useStore";
import { askAtlas } from "@/lib/supabase";
import { buildAtlasContext } from "@/lib/insights";

interface Msg { role: "user" | "assistant"; content: string; }

const PRIMER_DONE_KEY = "tww:atlasPrimed";

export function Concierge() {
  const { panel, closePanel, io, setIo, journeySIs, region, trip, addToTrip } = useStore();
  const open = panel === "concierge";
  const [primed, setPrimed] = useState<boolean>(() => {
    try { return localStorage.getItem(PRIMER_DONE_KEY) === "1"; } catch { return false; }
  });
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, busy]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    const next = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(next);
    setInput("");
    setBusy(true);
    // Ground Atlas in the live journey: Travel I.D., current SI/region/trip,
    // what they've considered, and curated happenings near where they're looking.
    const ctx = await buildAtlasContext();
    const { reply } = await askAtlas(next, ctx);
    setMessages([...next, { role: "assistant", content: reply }]);
    setBusy(false);
  }

  function begin(mode: "guided" | "conversation") {
    setPrimed(true);
    try { localStorage.setItem(PRIMER_DONE_KEY, "1"); } catch { /* ignore */ }
    if (mode === "guided") {
      setMessages([
        { role: "assistant", content: "Wonderful. Let's find your dream in a few easy questions — nothing like an interrogation. First: are you dreaming of wildlife, water, culture, or pure rest?" },
      ]);
    } else {
      setMessages([]);
    }
  }

  const ioBtn = (mode: IoMode, label: string, icon?: string) => (
    <button data-io={mode} aria-pressed={io === mode} onClick={() => setIo(mode)}>
      {icon && <Icon name={icon} small />} {label}
    </button>
  );

  return (
    <div className="tw-concierge" data-open={open} role="dialog" aria-modal="false" aria-label="Speak with Atlas — your Concierge" aria-hidden={!open}>
      <div className="tw-concierge__head">
        <div className="tw-concierge__avatar"><Icon name="sparkles" /></div>
        <div style={{ flex: 1 }}>
          <div className="tw-concierge__title">Speak with Atlas</div>
          <div className="tw-concierge__sub"><span className="dot" /> Your Concierge · powered by Claude</div>
        </div>
        <button className="tw-iconbtn" aria-label="Close Concierge" style={{ width: 36, height: 36, border: 0, background: "var(--surface-alt)" }} onClick={closePanel}>
          <Icon name="close" small />
        </button>
      </div>

      <div className="tw-concierge__context">
        <span>Knows:</span>
        {journeySIs.length === 0 && region == null ? (
          <span className="ctx-chip">Anonymous · just browsing</span>
        ) : (
          <>
            {journeySIs.slice(0, 2).map((s) => <span key={s} className="ctx-chip">{s}</span>)}
            {region && <span className="ctx-chip">{region}</span>}
            <span className="ctx-chip">Trip · {trip.length} blocks</span>
          </>
        )}
      </div>

      <div className="tw-concierge__body" ref={bodyRef}>
        {!primed ? (
          <div className="tw-primer">
            <div className="tw-concierge__avatar"><Icon name="sparkles" /></div>
            <h3 style={{ fontSize: 20 }}>Hello — I'm Atlas, your Concierge.</h3>
            <p className="t-body-s" style={{ color: "var(--muted-foreground)", marginTop: 8, maxWidth: "34ch", marginInline: "auto" }}>
              I can plan from a single sentence, or just keep you company while you browse. You can <b>type or talk</b>, and I can <b>read or speak</b> back — your choice, remembered.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 18 }}>
              <button className="btn btn-primary" onClick={() => begin("guided")}>Walk me through it</button>
              <button className="btn btn-secondary" onClick={() => begin("conversation")}>I'll just type</button>
            </div>
            <div className="tw-stop-row"><Icon name="stop" small /> You're in control — say “stop” anytime.</div>
          </div>
        ) : (
          <>
            {messages.length === 0 && (
              <div className="tw-msg tw-msg--bot">
                Tell me your dream in a sentence — “a safari for our anniversary in July” — and I'll start shaping it. I never book for you; you always choose.
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`tw-msg tw-msg--${m.role === "user" ? "user" : "bot"}`}>{m.content}</div>
            ))}
            {busy && (
              <div className="tw-msg tw-msg--bot">
                <span className="tw-typing"><span /><span /><span /></span>
              </div>
            )}
            {listening && (
              <div className="tw-listening">
                <div className="tw-mic-ring"><Icon name="mic" /></div>
                <div className="tw-wave">{Array.from({ length: 9 }).map((_, i) => <i key={i} style={{ animationDelay: `${i * 0.08}s` }} />)}</div>
                <p className="t-body-s" style={{ color: "var(--muted-foreground)" }}>Listening… speak naturally. Tap to stop.</p>
                <button className="btn btn-secondary" onClick={() => setListening(false)}><Icon name="stop" small /> Done</button>
              </div>
            )}
            {!busy && messages.length > 0 && messages[messages.length - 1].role === "assistant" && (
              <button
                className="btn btn-ghost" style={{ alignSelf: "flex-start" }}
                onClick={() => addToTrip({ well: "stay", icon: "bed", name: "Angama Mara", meta: "Stay-Well · suggested by Atlas", status: "idea" })}
              >
                + Add a suggested stay to my trip
              </button>
            )}
          </>
        )}
      </div>

      <div className="tw-concierge__foot">
        <div className="tw-io-toggle" role="group" aria-label="How should I respond?">
          {ioBtn("read", "Read", "read")}
          {ioBtn("hear", "Hear", "sound")}
          {ioBtn("both", "Both")}
        </div>
        <div className="tw-input">
          <input
            type="text" placeholder="Ask me anything, or tell me your dream…" aria-label="Message Atlas"
            value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
          />
          <button className="tw-input__mic" aria-label="Talk instead of type" onClick={() => setListening(true)}><Icon name="mic" small /></button>
          <button className="tw-input__send" aria-label="Send" onClick={() => send(input)}><Icon name="send" small /></button>
        </div>
        <div className="tw-stop-row"><Icon name="stop" small /> Say “stop” anytime — I'll step back gracefully.</div>
      </div>
    </div>
  );
}
