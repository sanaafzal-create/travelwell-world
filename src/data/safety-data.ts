/**
 * TravelWell — Safety Card data (the layer behind the Destination Safety Card).
 *
 * Self-contained, framework-free, no network — compiled into the bundle, the
 * same pattern as src/data/emergency-numbers.ts. Keyed by ISO 3166-1 alpha-2
 * country code so it JOINS the emergency-numbers data off one key (local
 * emergency phone lines live there, never duplicated here).
 *
 * Accuracy contract: every entry must carry a real `source` + `verified` date.
 * Entries we haven't verified yet fall through to DEFAULT_SAFETY ("exercise
 * normal precautions"), which the card renders as a neutral, accurate baseline.
 *
 * Hand-off (David): author entries in this shape (TS or matching JSON), keyed
 * by ISO code, no phone numbers, with source + verified on every entry.
 */

export type RiskLevel = 1 | 2 | 3 | 4; // 1 = normal precautions … 4 = do not travel

/**
 * A NAMED AREA INSIDE A COUNTRY whose advisory level differs from the country's.
 *
 * These already existed — as prose, inside `considerations`. Ten of our thirty-six
 * country rows carry a sentence like *'Level 4 "Do Not Travel" zones: the VRAEM
 * and the Colombia-border area of Loreto'*. That renders correctly and reads
 * well, and it is completely invisible to code: the booking gate reads `lvl`,
 * which is the COUNTRY number, so a destination inside a Do-Not-Travel zone
 * would show its country's Level 2 and offer a Book button.
 *
 * Nothing live is wrong today only because all 44 live destinations happen to
 * sit in the mainstream part of their country. That is luck, not a gate — and
 * the Philippines is the case that breaks it, because there the zones ARE the
 * advisory: a Level 2 country containing a Level 4 archipelago and a Level 3
 * island, with four named places carved back to the baseline inside it.
 *
 * So a zone is structured. Prose stays prose (`considerations`); anything with a
 * level attached to a named place lives here, where the gate can read it.
 */
export interface SafetyZone {
  /** The area, named as the advisory names it — this string is the join key. */
  name: string;
  /** This zone's level, which may be stricter OR looser than the country's. */
  lvl: RiskLevel;
  /**
   * Places explicitly carved BACK OUT of this zone by the advisory itself.
   * State's Philippines wording is the worked example: Level 3 for Mindanao
   * "except Davao City, Davao del Norte, Siargao Island and the Dinagat
   * Islands", which sit at the country baseline. Dropping the exceptions would
   * hold four bookable places at Level 3 — an over-restriction is still an
   * inaccuracy, and it is one that costs us bookings we are entitled to take.
   */
  except?: string[];
  /** Why, in the advisory's terms. Rendered beside the level. */
  note?: string;
}

// Verified destination safety data (David's safety.json — 33 countries, keyed
// by ISO alpha-2, sourced to US State Dept / UK FCDO advisories, verified 2026-06).
import safetyJson from "./safety.json";

export interface SafetyInfo {
  /** Display name, e.g. "Kenya". */
  country: string;
  /** Risk level — maps to the safety-1…safety-4 card colors. */
  lvl: RiskLevel;
  /** Advisory tier text, e.g. "Exercise increased caution". */
  label: string;
  /** One sentence shown at the top of the card. */
  summary: string;
  /** 2–5 key local considerations (rendered as rows). */
  considerations: string[];
  /** Verified medical notes — water, vaccines, altitude, etc. */
  medical?: string;
  /** Provenance, e.g. "US State Dept L2 / UK FCDO, Apr 2026". */
  source: string;
  /** Date verified, e.g. "2026-05". */
  verified: string;
  /**
   * TRUE when we have no verified advisory for this country — i.e. the fallback.
   * Safety data must FAIL SAFE: an unknown country is "we haven't checked",
   * never "normal precautions". Renderers must not print a level number for an
   * unverified card, and the booking gate must treat it as not-freely-bookable.
   */
  unverified?: boolean;
  /**
   * TRUE when we DO hold a level but its provenance is a report we have not
   * independently confirmed against an official advisory.
   *
   * Distinct from `unverified`, and the distinction matters: `unverified` means
   * we have nothing and must not print a number; `reported` means we have a
   * claim worth acting on but cannot call it verified. Collapsing the two would
   * either hide a real risk (printing "?" over an active outbreak) or overstate
   * our sourcing (printing "Verified" over a founder's note).
   *
   * A `reported` row keeps its level and its booking posture — we do not soften
   * a Do-Not-Travel because our paperwork is thin — but the card must not claim
   * verification, and the traveler is told where the reading came from.
   *
   * Why this exists: Uganda carried lvl 4 with `verified: "2026-08"` while its
   * own source string read "NOT independently re-verified — confirm against
   * travel.state.gov + CDC before public use." That string RENDERS, so the card
   * showed a traveler an internal instruction to ourselves, directly beside a
   * "Verified" badge contradicting it.
   */
  reported?: boolean;
  /**
   * Set when a DESTINATION-level carve-out is in force — a named zone whose
   * advisory differs from its country's (the FCDO 7km volcanic exclusion on
   * Flores, which State doesn't carry, is the worked example). The card must say
   * so rather than silently showing a different number from the country page:
   * a traveler who checks the country advisory and sees something else needs to
   * know which one they're looking at and why.
   */
  carveOut?: {
    /** The country-wide level this destination departs from, when we have one. */
    countryLevel?: RiskLevel;
    countryLabel?: string;
  };
  /** From the dossier: this destination is content-only, no Book button (L4 /
   *  blocked L3). Kept on the resolved record so one read answers both. */
  bookingHold?: boolean;
  /**
   * Named areas inside this country carrying their own level (see SafetyZone).
   * On a COUNTRY record these are the whole set; on a RESOLVED destination
   * record they are carried through so the card can still show the rest of the
   * country's picture beside this destination's own reading.
   */
  zones?: SafetyZone[];
  /** Set when this destination resolved INTO one of those zones — the card
   *  names it, because "Level 4" without "because you are in the Sulu
   *  Archipelago" is a number a traveler can't check. */
  inZone?: SafetyZone;
}

/** Card top color per risk level. */
export const SAFE_COLOR: Record<RiskLevel, string> = {
  1: "var(--safety-1)",
  2: "var(--safety-2)",
  3: "var(--safety-3)",
  4: "var(--safety-4)",
};

/** Dark, hued variants for the safety-card HEADER, where the fill sits behind
 *  WHITE text. The vivid SAFE_COLOR ramp is too light for white at L1–L3 (fails
 *  WCAG AA); these keep the same green→red signal but dark enough for ≥4.5:1. */
export const SAFE_HEADER_COLOR: Record<RiskLevel, string> = {
  1: "#1f6b3a", // dark green — normal precautions
  2: "#7a5a12", // dark gold — increased caution
  3: "#9a4e14", // dark amber — reconsider
  4: "#9e2420", // dark red — do not travel
};

/**
 * FAIL-SAFE baseline for any country we don't have verified data for.
 *
 * This used to claim "Level 1 — exercise normal precautions", which is the wrong
 * direction for a safety-first product: it made every gap in our data look like
 * the safest possible answer. A country under a live Level 4 advisory that we
 * simply hadn't recorded would have rendered as "normal precautions" — the exact
 * failure the Safer-Informed promise exists to prevent.
 *
 * Now it says what's true: we haven't verified this one, so check the official
 * source. `lvl: 2` only drives the card's colour toward caution; `unverified`
 * tells renderers not to print a level number at all, and tells the booking gate
 * (when built) to treat this as not-freely-bookable.
 */
export const DEFAULT_SAFETY: SafetyInfo = {
  country: "This destination",
  lvl: 2,
  label: "Not yet verified — check the official advisory",
  summary: "We haven't verified a current government advisory for this destination yet. Check your government's latest advisory before you book or travel.",
  considerations: [],
  source: "No verified advisory on file — confirm with travel.state.gov / your national advisory",
  verified: "",
  unverified: true,
};

/**
 * Display-name → ISO alpha-2 for the countries our live destinations cover.
 * (Destinations store `country` as a display name; the Safety Card and the
 * emergency-numbers data both key by ISO, so we map here.)
 */
export const COUNTRY_ISO: Record<string, string> = {
  Australia: "AU", Austria: "AT", Bahamas: "BS", Cambodia: "KH", Canada: "CA", "Chile / Argentina": "CL",
  Colombia: "CO", Egypt: "EG", France: "FR", "French Polynesia": "PF", Germany: "DE", Greece: "GR",
  Iceland: "IS", Indonesia: "ID", Italy: "IT", Japan: "JP", Jordan: "JO", Kenya: "KE",
  Ethiopia: "ET", Namibia: "NA", Netherlands: "NL", "New Zealand": "NZ", Norway: "NO", Peru: "PE",
  Philippines: "PH",
  Portugal: "PT", Rwanda: "RW", "Saudi Arabia": "SA", "South Africa": "ZA", "South Korea": "KR",
  Spain: "ES", "St. Lucia": "LC", Switzerland: "CH", Tanzania: "TZ", Thailand: "TH",
  "Turks & Caicos": "TC", UAE: "AE", Uganda: "UG",
};

export const isoForCountry = (name: string): string | null => COUNTRY_ISO[name] ?? null;

/**
 * Safety data keyed by ISO alpha-2 — sourced from David's verified safety.json
 * (33 countries, US State Dept / UK FCDO, verified 2026-06). Anything not in
 * the file falls through to DEFAULT_SAFETY. ⚠️ Advisories shift — re-verify
 * against the live source before these cards go public-facing.
 */
export const SAFETY_DATA = safetyJson as Record<string, SafetyInfo>;

/** Look up COUNTRY-level safety by ISO code. Always returns something (DEFAULT fallback). */
export function getSafety(iso: string | null | undefined): SafetyInfo {
  if (!iso) return DEFAULT_SAFETY;
  return SAFETY_DATA[iso.toUpperCase()] ?? DEFAULT_SAFETY;
}

const LEVEL_FROM_ADVISORY: Record<string, RiskLevel> = { L1: 1, L2: 2, L3: 3, L4: 4 };
const LABEL_FOR_LEVEL: Record<RiskLevel, string> = {
  1: "Exercise normal precautions",
  2: "Exercise increased caution",
  3: "Reconsider travel",
  4: "Do not travel",
};

/** The dossier's own safety block (ingest contract §3). */
interface DossierSafety {
  advisory_level?: string;
  posture?: string;
  booking_hold?: boolean;
  notes?: string;
  source?: string;
  verified?: string;
  /**
   * The named country zone this destination sits in — an EXACT match against a
   * `zones[].name` on the country row. Deliberately an explicit link rather than
   * matching on the destination's own name or sub_region: fuzzy geography is how
   * a place ends up inheriting the wrong advisory silently, and a safety read is
   * the last place to be clever. An unmatched name is a hard error at the gate,
   * and holds booking at runtime (below) so it can never fail open.
   */
  zone?: string;
}

/** Case/whitespace-insensitive zone lookup — the join is on a human-typed string. */
const findZone = (zones: SafetyZone[] | undefined, name: string): SafetyZone | undefined =>
  zones?.find((z) => z.name.trim().toLowerCase() === name.trim().toLowerCase());

/**
 * THE CASCADE, resolved: country advisory → destination carve-out.
 *
 * The country level is the baseline; a destination's own dossier can override it
 * for a named zone. Both halves were already specified — the country data keyed
 * by ISO, and `data.safety` in the ingest contract, which the gate validates —
 * but nothing read the carve-out, so a dossier could declare a Level 3 exclusion
 * and the page would calmly show the country's Level 1.
 *
 * When a carve-out is in force the result carries `carveOut` with the country
 * level it departs from, so the card can name both. Silently showing a different
 * number than the government page a traveler just read is exactly the kind of
 * unexplained discrepancy that costs trust.
 */
export function resolveSafety(
  dest: { data?: Record<string, unknown> } | null | undefined,
  iso: string | null | undefined,
): SafetyInfo {
  const base = getSafety(iso);
  const carve = (dest?.data as { safety?: DossierSafety } | undefined)?.safety;
  if (!carve) return base;

  const declared = carve.advisory_level ? LEVEL_FROM_ADVISORY[carve.advisory_level.toUpperCase()] : undefined;

  // ── The zone link ───────────────────────────────────────────────────────────
  // A named zone is resolved off the COUNTRY row, so the level is authored once
  // per advisory rather than copied onto every destination inside it. When State
  // moves the Sulu Archipelago, one row changes and every destination in it
  // follows — copies would have to be found.
  const zone = carve.zone ? findZone(base.zones, carve.zone) : undefined;
  // A zone we can't resolve means the author believes this place sits somewhere
  // with its own advisory and we don't know what that advisory says. There is no
  // safe number to print, so we print none and hold booking. The gate stops this
  // reaching production; this is what happens if one ever slips past it.
  const zoneUnresolved = Boolean(carve.zone) && !zone;

  // If a dossier declares BOTH a level and a zone and they disagree, the
  // STRICTER wins. Two sources of truth on one page can't both be shown, and of
  // the two possible mistakes — refusing a bookable place, or selling a held one
  // — only the second is one we can't take back.
  const lvl = (Math.max(declared ?? 0, zone?.lvl ?? 0) || undefined) as RiskLevel | undefined;
  const hold = carve.booking_hold === true || lvl === 4 || zoneUnresolved;

  if (zoneUnresolved) {
    return {
      ...base,
      lvl: Math.max(base.unverified ? 2 : base.lvl, 3) as RiskLevel,
      label: "Not yet verified — check the official advisory",
      summary: `This destination is recorded as sitting in a named advisory area (“${carve.zone}”) that we do not hold a level for. Read the official advisory below before you plan anything here.`,
      unverified: true,
      bookingHold: true,
    };
  }

  // A dossier that only carries notes (no level, no zone) enriches the country
  // record rather than overriding it — it isn't a carve-out.
  if (!lvl) {
    return {
      ...base,
      ...(carve.notes ? { considerations: [...base.considerations, carve.notes] } : {}),
      ...(hold ? { bookingHold: true } : {}),
    };
  }
  const differs = !base.unverified && lvl !== base.lvl;
  return {
    ...base,
    lvl,
    label: LABEL_FOR_LEVEL[lvl],
    ...(carve.notes ? { summary: carve.notes } : {}),
    ...(carve.source ? { source: carve.source } : {}),
    ...(carve.verified ? { verified: carve.verified } : {}),
    unverified: false,
    bookingHold: hold,
    ...(zone ? { inZone: zone } : {}),
    ...(differs ? { carveOut: { countryLevel: base.lvl, countryLabel: base.label } } : {}),
  };
}

/**
 * Does any named zone in this country carry a level STRICTER than the country's?
 *
 * The card uses this to decide whether to show the zone table at all: on a
 * Level 1 country with no zones it would be noise, and on Kenya or the
 * Philippines it is the most important thing on the page.
 */
export const stricterZones = (s: SafetyInfo): SafetyZone[] =>
  (s.zones ?? []).filter((z) => z.lvl > s.lvl).sort((a, b) => b.lvl - a.lvl);
