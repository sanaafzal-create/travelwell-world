import { Icon } from "@/lib/icons";
import { Eyebrow, Button, SafetyChip, Ftc } from "@/components/ui/primitives";
import { useStore } from "@/store/useStore";

const CONTENTS = [
  "Personalized medication list & dosages",
  "Region-specific essentials (antimalarials, rehydration)",
  "Nearest hospital & embassy, printed",
  "Local emergency numbers for your destinations",
  "Allergy & dietary cards in the local language",
];

export default function FirstAidKit() {
  const { showToast } = useStore();
  return (
    <div className="container" style={{ padding: "56px 0 80px" }}>
      <Eyebrow>Travel well · arrive safe</Eyebrow>
      <h1 className="t-display-l" style={{ marginTop: 12 }}>The TravelWell First-Aid Kit.</h1>
      <p className="t-lead" style={{ marginTop: 14, maxWidth: "56ch" }}>A personalized kit built from your Travel ID and itinerary — with a QR Safety Card that surfaces the right help, wherever you are.</p>

      <div style={{ marginTop: 36, display: "grid", gridTemplateColumns: "1fr 360px", gap: 36, alignItems: "start" }}>
        <div>
          <Eyebrow>What's inside</Eyebrow>
          <ul style={{ listStyle: "none", padding: 0, marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            {CONTENTS.map((c) => (
              <li key={c} className="card" style={{ padding: "14px 18px", display: "flex", gap: 12, alignItems: "center" }}>
                <Icon name="check" small style={{ color: "var(--primary)" }} /> <span className="t-body">{c}</span>
              </li>
            ))}
          </ul>
        </div>

        <aside className="card" style={{ padding: 24, position: "sticky", top: 88 }}>
          <Eyebrow>QR Safety Card</Eyebrow>
          <div style={{ marginTop: 14, aspectRatio: "1", background: "var(--surface-alt)", borderRadius: "var(--radius)", display: "grid", placeItems: "center", border: "1px solid var(--border)" }}>
            {/* CSS-rendered placeholder QR */}
            <div style={{ width: "62%", aspectRatio: "1", backgroundImage: "repeating-conic-gradient(var(--foreground) 0 25%, transparent 0 50%)", backgroundSize: "22% 22%", opacity: 0.85 }} />
          </div>
          <div style={{ marginTop: 16 }}><SafetyChip level={2} /></div>
          <p className="t-body-s" style={{ color: "var(--muted-foreground)", marginTop: 12 }}>Scan to surface your level, nearest hospital, embassy and local emergency line — even offline.</p>
          <Button style={{ width: "100%", marginTop: 16 }} onClick={() => showToast("Pre-order saved · we'll be in touch at launch")}>Pre-order your kit</Button>
          <Ftc className="pv__ftc" style={{ marginTop: 12 }}>Pre-launch product. Safety data is verified — never fabricated.</Ftc>
        </aside>
      </div>
    </div>
  );
}
