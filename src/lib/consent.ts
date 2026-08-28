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
 * was shown, not to the country. If the source reissues it the next morning, the
 * old record is evidence of what was on the screen that day and not agreement to
 * anything since — and without the date, the two are indistinguishable.
 *
 * ── IT DID NOT PERSIST, AND THAT MADE IT NOT A RECORD (2026-08-24) ─────────
 * This wrote to `localStorage` and nowhere else, capped at 100, and said so
 * plainly in its own comment: "a local audit trail, not storage." Which meant a
 * cleared cache erased it, a second device never had it, and WE COULD NOT READ
 * ANY OF IT.
 *
 * David's ruling ③ is explicit about the one purpose it serves: "in case
 * something drastic happens and we are asked if we offered this trip and why."
 * Against that purpose, a record only the traveller's browser holds is the same
 * as no record — the party who needs to produce it is the only one without it.
 *
 * The research library flagged the shape of this and pointed at
 * `travel_ids.consent`, a single boolean. That is the profile consent flag,
 * sitting beside dietary and accessibility, and was never an advisory record.
 * Right instinct, wrong column, and the real answer was worse than the one they
 * described: not "one flag cannot carry this" but "nothing carries this".
 *
 * ── SO IT NOW WRITES BOTH WAYS, AND NEITHER IS A FALLBACK FOR THE OTHER ────
 * The database row is the record. The local copy stays because it is the only
 * thing that works when a traveller is signed out, offline, or in private mode —
 * and dropping a decision on the floor in those cases is worse than holding it
 * somewhere imperfect. They answer different questions and both are kept.
 */
import type { AdvisoryConsent } from "@/components/safety/ConsentGate";
import { getSupabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";

const KEY = "tww:advisory-consents";
const CAP = 100;

/** The local copy. Bounded, newest first, and never the authority. */
function recordLocally(c: AdvisoryConsent): void {
  try {
    const prev = JSON.parse(localStorage.getItem(KEY) ?? "[]") as AdvisoryConsent[];
    localStorage.setItem(KEY, JSON.stringify([c, ...prev].slice(0, CAP)));
  } catch {
    /* private mode / quota — the gate still did its job on screen */
  }
}

/**
 * Record a decision. Writes locally first, then persists.
 *
 * Local first ON PURPOSE. The database write can fail — signed out, offline, RLS,
 * a bad session — and if it were tried first and awaited, a failure would lose the
 * decision entirely. The local write cannot fail in a way that matters, so it is
 * the one that happens unconditionally.
 *
 * Deliberately NOT awaited by the caller: the gate must never make a traveller
 * wait on a network round-trip to act on a safety decision they have already
 * made. It returns a promise for tests and for anything that wants to know.
 */
export async function recordAdvisoryConsent(c: AdvisoryConsent): Promise<"stored" | "local-only"> {
  recordLocally(c);

  const sb = getSupabase();
  if (!sb) return "local-only";

  try {
    const user = await getCurrentUser();
    // Not signed in is a normal state, not an error: the consent screen works
    // before an account exists. The local copy holds it; nothing is lost that we
    // could have kept, because there is no row to attach it to.
    if (!user) return "local-only";

    const { error } = await sb.from("advisory_consents").insert({
      user_id: user.id,
      dest_id: c.destId,
      dest_name: c.destName,
      country: c.country,
      level: c.level ?? null,
      // The founder-locked threshold that applied — stored in the 0016 `posture`
      // column, which was declared for exactly this and written by nothing.
      posture: c.threshold ?? null,
      fcdo_area: c.fcdoArea ?? null,
      // FIELD 4 of the record: the EXACT advisory text shown. Null is a fact —
      // we held no verbatim text that day — distinguishable from unrecorded.
      advisory_text: c.advisoryText ?? null,
      advisory_url: c.advisoryUrl ?? null,
      // FIELD 7: the statement itself, word-for-word. Not a duplicate of the
      // decision — the label is attorney-pending, so it WILL change, and a row
      // storing only `decision = continued` proves nothing after it is edited.
      statement: c.statement ?? null,
      advisory_published: c.advisoryPublished,
      decision: c.decision,
      decided_at: c.at,
    });

    // FIELD 6 — the profile attribute, written to the Travel I.D. A traveller
    // who reads a complete advisory and chooses to continue has told us
    // something durable: they accept a destination carrying a qualifying safety
    // statement. PRIVACY-BEARING, so the permitted uses are stated here and are
    // the only ones: avoid re-asking a question already answered, and prove
    // what was disclosed. It must NEVER be used to route someone toward a
    // riskier destination. Best-effort: the consent row above is the record;
    // this is a convenience flag derived from it.
    if (!error && c.decision === "continued") {
      try {
        await sb.from("travel_ids").upsert(
          { user_id: user.id, accepts_advisory_destinations: true, updated_at: new Date().toISOString() },
          { onConflict: "user_id" },
        );
      } catch { /* the consent row is the record; the flag can be re-derived */ }
    }
    return error ? "local-only" : "stored";
  } catch {
    // A thrown insert is the same outcome as a failed one from the caller's side.
    // It is not re-raised: a safety decision already taken on screen must not be
    // undone by a storage problem the traveller cannot see or act on.
    return "local-only";
  }
}

/** The local copy — this device only. Never the audit trail. */
export function advisoryConsents(): AdvisoryConsent[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]") as AdvisoryConsent[]; }
  catch { return []; }
}

/**
 * This traveller's decisions as WE hold them — the record that answers the
 * question the ruling was written for.
 *
 * Separate from `advisoryConsents()` and named differently on purpose. One reads
 * a browser, the other reads the database, and a caller that confuses them would
 * answer a legal question with whatever happens to be in a cache.
 */
export async function storedAdvisoryConsents(): Promise<AdvisoryConsent[]> {
  const sb = getSupabase();
  if (!sb) return [];
  try {
    const user = await getCurrentUser();
    if (!user) return [];
    const { data, error } = await sb
      .from("advisory_consents")
      .select("dest_id, dest_name, country, level, posture, fcdo_area, advisory_text, advisory_url, statement, advisory_published, decision, decided_at")
      .order("decided_at", { ascending: false });
    if (error || !data) return [];
    return data.map((r) => ({
      destId: r.dest_id as string,
      destName: r.dest_name as string,
      country: r.country as string,
      level: (r.level ?? 0) as number,
      threshold: (r.posture ?? "") as string,
      fcdoArea: (r.fcdo_area ?? null) as string | null,
      advisoryText: (r.advisory_text ?? null) as string | null,
      advisoryUrl: (r.advisory_url ?? null) as string | null,
      statement: (r.statement ?? "") as string,
      advisoryPublished: (r.advisory_published ?? null) as string | null,
      decision: r.decision as AdvisoryConsent["decision"],
      at: r.decided_at as string,
    }));
  } catch {
    return [];
  }
}
