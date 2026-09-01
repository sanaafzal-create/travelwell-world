/**
 * TravelWell — the official advisory sources, and DEEP links into them.
 *
 * David's §7B: we publish our verification date, name the sources, hand the
 * traveler the link, and say plainly to read the advisory before they go. His
 * requirement on the link: it must go to that COUNTRY's page, not the source's
 * homepage — "that is the difference between a useful link and a gesture."
 *
 * ── Why this is a table and not string manipulation ────────────────────────
 * The sources don't share a slug. Portugal is `portugal` at the FCDO and
 * `portugal-travel-advisory` at State. Irregular names (the UAE, Turks & Caicos,
 * St. Lucia) don't derive from the display name under any rule that also works
 * for Kenya. So: derive the regular ones, override the rest, in one place.
 *
 * ── A wrong deep link is worse than a homepage link ────────────────────────
 * A 404 looks like we checked and didn't. So every URL this file generates is
 * checkable: `npm run check:advisory-links` fetches all of them and reports what
 * resolves. It needs outbound network, which the build sandbox doesn't have —
 * run it from an environment that does BEFORE these go public-facing, and fix
 * any slug it flags here rather than in a component.
 *
 * Framework-free, no network at read time — the same discipline as
 * emergency-numbers.ts. Building a URL never fetches anything.
 */


/**
 * `state` was removed from this union on 2026-08-20, not merely unused.
 *
 * Leaving it meant the source table still carried State's name and index URL
 * into every visitor's JS bundle — a reference nothing rendered and everything
 * downloaded. David's instruction was categorical: "Nothing remains."
 *
 * The stored feed still exists for build-time comparison (scripts/lib/state-feed.ts).
 * What a traveller's browser receives is the distinction that matters.
 */
export type AdvisorySourceId = "fcdo" | "cdc";

export interface AdvisorySource {
  id: AdvisorySourceId;
  /** How we name it to the traveler. */
  name: string;
  /** Whose advisory this is — so a non-US, non-UK traveler knows to also check their own. */
  issuer: string;
  /** Where the link lands when we have no country slug for this source. */
  index: string;
}

export const ADVISORY_SOURCES: Record<AdvisorySourceId, AdvisorySource> = {
  fcdo: {
    id: "fcdo",
    name: "UK FCDO",
    issuer: "United Kingdom",
    index: "https://www.gov.uk/foreign-travel-advice",
  },
  cdc: {
    id: "cdc",
    name: "CDC Travel Health Notices",
    issuer: "United States · health",
    index: "https://wwwnc.cdc.gov/travel/notices",
  },
};

/**
 * Country slug per source, keyed by ISO alpha-2.
 *
 * `undefined` for a source means "we don't have a confirmed slug" — the link
 * falls back to that source's index rather than guessing, because a guess that
 * 404s is worse than an honest index link. Fill these in from the checker's
 * output; don't hand-type from memory.
 *
 * The default derivation (display name → lowercase, spaces to hyphens) covers
 * most countries; entries here exist only where that derivation is wrong.
 */
const SLUG_OVERRIDES: Record<string, Partial<Record<AdvisorySourceId, string>>> = {
  AE: { fcdo: "united-arab-emirates", cdc: "united-arab-emirates" },
  TC: { fcdo: "turks-and-caicos-islands", cdc: "turks-and-caicos-islands" },
  LC: { fcdo: "st-lucia", cdc: "saint-lucia" },
  // FCDO is `bahamas`, not `the-bahamas` — the checker's first live run 404'd on
  // it (2026-08-11). Empirical beats plausible: this is the whole reason the run
  // reports per-country failures instead of a single pass/fail.
  BS: { fcdo: "bahamas", cdc: "bahamas" },
  KR: { fcdo: "south-korea", cdc: "south-korea" },
  PF: { fcdo: "french-polynesia", cdc: "french-polynesia" },
  ZA: { fcdo: "south-africa", cdc: "south-africa" },
  NZ: { fcdo: "new-zealand", cdc: "new-zealand" },
  SA: { fcdo: "saudi-arabia", cdc: "saudi-arabia" },
  // ── From the library's ETag-verified slug table (2026-08-24) ──────────────
  // "A slug with an ETag beside it is not a guess about a URL — it is a URL we
  // opened." The FCDO files territories under their covering advisory: its
  // Denmark page states it also covers the Faroe Islands; Puerto Rico and the
  // USVI sit on the `usa` page (the FCDO advises on the US — it is only its
  // own country it publishes nothing for); the Bonaire trio share one page.
  US: { fcdo: "usa" },
  PR: { fcdo: "usa" },
  VI: { fcdo: "usa" },
  BQ: { fcdo: "bonaire-st-eustatius-saba" },
  FO: { fcdo: "denmark" },
  BL: { fcdo: "st-martin-and-st-barthelemy" },
  SX: { fcdo: "st-maarten" },
  // Ampersand names derive to a broken slug ("antigua-&-barbuda"); the FCDO's
  // own slugs, ETag-verified via the ingested verbatim store (2026-08-31):
  AG: { fcdo: "antigua-and-barbuda" },
  TT: { fcdo: "trinidad-and-tobago" },
  MF: { fcdo: "st-martin-and-st-barthelemy" },
};

/**
 * Two corrections, both inferred from links that VERIFIABLY resolve rather than
 * from what a slug ought to look like (Sana's run, 2026-08-24, 252 links):
 *
 *   · `&` becomes "and", it does not vanish. We produced `st-kitts-nevis` and
 *     `st-vincent-the-grenadines`, both 404. The evidence is in the passing set:
 *     `turks-and-caicos-islands` resolves at the FCDO, so the source spells the
 *     conjunction out. (And `st-lucia` resolves, so "St." stays "st-" — the two
 *     facts together are why this is a rule and not a guess.)
 *   · A trailing parenthetical is OUR annotation, not part of the country's name.
 *     "Puerto Rico (US territory)" produced `puerto-rico-us-territory`; no source
 *     has ever published that. The parenthetical exists to disambiguate a shelf
 *     for a human reader and has no business in a URL.
 */
const derive = (countryName: string) =>
  countryName
    .replace(/\s*\([^)]*\)\s*$/, "")          // drop our own annotation
    .replace(/&/g, " and ")                   // "&" is a conjunction, not a delimiter
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/**
 * A SOURCE DOES NOT ISSUE TRAVEL ADVICE ABOUT ITS OWN COUNTRY.
 *
 * State publishes no advisory for the United States or its territories; the FCDO
 * publishes none for the United Kingdom. A deep link there is wrong by
 * construction — it cannot ever resolve — and Sana's run found exactly that:
 * four State links and four FCDO links 404 or refuse, on the US, Puerto Rico, the
 * US Virgin Islands and the UK.
 *
 * The link is OMITTED rather than degraded to an index. "We could not confirm a
 * page" is a different and misleading statement when the truth is "this authority
 * does not advise on this country" — and a 404 on a traveller-facing safety link
 * reads as *we checked* when we did not, which is the whole reason this file is
 * checkable at all.
 *
 * Territories are listed explicitly rather than pattern-matched. Whether an
 * advisory covers a territory is a political fact, and the right place for one is
 * a table a person can read and disagree with.
 */
const SOURCE_HOME_COUNTRIES: Record<AdvisorySourceId, string[]> = {
  cdc: ["United States", "Puerto Rico (US territory)", "US Virgin Islands (US territory)"],
  fcdo: ["United Kingdom"],
};
const advisesOn = (source: AdvisorySourceId, countryName: string) =>
  !SOURCE_HOME_COUNTRIES[source].includes(countryName);

/**
 * A destination whose `country` spans TWO countries has no single advisory page
 * (we write those with a slash — "Chile / Argentina").
 *
 * Deliberately a slash and nothing else: "&" and "and" appear inside plenty of
 * SINGLE country names — Turks & Caicos, Antigua & Barbuda, Trinidad and Tobago.
 * A looser rule silently downgraded Turks & Caicos to an index link.
 *
 * ── BUT NOT A SLASH INSIDE A PARENTHESIS (2026-08-25) ─────────────────────
 * "St. Barthélemy (France/EU)" is ONE jurisdiction with a parenthetical saying
 * whose it is. The bare `includes("/")` read it as two and served the FCDO index
 * instead of the island's own page — which the research library's ETag-verified
 * batch shows exists, at `st-martin-and-st-barthelemy`.
 *
 * The failure is the same kind the comment above already warns about, one layer
 * in: a rule that is right about the separator and wrong about where it may
 * appear. The parenthetical is a QUALIFIER — "(US territory)", "(Kingdom of
 * Denmark)", "(NL)" — and never the span itself, so it is stripped before the
 * test. A real span is written outside the brackets, which is what "Chile /
 * Argentina", "Belgium / Luxembourg" and "Sint Maarten (NL) / Saint-Martin (FR)"
 * all do — and all three still read as multi-country after the strip.
 */
export const isMultiCountry = (countryName: string) =>
  countryName.replace(/\([^)]*\)/g, "").includes("/");

/**
 * Overrides for countries we hold NO ISO code for.
 *
 * `SLUG_OVERRIDES` is keyed by ISO, which works only for the 39 countries that
 * have a safety row. The 45 we serve without one — Mexico, the UK, the US
 * territories — cannot be corrected there at all, and that is precisely the set
 * whose links were never checked until the checker was widened.
 *
 * `null` means "no slug we can stand behind" and produces the source's INDEX with
 * the page saying so — the honest state for a URL we have MEASURED to 404.
 *
 * `foreign-travel-advice/united-states` was one of the eight failures in Sana's
 * 2026-08-24 run. `usa` was the obvious candidate and was deliberately left out
 * until it was opened, because obvious is not measured and a guessed deep link is
 * the failure this file exists to prevent. **Sana opened it the same day and it
 * serves the FCDO's United States page**, so it goes in now — with the check
 * recorded beside it rather than in a commit message nobody greps.
 */
const SLUG_OVERRIDES_BY_NAME: Record<string, Partial<Record<AdvisorySourceId, string | null>>> = {
  // Verified in a browser by Sana, 2026-08-24 — `united-states` 404s, `usa` serves.
  "United States": { fcdo: "usa" },

  // ── TERRITORY COVERAGE, READ OFF THE PAGES (Sana, 2026-08-24) ────────────
  // `faroe-islands`, `puerto-rico`, `sint-eustatius` and `us-virgin-islands` all
  // 404: the FCDO does not write separate advice for most territories. The parent
  // pages resolve, so pointing a territory at its parent was AVAILABLE — and was
  // deliberately not done, because "this document covers that territory" is a
  // coverage judgement rather than a URL fact.
  //
  // That restraint paid. Three of the four are covered and one is not, and no
  // rule would have separated them. Each parent page states its own scope in a
  // callout, quoted here verbatim so the claim is checkable without re-reading:
  //
  //   denmark — "This travel advice also covers the Faroe Islands and Greenland."
  //   usa     — "This travel advice also covers American Samoa, Guam, Northern
  //              Mariana Islands, Puerto Rico, and United States Virgin Islands."
  //
  // Had we inferred territory → parent as a rule, Sint Eustatius would have been
  // wrong, and wrong in the worst way: a real page, for the wrong jurisdiction,
  // under the traveller's destination name.
  "Faroe Islands (Kingdom of Denmark)": { fcdo: "denmark" },
  "Puerto Rico (US territory)": { fcdo: "usa" },
  "US Virgin Islands (US territory)": { fcdo: "usa" },

  // THE EXCEPTION — and the research library found the page we could not.
  // The Netherlands page declines to cover it: "Check separate travel advice
  // pages for advice on travel to the constituent countries and special
  // municipalities in the Dutch Caribbean." So a separate page existed and we
  // did not know its slug; `sint-eustatius` 404s.
  //
  // It is `bonaire-st-eustatius-saba` — three islands on one page. Taken from
  // the FCDO's own 226-country index rather than derived, which is why it was
  // findable at all: our derivation produced "-and-" and no rule would have
  // produced this. (Their note, 2026-08-19: six other names failed the same way —
  // Bonaire, Saba, Antigua & Barbuda, Trinidad & Tobago, Montserrat, Hungary.)
  "Sint Eustatius": { fcdo: "bonaire-st-eustatius-saba" },

  // Same shape as Sint Eustatius, found the same way: two islands on one FCDO
  // page, under a name no derivation would produce. From the research library's
  // ETag-verified batch of 2026-08-25, not derived here.
  //
  // This one needed the `isMultiCountry` fix above to be reachable at all — the
  // slash in "(France/EU)" was sending it to the index before any slug was
  // consulted, so the override alone would have done nothing.
  "St. Barthélemy (France/EU)": { fcdo: "st-martin-and-st-barthelemy" },

  // ── DISPROVED BY HAND, 2026-08-24 (Sana) ─────────────────────────────────
  // `monaco-travel-advisory.html` does not open. Monaco has no entry in State's
  // feed, so this was a slug we derived, and the script could never condemn it:
  // State 403s us by method and by header from every egress we have, so a real
  // 404 and a bot block are the same result to a fetch.
  //
  // This is the first time the "unproven and ours" bucket has been cashed in, and
  // it held a genuinely broken link. That category was created on the argument
  // that a 403 on OUR slug is different in kind from a 403 on a URL the source
  // published — the record now shows it: two derived slugs checked by hand,
  // Austria good, Monaco broken. A negative result is worth recording as
  // precisely as a positive one, because the next person to see `monaco` missing
  // will otherwise assume it was an oversight and derive it again.

};

function slugFor(source: AdvisorySourceId, iso: string | null, countryName: string): string | null {
  if (isMultiCountry(countryName)) return null;
  const byName = SLUG_OVERRIDES_BY_NAME[countryName];
  if (byName && source in byName) return byName[source] ?? null;
  const override = iso ? SLUG_OVERRIDES[iso.toUpperCase()]?.[source] : undefined;
  if (override) return override;
  const d = derive(countryName);
  return d || null;
}

export interface AdvisoryLink {
  source: AdvisorySource;
  href: string;
  /** False when we fell back to the source's index — the UI says so plainly. */
  deep: boolean;
}

/**
 * The links we hand a traveler for one destination's country.
 * Never throws, never fetches; returns an index link rather than a bad guess.
 */
export function advisoryLinks(countryName: string, iso: string | null): AdvisoryLink[] {
  // ── STATE IS NOT LINKED. David, 2026-08-20: "We need all references to State
  // Safety Advisories off our website completely. Nothing remains." His reason is
  // not availability but independence — the advisories have been politicised, and
  // a safety authority that moves with a foreign policy is not one we can hand a
  // traveller as ours.
  //
  // The id stays in the union and `statePublishedUrl` stays exported: the stored
  // feed is still what `gen-ground-truth` compares our curated levels against, and
  // a comparison we run internally is not a reference we publish. What changed is
  // that nothing traveller-facing emits it.
  return (["fcdo", "cdc"] as AdvisorySourceId[]).flatMap((id) => {
    // A source that does not advise on this country is left out entirely, rather
    // than shown with a link that cannot resolve.
    if (!advisesOn(id, countryName)) return [];
    const source = ADVISORY_SOURCES[id];
    const slug = slugFor(id, iso, countryName);
    if (!slug) return { source, href: source.index, deep: false };
    const href =
      id === "fcdo" ? `https://www.gov.uk/foreign-travel-advice/${slug}`
      : `https://wwwnc.cdc.gov/travel/destinations/traveler/none/${slug}`;
    return { source, href, deep: true };
  });
}
