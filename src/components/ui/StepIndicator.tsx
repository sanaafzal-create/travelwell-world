/**
 * Dream-Journey step rail: Interest → Region → Activities → Wells → Book It.
 * Stateful + fully navigable — every step is tappable (free movement), done
 * steps show a check, the current step is highlighted. Completion is derived
 * from the journey selections in the store, so the rail is the single source
 * of "where am I / what's done" on every journey page.
 */
import { Link } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { useStore } from "@/store/useStore";
import { cx } from "@/lib/utils";

const STEPS = [
  { label: "Interest", to: "/special-interests" },
  { label: "Region", to: "/regions" },
  { label: "Activities", to: "/activities" },
  { label: "Wells", to: "/wells-surface" },
  { label: "Book It", to: "/itinerary" },
];

/** Which steps have enough data to count as "done" (drives the checkmarks). */
function useStepDone(): boolean[] {
  const { journeySIs, region, journeyActs } = useStore();
  return [
    journeySIs.length > 0,
    Boolean(region),
    journeyActs.length > 0,
    false, // Wells & Book It are the build/book phase — not auto-checked
    false,
  ];
}

export function StepIndicator({ current }: { current: number }) {
  const done = useStepDone();
  return (
    <div className="tw-steps" role="list" aria-label="Dream Journey progress">
      {STEPS.map((step, i) => {
        const n = i + 1;
        const isCurrent = n === current;
        const isDone = done[i] && !isCurrent;
        const state = isCurrent ? "current" : isDone ? "done" : "todo";
        return (
          <div key={step.label} style={{ display: "flex", alignItems: "center" }}>
            <Link
              to={step.to}
              className="tw-step"
              data-state={state}
              role="listitem"
              aria-current={isCurrent ? "step" : undefined}
              title={`Step ${n} · ${step.label}`}
            >
              <span className="tw-step__dot">{isDone ? <Icon name="check" small /> : n}</span>
              <span className="tw-step__label">{step.label}</span>
            </Link>
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
