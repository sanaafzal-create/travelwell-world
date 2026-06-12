import { useNavigate } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { useStore, MAX_SIS } from "@/store/useStore";
import { siById } from "@/data/taxonomy";

/** Sticky selection bar — carries chosen SIs forward to Regions. */
export function SiPickBar() {
  const { journeySIs, toggleSI } = useStore();
  const navigate = useNavigate();
  const show = journeySIs.length > 0;
  const sweet = journeySIs.length >= 1 && journeySIs.length <= 2;

  return (
    <div className="si-pickbar" data-show={show} aria-hidden={!show} role="region" aria-label="Your chosen interests">
      <div className="si-pickbar__inner">
        <div className="si-pickbar__pills">
          {journeySIs.map((id) => {
            const si = siById(id);
            return (
              <span key={id} className="si-pickbar__pill">
                {si?.name ?? id}
                <button aria-label={`Remove ${si?.name ?? id}`} onClick={() => toggleSI(id)}>
                  <Icon name="close" small />
                </button>
              </span>
            );
          })}
        </div>
        <span className="si-pickbar__msg">
          {journeySIs.length}/{MAX_SIS} chosen{sweet ? " · the sweet spot" : journeySIs.length === MAX_SIS ? " · max reached" : ""}
        </span>
        <button className="btn btn-primary" onClick={() => navigate("/regions")}>
          Continue to regions <Icon name="arrow" small />
        </button>
      </div>
    </div>
  );
}
