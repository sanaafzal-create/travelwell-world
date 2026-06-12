import { Link } from "react-router-dom";

/** Chosen mark #6 — "Travel" ink · "Well" teal · italic gold ".world". */
export function Logo({ to = "/" }: { to?: string }) {
  return (
    <Link className="tw-logo" to={to} aria-label="TravelWell.world — home">
      Travel<span className="lwell">Well</span><span className="lworld">.world</span>
    </Link>
  );
}
