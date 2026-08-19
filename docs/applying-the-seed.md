# Applying the catalog seed

**The destination seed is 15 numbered files, and they run in order.**

## Why it is not one file

At 504 destinations the seed is ~4.8MB. The Supabase SQL editor is a browser text
area and cannot accept a paste that size, and GitHub will not render a blob that
large either — so it could not even be opened in a browser to copy from.

An earlier fix chunked the *statements* to ~98KB each. That was necessary and not
sufficient: **the limit that bites is on the whole file, not on any statement in
it.** Fixing one and stopping is how a constraint moves without anyone noticing.

## How to run it

Supabase dashboard → **SQL Editor** → paste one part → **Run** → next part.

```
0005_part01_seed_destinations.sql     ← schema, then destinations
0005_part02_seed_destinations.sql
   …
0005_part14_seed_destinations.sql
0005_part15_seed_destinations.sql     ← ⚠ MUST BE LAST
```

Largest part is ~383KB. Fifteen pastes, a couple of minutes.

### The order is load-bearing

- **Part 01** carries the DDL — `create table if not exists`, the column adds,
  the constraint swaps, the indexes. Safe to re-run; it creates nothing twice.
- **Parts 02–14** are destination upserts. Every statement carries its own
  `on conflict (id) do update`, so **any part can be re-run on its own** after a
  failure, in any order, with no duplicate rows.
- **Part 15 must run last.** It carries `delete from public.destinations where id
  not in (…)` — the self-clean that removes a destination dropped from the
  catalog. Run it before the earlier parts have landed and it deletes rows they
  were about to insert. It also carries the guides.

### If a part fails partway

Re-run that part. Nothing needs undoing — the upserts are idempotent. If you are
unsure how far you got, re-running every part from 01 is safe and costs minutes.

### Checking it worked

```sql
select count(*) from public.destinations;      -- expect 504
select count(*) from public.guides;            -- expect 9
select count(*) from public.destinations where data ? 'jewels';
```

## Regenerating

`npm run gen:catalog` rewrites all 15 parts from source and deletes any orphaned
part from a previous, larger run. Never hand-edit one — `npm run check:generated`
compares every part against what the generator produces and refuses the commit if
they differ, which is checked by testing rather than assumed.

## Reading a big generated file

GitHub will not render `library-clean.json` (~6MB) or the seed parts in the
browser. To read one:

```bash
git clone https://github.com/sanaafzal-create/travelwell-world.git
less supabase/migrations/0005_part01_seed_destinations.sql
```

Or on a file already cloned, open it in an editor — the size limit is GitHub's
web view, not the file.
