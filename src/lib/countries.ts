/**
 * Country list for the Travel ID's home_country (the waitlist's source-country
 * capture — the demand-evidence signal, Josh's open-questions row, 2026-10-11).
 *
 * No hand-typed country table: the ISO-3166 alpha-2 set is derived at runtime
 * by probing Intl.DisplayNames over AA–ZZ with fallback "none" — unknown codes
 * come back undefined and drop out. That gives us the names LOCALIZED in all
 * nine site languages for free (the browser's ICU data), which a hand-authored
 * list would have cost nine translations to match. A small exclusion list
 * removes macro-regions and retired codes that still resolve in some ICUs.
 * Everything is wrapped for engines without DisplayNames: the picker then
 * renders bare codes, and the capture still works — codes are what we store.
 */

const EXCLUDE = new Set([
  "AN", "BU", "CP", "CS", "DG", "EA", "EU", "EZ", "IC", "NT", "QO",
  "SU", "TA", "TP", "UN", "XA", "XB", "YU", "ZR", "ZZ",
]);

let cache: { locale: string; list: { code: string; name: string }[] } | null = null;

/** All ISO country codes with names in the given locale, sorted by name. */
export function countryOptions(locale: string): { code: string; name: string }[] {
  const loc = locale || "en";
  if (cache && cache.locale === loc) return cache.list;
  let list: { code: string; name: string }[] = [];
  try {
    const dn = new Intl.DisplayNames([loc, "en"], { type: "region", fallback: "none" });
    const A = 65;
    for (let i = 0; i < 26; i++) {
      for (let j = 0; j < 26; j++) {
        const code = String.fromCharCode(A + i) + String.fromCharCode(A + j);
        if (EXCLUDE.has(code)) continue;
        let name: string | undefined;
        try { name = dn.of(code); } catch { name = undefined; }
        if (name && name !== code) list.push({ code, name });
      }
    }
    list.sort((a, b) => a.name.localeCompare(b.name, loc));
  } catch {
    list = [];
  }
  cache = { locale: loc, list };
  return list;
}

/** One country's display name, for Profile and admin surfaces. */
export function countryName(code: string | null | undefined, locale: string): string {
  if (!code) return "";
  try {
    const n = new Intl.DisplayNames([locale || "en", "en"], { type: "region", fallback: "none" }).of(code);
    return n || code;
  } catch {
    return code;
  }
}

/**
 * The browser's own region subtag (en-GB → GB) as a suggestion to pin at the
 * top of the picker. A suggestion only — never pre-selected, because en-US
 * defaults would silently write "US" for half the world and poison the very
 * signal this field exists to capture.
 */
export function suggestedCountry(): string | null {
  try {
    const tag = navigator.language || "";
    const m = /-([A-Za-z]{2})(?:-|$)/.exec(tag);
    return m ? m[1].toUpperCase() : null;
  } catch {
    return null;
  }
}
