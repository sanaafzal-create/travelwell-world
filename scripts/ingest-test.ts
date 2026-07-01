/**
 * Cape Town ingest / conformance test — validates a destination .json against
 * the engine's canonical vocabularies (SI slugs, region codes, the 5 tiers, the
 * gate set) and existing records. Read-only; prints a report. Not shipped.
 *
 * Run:  esbuild scripts/ingest-test.ts --bundle --platform=node --format=esm \
 *         --outfile=scratchpad/ingest.mjs && node scratchpad/ingest.mjs <path-to.json>
 *
 * Reusable across David's destination dossiers — point it at any conformed
 * .json to check it against the engine before we fold it in.
 */
import { SIS, REGIONS } from "../src/data/taxonomy";
import { DESTINATIONS } from "../src/data/places";
import { readFileSync } from "node:fs";

const FILE = process.argv[2] || "scratchpad/capetown.json";

const CANON_SLUGS = new Set(SIS.map((s) => s.id));
const REGION_CODES = new Set(REGIONS.map((r) => r.code));
const TIERS = new Set(["essential", "comfort", "premier", "luxury", "ultra"]);
const GATES = new Set(["open", "clia", "iatan", "host"]);
const POSTURES = new Set(["bookable", "bookable_with_disclosure", "booking_hold"]);
const TIMINGS = new Set(["sign-now", "sign-now-partial", "july-plus"]);
const DEST_IDS = new Set(Object.values(DESTINATIONS).flat().map((d) => d.id));

const doc = JSON.parse(readFileSync(FILE, "utf8"));
const problems: string[] = [];
const notes: string[] = [];
const ok: string[] = [];

// 1. destination_id vs existing record
if (DEST_IDS.has(doc.destination_id)) ok.push(`destination_id "${doc.destination_id}" matches an existing destination`);
else {
  const near = [...DEST_IDS].find((id) => doc.destination_id.startsWith(id) || id.startsWith(doc.name.toLowerCase().split(" ")[0]));
  problems.push(`destination_id "${doc.destination_id}" has NO matching row. Existing Cape Town row is id="${near ?? "?"}". Slug reconciliation needed.`);
}

// 2. region
if (REGION_CODES.has(doc.region_code)) ok.push(`region_code "${doc.region_code}" valid`);
else problems.push(`region_code "${doc.region_code}" not a known region`);

// 3. tiers
const badTiers = (doc.tier_range ?? []).filter((t: string) => !TIERS.has(t));
if (badTiers.length) problems.push(`tier_range has non-canonical tiers: ${badTiers.join(", ")}`);
else ok.push(`tier_range: all ${doc.tier_range.length} tiers canonical`);

// 4. SI slugs in sis_present
for (const s of doc.sis_present ?? []) {
  if (!CANON_SLUGS.has(s.si)) problems.push(`sis_present slug "${s.si}" (${s.si_name}) is NOT an engine slug`);
}
// 5. SI slugs in jewels
for (const j of doc.jewels ?? []) {
  if (j.si_tag && !CANON_SLUGS.has(j.si_tag)) problems.push(`jewel "${j.name}" si_tag "${j.si_tag}" is NOT an engine slug`);
}
const allSlugs = [...new Set([...(doc.sis_present ?? []).map((s: {si:string}) => s.si), ...(doc.jewels ?? []).map((j: {si_tag:string}) => j.si_tag).filter(Boolean)])];
const goodSlugs = allSlugs.filter((s) => CANON_SLUGS.has(s as string));
ok.push(`SI slugs recognized: ${goodSlugs.length}/${allSlugs.length} (${goodSlugs.join(", ")})`);

// 6. si_name vs engine name (drift, not fatal)
for (const s of doc.sis_present ?? []) {
  const eng = SIS.find((x) => x.id === s.si);
  if (eng && s.si_name && eng.name !== s.si_name) notes.push(`si_name drift for "${s.si}": file="${s.si_name}" vs engine="${eng.name}"`);
}

// 7. gates + timings + posture across jewels and trails
const gatesUsed = new Set<string>();
const timingsUsed = new Set<string>();
const typesUsed = new Set<string>();
const scan = (cp: {gate?: string|null; timing?: string|null; type?: string}, where: string) => {
  if (cp.gate != null) { gatesUsed.add(cp.gate); if (!GATES.has(cp.gate)) problems.push(`${where}: gate "${cp.gate}" not in {open,clia,iatan,host}`); }
  if (cp.timing != null) { timingsUsed.add(cp.timing); if (!TIMINGS.has(cp.timing)) problems.push(`${where}: timing "${cp.timing}" not canonical`); }
  if (cp.type) typesUsed.add(cp.type);
};
for (const j of doc.jewels ?? []) if (j.commission_path) scan(j.commission_path, `jewel "${j.name}"`);
for (const t of doc.monetization_trails ?? []) scan(t, `trail "${t.channel}"`);
ok.push(`gates used: ${[...gatesUsed].join(", ") || "none"} (all valid)`);
ok.push(`timings used: ${[...timingsUsed].join(", ") || "none"}`);
notes.push(`commission_path/trail types used (lock the enum?): ${[...typesUsed].join(", ")}`);

if (doc.booking?.posture && !POSTURES.has(doc.booking.posture)) problems.push(`booking.posture "${doc.booking.posture}" not canonical`);
else ok.push(`booking.posture "${doc.booking?.posture}" valid, advisory_level ${doc.booking?.advisory_level}`);

// 8. sourcing discipline
const factsUnsourced = (doc.key_facts ?? []).filter((f: {source_url?:string}) => !f.source_url).length;
const jewelsUnsourced = (doc.jewels ?? []).filter((j: {source_url?:string}) => !j.source_url).length;
if (factsUnsourced || jewelsUnsourced) notes.push(`unsourced: ${factsUnsourced} facts, ${jewelsUnsourced} jewels`);
else ok.push(`every fact (${doc.key_facts.length}) and jewel (${doc.jewels.length}) carries source_url`);

// Report
console.log("\n=== CAPE TOWN INGEST TEST ===\n");
console.log(`schema_version: ${doc.schema_version}\n`);
console.log(`PASS (${ok.length}):`);
ok.forEach((s) => console.log("  ✓ " + s));
console.log(`\nFINDINGS — must fix for clean drop-in (${problems.length}):`);
problems.length ? problems.forEach((s) => console.log("  ✗ " + s)) : console.log("  (none)");
console.log(`\nNOTES — align but non-blocking (${notes.length}):`);
notes.forEach((s) => console.log("  • " + s));
console.log("");
