/**
 * TravelWell.World — the GA4 socket (the measurement stack's item ④,
 * 2026-09-03). SOCKET, DELIBERATELY UNPLUGGED until two things exist:
 *
 *   · the Measurement ID — `VITE_TWW_GA4_ID` on Vercel. Absent (today), every
 *     function here is a permanent no-op and NOTHING is requested from any
 *     Google host. When David's ID arrives it is an env var, not a code change.
 *   · an explicit, per-visitor OPT-IN — `tww:analyticsConsent === "true"`,
 *     granted by a consent surface that does not exist yet and set by nothing
 *     else.
 *
 * ── WHY A SECOND CONSENT KEY, NOT THE EXISTING ONE ─────────────────────────
 * `tww:trackingConsent` (track.ts) is OPT-OUT: it gates our own first-party
 * journey_events, which set no third-party cookies and leave our
 * infrastructure only as rows in our own database. GA4 is a third-party tag
 * with cookies, and nine languages means European visitors, so it needs prior
 * OPT-IN under GDPR/ePrivacy — a default the first-party key must never lend
 * it. Two keys, two defaults, on purpose: inheriting the opt-out default here
 * would load Google for every EU visitor who never said yes.
 *
 * The conservative posture: with no grant we load NOTHING — no gtag loader,
 * no Consent-Mode cookieless pings (some EU regulators contest even those).
 * The grant is recorded with the timestamp it was given, same discipline as
 * the advisory consent record: "what was this visitor asked, and when" is
 * answerable later.
 *
 * journey_events remains the attribution instrument of record for everything
 * beyond GA4's 90-day wall — GA4 measures the short-window interests (ski at
 * 51 days) and the on-site behavior of consenting visitors; it never becomes
 * the source a long-window conversion is judged by (measurement-stack Part 7.4).
 */

// Optional-chained: under the prerender's Node ESM, `import.meta.env` does not
// exist at all, and a bare property read crashes the build.
const GA4_ID: string = ((import.meta as { env?: Record<string, string | undefined> }).env?.VITE_TWW_GA4_ID) ?? "";
const CONSENT_KEY = "tww:analyticsConsent";
const CONSENT_AT_KEY = "tww:analyticsConsentAt";

let loaded = false;

/** Opt-IN: only an explicit stored "true" counts. Absent = denied. */
export function analyticsConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === "true";
  } catch {
    return false;
  }
}

/** Record the visitor's choice (with its timestamp) and act on it. */
export function setAnalyticsConsent(on: boolean) {
  try {
    localStorage.setItem(CONSENT_KEY, on ? "true" : "false");
    localStorage.setItem(CONSENT_AT_KEY, new Date().toISOString());
  } catch {
    /* storage unavailable — stay denied */
  }
  if (on) initGa4();
  else if (GA4_ID) {
    // Google's documented per-property kill switch for an already-loaded tag.
    (window as unknown as Record<string, unknown>)[`ga-disable-${GA4_ID}`] = true;
  }
}

/** Load gtag — only ever with an ID AND a stored grant. Idempotent. */
export function initGa4() {
  if (!GA4_ID || loaded || typeof document === "undefined" || !analyticsConsent()) return;
  loaded = true;
  const w = window as unknown as { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void };
  w.dataLayer = w.dataLayer ?? [];
  const gtag = (...args: unknown[]) => { w.dataLayer!.push(args); };
  w.gtag = gtag;
  gtag("js", new Date());
  // No ad personalization signals — this is site measurement, not remarketing.
  gtag("config", GA4_ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_ID)}`;
  document.head.appendChild(s);
}
