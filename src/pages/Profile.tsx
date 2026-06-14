import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { siById } from "@/data/taxonomy";
import { useStore } from "@/store/useStore";
import { Eyebrow } from "@/components/ui/primitives";
import { cx } from "@/lib/utils";

const PROFILE = {
  id: "TW-2A9F-K3",
  created: "Jun 2026",
  party: [
    { initial: "A", name: "Amara", role: "Trip lead · books & pays", cohort: "35–44", tag: "You" },
    { initial: "J", name: "Jhumur", role: "Partner", cohort: "35–44", tag: "Adult" },
  ],
  interests: ["safari", "romance", "culinary"],
  budgets: { stay: ["high", "luxury"], fly: ["business"], eat: ["high"], move: ["mid"], activities: ["mid", "high"] } as Record<string, string[]>,
  trip: { type: "Romantic getaway", length: "10 days", window: "July 2026" },
  dream: "An unhurried anniversary safari — golden-hour game drives, candlelit dinners under the stars, and a few slow mornings with coffee and a view.",
  diet: ["Pescatarian (Jhumur)", "No shellfish"],
  access: ["Step-free rooms preferred"],
  contact: { email: "amara@email.com", channel: "Email + SMS" },
  consent: { updates: true, safety: true, marketing: false } as Record<string, boolean>,
};
const BUDGET_TIERS: Record<string, { label: string; pct: number }> = {
  luxury: { label: "Luxury", pct: 100 }, high: { label: "High-End", pct: 80 }, mid: { label: "Mid-Range", pct: 58 },
  family: { label: "Family Friendly", pct: 40 }, budget: { label: "Budget Conscious", pct: 24 },
};
const FLY_TIERS: Record<string, { label: string; pct: number }> = {
  first: { label: "First Class", pct: 100 }, business: { label: "Business Class", pct: 68 }, coach: { label: "Coach", pct: 34 },
};
const tiersFor = (wid: string) => (wid === "fly" ? FLY_TIERS : BUDGET_TIERS);
const BUDGET_WELLS = [
  { id: "stay", name: "Stay-Well", icon: "bed" }, { id: "fly", name: "Fly-Well", icon: "plane" },
  { id: "eat", name: "Eat-Well", icon: "utensils" }, { id: "move", name: "Move-Well", icon: "car" },
  { id: "activities", name: "Activities-Well", icon: "compass" },
];

function InterestChips() {
  return (
    <div className="idp-chips">
      {PROFILE.interests.map((id) => { const si = siById(id); return si ? <span className="idp-chip" key={id}><span className="dot" style={{ background: si.accent }} />{si.name}</span> : null; })}
    </div>
  );
}

function IdentityCard() {
  return (
    <div className="idp">
      <div className="idp__top">
        <div className="idp__top-row">
          <div className="idp__seal"><Icon name="globe" /></div>
          <div>
            <div className="idp__kicker">TravelWell · Identity Card</div>
            <div className="idp__title">{PROFILE.trip.type}</div>
          </div>
        </div>
        <div className="idp__no">
          <span>ID · {PROFILE.id}</span><span>PARTY · {PROFILE.party.length}</span>
          <span>WINDOW · {PROFILE.trip.window.toUpperCase()}</span><span>SINCE · {PROFILE.created.toUpperCase()}</span>
        </div>
      </div>
      <div className="idp__body">
        <div className="idp__col">
          <h3>Traveling party</h3>
          <div className="idp-party">
            {PROFILE.party.map((m) => (
              <div className="idp-member" key={m.name}>
                <div className="idp-member__av">{m.initial}</div>
                <div><div className="idp-member__name">{m.name}</div><div className="idp-member__meta">{m.role} · {m.cohort}</div></div>
                <span className={cx("idp-member__tag pill", m.tag === "You" ? "pill-live" : "pill-preview")}>{m.tag}</span>
              </div>
            ))}
          </div>
          <h3 style={{ marginTop: 22 }}>Travels for</h3>
          <InterestChips />
        </div>
        <div className="idp__col">
          <h3>The dream</h3>
          <p className="idp-dream">“{PROFILE.dream}”</p>
          <h3 style={{ marginTop: 20 }}>Shape</h3>
          <div className="idp-chips">
            <span className="idp-chip" style={{ background: "var(--surface-alt)", border: "1px solid var(--border)" }}><Icon name="calendar" small /> {PROFILE.trip.length}</span>
            <span className="idp-chip" style={{ background: "var(--surface-alt)", border: "1px solid var(--border)" }}>{PROFILE.trip.window}</span>
          </div>
        </div>
      </div>
      <div className="idp__foot">
        <span className="idp__sig">Signed, ready to travel. <span className="tw">Travel Well.</span></span>
        <span className="pill pill-live">Saved on this device</span>
      </div>
    </div>
  );
}

export default function Profile() {
  const { openPanel, showToast } = useStore();
  const [editing, setEditing] = useState<string | null>(null);

  const Sec = ({ k, icon, title, children }: { k: string; icon: string; title: ReactNode; children: ReactNode }) => {
    if (editing === k) {
      return (
        <div className="pf-sec pf-edit">
          <div className="pf-sec__head"><div className="pf-sec__ic"><Icon name={icon} /></div><div className="pf-sec__title">{title}</div></div>
          <div className="pf-sec__body">
            <div className="pf-edit__fields"><p className="fld__hint"><Icon name="info" small /> Editing is a demo here — changes re-tune your trip in the full product.</p></div>
            <div className="pf-edit__actions">
              <button className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { setEditing(null); showToast("Saved — your trip will re-tune around these changes."); }}>Save changes</button>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="pf-sec">
        <div className="pf-sec__head">
          <div className="pf-sec__ic"><Icon name={icon} /></div><div className="pf-sec__title">{title}</div>
          <button className="pf-sec__edit" onClick={() => setEditing(k)}><Icon name="arrow" small /> Edit</button>
        </div>
        <div className="pf-sec__body">{children}</div>
      </div>
    );
  };

  return (
    <div className="pf">
      <div className="pf__head">
        <div><Eyebrow>Your Travel ID</Eyebrow><h1>{PROFILE.party[0].name}'s travel identity</h1></div>
        <div className="pf__head-actions">
          <Link className="btn btn-secondary" to="/signup"><Icon name="arrow" small /> Rebuild from scratch</Link>
          <Link className="btn btn-primary" to="/itinerary">Open my trip →</Link>
        </div>
      </div>

      <IdentityCard />

      <h2 className="t-h3" style={{ marginTop: 36, marginBottom: 4 }}>Edit any detail</h2>
      <p className="t-body-s" style={{ color: "var(--muted-foreground)", marginBottom: 18 }}>Change anything here and your dream trip quietly re-tunes. No account required — this lives on your device.</p>

      <div className="pf-sections">
        <Sec k="party" icon="heart" title="Traveling party">
          {PROFILE.party.map((m) => <div className="pf-row" key={m.name}><span className="pf-row__k">{m.name}</span><span className="pf-row__v">{m.cohort} · {m.tag}</span></div>)}
        </Sec>

        <Sec k="interests" icon="compass" title="Interests"><InterestChips /></Sec>

        <Sec k="budget" icon="gift" title="Budget, per Well">
          <div className="pf-budget">
            {BUDGET_WELLS.map((w) => {
              const tiers = tiersFor(w.id); const sel = PROFILE.budgets[w.id] || [];
              const maxPct = Math.max(0, ...sel.map((k) => tiers[k]?.pct || 0));
              const labels = sel.map((k) => tiers[k]?.label).filter(Boolean).join(" · ") || "—";
              return (
                <div className="pf-budget__row" key={w.id}>
                  <span className="pf-budget__name"><Icon name={w.icon} small /> {w.name}</span>
                  <span className="pf-budget__track"><span className="pf-budget__fill" style={{ width: `${maxPct}%` }} /></span>
                  <span className="pf-budget__tier">{labels}</span>
                </div>
              );
            })}
          </div>
        </Sec>

        <Sec k="dream" icon="sparkle" title="Trip intent & dream">
          <div className="pf-row"><span className="pf-row__k">Trip type</span><span className="pf-row__v">{PROFILE.trip.type}</span></div>
          <div className="pf-row"><span className="pf-row__k">Length</span><span className="pf-row__v">{PROFILE.trip.length} · {PROFILE.trip.window}</span></div>
          <div style={{ marginTop: 14 }}><p className="idp-dream" style={{ fontSize: 16 }}>“{PROFILE.dream}”</p></div>
        </Sec>

        <Sec k="care" icon="shield" title="Dietary & accessibility">
          <div className="pf-row"><span className="pf-row__k">Dietary</span><span className="pf-row__v">{PROFILE.diet.join(" · ")}</span></div>
          <div className="pf-row"><span className="pf-row__k">Accessibility</span><span className="pf-row__v">{PROFILE.access.join(" · ") || "None noted"}</span></div>
        </Sec>

        <Sec k="contact" icon="message" title="Contact & consent">
          <div className="pf-row"><span className="pf-row__k">Email</span><span className="pf-row__v">{PROFILE.contact.email}</span></div>
          <div className="pf-row"><span className="pf-row__k">Reach me via</span><span className="pf-row__v">{PROFILE.contact.channel}</span></div>
          <div className="pf-row"><span className="pf-row__k">Consents</span><span className="pf-row__v">{[PROFILE.consent.updates && "Updates", PROFILE.consent.safety && "Safety", PROFILE.consent.marketing && "Inspiration"].filter(Boolean).join(" · ")}</span></div>
        </Sec>
      </div>

      <div className="pf-danger">
        <div><Icon name="info" /></div>
        <div><div className="pf-danger__t">Reset your Travel ID</div><div className="pf-danger__s">Clear everything in your Identity Card and start fresh. Your itinerary is kept.</div></div>
        <button className="btn btn-danger" onClick={() => openPanel("concierge")}>Reset Travel ID</button>
      </div>
    </div>
  );
}
