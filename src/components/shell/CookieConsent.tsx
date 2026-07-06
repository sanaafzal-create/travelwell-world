import { useState } from "react";
import { Link } from "react-router-dom";

const KEY = "tww:consent";

/** First-visit cookie/consent notice. Non-blocking; remembers the choice. */
export function CookieConsent() {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try { return localStorage.getItem(KEY) === "1"; } catch { return true; }
  });
  if (dismissed) return null;

  const accept = () => {
    try { localStorage.setItem(KEY, "1"); } catch { /* private mode */ }
    setDismissed(true);
  };

  return (
    <div className="tw-consent" role="dialog" aria-label="Cookie notice">
      <p className="tw-consent__text">
        We use essential cookies and local storage to remember your trip and preferences.
        See our <Link to="/privacy">Privacy Policy</Link>.
      </p>
      <button className="btn btn-primary tw-consent__ok" onClick={accept}>Got it</button>
    </div>
  );
}
