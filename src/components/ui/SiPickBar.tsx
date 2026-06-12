import { Link } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { useStore } from "@/store/useStore";
import { siById } from "@/data/taxonomy";

/** Sticky selection bar — carries chosen SIs forward to Regions. */
export function SiPickBar() {
  const { journeySIs, toggleSI } = useStore();
  const show = journeySIs.length > 0;
  const n = journeySIs.length;
  const msg = n === 2 ? "Two — the sweet spot ✨" : n === 3 ? "Three — the most we recommend" : "Add one more, or continue";

  return (
    <div className="si-pickbar" data-show={show} aria-hidden={!show} role="region" aria-label="Your chosen interests">
      <div className="si-pickbar__inner">
        <div className="si-pickbar__pills">
          {journeySIs.map((id) => {
            const si = siById(id);
            return (
              <span key={id} className="si-pickbar__pill">
                {si?.name ?? id}
                <button aria-label={`Remove ${si?.name ?? id}`} onClick={() => toggleSI(id)}>✕</button>
              </span>
            );
          })}
        </div>
        <span className="si-pickbar__msg">{msg}</span>
        <Link className="btn btn-primary" to="/regions">Continue · choose a region <Icon name="arrow" small /></Link>
      </div>
    </div>
  );
}
