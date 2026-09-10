import { Eyebrow, ButtonLink } from "@/components/ui/primitives";
import { useT } from "@/lib/i18n";

/**
 * The real 404 — NOT the Placeholder scaffold. The scaffold's "Preview ·
 * scaffolded screen" pill shipped on every dead URL until David hit one
 * (2026-09-09) and read it as an unfinished site, which to a cold visitor is
 * exactly what it says. A traveler on a dead link gets the same treatment as
 * a traveler anywhere else: the brand, a plain statement, and three ways
 * forward. Placeholder stays for genuinely scaffolded screens in dev; nothing
 * routed in production may render it.
 */
export default function NotFound() {
  const t = useT();
  return (
    <div className="container" style={{ padding: "80px 0 64px", maxWidth: "var(--reading-max)" }}>
      <Eyebrow>404</Eyebrow>
      <h1 className="t-display-l" style={{ marginTop: 12 }}>{t("nf.title")}</h1>
      <p className="t-lead" style={{ marginTop: 16 }}>{t("nf.lead")}</p>
      <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
        <ButtonLink to="/">{t("nf.home")}</ButtonLink>
        <ButtonLink to="/special-interests" variant="secondary">{t("nf.explore")}</ButtonLink>
        <ButtonLink to="/sitemap" variant="secondary">{t("nf.sitemap")}</ButtonLink>
      </div>
    </div>
  );
}
