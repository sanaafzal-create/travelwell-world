import { useState } from "react";
import { Link } from "react-router-dom";
import { useT } from "@/lib/i18n";
import { setAnalyticsConsent } from "@/lib/analytics";

const KEY = "tww:consent";

/**
 * First-visit consent notice. Non-blocking; remembers the choice.
 *
 * Two decisions live here, deliberately unbundled (2026-09-03):
 *  · the ESSENTIAL notice — first-party cookies/local storage that remember
 *    the trip. Informational; both buttons acknowledge it.
 *  · the ANALYTICS OPT-IN — Google Analytics loads ONLY on an explicit yes
 *    (src/lib/analytics.ts; default-denied, recorded with its timestamp).
 *    "Essential only" is styled with the same weight as "Allow" — declining
 *    must be exactly as easy as accepting, or the consent is theatre.
 */
export function CookieConsent() {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try { return localStorage.getItem(KEY) === "1"; } catch { return true; }
  });
  const t = useT();
  if (dismissed) return null;

  const choose = (analytics: boolean) => {
    setAnalyticsConsent(analytics);
    try { localStorage.setItem(KEY, "1"); } catch { /* private mode */ }
    setDismissed(true);
  };

  return (
    <div className="tw-consent" role="dialog" aria-label="Cookie and analytics consent">
      <p className="tw-consent__text">
        {t("consent.text")} {t("consent.analytics")}{" "}
        {t("consent.see")} <Link to="/privacy">{t("foot.privacy")}</Link>.
      </p>
      <div className="tw-consent__actions">
        <button className="btn btn-primary tw-consent__ok" onClick={() => choose(true)}>{t("consent.allow")}</button>
        <button className="btn btn-secondary tw-consent__ok" onClick={() => choose(false)}>{t("consent.essential")}</button>
      </div>
    </div>
  );
}
