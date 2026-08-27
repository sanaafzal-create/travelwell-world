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
  /**
   * The FCDO's own verb for this area — "advises against all travel" or
   * "advises against all but essential travel".
   *
   * ── DAVID'S RULING, 2026-08-21: L1–L4 IS RETIRED OUTRIGHT ────────────────
   * "We don't post them anymore, we don't book on them or against them anymore
   * … Postures only." Postures order without being numbered: no advisory →
   * against all but essential → against all travel. Three values, strictly
   * ranked; stricter-wins unchanged; an unrecognised posture still holds.
   *
   * `lvl` stays as the internal ORDERING for one transition window, because
   * 452 of the library's shipping rows still carry `advisory_level` and both
   * sides agreed the strip is sequenced, not unilateral. But where `posture`
   * is present the RENDER speaks the FCDO's words and never the number — a
   * zone with a posture is FCDO-transcribed, and printing "Level 4" over an
   * FCDO sentence would attribute State's scale to a source that has none.
   * Zones without a posture predate the re-read and keep the number until
   * their country is re-read from verbatim text.
   */
  posture?: "all" | "all-but-essential";
}

/** The FCDO's sentence for a zone posture — rendered instead of a level. */
export const ZONE_POSTURE_TEXT: Record<NonNullable<SafetyZone["posture"]>, string> = {
  all: "FCDO advises against all travel",
  "all-but-essential": "FCDO advises against all but essential travel",
};

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
  /**
   * Date verified, e.g. "2026-05" — ABSENT when the row cannot claim one.
   *
   * It was required, which forced every row to carry a verification date whether
   * or not one was true. That became untenable on 2026-08-20, when David retired
   * the US State Department as a safety authority: 28 of our 38 rows had State as
   * their ONLY source, so their verification rested on something we had disowned.
   *
   * Keeping the date would have reproduced the Uganda failure exactly — a
   * "Verified" badge over sourcing the row itself no longer stands behind. So
   * those rows carry `reported: true` instead, which keeps the level and the
   * booking posture (a thin paper trail is not a reason to soften a warning) and
   * stops the card claiming verification.
   *
   * Optional is the honest shape: a date we cannot support is worse than none.
   */
  verified?: string;
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
   * TRUE when the level came from a source's SILENCE rather than its grade.
   *
   * ── THE FCDO GRADES NOTHING (2026-08-26) ─────────────────────────────────
   * The 34 backfilled rows sit at `lvl: 1` because the FCDO publishes no
   * advisory against travel anywhere in that country. That is a curated
   * baseline, which our canon allows — our L1–L4 are ours, not the source's.
   *
   * But the CARD was presenting it as "Level 1 of 4" in dark green on a
   * four-colour ramp, directly above a source line naming the FCDO. A reader
   * reasonably concludes the FCDO graded the country 1 of 4. It grades nothing,
   * and an absence of a warning is not a statement that a place is safe — the
   * research library asked for exactly this ("no level and no green badge") and
   * was right to.
   *
   * So the number and the ramp are withheld while the LABEL and the summary do
   * the work. Distinct from `unverified`: we DO hold a reading here and the
   * destination books freely. We simply will not draw a grade nobody issued.
   */
  fromAbsence?: boolean;
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
  // NAMES NO SOURCE, deliberately. This read "confirm with travel.state.gov"
  // until 2026-08-18 — printed on every unverified destination as the place to go
  // and check.
  //
  // The wording here used to say State had been "deprioritised" and was
  // "enrichment". That was true on 2026-08-13 and is not true now, and the
  // research library was right to flag it: David RETIRED State on 2026-08-19 —
  // not read, not published, not quoted, not compared, not linked. A comment
  // describing a softer rule than the one in force is how a later reader
  // reintroduces a State reference while believing they are following canon.
  // The code was already correct; only this sentence was behind.
  //
  // It names none rather than swapping one for another, because the card already
  // renders `CheckItYourself` directly beneath it with the real deep links for
  // that country, in source order. A second, hard-coded source string here can
  // only drift from those links, and drifted once already.
  source: "No verified advisory on file — read the official advisory for this country below",
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
  // ── ALIASES ──────────────────────────────────────────────────────────────
  // The research library spells two of these differently from us, and a name
  // that doesn't match falls through to DEFAULT_SAFETY — so a destination shows
  // "not yet verified" while the verified row sits right there under another key.
  // Found when 240 of 503 ingested destinations hit the fallback (2026-08-18);
  // 2 were this, 233 were a genuine gap, and the two look identical on the page.
  "United Arab Emirates": "AE",   // we key it "UAE"
  Chile: "CL",                    // we key the Patagonia row "Chile / Argentina"
  Portugal: "PT", Rwanda: "RW", "Saudi Arabia": "SA", "South Africa": "ZA", "South Korea": "KR",
  Spain: "ES", "St. Lucia": "LC", Switzerland: "CH", Tanzania: "TZ", Thailand: "TH",
  "Turks & Caicos": "TC", UAE: "AE", Uganda: "UG",

  // ── THE FCDO BACKFILL (2026-08-25) ───────────────────────────────────────
  // 233 destinations across 48 countries were reaching DEFAULT_SAFETY, and the
  // cause was not missing rows: every country this map could NAME already had
  // one. It was the naming. A country absent from here resolves to no ISO, so it
  // gets no row, so it never enters the advisory checker's list, so no reading
  // ever arrives to justify a row. The loop closes on itself, and widening this
  // map is what opens it.
  //
  // 38 of the 48 are added here, from the research library's ETag-verified FCDO
  // batch. The ISO codes are ours — the library holds no sourced ISO-3166 table
  // and declined to type one from memory, which was the right call.
  //
  // The 10 that are NOT here are deliberate, and each is a different reason:
  //   · 7 are AREA-RESTRICTED at the FCDO (Mexico, Mozambique, Brazil, Tunisia,
  //     Guatemala, Ecuador, Laos — 87 destinations). Naming them here without
  //     first joining each destination to a zone would print a country-wide
  //     Level 1 over places sitting inside a named restricted area. Staying
  //     unnamed keeps them at DEFAULT_SAFETY, which fails safe.
  //   · 2 span two jurisdictions ("Belgium / Luxembourg", "Sint Maarten (NL) /
  //     Saint-Martin (FR)"). `isMultiCountry` already refuses to deep-link one
  //     advisory for these; picking one half's LEVEL is the same guess somewhere
  //     it matters more.
  //   · 1 is the United Kingdom. The FCDO issues no advice for its own country,
  //     so with State retired we hold no advisory authority for it at all. That
  //     is an accurate gap, not an oversight.
  Argentina: "AR", Belgium: "BE", Belize: "BZ", Botswana: "BW", "British Virgin Islands": "VG",
  "Costa Rica": "CR", Croatia: "HR", Denmark: "DK", "Dominican Republic": "DO",
  "El Salvador": "SV", Estonia: "EE", "Faroe Islands (Kingdom of Denmark)": "FO", Finland: "FI",
  Honduras: "HN", Hungary: "HU", Ireland: "IE", Jamaica: "JM", Luxembourg: "LU", Monaco: "MC",
  Morocco: "MA", Nicaragua: "NI", Oman: "OM", Palau: "PW", Panama: "PA",
  "Puerto Rico (US territory)": "PR", Qatar: "QA", "Sint Eustatius": "BQ", Slovenia: "SI",
  "St. Barthélemy (France/EU)": "BL", "St. Kitts & Nevis": "KN",
  "St. Vincent & the Grenadines": "VC", Sweden: "SE", "United States": "US", Uruguay: "UY",
  "US Virgin Islands (US territory)": "VI", Vietnam: "VN", Zambia: "ZM", Zimbabwe: "ZW",

  // ── FROM THE LIBRARY'S 59-ROW BATCH, 2026-08-26 ──────────────────────────
  // Seven of their 59. The rest were already held, or are held back: the seven
  // AREA-RESTRICTED countries carry their restricted areas as PROSE in
  // `considerations` with `zones: []`, which is the exact shape our own canon
  // forbids — the booking gate reads `lvl`, so a destination inside a named
  // restricted area would show the country number and offer a Book button.
  // Seven more name a country string no destination of ours uses yet.
  Aruba: "AW", Barbados: "BB", "Curaçao": "CW", Dominica: "DM", Grenada: "GD",
  Maldives: "MV", Malta: "MT",
  // Tunisia landed 2026-08-27, the first row whose zones are transcribed from
  // FCDO verbatim text (their snapshot of 2026-07-24) rather than from the
  // retired scale — a named park, military zones and two border strips.
  Tunisia: "TN",
  // ONE ISO, THREE ISLANDS. BQ is ISO's "Bonaire, Sint Eustatius and Saba", and
  // the FCDO serves all three on one page — which is why our slug override for
  // Sint Eustatius is `bonaire-st-eustatius-saba`. Both country strings map to
  // it, and the row now names the jurisdiction rather than one island of it, so
  // a Bonaire card does not claim to be about Sint Eustatius.
  Bonaire: "BQ",
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

/**
 * POSTURE — the FCDO doctrine's booking verb, and it has to DO something.
 *
 * The research library's safety doctrine (David, 2026-08-16) is three postures
 * applied to areas rather than countries: no advisory books freely; against all
 * but essential travel goes to the consent screen; against all travel never
 * books, content only, no override. There is no green badge.
 *
 * `posture` was already declared on `DossierSafety` — and read by nothing. It sat
 * beside `booking_hold`, which is what actually held the booking, so a dossier
 * could carry `posture: "no-booking"` and still offer a Book button if its author
 * trusted the word instead of the boolean. Today no row does: the one dossier
 * carrying a posture also sets `booking_hold: true`, so nothing is live-wrong.
 * That is the author being careful, not the code being safe — and nine more
 * Ethiopian dossiers are written against this doctrine.
 *
 * So the verb is mapped onto machinery that already exists rather than a new gate:
 *   · `book-freely`  → nothing; the level decides, as it always did.
 *   · `consent`      → floor the level at 3, which is exactly what makes the
 *                      existing L3 consent screen fire. "Goes to the consent
 *                      screen" is a sentence our code can already honour.
 *   · `no-booking`   → hold, unconditionally, whatever the level says.
 *   · anything else  → hold, and say the posture was not understood.
 *
 * The last line is the important one. An unrecognised posture means the author
 * intended a restriction we do not implement, and the same reasoning as an
 * unresolvable zone applies: of the two available mistakes, refusing a bookable
 * place is recoverable and selling a held one is not.
 */
const POSTURE_HOLD = "no-booking";
const POSTURE_CONSENT = "consent";
const POSTURE_FREE = "book-freely";
const KNOWN_POSTURES = new Set([POSTURE_HOLD, POSTURE_CONSENT, POSTURE_FREE]);
const normPosture = (p: string | undefined) => (p ?? "").trim().toLowerCase();

/** Case/whitespace-insensitive zone lookup — the join is on a human-typed string. */
const findZone = (zones: SafetyZone[] | undefined, name: string): SafetyZone | undefined =>
  zones?.find((z) => z.name.trim().toLowerCase() === name.trim().toLowerCase());

/**
 * AN UNVERIFIED CARD MUST NOT SIT BESIDE A BOOK BUTTON (2026-08-26).
 *
 * `DEFAULT_SAFETY` has said since it was written that `unverified` "tells the
 * booking gate to treat this as not-freely-bookable". The gate reads
 * `bookingHold`, and nothing ever set it from `unverified` — so 15 live
 * destinations rendered "Safety Card · Not yet verified", a "?" where the level
 * goes, and a working Book It button directly underneath.
 *
 * The research library found the shape of this and put it at 110 rows; the
 * backfill had already closed most of it. 15 is the real figure and every one is
 * a place we have genuine doubt about — Guatemala, Mexico, and the four countries
 * held because a stricter reading disagrees with the FCDO's silence. Those are
 * exactly the ones not to sell.
 *
 * Their remedy is the better one and it is not in conflict: verify them and the
 * hold lifts itself. Until then the page must not contradict its own card.
 */
const holdIfUnverified = (s: SafetyInfo): SafetyInfo =>
  s.unverified && !s.bookingHold ? { ...s, bookingHold: true } : s;

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
  if (!carve) return holdIfUnverified(base);

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
  // The posture, resolved before the level so it can raise it (see POSTURE_* above).
  const posture = normPosture(carve.posture);
  const postureUnknown = posture !== "" && !KNOWN_POSTURES.has(posture);
  const postureFloor = posture === POSTURE_CONSENT ? 3 : 0;

  const lvl = (Math.max(declared ?? 0, zone?.lvl ?? 0, postureFloor) || undefined) as RiskLevel | undefined;
  const hold =
    carve.booking_hold === true ||
    lvl === 4 ||
    zoneUnresolved ||
    posture === POSTURE_HOLD ||
    postureUnknown;

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

  // An unrecognised posture holds booking (above) — and says why. A page that
  // silently refuses to sell, with nothing on it explaining the refusal, is
  // indistinguishable from a broken page, and the traveler deserves the reason
  // as much as the restriction.
  const postureNote = postureUnknown
    ? `Booking is held here: this destination carries a booking posture (“${carve.posture}”) that we do not recognise, and we will not sell a place whose restriction we cannot read.`
    : null;

  // A dossier that only carries notes (no level, no zone) enriches the country
  // record rather than overriding it — it isn't a carve-out.
  if (!lvl) {
    const extra = [carve.notes, postureNote].filter(Boolean) as string[];
    return holdIfUnverified({
      ...base,
      ...(extra.length ? { considerations: [...base.considerations, ...extra] } : {}),
      ...(hold ? { bookingHold: true } : {}),
    });
  }
  const differs = !base.unverified && lvl !== base.lvl;
  // ── A LEVEL MUST NOT INHERIT A SOURCE THAT DENIES HOLDING ONE (2026-08-25)
  // When the country baseline is unverified and a dossier carve-out supplies the
  // level, `unverified` flips to false and the level prints — but the source
  // string was still the base's, which reads "No verified advisory on file". 86
  // live destinations showed "Exercise increased caution" attributed to a
  // sentence saying we hold no advisory: Mexico's 50, Mozambique's 12, the UK's
  // 5, and so on.
  //
  // That is the Uganda failure in a different coat — a card contradicting itself
  // about its own provenance — and the existing conformance check could not see
  // it, because it reads `safety.json` ROWS and this only exists on the RESOLVED
  // record. The check now reads the resolver too.
  //
  // So when the baseline holds nothing, the level's provenance is the dossier's,
  // and it is `reported` rather than verified: a claim we act on and do not
  // dress up as a confirmed government reading.
  const baseDenies = base.unverified && !carve.source;
  const source = carve.source ?? (baseDenies
    ? "From this destination's own dossier — we hold no country-level advisory for it yet"
    : base.source);
  return {
    ...base,
    lvl,
    label: LABEL_FOR_LEVEL[lvl],
    ...(carve.notes ? { summary: carve.notes } : {}),
    source,
    // The level is now a DECLARED reading from this destination's dossier, not
    // the country's silence — so the card draws the number and the ramp again.
    fromAbsence: false,
    ...(baseDenies ? { reported: true } : {}),
    ...(carve.verified ? { verified: carve.verified } : {}),
    ...(postureNote ? { considerations: [...base.considerations, postureNote] } : {}),
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
