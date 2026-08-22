/**
 * One-off generator: emits the catalog seed migrations from the real bundled
 * catalog, so the seeds can never drift from the app. Run via esbuild so it
 * reads the actual TS source:
 *
 *   ./node_modules/.bin/esbuild scripts/gen-catalog-seed.ts --bundle \
 *     --platform=node --format=esm --outfile=scratchpad/gen.mjs && node scratchpad/gen.mjs
 *
 * Emits:
 *   0003_seed_si_activities.sql  — special_interests + activities
 *   0004_seed_providers_subregions.sql — providers + sub_regions
 * Re-run whenever the catalog changes to refresh the seeds.
 */
import { writeFileSync, readFileSync, readdirSync, unlinkSync } from "node:fs";
// ONE reader for dropped-in dossiers, shared with gen-static-heads — see the
// header of that file for what a second, forgotten consumer cost us.
import { mergedDestinations } from "./lib/destination-batches";
import { SIS, SUBREGIONS, REGIONS } from "../src/data/taxonomy";
import { ACTIVITIES, PROVIDERS, DESTINATIONS, GUIDES } from "../src/data/places";
import { LOCAL_SIGNALS } from "../src/data/local-signals";

// Provider research arrives as CSVs in src/data/providers/ (David's sets,
// conformed to the 10-column schema). The seed generator ingests them directly
// — no transcription — so a new set drops in by adding a file. si is
// pipe-separated slugs; region blank = cross-region (e.g. airlines).
interface CsvProvider {
  name: string; well: string; tier: string; price: string; mode: string;
  desc: string; commission: string; si: string[]; region?: string; bookingUrl?: string;
}
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else inQ = false; }
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}
function readProviderCsvs(): CsvProvider[] {
  const dir = "src/data/providers";
  let files: string[] = [];
  try { files = readdirSync(dir).filter((f) => f.endsWith(".csv")); } catch { return []; }
  const rows: CsvProvider[] = [];
  for (const f of files.sort()) {
    const lines = readFileSync(`${dir}/${f}`, "utf8").trim().split(/\r?\n/).filter(Boolean);
    const header = parseCsvLine(lines[0]).map((h) => h.trim());
    for (const line of lines.slice(1)) {
      const cells = parseCsvLine(line);
      const rec: Record<string, string> = {};
      header.forEach((h, i) => { rec[h] = (cells[i] ?? "").trim(); });
      rows.push({
        name: rec.name, well: rec.well, tier: rec.tier, price: rec.price, mode: rec.mode,
        desc: rec.description, commission: rec.commission,
        si: rec.si ? rec.si.split("|").map((s) => s.trim()).filter(Boolean) : [],
        region: rec.region || undefined,
        bookingUrl: rec.booking_url || undefined,
        desc_by_si: rec.desc_by_si ? JSON.parse(rec.desc_by_si) as Record<string, string> : undefined,
      });
    }
  }
  return rows;
}

// TLEU look-ahead events (David's Travel-Linked Event Universe) arrive as one
// JSON array in src/data/tleu-events.json, pre-shaped to the local_signals row
// (snake_case + a meta object per event). The generator ingests them straight
// into the 0007 seed alongside the authored LOCAL_SIGNALS — no transcription.
// Two normalizations happen here so the file stays David's verbatim map:
//   • id is authored null → we mint a stable `tleu-<slug(title)>` primary key.
//   • wells "lodging" → "stay" (our canonical well id; there is no "lodging").
// region_code is validated against REGIONS below (the table FK would error on a
// bad code); SI slugs are soft (text[], no FK) so future-SI tags like
// prosports-spectator ride along quietly until those interests ship.
interface TleuEvent {
  id: string | null; destination_id: string | null; region_code: string | null;
  si?: string[]; wells?: string[]; kind: string; horizon: string;
  title: string; blurb?: string; starts_on?: string | null; ends_on?: string | null;
  recurrence?: { months?: number[]; days?: number[] }; season?: string;
  source?: string; priority?: number; meta?: Record<string, unknown>;
}
const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const WELL_REMAP: Record<string, string> = { lodging: "stay" };
function readTleuEvents(validRegions: Set<string>): LocalSignal[] {
  let raw: TleuEvent[] = [];
  try { raw = JSON.parse(readFileSync("src/data/tleu-events.json", "utf8")); }
  catch { return []; }
  const seen = new Set<string>();
  return raw.map((e) => {
    let id = e.id ?? `tleu-${slug(e.title)}`;
    while (seen.has(id)) id = `${id}-2`;
    seen.add(id);
    if (e.region_code && !validRegions.has(e.region_code)) {
      throw new Error(`TLEU event "${e.title}" has unknown region_code ${e.region_code}`);
    }
    return {
      id,
      kind: e.kind as LocalSignal["kind"],
      horizon: e.horizon as LocalSignal["horizon"],
      title: e.title,
      blurb: e.blurb,
      destination: e.destination_id ?? undefined,
      region: e.region_code ?? undefined,
      si: e.si,
      wells: (e.wells ?? []).map((w) => WELL_REMAP[w] ?? w),
      season: e.season,
      recurrence: e.recurrence,
      startsOn: e.starts_on ?? undefined,
      endsOn: e.ends_on ?? undefined,
      priority: e.priority,
      source: (e.source ?? "curated") as LocalSignal["source"],
      meta: e.meta,
    };
  });
}

const q = (s: string | null | undefined) => (s == null ? "null" : `'${s.replace(/'/g, "''")}'`);
const pgArr = (xs?: string[]) => `'{${(xs ?? []).map((x) => `"${x.replace(/"/g, '\\"')}"`).join(",")}}'`;
const jsonb = (o: unknown) => (o == null ? "null" : `'${JSON.stringify(o).replace(/'/g, "''")}'::jsonb`);

/**
 * Drop-in Special-Interest dossiers — the same "add a file and it works" path
 * the destination batches use. The research library delivers
 * `src/data/interests/<batch>.json` and this picks it up automatically:
 * nothing to hand-merge into taxonomy.ts, nothing to reshape.
 *
 * Each file is either an array of SIs or `{ "special_interests": [ … ] }`.
 * Files beginning with `_` are ignored, so the gold reference can live in the
 * folder without ever shipping as a row.
 *
 * Merge rule differs from destinations ON PURPOSE: an SI batch row is
 * SHALLOW-MERGED onto the bundled row rather than replacing it. The common case
 * is a dossier that only adds `data` to an interest that already exists — a
 * straight replace would blank its name, accent and status. Keys the batch
 * supplies win; keys it omits keep what the bundle has.
 */
function readSiBatches(): SiRow[] {
  const dir = "src/data/interests";
  let files: string[] = [];
  try { files = readdirSync(dir).filter((f) => f.endsWith(".json") && !f.startsWith("_")); } catch { return []; }
  const out: SiRow[] = [];
  for (const f of files.sort()) {
    const raw = JSON.parse(readFileSync(`${dir}/${f}`, "utf8"));
    const rows: SiRow[] = Array.isArray(raw) ? raw : (raw.special_interests ?? []);
    for (const s of rows) {
      if (!s.id) throw new Error(`${f}: special interest "${s.name ?? "?"}" has no id`);
      out.push(s);
    }
  }
  return out;
}
type SiRow = { id: string; name?: string } & Record<string, unknown>;

/** Bundled SIs + dropped-in dossiers, shallow-merged on id. */
function mergedSis(): SiRow[] {
  const merged: SiRow[] = SIS.map((s) => ({ ...s })) as unknown as SiRow[];
  for (const s of readSiBatches()) {
    const i = merged.findIndex((x) => x.id === s.id);
    if (i >= 0) merged[i] = { ...merged[i], ...s };
    else {
      for (const f of ["name", "sig", "status", "accent", "group"]) {
        if (s[f] == null) throw new Error(`interests batch: new SI "${s.id}" is missing required "${f}"`);
      }
      merged.push({ lux: false, ...s });
    }
  }
  return merged;
}

const ALL_SIS = mergedSis();
const siRows = ALL_SIS.map(
  (s) => `  (${q(s.id)}, ${q(s.name as string)}, ${q(s.sig as string)}, ${q(s.status as string)}, ${q(s.accent as string)}, ${!!s.lux}, ${q(s.group as string)}, ${jsonb(s.data)})`
).join(",\n");
const siIdList = ALL_SIS.map((s) => q(s.id)).join(", ");

const actRows = Object.entries(ACTIVITIES)
  .flatMap(([siId, acts]) =>
    acts.map((a, i) => `  (${q(siId)}, ${q(a.id)}, ${q(a.name)}, ${q(a.well)}, ${q(a.line)}, ${i})`)
  )
  .join(",\n");

const sql = `-- TravelWell.World — seed the Special Interests + Activities catalog.
--
-- GENERATED by scripts/gen-catalog-seed.ts from the bundled catalog (SIS +
-- ACTIVITIES, including David's special-interests.json). Do not hand-edit —
-- regenerate after catalog changes. Idempotent (ON CONFLICT DO UPDATE), so it
-- doubles as the refresh path and the next slice of catalog -> DB.
--
-- Apply:  supabase db push   (or paste into the Supabase SQL editor)
-- Requires 0001 (tables) and 0002 (wells, for the activities.well FK).

-- Special Interests -----------------------------------------------------------
insert into public.special_interests (id, name, signature, status, accent, is_lux, grp, data) values
${siRows}
on conflict (id) do update set
  name = excluded.name, signature = excluded.signature, status = excluded.status,
  accent = excluded.accent, is_lux = excluded.is_lux, grp = excluded.grp, data = excluded.data;

-- Self-clean, same discipline as the destinations seed: an SI RETIRED in
-- src/data/taxonomy.ts must also leave the DB. Without this the seed was
-- insert-and-upsert only, so a removed interest would linger in Postgres and —
-- because the app reads DB-first with the bundle only as fallback — keep showing
-- in production after it had been deleted from the source. Silent and confusing.
delete from public.special_interests where id not in (${siIdList});

-- Activities ------------------------------------------------------------------
-- Laddered experiences per Special Interest. si_id is a plain key (not all
-- activity groups map to a canonical SI in the prototype); well FKs to wells.
create table if not exists public.activities (
  si_id     text not null,
  id        text not null,
  name      text not null,
  well      text not null references public.wells(id),
  line      text,
  position  int not null default 0,
  primary key (si_id, id)
);

alter table public.activities enable row level security;
do $$
begin
  create policy "read activities" on public.activities for select using (true);
exception when duplicate_object then null;
end $$;

insert into public.activities (si_id, id, name, well, line, position) values
${actRows}
on conflict (si_id, id) do update set
  name = excluded.name, well = excluded.well, line = excluded.line, position = excluded.position;
`;

writeFileSync("supabase/migrations/0003_seed_si_activities.sql", sql);
console.log("Wrote supabase/migrations/0003_seed_si_activities.sql");
console.log(`  ${ALL_SIS.length} special interests (${ALL_SIS.length - SIS.length} from src/data/interests batches), ${Object.values(ACTIVITIES).flat().length} activities`);

// ---------------------------------------------------------------------------
// 0004 — Providers + Sub-regions
// ---------------------------------------------------------------------------
// Bundle providers (places.ts) + CSV providers, deduped on the (name, well)
// natural key so the generated INSERT never hits the same conflict row twice.
const allProviders: CsvProvider[] = [...Object.values(PROVIDERS).flat(), ...readProviderCsvs()];
const seenPk = new Set<string>();
const provRows = allProviders
  .filter((p) => { const k = `${p.name}|${p.well}`; if (seenPk.has(k)) return false; seenPk.add(k); return true; })
  .map((p) => `  (${q(p.name)}, ${q(p.well)}, ${q(p.tier)}, ${q(p.price)}, ${q(p.mode)}, ${q(p.desc)}, ${q(p.commission)}, ${pgArr(p.si)}, ${p.region ? q(p.region) : "null"}, ${p.bookingUrl ? q(p.bookingUrl) : "null"}, ${p.desc_by_si && Object.keys(p.desc_by_si).length ? q(JSON.stringify(p.desc_by_si)) : "null"})`)
  .join(",\n");

const subRows = Object.entries(SUBREGIONS)
  .flatMap(([code, names]) => names.map((name, i) => `  (${q(code)}, ${q(name)}, ${i})`))
  .join(",\n");

const sql4 = `-- TravelWell.World — seed Providers + Sub-regions.
--
-- GENERATED by scripts/gen-catalog-seed.ts from the bundled catalog (PROVIDERS
-- in places.ts + SUBREGIONS in taxonomy.ts). Do not hand-edit — regenerate
-- after catalog changes. Idempotent (ON CONFLICT DO UPDATE).
--
-- Apply:  supabase db push   (or paste into the Supabase SQL editor)
-- Requires 0001 (providers table + RLS) and 0002 (wells/regions, for the FKs).

-- Providers -------------------------------------------------------------------
-- The providers table (0001) has a generated uuid pk; add a natural key so the
-- seed is idempotent and can act as the refresh path.
create unique index if not exists providers_name_well_key on public.providers (name, well);

-- Step 1 of the matching keystone: give providers an SI dimension and a region
-- dimension, so the catalog can express "Caribbean dive providers". Additive —
-- matching that reads these lands in a later step.
alter table public.providers add column if not exists si          text[] not null default '{}';
alter table public.providers add column if not exists region      text;
alter table public.providers add column if not exists booking_url text;
-- One description cannot serve six SI doors: a provider surfaces on every interest
-- it serves, and the sentence a traveller reads should answer the door they came
-- through. Additive and nullable: a row that fills none of it renders description.
alter table public.providers add column if not exists desc_by_si jsonb;
create index if not exists providers_region_idx on public.providers (region);

insert into public.providers (name, well, tier, price, mode, description, commission, si, region, booking_url, desc_by_si) values
${provRows}
on conflict (name, well) do update set
  tier = excluded.tier, price = excluded.price, mode = excluded.mode,
  description = excluded.description, commission = excluded.commission,
  si = excluded.si, region = excluded.region, booking_url = excluded.booking_url,
  desc_by_si = excluded.desc_by_si;

-- Sub-regions -----------------------------------------------------------------
create table if not exists public.sub_regions (
  region_code text not null references public.regions(code) on delete cascade,
  name        text not null,
  position    int not null default 0,
  primary key (region_code, name)
);

alter table public.sub_regions enable row level security;
do $$
begin
  create policy "read sub_regions" on public.sub_regions for select using (true);
exception when duplicate_object then null;
end $$;

insert into public.sub_regions (region_code, name, position) values
${subRows}
on conflict (region_code, name) do update set position = excluded.position;
`;

writeFileSync("supabase/migrations/0004_seed_providers_subregions.sql", sql4);
console.log("Wrote supabase/migrations/0004_seed_providers_subregions.sql");
console.log(`  ${seenPk.size} providers (${Object.values(PROVIDERS).flat().length} bundle + ${readProviderCsvs().length} csv), ${Object.values(SUBREGIONS).flat().length} sub-regions`);

// ---------------------------------------------------------------------------
// 0005 — Destinations + Guides
// ---------------------------------------------------------------------------
const DESTS = mergedDestinations();
const allDests = Object.values(DESTS).flat();
const destRows = Object.entries(DESTS)
  .flatMap(([code, list]) =>
    list.map((d, i) => `  (${q(d.id)}, ${q(code)}, ${q(d.name)}, ${q(d.country)}, ${q(d.line)}, ${q(d.status)}, ${q(d.depth)}, ${q(d.img)}, ${d.sub_region ? q(d.sub_region) : "null"}, ${pgArr(d.si)}, ${pgArr(d.feel)}, ${pgArr(d.tier_range)}, ${d.price_band ? q(d.price_band) : "null"}, ${d.draw_rank ? q(d.draw_rank) : "null"}, ${jsonb(d.data)}, ${i})`)
  )
  ;

/**
 * The destination insert, CHUNKED — one statement per 40 rows rather than one
 * statement for the lot.
 *
 * Measured 2026-08-17 with 530 synthetic dossiers ingested: the seed grew to
 * 1.4MB in **one 1.37MB INSERT statement**. Every gate stayed green — validate
 * ran in 253ms, the generator in 377ms — because none of them is the constraint.
 * The constraint is a human pasting that statement into the Supabase SQL editor,
 * which is a browser text editor, and 1.37MB in one statement is where the
 * pipeline actually breaks.
 *
 * Chunking costs nothing and buys three things. The paste is survivable. A
 * failure names the chunk it happened in instead of failing the whole catalog
 * anonymously. And because every chunk carries the same `on conflict do update`,
 * re-running the file after a partial application is safe — which is the
 * difference between a recoverable step and a scary one.
 *
 * The delete-what-is-missing statement stays whole and runs last, so a partial
 * apply can never delete rows the earlier chunks had not inserted yet.
 */
// Chunk by BYTES, not by row count.
//
// The first version cut every 40 rows, sized against synthetic dossiers. Measured
// against the real library batch (2026-08-17, 504 rows): 40 fat rows is a 445KB
// statement — a real dossier carries jewels, an FAQ, coordinates and a safety
// block, and is many times the size of the row this was tuned on. Row count is a
// proxy for the thing that actually matters, and it was the wrong proxy.
//
// ~100KB per statement, and always at least one row per chunk so a single
// oversized dossier still emits rather than looping forever.
const DEST_CHUNK_BYTES = 100_000;
const destInsert = (() => {
  const cols = "(id, region_code, name, country, line, status, depth, img, sub_region, si, feel, tier_range, price_band, draw_rank, data, position)";
  const tail = `on conflict (id) do update set
  region_code = excluded.region_code, name = excluded.name, country = excluded.country,
  line = excluded.line, status = excluded.status, depth = excluded.depth, img = excluded.img,
  sub_region = excluded.sub_region, si = excluded.si, feel = excluded.feel, tier_range = excluded.tier_range,
  price_band = excluded.price_band, draw_rank = excluded.draw_rank, data = excluded.data, position = excluded.position;`;
  const slices: string[][] = [];
  let cur: string[] = [], curBytes = 0;
  for (const row of destRows) {
    if (cur.length && curBytes + row.length > DEST_CHUNK_BYTES) { slices.push(cur); cur = []; curBytes = 0; }
    cur.push(row); curBytes += row.length;
  }
  if (cur.length) slices.push(cur);

  const chunks: string[] = [];
  let at = 0;
  slices.forEach((slice, i) => {
    chunks.push(`-- destinations ${at + 1}-${at + slice.length} of ${destRows.length} (chunk ${i + 1}/${slices.length})
insert into public.destinations ${cols} values
${slice.join(",\n")}
${tail}`);
    at += slice.length;
  });
  return chunks.join("\n\n");
})();

const destIdList = allDests.map((d) => q(d.id)).join(", ");

const guideRows = GUIDES.map(
  (g, i) =>
    `  (${q(g.id)}, ${q(g.type)}, ${q(g.title)}, ${q(g.lede)}, ${q(g.read)}, ${q(g.updated)}, ${q(g.img)}, ${q(g.si)}, ${q(g.region)}, ${i})`
).join(",\n");

const sql5 = `-- TravelWell.World — seed Destinations + Guides.
--
-- GENERATED by scripts/gen-catalog-seed.ts from the bundled catalog
-- (DESTINATIONS + GUIDES in places.ts). Do not hand-edit — regenerate after
-- catalog changes. Idempotent (ON CONFLICT DO UPDATE).
--
-- Apply:  supabase db push   (or paste into the Supabase SQL editor)
-- Requires 0001 (tables) and 0002 (regions, for the destinations.region_code FK).

-- Destinations ----------------------------------------------------------------
create table if not exists public.destinations (
  id          text primary key,
  region_code text not null references public.regions(code) on delete cascade,
  name        text not null,
  country     text not null,
  line        text not null,
  status      text not null check (status in ('live','future')),
  depth       text not null default 'verified' check (depth in ('verified','stub','cached')),
  img         text not null,
  sub_region  text,
  si          text[] not null default '{}',   -- Signature Interests this place serves
  feel        text[] not null default '{}',   -- feel/archetype tags (SI + feel used together, never one alone)
  tier_range  text[] not null default '{}',   -- budget bands present (essential…ultra)
  price_band  text,                            -- coarse overall price label
  draw_rank   text check (draw_rank in ('anchor','core','emerging')),  -- surface order
  data        jsonb,                           -- full dossier (safety, booking, jewels, seo, timing…)
  position    int not null default 0
);

alter table public.destinations enable row level security;
do $$
begin
  create policy "read destinations" on public.destinations for select using (true);
exception when duplicate_object then null;
end $$;

-- Two-axis model (David-locked): status = shown | coming-soon; depth = how deep.
-- Evolve a pre-existing table (was status live|stub, no depth/sub_region)
-- idempotently BEFORE the upsert. Set depth from the old status, then flip the
-- shown-but-thin 'stub' rows to status 'live' (they stay shown; depth carries
-- the thinness), then swap the status constraint to live|future.
alter table public.destinations add column if not exists depth      text;
alter table public.destinations add column if not exists sub_region text;
update public.destinations set depth = case when status = 'stub' then 'stub' else 'verified' end where depth is null;
update public.destinations set status = 'live' where status = 'stub';
alter table public.destinations drop constraint if exists destinations_status_check;
alter table public.destinations add  constraint destinations_status_check check (status in ('live','future'));
alter table public.destinations drop constraint if exists destinations_depth_check;
alter table public.destinations add  constraint destinations_depth_check check (depth in ('verified','stub','cached'));
alter table public.destinations alter column depth set default 'verified';
-- Serving signals (the traveler-fit axes) + the dossier document. Self-heal an
-- existing table so a single re-run adds them.
alter table public.destinations add column if not exists si         text[] not null default '{}';
alter table public.destinations add column if not exists feel       text[] not null default '{}';
alter table public.destinations add column if not exists tier_range text[] not null default '{}';
alter table public.destinations add column if not exists price_band text;
alter table public.destinations add column if not exists draw_rank  text;
alter table public.destinations drop constraint if exists destinations_draw_rank_check;
alter table public.destinations add  constraint destinations_draw_rank_check check (draw_rank is null or draw_rank in ('anchor','core','emerging'));
alter table public.destinations add column if not exists data       jsonb;
create index if not exists destinations_si_idx        on public.destinations using gin (si);
create index if not exists destinations_draw_rank_idx on public.destinations (draw_rank);

${destInsert}

-- Seed is authoritative: drop any destination no longer in the catalog — e.g.
-- a row left behind by a key rename (cape-town -> cape-town-south-africa). Safe
-- while every destination comes from this seed; once cache-back writes
-- atlas-sourced rows, scope this by a source column instead.
delete from public.destinations where id not in (${destIdList});

-- Guides ----------------------------------------------------------------------
create table if not exists public.guides (
  id        text primary key,
  type      text not null,
  title     text not null,
  lede      text not null,
  read      text not null,
  updated   text not null,
  img       text not null,
  si        text not null,
  region    text not null,
  position  int not null default 0
);

alter table public.guides enable row level security;
do $$
begin
  create policy "read guides" on public.guides for select using (true);
exception when duplicate_object then null;
end $$;

insert into public.guides (id, type, title, lede, read, updated, img, si, region, position) values
${guideRows}
on conflict (id) do update set
  type = excluded.type, title = excluded.title, lede = excluded.lede, read = excluded.read,
  updated = excluded.updated, img = excluded.img, si = excluded.si, region = excluded.region,
  position = excluded.position;
`;

/**
 * SPLIT INTO PASTEABLE PARTS.
 *
 * The seed is applied by hand in the Supabase SQL editor, which is a browser
 * text area with a size limit — and at 504 destinations this file reached 4.86MB
 * and simply could not be pasted. GitHub also refuses to render a blob that
 * large, so it could not even be read in a browser to copy from.
 *
 * Chunking the STATEMENTS (done earlier, 98KB each) was necessary and not
 * sufficient: the limit that bit is on the whole file, not on any statement in
 * it. Fixing one and calling it done is how the constraint moved without anyone
 * noticing.
 *
 * So the file is split on statement boundaries at ~400KB, numbered in run order,
 * and the ORDER IS LOAD-BEARING:
 *
 *   part 01  DDL — create/alter/index. Safe to re-run, creates nothing twice.
 *   part 02… the destination upserts, each carrying its own on-conflict clause,
 *            so any part can be re-run alone after a failure.
 *   part 99  the cleanup — `delete … where id not in (…)` — and the guides.
 *
 * Part 99 MUST run last. It removes any destination not in the seed, so running
 * it before the upserts have all landed would delete rows the later parts were
 * about to insert. Every other part is order-independent and idempotent.
 */
const SPLIT_BYTES = 400_000;
const statements = sql5.split(/;\n/).map((x, i, a) => (i < a.length - 1 ? x + ";\n" : x));
const parts: string[] = [];
let cur = "";
for (const st of statements) {
  // The cleanup and everything after it (the guides) go in the final part, always.
  if (st.includes("delete from public.destinations where id not in")) {
    if (cur.trim()) parts.push(cur);
    cur = st;
    continue;
  }
  if (cur.length + st.length > SPLIT_BYTES && cur.trim() && parts.length < 90) {
    parts.push(cur); cur = "";
  }
  cur += st;
}
if (cur.trim()) parts.push(cur);

const header = (n: number, of: number, last: boolean) =>
  `-- TravelWell.World — seed Destinations + Guides · PART ${n} OF ${of}\n` +
  `--\n` +
  `-- GENERATED by scripts/gen-catalog-seed.ts. Do not hand-edit — regenerate.\n` +
  `-- Split because the whole seed is ${(sql5.length / 1048576).toFixed(2)}MB, which the Supabase SQL\n` +
  `-- editor cannot accept in one paste.\n` +
  `--\n` +
  `-- RUN THE PARTS IN ORDER, 1 to ${of}. Each is idempotent (on conflict do update)\n` +
  `-- so a part can be safely re-run on its own after a failure.\n` +
  (last
    ? `--\n-- ⚠ THIS PART MUST RUN LAST. It deletes any destination not in the seed, so\n-- running it before the earlier parts have landed would remove rows they were\n-- about to insert.\n`
    : ``) +
  `--\n`;

const OUT = "supabase/migrations";
// Clear any parts from a previous run — a shrinking catalog would otherwise
// leave an orphaned high-numbered part that still deletes rows.
for (const f of readdirSync(OUT)) {
  if (/^0005_part\d+_seed_destinations\.sql$/.test(f)) unlinkSync(`${OUT}/${f}`);
}
parts.forEach((body, i) => {
  const n = i + 1;
  const name = `${OUT}/0005_part${String(n).padStart(2, "0")}_seed_destinations.sql`;
  writeFileSync(name, header(n, parts.length, n === parts.length) + body.replace(/^\n+/, ""));
});

const sizes = parts.map((p) => p.length);
console.log(`Wrote ${parts.length} parts: supabase/migrations/0005_part01…part${String(parts.length).padStart(2, "0")}_seed_destinations.sql`);
console.log(`  largest part ${(Math.max(...sizes) / 1024).toFixed(0)}KB — pasteable; the single file was ${(sql5.length / 1048576).toFixed(2)}MB and was not`);
console.log(`  ${allDests.length} destinations (${Object.values(DESTINATIONS).flat().length} bundled + ${allDests.length - Object.values(DESTINATIONS).flat().length} dropped-in), ${GUIDES.length} guides`);

// ---------------------------------------------------------------------------
// 0007 — Local & temporal signals (the "knows what's happening" layer)
// ---------------------------------------------------------------------------
const TLEU_SIGNALS = readTleuEvents(new Set(REGIONS.map((r) => r.code)));
const ALL_SIGNALS = [...LOCAL_SIGNALS, ...TLEU_SIGNALS];
const signalRows = ALL_SIGNALS.map(
  (s) =>
    `  (${q(s.id)}, ${s.destination ? q(s.destination) : "null"}, ${s.region ? q(s.region) : "null"}, ` +
    `${pgArr(s.si)}, ${pgArr(s.wells)}, ${q(s.kind)}, ${q(s.horizon)}, ${q(s.title)}, ${q(s.blurb)}, ${q(s.href)}, ` +
    `${s.startsOn ? q(s.startsOn) : "null"}, ${s.endsOn ? q(s.endsOn) : "null"}, ${jsonb(s.recurrence)}, ` +
    `${q(s.season)}, ${q(s.source)}, ${s.priority ?? 0}, ${s.validFrom ? q(s.validFrom) : "null"}, ${s.validTo ? q(s.validTo) : "null"}, ${jsonb(s.meta)})`
).join(",\n");

const sql7 = `-- TravelWell.World — Local & temporal signals (Atlas's "knows what's happening").
--
-- GENERATED by scripts/gen-catalog-seed.ts from src/data/local-signals.ts.
-- Do not hand-edit — regenerate after authoring. Idempotent (ON CONFLICT).
-- World-readable: Atlas + Whispers read it; curated now, feeds/provider later.
--
-- Apply:  supabase db push   (or paste into the Supabase SQL editor)
-- Requires 0001 + 0002 (regions) and 0005 (destinations, for the FKs).

-- destination_id is a free-text place key (signals name places we don't model
-- in the destinations catalog yet), so it is intentionally NOT a foreign key.
create table if not exists public.local_signals (
  id            text primary key,
  destination_id text,
  region_code   text references public.regions(code),
  si            text[] not null default '{}',
  wells         text[] not null default '{}',
  kind          text not null check (kind in ('event','schedule','opening','lookahead')),
  horizon       text not null default 'now' check (horizon in ('now','soon','lookahead')),
  title         text not null,
  blurb         text,
  href          text,
  starts_on     date,
  ends_on       date,
  recurrence    jsonb,
  season        text,
  source        text not null default 'curated' check (source in ('curated','feed','provider')),
  priority      int  not null default 0,
  valid_from    timestamptz,
  valid_to      timestamptz,
  meta          jsonb,
  updated_at    timestamptz not null default now()
);

-- Drop the destination FK for DBs where an earlier 0007 created it (idempotent).
alter table public.local_signals drop constraint if exists local_signals_destination_id_fkey;
-- Structured extras (TLEU look-ahead: ticket_drop / book_by / sells_out /
-- high_intent / upsell_ladder, etc.). Self-heal an existing table.
alter table public.local_signals add column if not exists meta jsonb;

create index if not exists local_signals_dest_idx   on public.local_signals (destination_id);
create index if not exists local_signals_region_idx on public.local_signals (region_code);

alter table public.local_signals enable row level security;
do $$
begin
  create policy "read local_signals" on public.local_signals for select using (true);
exception when duplicate_object then null;
end $$;

insert into public.local_signals
  (id, destination_id, region_code, si, wells, kind, horizon, title, blurb, href, starts_on, ends_on, recurrence, season, source, priority, valid_from, valid_to, meta) values
${signalRows}
on conflict (id) do update set
  destination_id = excluded.destination_id, region_code = excluded.region_code, si = excluded.si, wells = excluded.wells,
  kind = excluded.kind, horizon = excluded.horizon, title = excluded.title, blurb = excluded.blurb, href = excluded.href,
  starts_on = excluded.starts_on, ends_on = excluded.ends_on, recurrence = excluded.recurrence, season = excluded.season,
  source = excluded.source, priority = excluded.priority, valid_from = excluded.valid_from, valid_to = excluded.valid_to,
  meta = excluded.meta, updated_at = now();
`;

writeFileSync("supabase/migrations/0007_seed_local_signals.sql", sql7);
console.log("Wrote supabase/migrations/0007_seed_local_signals.sql");
console.log(`  ${ALL_SIGNALS.length} local signals (${LOCAL_SIGNALS.length} authored + ${TLEU_SIGNALS.length} TLEU)`);
