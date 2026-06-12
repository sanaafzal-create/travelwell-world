/** Tiny class-name joiner (no dependency). */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Title-case a single token, e.g. "idea" → "Idea". */
export function cap(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}
