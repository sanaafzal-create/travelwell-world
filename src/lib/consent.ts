/**
 * The advisory consent record.
 *
 * Pestronk's mechanism for the insurance decline is a signed form, and his point
 * is not the signature — it is having a record of what the traveller was offered
 * and what they chose. A stored record does that better: automatic, timestamped
 * and queryable.
 *
 * TWO THINGS IT DELIBERATELY KEEPS.
 *
 * BOTH DECISIONS, not only the decline. A record that exists only when someone
 * declines tells you nothing about the ones who continued, which is the half you
 * would actually need if a trip went wrong.
 *
 * AND THE ADVISORY'S PUBLICATION DATE. Consent is to the advisory the traveller
 * was shown, not to the country. If State reissues it the next morning, the old
 * record is evidence of what was on the screen that day and not agreement to
 * anything since — and without the date, the two are indistinguishable.
 */
import type { AdvisoryConsent } from "@/components/safety/L3ConsentGate";

const KEY = "tww:advisory-consents";
const CAP = 100;

export function recordAdvisoryConsent(c: AdvisoryConsent): void {
  try {
    const prev = JSON.parse(localStorage.getItem(KEY) ?? "[]") as AdvisoryConsent[];
    // Newest first, bounded — this is a local audit trail, not storage.
    localStorage.setItem(KEY, JSON.stringify([c, ...prev].slice(0, CAP)));
  } catch {
    /* private mode / quota — the gate still did its job on screen */
  }
}

export function advisoryConsents(): AdvisoryConsent[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]") as AdvisoryConsent[]; }
  catch { return []; }
}
