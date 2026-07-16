import { Icon } from "@/lib/icons";
import { useStore } from "@/store/useStore";
import { useT } from "@/lib/i18n";

/**
 * Always-present Safety button — floats on every screen (bottom-inline-start,
 * clear of the Atlas pill on the end side). One tap opens the Emergency panel,
 * which surfaces the data we already hold: location-aware local emergency
 * numbers (117 countries, offline) + first-aid protocols.
 *
 * Safer-Informed voice: labelled "Safety," not an alarm — we keep travelers
 * informed, calmly, so help is always one tap away. Accessible by default:
 * a real labelled button, keyboard-focusable, visible focus, ≥44px.
 */
export function SafetyFab() {
  const { openPanel, panel } = useStore();
  const t = useT();
  if (panel === "emergency") return null; // no need to float while it's open
  return (
    <button className="tw-safety-fab" onClick={() => openPanel("emergency")} aria-label={t("safety.aria")}>
      <Icon name="cross" />
      <span className="tw-safety-fab__lbl">{t("safety.label")}</span>
    </button>
  );
}
