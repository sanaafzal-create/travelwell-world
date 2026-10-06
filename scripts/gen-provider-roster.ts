/**
 * The provider id roster - the stable reference keys dossier section-9 joins on
 * (S1, ruled 2026-10-04). Committed and generated so the library reads it AT A
 * REF instead of waiting on an attachment that may not arrive (their C3, 4 Oct:
 * it didn't). One id = one supplier entity, across wells; a rename keeps its
 * id. In the DATABASE these values live in the `slug` column - providers.id is
 * the uuid primary key from 0001 and is never the reference.
 *
 * Run:  npm run gen:provider-roster   ->  docs/provider-ids.json
 * Guarded by check:generated.
 */
import { PROVIDERS, providerId } from "../src/data/places";
import { writeGenerated } from "./lib/write-generated";
import { readFileSync, readdirSync } from "node:fs";
const out: Record<string, { name: string; wells: string[] }> = {};
for (const [well, list] of Object.entries(PROVIDERS)) for (const p of list) {
  const id = providerId(p);
  out[id] ??= { name: p.name, wells: [] };
  if (!out[id].wells.includes(p.well)) out[id].wells.push(p.well);
}
for (const f of readdirSync("src/data/providers").filter((x) => x.endsWith(".csv"))) {
  const lines = readFileSync(`src/data/providers/${f}`, "utf8").trim().split(/\r?\n/);
  const hdr = lines[0].split(","); const n = hdr.indexOf("name"); const w = hdr.indexOf("well");
  for (const l of lines.slice(1)) {
    const cols = l.match(/("([^"]|"")*"|[^,]*)(,|$)/g)!.map((c) => c.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"'));
    if (!cols[n]) continue;
    const id = providerId({ name: cols[n] });
    out[id] ??= { name: cols[n], wells: [] };
    if (!out[id].wells.includes(cols[w])) out[id].wells.push(cols[w]);
  }
}
const res = writeGenerated("docs/provider-ids.json", JSON.stringify({
  _what: "The stable provider ids (S1, ruled 2026-10-04): what a dossier section-9 reference joins on. Minted as the name's slug; a RENAME KEEPS ITS ID, so the id is the durable key and the name is display. One id = one supplier entity, across wells.",
  _rule: "Reference by id. A supplier not in this roster is a named operator with no row yet (S2): carry it by name in the dossier with no booking route until it earns a row through validate:providers.",
  _db_column: "slug (providers.id is the uuid primary key and is never the reference)",
  count: Object.keys(out).length,
  providers: out,
}, null, 1) + "\n");
console.log(`docs/provider-ids.json - ${res}. ${Object.keys(out).length} ids.`);
