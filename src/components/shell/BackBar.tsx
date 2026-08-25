import { useNavigate, useLocation } from "react-router-dom";
import { Icon } from "@/lib/icons";

/**
 * Big, always-obvious BACK control on every page but Home (David, Jul 2026 —
 * senior-first: "how do I go back?" should never be a question). Sits at the top
 * of every page's content, aligned to the content column, one consistent spot.
 *
 * Robust: uses in-app history when we have it, otherwise falls to Home so a
 * deep-linked / fresh-loaded visitor never dead-ends on navigate(-1). WCAG AA:
 * a real labelled button, ≥44px, visible focus.
 *
 * `inline` marks the copy a PAGE renders for itself, below its sub-header and
 * directly above its eyebrow (Sana, 2026-08-24). Shell renders the other copy at
 * the top of <main> for every page that has no sub-header; CSS hides Shell's
 * whenever a `.jn-subhead` is present. The two are told apart by this class and
 * NOT by document order — both land as direct children of `.tw-main`, so a rule
 * keyed on position hid both at once, which is exactly how the control vanished
 * from every journey page while still being in the DOM twice.
 */
export function BackBar({ inline }: { inline?: boolean } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  if (location.pathname === "/") return null; // nothing to go back to on Home

  const goBack = () => {
    if (location.key !== "default") navigate(-1); // real in-app history
    else navigate("/"); // fresh load / deep link — never a dead end
  };

  return (
    <div className={inline ? "tw-backbar tw-backbar--inline" : "tw-backbar"}>
      <button className="tw-back" onClick={goBack} aria-label="Go back to the previous page">
        <Icon name="back" small /> <span>Back</span>
      </button>
    </div>
  );
}
