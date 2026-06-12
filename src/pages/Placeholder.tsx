import { Eyebrow, ButtonLink } from "@/components/ui/primitives";

/** Honest, on-brand placeholder for screens not yet ported to full fidelity. */
export function Placeholder({ title, eyebrow, lead }: { title: string; eyebrow: string; lead: string }) {
  return (
    <div className="container" style={{ padding: "80px 0 40px", maxWidth: "var(--reading-max)" }}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="t-display-l" style={{ marginTop: 12 }}>{title}</h1>
      <p className="t-lead" style={{ marginTop: 16 }}>{lead}</p>
      <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
        <ButtonLink to="/special-interests">Design your journey</ButtonLink>
        <ButtonLink to="/sitemap" variant="secondary">View the sitemap</ButtonLink>
      </div>
      <p className="pill pill-preview" style={{ marginTop: 28 }}>Preview · scaffolded screen</p>
    </div>
  );
}

export default Placeholder;
