import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { useStore } from "@/store/useStore";
import { useCatalog } from "@/store/useCatalog";
import { track } from "@/lib/track";

/** Toast + Whisper + Anchor + backdrop — the ambient, non-blocking shell layer. */
export function Ambient() {
  const { toast, whisper, hideWhisper, panel, closePanel, anchor, setAnchor, clearAnchor, region } = useStore();
  const regions = useCatalog((s) => s.regions);
  const navigate = useNavigate();
  const location = useLocation();
  const backdropOpen = panel === "mega" || panel === "concierge" || panel === "tray";

  // They've made it back to where they were — drop the anchor.
  useEffect(() => {
    if (anchor && location.pathname === anchor.path) clearAnchor();
  }, [anchor, location.pathname, clearAnchor]);

  // Tap a whisper idea: remember the exact spot first (Anchor), then go.
  function followWhisper() {
    if (!whisper?.href) return;
    const label = region ? regions.find((r) => r.code === region)?.name ?? "your planning" : "your planning";
    setAnchor({ path: location.pathname, label, scrollY: window.scrollY });
    track({ kind: "select", entity: "whisper", entityId: whisper.id, context: { href: whisper.href } });
    const href = whisper.href;
    hideWhisper();
    if (href.startsWith("/")) navigate(href);
    else window.open(href, "_blank", "noopener");
  }

  // One tap back to the exact spot — path + scroll position.
  function goBack() {
    if (!anchor) return;
    const { path, scrollY } = anchor;
    clearAnchor();
    navigate(path);
    window.setTimeout(() => window.scrollTo({ top: scrollY, behavior: "auto" }), 60);
  }

  const showAnchor = Boolean(anchor) && location.pathname !== anchor?.path;

  return (
    <>
      <div className="tw-backdrop" data-open={backdropOpen} onClick={closePanel} />

      <div className="tw-whisper" data-show={Boolean(whisper)} role="status" aria-live="polite">
        <div className="tw-whisper__ic"><Icon name="sun" small /></div>
        <div style={{ flex: 1 }}>
          <div className="tw-whisper__kind">{whisper?.kind ?? "A gentle idea"}</div>
          <p className="tw-whisper__text">{whisper?.text ?? ""}</p>
          {whisper?.href && (
            <button className="tw-whisper__act" onClick={followWhisper}>Take a look →</button>
          )}
        </div>
        <button className="tw-whisper__close" aria-label="Dismiss" onClick={hideWhisper}><Icon name="close" small /></button>
      </div>

      {/* Anchor — the warm way back after wandering off the flow. Wording follows
          David's Atlas Voice Guide ("↩ Back to Bonaire?"): names the place,
          gentle, never a command. Shape further in the voice session. */}
      <div className="tw-anchor" data-show={showAnchor} role="status" aria-live="polite">
        <button className="tw-anchor__btn" onClick={goBack}>
          <span className="tw-anchor__arrow" aria-hidden="true">↩</span> Back to {anchor?.label ?? "your planning"}?
        </button>
        <button className="tw-anchor__close" aria-label="Dismiss" onClick={clearAnchor}><Icon name="close" small /></button>
      </div>

      <div className="tw-toast" data-show={Boolean(toast)} role="status" aria-live="polite">
        {toast && <><Icon name="check" small /> {toast}</>}
      </div>
    </>
  );
}
