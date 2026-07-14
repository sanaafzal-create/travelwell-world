import { useState, useRef, useEffect } from "react";
import { Icon } from "@/lib/icons";
import { useStore, type IoMode } from "@/store/useStore";
import { useAtlas } from "@/lib/useAtlas";
import { useSpeechInput } from "@/lib/useSpeech";

export function Concierge() {
  const { io, setIo, journeySIs, region, trip, addToTrip, showToast } = useStore();
  // Conversation lives in the store now (persists across navigation + reload).
  const { messages, busy, primed, dock, send, setMessages, setPrimed, open, collapse, reset } = useAtlas();
  const isOpen = dock === "open";
  const [input, setInput] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);

  // Voice input — streams what they say into the box AND shows it live in the
  // listening panel, then on finish (Done, spoken "stop", or natural end) sends
  // it so it lands in the conversation instead of vanishing.
  const { supported: voiceSupported, listening, start: startVoice, stop: stopVoice } =
    useSpeechInput(setInput, (finalText) => { if (finalText.trim()) { send(finalText); setInput(""); } });
  const onMic = () => {
    if (listening) { stopVoice(); return; }
    if (!voiceSupported) { showToast("Voice input isn't supported in this browser yet — please type for now."); return; }
    startVoice();
  };

  useEffect(() => {
    if (isOpen && bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, busy, isOpen]);

  function onSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput("");
    void send(trimmed);
  }

  function begin(mode: "guided" | "conversation") {
    setPrimed(true);
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
    <>
      {/* Collapsed: Atlas stays beside you as a gentle pill — tap to reopen, full
          history intact. Shown whenever there's a live conversation to return to. */}
      {dock === "collapsed" && (
        <button className="tw-atlas-fab" aria-label="Open Atlas, your Concierge" onClick={open}>
          <Icon name="sparkles" />
          {messages.length > 0 && <span className="tw-atlas-fab__dot" aria-hidden="true" />}
        </button>
      )}

      <div className="tw-concierge" data-open={isOpen} role="dialog" aria-modal="false" aria-label="Speak with Atlas — your Concierge" aria-hidden={!isOpen}>
        <div className="tw-concierge__head">
          <div className="tw-concierge__avatar"><Icon name="sparkles" /></div>
          <div style={{ flex: 1 }}>
            <div className="tw-concierge__title">Speak with Atlas</div>
            <div className="tw-concierge__sub"><span className="dot" /> Your Concierge · powered by Atlas</div>
          </div>
          {primed && messages.length > 0 && (
            <button className="tw-concierge__restart" aria-label="Start over" title="Start over" onClick={() => { reset(); setInput(""); }}>
              Start over
            </button>
          )}
          <button className="tw-iconbtn" aria-label="Minimize Concierge" style={{ width: 36, height: 36, border: 0, background: "var(--surface-alt)" }} onClick={collapse}>
            <Icon name="chev" small />
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
              {/* Self-demonstrating language beat: a cold visitor witnesses the
                  multilingual moat on landing, no action needed. Arabic carries
                  its own dir/lang so it shapes + renders right-to-left in place.
                  aria-label states it plainly for anyone who can't see it. */}
              <div
                className="tw-langbeat"
                aria-label="Atlas speaks your language — English, Spanish, Arabic, Chinese, and French"
                style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", alignItems: "center", marginTop: 14 }}
              >
                <span className="t-body-s" style={{ width: "100%", color: "var(--muted-foreground)", marginBottom: 2 }}>I speak your language, too —</span>
                {[
                  { t: "Hello", lang: "en", dir: "ltr" },
                  { t: "Hola", lang: "es", dir: "ltr" },
                  { t: "مرحباً", lang: "ar", dir: "rtl" },
                  { t: "你好", lang: "zh", dir: "ltr" },
                  { t: "Bonjour", lang: "fr", dir: "ltr" },
                ].map((g) => (
                  <span
                    key={g.lang}
                    lang={g.lang}
                    dir={g.dir as "ltr" | "rtl"}
                    style={{ padding: "2px 10px", border: "1px solid var(--border)", borderRadius: 999, fontSize: 13, lineHeight: 1.6 }}
                  >
                    {g.t}
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 18 }}>
                <button className="btn btn-primary" onClick={() => begin("guided")}>Walk me through it</button>
                <button className="btn btn-secondary" onClick={() => begin("conversation")}>I'll just type</button>
              </div>
              <div className="tw-stop-row"><Icon name="check" small /> You're in control — Atlas suggests, and never books for you.</div>
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
                  <div className="tw-listening__transcript" aria-live="polite">
                    {input ? input : <span className="tw-listening__hint">Listening… start speaking and your words will appear here.</span>}
                  </div>
                  <button className="btn btn-primary" onClick={() => stopVoice()}><Icon name="check" small /> Done — send to Atlas</button>
                  <p className="t-body-s" style={{ color: "var(--muted-foreground)", margin: 0 }}>Tap Done, or just say “stop,” when you're finished — I'll reply.</p>
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
              type="text" placeholder="Ask me anything — in English · Español · العربية · 中文 · Français" aria-label="Message Atlas — ask in English, Spanish, Arabic, Chinese, or French"
              value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") onSend(input); }}
            />
            <button className="tw-input__mic" aria-label={listening ? "Stop recording" : "Talk instead of type"} aria-pressed={listening} onClick={onMic}><Icon name="mic" /></button>
            <button className="tw-input__send" aria-label="Send" onClick={() => onSend(input)}><Icon name="send" small /></button>
          </div>
          <div className="tw-stop-row"><Icon name="check" small /> You're in control — Atlas suggests, and never books for you.</div>
        </div>
      </div>
    </>
  );
}
