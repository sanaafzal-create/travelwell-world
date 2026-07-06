import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/primitives";

/** Shared reading layout for the policy / disclosure pages. */
export function LegalLayout({ eyebrow, title, updated, children }: {
  eyebrow: string; title: string; updated?: string; children: ReactNode;
}) {
  return (
    <div className="legal">
      <div className="legal__head">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1>{title}</h1>
        {updated && <p className="legal__updated">Last updated · {updated}</p>}
      </div>
      <div className="legal__body">{children}</div>
    </div>
  );
}
