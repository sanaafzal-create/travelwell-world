/**
 * Dream-Journey step indicator: Interest → Region → Activities → Wells → Book It.
 * Uses the prototype's .tw-steps + .jn-subhead classes (shell.css / journey.css).
 */
import { Link } from "react-router-dom";
import { cx } from "@/lib/utils";

const STEPS = ["Interest", "Region", "Activities", "Wells", "Book It"];

export function StepIndicator({ current }: { current: number }) {
  return (
    <div className="tw-steps" role="list" aria-label="Dream Journey progress">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const state = n < current ? "done" : n === current ? "current" : "todo";
        return (
          <div key={label} style={{ display: "flex", alignItems: "center" }}>
            <div className="tw-step" data-state={state} role="listitem">
              <span className="tw-step__dot">{n}</span>
              <span className="tw-step__label">{label}</span>
            </div>
            {i < STEPS.length - 1 && <span className="tw-step__line" />}
          </div>
        );
      })}
    </div>
  );
}

export interface Crumb { label: string; to?: string; }

/** Journey sub-header: breadcrumb on the left, steps on the right. */
export function JourneyBar({ current, crumbs }: { current: number; crumbs: Crumb[] }) {
  return (
    <div className="jn-subhead">
      <div className="jn-subhead__inner">
        <nav className="jn-crumbs" aria-label="Breadcrumb">
          {crumbs.map((c, i) => (
            <span key={c.label} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              {i > 0 && <span className="sep">/</span>}
              {c.to && i < crumbs.length - 1 ? (
                <Link to={c.to}>{c.label}</Link>
              ) : (
                <span className={cx(i === crumbs.length - 1 && "here")}>{c.label}</span>
              )}
            </span>
          ))}
        </nav>
        <StepIndicator current={current} />
      </div>
    </div>
  );
}
