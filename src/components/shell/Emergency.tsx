import { Icon } from "@/lib/icons";
import { useStore } from "@/store/useStore";

export function Emergency() {
  const { panel, closePanel } = useStore();
  const open = panel === "emergency";

  return (
    <div className="tw-emergency" data-open={open} role="dialog" aria-modal="true" aria-label="Emergency help" aria-hidden={!open}>
      <div className="tw-emergency__scrim" onClick={closePanel} />
      <div className="tw-emergency__card">
        <div className="tw-emergency__head">
          <div className="ring"><Icon name="sos" /></div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 22 }}>Emergency Help</h2>
            <p className="t-body-s" style={{ color: "var(--muted-foreground)", marginTop: 2 }}>Nearest help and the right local numbers.</p>
          </div>
          <button className="tw-iconbtn" aria-label="Close" style={{ width: 36, height: 36, border: 0, background: "var(--surface-alt)" }} onClick={closePanel}>
            <Icon name="close" small />
          </button>
        </div>
        <div className="tw-emergency__loc">
          <Icon name="pin" small />
          <div><b>Using your itinerary location:</b> Maasai Mara, Kenya. <a href="#" onClick={(e) => e.preventDefault()} style={{ fontWeight: 600 }}>Use precise GPS instead</a> for nearest hospital.</div>
        </div>
        <div className="tw-emergency__list">
          <div className="tw-emerg-item">
            <div className="tw-emerg-item__ic"><Icon name="phone" /></div>
            <div><div className="tw-emerg-item__name">Local emergency line</div><div className="tw-emerg-item__meta">Kenya · police / fire / ambulance</div></div>
            <a className="btn btn-secondary tw-emerg-item__call" href="tel:999">Call 999</a>
          </div>
          <div className="tw-emerg-item">
            <div className="tw-emerg-item__ic"><Icon name="hospital" /></div>
            <div><div className="tw-emerg-item__name">Nearest hospital</div><div className="tw-emerg-item__meta">Shown from your saved location</div></div>
            <a className="btn btn-secondary tw-emerg-item__call" href="#" onClick={(e) => e.preventDefault()}>Directions</a>
          </div>
          <div className="tw-emerg-item">
            <div className="tw-emerg-item__ic"><Icon name="shield" /></div>
            <div><div className="tw-emerg-item__name">Your embassy</div><div className="tw-emerg-item__meta">From your Travel ID nationality</div></div>
            <a className="btn btn-secondary tw-emerg-item__call" href="#" onClick={(e) => e.preventDefault()}>Contact</a>
          </div>
        </div>
        <div style={{ padding: "8px 24px 22px" }}>
          <p className="ftc"><Icon name="globe" small /> Numbers and locations are surfaced from verified safety data — never fabricated. Confirm with local authorities on the ground.</p>
        </div>
      </div>
    </div>
  );
}
