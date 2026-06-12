import { Icon } from "@/lib/icons";
import { useStore } from "@/store/useStore";

/** Toast + Whisper + backdrop — the ambient, non-blocking shell layer. */
export function Ambient() {
  const { toast, whisper, hideWhisper, panel, closePanel } = useStore();
  const backdropOpen = panel === "mega" || panel === "concierge" || panel === "tray";

  return (
    <>
      <div className="tw-backdrop" data-open={backdropOpen} onClick={closePanel} />

      <div className="tw-whisper" data-show={Boolean(whisper)} role="status" aria-live="polite">
        <div className="tw-whisper__ic"><Icon name="sun" small /></div>
        <div style={{ flex: 1 }}>
          <div className="tw-whisper__kind">{whisper?.kind ?? "A gentle idea"}</div>
          <p className="tw-whisper__text">{whisper?.text ?? ""}</p>
        </div>
        <button className="tw-whisper__close" aria-label="Dismiss" onClick={hideWhisper}><Icon name="close" small /></button>
      </div>

      <div className="tw-toast" data-show={Boolean(toast)} role="status" aria-live="polite">
        {toast && <><Icon name="check" small /> {toast}</>}
      </div>
    </>
  );
}
