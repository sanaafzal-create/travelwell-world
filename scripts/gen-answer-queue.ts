/**
 * The answer-layer harvest queue — the weekly report the library asked to work
 * from (their letter of 29 Sep 2026, T2/G4): "oldest answers ranked by region
 * times demand weight ... yours will know what is stale and ours only knows
 * what is thin."
 *
 * The region ORDER is David's harvest re-point ruling of 29 September (4.6.6):
 * Caribbean, then Western Europe, then the US, then everywhere else. It is an
 * ordinal, deliberately — the 31 Aug demand research ranks the regions but we
 * hold no per-row demand numbers yet, and an invented weight is a guessed
 * number wearing a formula's clothes. THE CLOCK IS NOW RUNNING: the
 * GSC → BigQuery bulk export went live on 2026-10-05 (project
 * project-8ca0cead-6e94-4194-899, dataset `searchconsole`, location US) —
 * day one of our query history; nothing earlier exists, by Google's design.
 * Once it has accumulated real query volume per market, the ordinal upgrades
 * to a measured weight and this header will say so.
 *
 * Within a region, the queue is: rows whose answers carry NO accessed date
 * first (staleness unknowable, which is worse than stale — a corpus with no
 * clock reports as nothing), then dated rows oldest-first, then rows with no
 * answers at all (the authoring backlog, listed so the harvest and the dossier
 * refresh can run in the same pass and no row is visited twice).
 *
 * Run:  npm run gen:answer-queue   → docs/answer-queue.md
 * Guarded by check:generated like every other generated artifact.
 */
import { writeGenerated } from "./lib/write-generated";
import { REGIONS } from "../src/data/taxonomy";
import { DESTINATIONS } from "./ssr/places-merged";

const stamp = new Date().toISOString().slice(0, 10);

// David's ruled order (29 Sep 2026, 4.6.6) — the rest follow in taxonomy order.
const RULED_ORDER = ["11C", "01F", "12A"];
const regionOrder = [
  ...RULED_ORDER,
  ...REGIONS.map((r) => r.code).filter((c) => !RULED_ORDER.includes(c)),
];
const regionName = (code: string) => REGIONS.find((r) => r.code === code)?.name ?? code;

interface Faq { accessed?: string }
interface QueueRow {
  id: string;
  faqN: number;
  datedN: number;
  oldest: string | null; // oldest accessed date among dated answers
}

const rowsFor = (code: string): { answered: QueueRow[]; thin: string[] } => {
  const rows = (DESTINATIONS[code] ?? []).filter((d) => d.status === "live");
  const answered: QueueRow[] = [];
  const thin: string[] = [];
  for (const d of rows) {
    const faq = ((d.data as { faq?: Faq[] } | undefined)?.faq ?? []);
    if (faq.length === 0) { thin.push(d.id); continue; }
    const dated = faq.filter((f) => f.accessed);
    const oldest = dated.length ? dated.map((f) => f.accessed as string).sort()[0] : null;
    answered.push({ id: d.id, faqN: faq.length, datedN: dated.length, oldest });
  }
  // Undated-first (staleness unknowable), then oldest date ascending.
  answered.sort((a, b) => {
    const aU = a.datedN < a.faqN ? 0 : 1;
    const bU = b.datedN < b.faqN ? 0 : 1;
    if (aU !== bU) return aU - bU;
    return (a.oldest ?? "0000").localeCompare(b.oldest ?? "0000");
  });
  return { answered, thin };
};

const CAP = 15; // rows listed per table; the counts always cover everything

const sections = regionOrder.map((code, i) => {
  const { answered, thin } = rowsFor(code);
  const live = (DESTINATIONS[code] ?? []).filter((d) => d.status === "live").length;
  if (live === 0) return null;
  const undatedRows = answered.filter((r) => r.datedN < r.faqN).length;
  const head = `## ${i < RULED_ORDER.length ? `${i + 1}. ` : ""}${regionName(code)} (\`${code}\`) — ${live} live rows · ${answered.length} answered · ${thin.length} without answers${i < RULED_ORDER.length ? " · **ruled priority**" : ""}`;
  const table = answered.length
    ? `\n| Destination | Answers | Dated | Oldest accessed |\n|---|---|---|---|\n${answered.slice(0, CAP).map((r) =>
        `| \`${r.id}\` | ${r.faqN} | ${r.datedN} | ${r.datedN === 0 ? "**none — staleness unknowable**" : (r.datedN < r.faqN ? `${r.oldest} (partial: ${r.faqN - r.datedN} undated)` : r.oldest)} |`).join("\n")}${answered.length > CAP ? `\n\n*…and ${answered.length - CAP} more answered rows, same ordering.*` : ""}`
    : "\n*No answered rows yet — this region is entirely authoring backlog.*";
  const thinLine = thin.length
    ? `\n\n**Authoring backlog (no answers yet, ${thin.length}):** ${thin.slice(0, CAP).map((t) => `\`${t}\``).join(" · ")}${thin.length > CAP ? ` · …and ${thin.length - CAP} more` : ""}`
    : "";
  return `${head}\n${table}${thinLine}\n\n_${undatedRows} of ${answered.length} answered rows carry at least one undated answer._`;
}).filter(Boolean);

const allLive = Object.values(DESTINATIONS).flat().filter((d) => d.status === "live");
const totalQ = allLive.reduce((n, d) => n + (((d.data as { faq?: Faq[] } | undefined)?.faq) ?? []).length, 0);
const totalDated = allLive.reduce((n, d) => n + (((d.data as { faq?: Faq[] } | undefined)?.faq) ?? []).filter((f) => f.accessed).length, 0);

const md = `# The answer-layer harvest queue

*Generated by \`scripts/gen-answer-queue.ts\` (\`npm run gen:answer-queue\`) from the
live merged catalog. Content last changed ${stamp}. Do not hand-edit — regenerate.
Regenerate weekly, and after every ingest that touches \`faq\` — the library works
from this report rather than its own ranking (their letter, 29 Sep 2026).*

**Region order is David's harvest re-point ruling (29 Sep 2026, 4.6.6): Caribbean →
Western Europe → United States, then the rest.** The order is an ordinal, not a
weight — see the generator header for when it upgrades to measured demand.

**The whole surface right now: ${totalQ} answers on this side of the wall, ${totalDated} dated.**
A question without an accessed date cannot report as stale — it reports as
nothing — so undated rows outrank merely old ones.

${sections.join("\n\n")}

---
*Counts are computed from what is LIVE on the MVP side — the library's send lane
runs ahead of this (their 29 Sep measure: 566 of 862 dated). This sheet moves
when their batches land, which is the point: it ranks what travelers actually see.*
`;

const res = writeGenerated("docs/answer-queue.md", md, [/Content last changed \d{4}-\d{2}-\d{2}/]);
console.log(`docs/answer-queue.md — ${res}. ${totalQ} answers (${totalDated} dated) across ${allLive.length} live rows.`);
