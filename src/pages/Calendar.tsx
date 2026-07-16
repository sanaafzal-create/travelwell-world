import { Icon } from "@/lib/icons";
import { Eyebrow } from "@/components/ui/primitives";
import { MARQUEE_BY_DATE, whenLabel } from "@/lib/marquee";
import { useT } from "@/lib/i18n";
import { useCatalogName } from "@/lib/i18n-catalog";

/**
 * The Forward Calendar — all 70 TLEU marquee events, chronological, each with
 * its booking-window intelligence. The "Sooner" differentiator, on screen.
 */
export default function Calendar() {
  const t = useT();
  const ct = useCatalogName();
  return (
    <main id="main" className="container" style={{ paddingTop: 28, paddingBottom: 80 }}>
      <Eyebrow>{t("mrq.eyebrow")}</Eyebrow>
      <h1 style={{ marginTop: 10 }}>{t("mrq.pageTitle")}</h1>
      <p className="lead" style={{ maxWidth: "60ch" }}>{t("mrq.pageLead")}</p>

      <div className="mrq-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14, marginTop: 24 }}>
        {MARQUEE_BY_DATE.map((e) => (
          <article key={e.id} className="mrq-card" style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 16, background: "var(--surface-alt)", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {e.flagship && (
                <span className="pill" style={{ background: "var(--gold-deep)", color: "white", fontSize: 12, padding: "2px 10px", borderRadius: 999 }}>
                  <Icon name="sparkles" small /> {t("mrq.flagship")}
                </span>
              )}
              {e.regionName && <span className="t-body-s" style={{ color: "var(--muted-foreground)" }}>{ct(`region.${e.regionCode}.name`, e.regionName)}</span>}
            </div>
            <h3 style={{ fontSize: 17, margin: 0 }}>{e.title}</h3>
            {e.blurb && <p className="t-body-s" style={{ color: "var(--muted-foreground)", margin: 0 }}>{e.blurb}</p>}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: "auto", fontSize: 13 }}>
              <Icon name="pin" small /> <span>{whenLabel(e)}</span>
            </div>
            {e.bookBy && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--gold-deep)", fontWeight: 600 }}>
                <Icon name="check" small /> {t("mrq.bookBy")}: {e.bookBy}
              </div>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
