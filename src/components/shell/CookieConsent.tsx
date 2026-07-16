import { useState } from "react";
import { Link } from "react-router-dom";
import { useT } from "@/lib/i18n";

const KEY = "tww:consent";

/** First-visit cookie/consent notice. Non-blocking; remembers the choice. */
export function CookieConsent() {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try { return localStorage.getItem(KEY) === "1"; } catch { return true; }
  });
  const t = useT();
  if (dismissed) return null;

  const accept = () => {
    try { localStorage.setItem(KEY, "1"); } catch { /* private mode */ }
    setDismissed(true);
  };

  return (
    <div className="tw-consent" role="dialog" aria-label="Cookie notice">
      <p className="tw-consent__text">
        {t("consent.text")}{" "}
        {t("consent.see")} <Link to="/privacy">{t("foot.privacy")}</Link>.
      </p>
      <button className="btn btn-primary tw-consent__ok" onClick={accept}>{t("consent.ok")}</button>
    </div>
  );
}
