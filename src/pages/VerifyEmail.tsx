import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { img } from "@/lib/images";
import { useStore } from "@/store/useStore";
import { Eyebrow } from "@/components/ui/primitives";

const EMAIL = "amara@email.com";
type State = "pending" | "verifying" | "verified" | "expired";
const TONE: Record<State, string> = { pending: "ve--pending", verifying: "ve--verifying", verified: "ve--ok", expired: "ve--expired" };

export default function VerifyEmail() {
  const { openPanel, showToast } = useStore();
  const [state, setState] = useState<State>("pending");

  // verifying resolves to verified after a beat (mirrors the prototype)
  useEffect(() => {
    if (state !== "verifying") return;
    const t = setTimeout(() => setState("verified"), 1900);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <div className="ve-wrap">
      <div className="ve-bg"><img src={img("santorini", 1600)} alt="" referrerPolicy="no-referrer" /></div>
      <div className={`ve-card ${TONE[state]}`} key={state}>
        <div className="ve-card__accent" />
        <div className="ve-card__inner">
          <div className="ve-logo">Travel<span className="lwell">Well</span><span className="lworld">.world</span></div>

          {state === "pending" && (
            <>
              <div className="ve-ic"><Icon name="message" /></div>
              <Eyebrow className="ve-eyebrow">Confirm it's you</Eyebrow>
              <h1 className="ve-title">Verify your email</h1>
              <p className="ve-sub">We sent a confirmation link to your inbox. Tap it to secure your account and unlock booking — no password needed.</p>
              <div className="ve-mail-to"><Icon name="message" small /> {EMAIL}</div>
              <div className="ve-actions">
                <button className="btn btn-primary" onClick={() => setState("verifying")}>I've tapped the link →</button>
              </div>
              <p className="ve-resend">Didn't get it? <button onClick={() => showToast(`Fresh link sent to ${EMAIL}`)}>Resend email</button></p>
            </>
          )}

          {state === "verifying" && (
            <>
              <div className="ve-spinner" />
              <Eyebrow className="ve-eyebrow">Verifying</Eyebrow>
              <h1 className="ve-title">Confirming your email…</h1>
              <p className="ve-sub">This only takes a moment. Hang tight while we secure your account.</p>
            </>
          )}

          {state === "verified" && (
            <>
              <svg className="ve-check-ring" viewBox="0 0 84 84"><circle cx="42" cy="42" r="42" /><path d="M24 44l12 12 24-26" /></svg>
              <Eyebrow className="ve-eyebrow">You're verified</Eyebrow>
              <h1 className="ve-title">Email confirmed.</h1>
              <p className="ve-sub">Your account is secured and your dream trip is ready. Let's pick up where you left off.</p>
              <div className="ve-actions">
                <Link className="btn btn-primary" to="/itinerary">Continue to your trip →</Link>
                <Link className="btn btn-secondary" to="/special-interests">Explore experiences</Link>
              </div>
            </>
          )}

          {state === "expired" && (
            <>
              <div className="ve-ic"><Icon name="info" /></div>
              <Eyebrow className="ve-eyebrow">Link expired</Eyebrow>
              <h1 className="ve-title">This link has expired.</h1>
              <p className="ve-sub">For your security, verification links last 24 hours and work once. No problem — we'll send a fresh one right away.</p>
              <div className="ve-actions">
                <button className="btn btn-primary" onClick={() => { showToast(`Fresh link sent to ${EMAIL}`); setState("pending"); }}>Send a new link</button>
                <Link className="btn btn-secondary" to="/signin">Back to sign in</Link>
              </div>
            </>
          )}
        </div>
        <div className="ve-foot">
          {state === "pending" && <>Wrong address? <Link to="/signin">Use a different email</Link></>}
          {state === "verifying" && <>Having trouble? <button className="ve-linkbtn" onClick={() => setState("expired")}>The link may have expired</button></>}
          {state === "verified" && <>Signed in as <b style={{ color: "var(--foreground)" }}>{EMAIL}</b></>}
          {state === "expired" && <>Still stuck? <button className="ve-linkbtn" onClick={() => openPanel("concierge")}>Speak with Atlas</button></>}
        </div>
      </div>
    </div>
  );
}
