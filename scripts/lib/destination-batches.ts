/**
 * The one reader for dropped-in destination dossiers.
 *
 * WHY THIS IS SHARED AND NOT COPIED. `gen-catalog-seed` had its own copy and
 * `gen-static-heads` had none, so a batch dropped into `src/data/destinations/`
 * reached Postgres and the live site — and got no static `<head>` page, no
 * per-route title or description, and no JSON-LD in the served HTML.
 *
 * Measured before fixing (2026-08-17): 530 synthetic dossiers ingested cleanly,
 * the seed grew from 28KB to 1.4MB, and `dist/destination/` still held exactly
 * the 44 hand-authored rows. The entire answer-engine surface — which is the
 * reason the static heads exist at all — would have missed every ingested
 * destination while every gate stayed green.
 *
 * That is the shape of failure this repo keeps finding: not a crash, but a
 * second consumer nobody remembered was a consumer. One reader, imported twice.
 */
import { readFileSync, readdirSync } from "node:fs";
import { DESTINATIONS } from "../../src/data/places";

export type DestRow = {
  id?: string; name: string; country: string; region_code?: string;
} & Record<string, unknown>;

/**
 * Every dossier in `src/data/destinations`, keyed by region code.
 *
 * A file is either an array of rows (each carrying `region_code`) or an object
 * keyed by region code. `_`-prefixed files are references and never ship.
 */
export function readDestinationBatches(dir = "src/data/destinations"): Record<string, DestRow[]> {
  let files: string[] = [];
  try { files = readdirSync(dir).filter((f) => f.endsWith(".json") && !f.startsWith("_")); } catch { return {}; }
  const out: Record<string, DestRow[]> = {};
  for (const f of files.sort()) {
    const raw = JSON.parse(readFileSync(`${dir}/${f}`, "utf8"));
    const rows: DestRow[] = Array.isArray(raw)
      ? raw
      : Object.entries(raw).flatMap(([code, list]) =>
          (list as DestRow[]).map((d) => ({ ...d, region_code: d.region_code ?? code })));
    for (const d of rows) {
      const code = d.region_code;
      if (!code) throw new Error(`${f}: destination "${d.id ?? d.name}" has no region_code`);
      (out[code] ??= []).push(d);
    }
  }
  return out;
}

/**
 * Bundled catalog + dropped-in batches, batches winning on id collision — that
 * is how a shallow hand-authored anchor gets upgraded by its full dossier.
 */
export function mergedDestinations(): Record<string, DestRow[]> {
  const merged: Record<string, DestRow[]> = {};
  for (const [code, list] of Object.entries(DESTINATIONS)) merged[code] = [...(list as unknown as DestRow[])];
  for (const [code, list] of Object.entries(readDestinationBatches())) {
    const target = (merged[code] ??= []);
    for (const row of list) {
      // `img` is a placeholder token only — the real photo comes from Unsplash by
      // name + country — so a batch may omit it. Default rather than reject a good
      // dossier over a cosmetic field the DB happens to mark not-null.
      if (!row.img) row.img = "mountainValley";
      const at = row.id ? target.findIndex((d) => d.id === row.id) : -1;
      if (at >= 0) target[at] = row; else target.push(row);   // batch wins
    }
  }
  return merged;
}
