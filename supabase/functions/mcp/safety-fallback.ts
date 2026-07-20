// AUTO-GENERATED from src/data/safety.json (verified 2026-06) — do NOT hand-edit.
// Regenerate: node scratchpad/gen-safety-fallback.mjs
//
// Country-level safety fallback for the read-only MCP server. Fills a
// destination's safety block from our verified country advisories when the
// dossier hasn't populated data.safety yet (pre-ingest). Marked derived:true so
// an agent never mistakes it for dossier-grade, place-level detail — but the
// content-only / booking-hold gate still fires, so Safer-Informed holds live.

export interface CountryAdvisory { lvl: 1 | 2 | 3 | 4; label: string; summary: string; source: string; verified: string }

export const COUNTRY_SAFETY: Record<string, CountryAdvisory> = {
  "AE": {
    "lvl": 3,
    "label": "Reconsider travel",
    "summary": "Reconsider travel due to regional conflict and missile/drone risk plus major flight disruption — a sharp, recent change from the UAE's normal baseline.",
    "source": "US State Dept L3 / UK FCDO, Mar 2026",
    "verified": "2026-06"
  },
  "United Arab Emirates": {
    "lvl": 3,
    "label": "Reconsider travel",
    "summary": "Reconsider travel due to regional conflict and missile/drone risk plus major flight disruption — a sharp, recent change from the UAE's normal baseline.",
    "source": "US State Dept L3 / UK FCDO, Mar 2026",
    "verified": "2026-06"
  },
  "AU": {
    "lvl": 1,
    "label": "Exercise normal precautions",
    "summary": "Australia is very safe for travelers; the main risks are natural and environmental, not crime.",
    "source": "US State Dept L1, May 2025",
    "verified": "2026-06"
  },
  "Australia": {
    "lvl": 1,
    "label": "Exercise normal precautions",
    "summary": "Australia is very safe for travelers; the main risks are natural and environmental, not crime.",
    "source": "US State Dept L1, May 2025",
    "verified": "2026-06"
  },
  "BS": {
    "lvl": 2,
    "label": "Exercise increased caution",
    "summary": "Exercise increased caution due to crime, concentrated in parts of Nassau and Freeport.",
    "source": "US State Dept L2, Mar 2025",
    "verified": "2026-06"
  },
  "Bahamas": {
    "lvl": 2,
    "label": "Exercise increased caution",
    "summary": "Exercise increased caution due to crime, concentrated in parts of Nassau and Freeport.",
    "source": "US State Dept L2, Mar 2025",
    "verified": "2026-06"
  },
  "CA": {
    "lvl": 1,
    "label": "Exercise normal precautions",
    "summary": "Canada is very safe; ordinary precautions apply.",
    "source": "US State Dept L1, Jun 2026",
    "verified": "2026-06"
  },
  "Canada": {
    "lvl": 1,
    "label": "Exercise normal precautions",
    "summary": "Canada is very safe; ordinary precautions apply.",
    "source": "US State Dept L1, Jun 2026",
    "verified": "2026-06"
  },
  "CH": {
    "lvl": 1,
    "label": "Exercise normal precautions",
    "summary": "Switzerland is very safe; ordinary precautions apply.",
    "source": "US State Dept L1, May 2025",
    "verified": "2026-06"
  },
  "Switzerland": {
    "lvl": 1,
    "label": "Exercise normal precautions",
    "summary": "Switzerland is very safe; ordinary precautions apply.",
    "source": "US State Dept L1, May 2025",
    "verified": "2026-06"
  },
  "CL": {
    "lvl": 2,
    "label": "Exercise increased caution",
    "summary": "Exercise increased caution due to rising crime and periodic large demonstrations.",
    "source": "US State Dept L2, May 2026",
    "verified": "2026-06"
  },
  "Chile": {
    "lvl": 2,
    "label": "Exercise increased caution",
    "summary": "Exercise increased caution due to rising crime and periodic large demonstrations.",
    "source": "US State Dept L2, May 2026",
    "verified": "2026-06"
  },
  "CO": {
    "lvl": 3,
    "label": "Reconsider travel",
    "summary": "Reconsider travel due to crime, terrorism, kidnapping and civil unrest, with several regions off-limits entirely.",
    "source": "US State Dept L3 / UK FCDO, Mar 2026",
    "verified": "2026-06"
  },
  "Colombia": {
    "lvl": 3,
    "label": "Reconsider travel",
    "summary": "Reconsider travel due to crime, terrorism, kidnapping and civil unrest, with several regions off-limits entirely.",
    "source": "US State Dept L3 / UK FCDO, Mar 2026",
    "verified": "2026-06"
  },
  "DE": {
    "lvl": 2,
    "label": "Exercise increased caution",
    "summary": "Exercise increased caution due to terrorism risk.",
    "source": "US State Dept L2, May 2025",
    "verified": "2026-06"
  },
  "Germany": {
    "lvl": 2,
    "label": "Exercise increased caution",
    "summary": "Exercise increased caution due to terrorism risk.",
    "source": "US State Dept L2, May 2025",
    "verified": "2026-06"
  },
  "ES": {
    "lvl": 2,
    "label": "Exercise increased caution",
    "summary": "Exercise increased caution due to terrorism risk and notably high tourist-area street crime.",
    "source": "US State Dept L2, May 2025",
    "verified": "2026-06"
  },
  "Spain": {
    "lvl": 2,
    "label": "Exercise increased caution",
    "summary": "Exercise increased caution due to terrorism risk and notably high tourist-area street crime.",
    "source": "US State Dept L2, May 2025",
    "verified": "2026-06"
  },
  "FR": {
    "lvl": 2,
    "label": "Exercise increased caution",
    "summary": "Exercise increased caution due to terrorism and persistent petty crime in tourist cities.",
    "source": "US State Dept L2, May 2025",
    "verified": "2026-06"
  },
  "France": {
    "lvl": 2,
    "label": "Exercise increased caution",
    "summary": "Exercise increased caution due to terrorism and persistent petty crime in tourist cities.",
    "source": "US State Dept L2, May 2025",
    "verified": "2026-06"
  },
  "GR": {
    "lvl": 1,
    "label": "Exercise normal precautions",
    "summary": "Greece is generally safe; ordinary precautions apply.",
    "source": "US State Dept L1, Oct 2025",
    "verified": "2026-06"
  },
  "Greece": {
    "lvl": 1,
    "label": "Exercise normal precautions",
    "summary": "Greece is generally safe; ordinary precautions apply.",
    "source": "US State Dept L1, Oct 2025",
    "verified": "2026-06"
  },
  "ID": {
    "lvl": 2,
    "label": "Exercise increased caution",
    "summary": "Exercise increased caution due to terrorism and natural hazards; parts of Papua are off-limits.",
    "source": "US State Dept L2 / UK FCDO, Apr 2025",
    "verified": "2026-06"
  },
  "Indonesia": {
    "lvl": 2,
    "label": "Exercise increased caution",
    "summary": "Exercise increased caution due to terrorism and natural hazards; parts of Papua are off-limits.",
    "source": "US State Dept L2 / UK FCDO, Apr 2025",
    "verified": "2026-06"
  },
  "IS": {
    "lvl": 1,
    "label": "Exercise normal precautions",
    "summary": "Iceland is very safe; the real risks are environmental, not crime.",
    "source": "US State Dept L1, May 2026",
    "verified": "2026-06"
  },
  "Iceland": {
    "lvl": 1,
    "label": "Exercise normal precautions",
    "summary": "Iceland is very safe; the real risks are environmental, not crime.",
    "source": "US State Dept L1, May 2026",
    "verified": "2026-06"
  },
  "IT": {
    "lvl": 2,
    "label": "Exercise increased caution",
    "summary": "Exercise increased caution due to terrorism risk and heavy tourist-area petty crime.",
    "source": "US State Dept L2, May 2025",
    "verified": "2026-06"
  },
  "Italy": {
    "lvl": 2,
    "label": "Exercise increased caution",
    "summary": "Exercise increased caution due to terrorism risk and heavy tourist-area petty crime.",
    "source": "US State Dept L2, May 2025",
    "verified": "2026-06"
  },
  "JO": {
    "lvl": 3,
    "label": "Reconsider travel",
    "summary": "Reconsider travel due to terrorism and regional conflict; several border zones are off-limits.",
    "source": "US State Dept L3 / UK FCDO, May 2026",
    "verified": "2026-06"
  },
  "Jordan": {
    "lvl": 3,
    "label": "Reconsider travel",
    "summary": "Reconsider travel due to terrorism and regional conflict; several border zones are off-limits.",
    "source": "US State Dept L3 / UK FCDO, May 2026",
    "verified": "2026-06"
  },
  "JP": {
    "lvl": 1,
    "label": "Exercise normal precautions",
    "summary": "Japan is very safe; ordinary precautions apply.",
    "source": "US State Dept L1, May 2025",
    "verified": "2026-06"
  },
  "Japan": {
    "lvl": 1,
    "label": "Exercise normal precautions",
    "summary": "Japan is very safe; ordinary precautions apply.",
    "source": "US State Dept L1, May 2025",
    "verified": "2026-06"
  },
  "KE": {
    "lvl": 2,
    "label": "Exercise increased caution",
    "summary": "Exercise increased caution; mainstream safari areas are Level 2, but several border and coastal zones are off-limits.",
    "source": "US State Dept L2 / UK FCDO, Mar 2025",
    "verified": "2026-06"
  },
  "Kenya": {
    "lvl": 2,
    "label": "Exercise increased caution",
    "summary": "Exercise increased caution; mainstream safari areas are Level 2, but several border and coastal zones are off-limits.",
    "source": "US State Dept L2 / UK FCDO, Mar 2025",
    "verified": "2026-06"
  },
  "KH": {
    "lvl": 2,
    "label": "Exercise increased caution",
    "summary": "Exercise increased caution; most of the country is fine, but the Thailand border is off-limits and landmines persist in some rural areas.",
    "source": "US State Dept L2 / UK FCDO, Jul 2025",
    "verified": "2026-06"
  },
  "Cambodia": {
    "lvl": 2,
    "label": "Exercise increased caution",
    "summary": "Exercise increased caution; most of the country is fine, but the Thailand border is off-limits and landmines persist in some rural areas.",
    "source": "US State Dept L2 / UK FCDO, Jul 2025",
    "verified": "2026-06"
  },
  "KR": {
    "lvl": 1,
    "label": "Exercise normal precautions",
    "summary": "South Korea (Republic of Korea) is very safe; ordinary precautions apply — this is not North Korea, which is Do Not Travel.",
    "source": "US State Dept L1, May 2025",
    "verified": "2026-06"
  },
  "South Korea": {
    "lvl": 1,
    "label": "Exercise normal precautions",
    "summary": "South Korea (Republic of Korea) is very safe; ordinary precautions apply — this is not North Korea, which is Do Not Travel.",
    "source": "US State Dept L1, May 2025",
    "verified": "2026-06"
  },
  "LC": {
    "lvl": 1,
    "label": "Exercise normal precautions",
    "summary": "Saint Lucia is island-wide Level 1, but one specific resort has a current US Embassy security alert.",
    "source": "US State Dept L1, Aug 2024 + US Embassy Bridgetown alert, Feb 2026",
    "verified": "2026-06"
  },
  "Saint Lucia": {
    "lvl": 1,
    "label": "Exercise normal precautions",
    "summary": "Saint Lucia is island-wide Level 1, but one specific resort has a current US Embassy security alert.",
    "source": "US State Dept L1, Aug 2024 + US Embassy Bridgetown alert, Feb 2026",
    "verified": "2026-06"
  },
  "NA": {
    "lvl": 2,
    "label": "Exercise increased caution",
    "summary": "Exercise increased caution due to crime; no regional carve-outs.",
    "source": "US State Dept L2, May 2026",
    "verified": "2026-06"
  },
  "Namibia": {
    "lvl": 2,
    "label": "Exercise increased caution",
    "summary": "Exercise increased caution due to crime; no regional carve-outs.",
    "source": "US State Dept L2, May 2026",
    "verified": "2026-06"
  },
  "NL": {
    "lvl": 2,
    "label": "Exercise increased caution",
    "summary": "Exercise increased caution due to terrorism risk.",
    "source": "US State Dept L2, Aug 2024",
    "verified": "2026-06"
  },
  "Netherlands": {
    "lvl": 2,
    "label": "Exercise increased caution",
    "summary": "Exercise increased caution due to terrorism risk.",
    "source": "US State Dept L2, Aug 2024",
    "verified": "2026-06"
  },
  "NO": {
    "lvl": 1,
    "label": "Exercise normal precautions",
    "summary": "Norway is among the safest destinations; the risks are environmental.",
    "source": "US State Dept L1, Feb 2025",
    "verified": "2026-06"
  },
  "Norway": {
    "lvl": 1,
    "label": "Exercise normal precautions",
    "summary": "Norway is among the safest destinations; the risks are environmental.",
    "source": "US State Dept L1, Feb 2025",
    "verified": "2026-06"
  },
  "NZ": {
    "lvl": 1,
    "label": "Exercise normal precautions",
    "summary": "New Zealand is very safe; ordinary precautions apply.",
    "source": "US State Dept L1, Apr 2026",
    "verified": "2026-06"
  },
  "New Zealand": {
    "lvl": 1,
    "label": "Exercise normal precautions",
    "summary": "New Zealand is very safe; ordinary precautions apply.",
    "source": "US State Dept L1, Apr 2026",
    "verified": "2026-06"
  },
  "PE": {
    "lvl": 2,
    "label": "Exercise increased caution",
    "summary": "Exercise increased caution; the tourist circuit is Level 2, but two remote regions are off-limits.",
    "source": "US State Dept L2 / UK FCDO, May 2025",
    "verified": "2026-06"
  },
  "Peru": {
    "lvl": 2,
    "label": "Exercise increased caution",
    "summary": "Exercise increased caution; the tourist circuit is Level 2, but two remote regions are off-limits.",
    "source": "US State Dept L2 / UK FCDO, May 2025",
    "verified": "2026-06"
  },
  "PF": {
    "lvl": 1,
    "label": "Exercise normal precautions",
    "summary": "French Polynesia (Tahiti, Bora Bora, the Society Islands) is low-risk; ordinary precautions apply. It has its own US advisory, separate from mainland France.",
    "source": "US State Dept L1, Dec 2024",
    "verified": "2026-06"
  },
  "French Polynesia": {
    "lvl": 1,
    "label": "Exercise normal precautions",
    "summary": "French Polynesia (Tahiti, Bora Bora, the Society Islands) is low-risk; ordinary precautions apply. It has its own US advisory, separate from mainland France.",
    "source": "US State Dept L1, Dec 2024",
    "verified": "2026-06"
  },
  "PT": {
    "lvl": 1,
    "label": "Exercise normal precautions",
    "summary": "Portugal is generally safe; ordinary precautions apply.",
    "source": "US State Dept L1, Dec 2025",
    "verified": "2026-06"
  },
  "Portugal": {
    "lvl": 1,
    "label": "Exercise normal precautions",
    "summary": "Portugal is generally safe; ordinary precautions apply.",
    "source": "US State Dept L1, Dec 2025",
    "verified": "2026-06"
  },
  "RW": {
    "lvl": 3,
    "label": "Reconsider travel",
    "summary": "Reconsider travel due to a regional Ebola health emergency and DRC-border conflict spillover.",
    "source": "US State Dept L3 / UK FCDO / WHO Ebola emergency, Jun 2026",
    "verified": "2026-06"
  },
  "Rwanda": {
    "lvl": 3,
    "label": "Reconsider travel",
    "summary": "Reconsider travel due to a regional Ebola health emergency and DRC-border conflict spillover.",
    "source": "US State Dept L3 / UK FCDO / WHO Ebola emergency, Jun 2026",
    "verified": "2026-06"
  },
  "SA": {
    "lvl": 3,
    "label": "Reconsider travel",
    "summary": "Reconsider travel due to regional conflict, terrorism and missile/drone risk; some areas are off-limits.",
    "source": "US State Dept L3 / UK FCDO, Mar 2026",
    "verified": "2026-06"
  },
  "Saudi Arabia": {
    "lvl": 3,
    "label": "Reconsider travel",
    "summary": "Reconsider travel due to regional conflict, terrorism and missile/drone risk; some areas are off-limits.",
    "source": "US State Dept L3 / UK FCDO, Mar 2026",
    "verified": "2026-06"
  },
  "TC": {
    "lvl": 2,
    "label": "Exercise increased caution",
    "summary": "Exercise increased caution due to crime, mostly on Providenciales. It has its own US advisory, not folded under the UK.",
    "source": "US State Dept L2, Mar 2025",
    "verified": "2026-06"
  },
  "Turks and Caicos Islands": {
    "lvl": 2,
    "label": "Exercise increased caution",
    "summary": "Exercise increased caution due to crime, mostly on Providenciales. It has its own US advisory, not folded under the UK.",
    "source": "US State Dept L2, Mar 2025",
    "verified": "2026-06"
  },
  "TH": {
    "lvl": 2,
    "label": "Exercise increased caution",
    "summary": "Exercise increased caution; most of the country is fine, but the deep south and the Cambodia border are off-limits or sensitive.",
    "source": "US State Dept L2 / UK FCDO, Jul 2025",
    "verified": "2026-06"
  },
  "Thailand": {
    "lvl": 2,
    "label": "Exercise increased caution",
    "summary": "Exercise increased caution; most of the country is fine, but the deep south and the Cambodia border are off-limits or sensitive.",
    "source": "US State Dept L2 / UK FCDO, Jul 2025",
    "verified": "2026-06"
  },
  "TZ": {
    "lvl": 3,
    "label": "Reconsider travel",
    "summary": "Reconsider travel due to post-election unrest, crime and terrorism; the northern safari circuit is far from the worst areas but the country-wide level is elevated.",
    "source": "US State Dept L3 / UK FCDO, Oct 2025",
    "verified": "2026-06"
  },
  "Tanzania": {
    "lvl": 3,
    "label": "Reconsider travel",
    "summary": "Reconsider travel due to post-election unrest, crime and terrorism; the northern safari circuit is far from the worst areas but the country-wide level is elevated.",
    "source": "US State Dept L3 / UK FCDO, Oct 2025",
    "verified": "2026-06"
  },
  "ZA": {
    "lvl": 2,
    "label": "Exercise increased caution",
    "summary": "Exercise increased caution due to high violent-crime rates.",
    "source": "US State Dept L2, May 2025",
    "verified": "2026-06"
  },
  "South Africa": {
    "lvl": 2,
    "label": "Exercise increased caution",
    "summary": "Exercise increased caution due to high violent-crime rates.",
    "source": "US State Dept L2, May 2025",
    "verified": "2026-06"
  },
  "Chile / Argentina": {
    "lvl": 2,
    "label": "Exercise increased caution",
    "summary": "Exercise increased caution due to rising crime and periodic large demonstrations.",
    "source": "US State Dept L2, May 2026",
    "verified": "2026-06"
  },
  "St. Lucia": {
    "lvl": 1,
    "label": "Exercise normal precautions",
    "summary": "Saint Lucia is island-wide Level 1, but one specific resort has a current US Embassy security alert.",
    "source": "US State Dept L1, Aug 2024 + US Embassy Bridgetown alert, Feb 2026",
    "verified": "2026-06"
  },
  "Turks & Caicos": {
    "lvl": 2,
    "label": "Exercise increased caution",
    "summary": "Exercise increased caution due to crime, mostly on Providenciales. It has its own US advisory, not folded under the UK.",
    "source": "US State Dept L2, Mar 2025",
    "verified": "2026-06"
  },
  "UAE": {
    "lvl": 3,
    "label": "Reconsider travel",
    "summary": "Reconsider travel due to regional conflict and missile/drone risk plus major flight disruption — a sharp, recent change from the UAE's normal baseline.",
    "source": "US State Dept L3 / UK FCDO, Mar 2026",
    "verified": "2026-06"
  }
};

export interface McpSafety {
  advisory_level: string; posture: string; booking_hold: boolean;
  notes: string; source: string; verified?: string; derived: boolean; granularity: string;
}

// L1/L2 book freely; L3 books only if it passes the three safety gates
// (posture "reconsider-gated"); L4 is content-only, booking held. Unknown
// country → neutral baseline (never a false "safe").
export function deriveSafety(country: string): McpSafety {
  const c = COUNTRY_SAFETY[country] ?? COUNTRY_SAFETY[(country || "").toUpperCase()];
  if (!c) {
    return { advisory_level: "L1", posture: "book-freely", booking_hold: false,
      notes: "Baseline — verify the latest official advisory before travel.",
      source: "baseline", derived: true, granularity: "country" };
  }
  const posture = c.lvl >= 4 ? "content-only" : c.lvl === 3 ? "reconsider-gated" : "book-freely";
  return { advisory_level: "L" + c.lvl, posture, booking_hold: c.lvl >= 4,
    notes: c.summary, source: c.source, verified: c.verified, derived: true, granularity: "country" };
}

// Fill safety on a catalog row when the dossier hasn't. Handles both shapes:
// get_destination rows carry `data.safety`; search / get_safety rows carry a
// top-level `safety`. Never overwrites a real dossier safety block.
export function withSafety<T extends Record<string, any>>(row: T): T {
  if (!row) return row;
  const hasData = row.data && typeof row.data === "object";
  const existing = hasData ? row.data.safety : row.safety;
  if (existing && existing.advisory_level) return row;
  const fb = deriveSafety(row.country ?? "");
  if (hasData) (row as any).data = { ...row.data, safety: fb };
  else (row as any).safety = fb;
  return row;
}
