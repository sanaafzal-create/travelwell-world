-- ════════════════════════════════════════════════════════════════════════════
-- 0017 · Three schema answers from the research library's Supabase read
--        (their SANA-02 v3, 2026-08-21) — plus one drift their read exposed.
-- ════════════════════════════════════════════════════════════════════════════
-- Idempotent. Run once in the Supabase SQL editor.

-- ── ① providers.mode grows from four values to seven ───────────────────────
-- The library's integration shelves are six and three had nowhere to live:
-- "shelf 5, request-to-book, is the entire liveaboard model — certification,
-- medical sign-off, verified dive insurance, a deposit against a cancellation
-- clock. The friction is the product, and the schema can't represent it."
--
-- The three new values were already half-canon here: the provider capability
-- ledger names `email-parse` as the confirmation-return everyone starts on.
--   email-parse      shelf 4 — deep link out, the confirmation comes back by
--                    parsed e-mail rather than API
--   request-to-book  shelf 5 — no instant purchase; a structured request with
--                    prerequisites (certs, medical, insurance) and a deposit
--   lead             shelf 6 — manual handoff; Atlas connects, a human closes
alter table public.providers drop constraint if exists providers_mode_check;
alter table public.providers add constraint providers_mode_check
  check (mode in ('api','widget','affiliate','first-party','email-parse','request-to-book','lead'));

-- ── ② a journey can be rooted on an EVENT ──────────────────────────────────
-- David, 2026-08-21: "Events are the anchor for their trip, and it may be that
-- and not just going to a destination" — at every budget tier, not just ultra.
-- Canon already shaped for this ("booking windows are absolute, multi-year
-- dated event-series"); the journeys table just had no socket. Nullable on
-- purpose: an interest-rooted journey is still the default, and nothing in the
-- product writes this column yet — the seam is poured, the machinery follows.
-- ON DELETE SET NULL, not CASCADE: an event leaving the catalogue must not
-- delete a traveller's trip.
alter table public.journeys
  add column if not exists event_id text references public.local_signals(id) on delete set null;

-- ── ③ the wells table is missing Pets-Well, and has been since 2026-08-10 ──
-- The library read the deployed table and reported "there are TWELVE Wells, no
-- Pets-Well". The roster is THIRTEEN (David-locked: "THE 13 WELLS") — their
-- read was accurate and the DATABASE was wrong: the wells seed lives in the
-- hand-kept 0002, outside the generated pipeline, and nobody regenerated it
-- when Pets-Well joined the taxonomy. The app never showed the gap because the
-- client merges the bundle over the DB — which is also why nobody noticed.
-- Values read from `WELLS` in src/data/taxonomy.ts, not typed from memory —
-- the first draft of this row guessed "Companionship"/"paw" where the taxonomy
-- says "Loyalty"/"heart", which is the whole argument for generating this seed.
insert into public.wells (id, name, tag, body, status, icon, is_lux) values
  ('pets', 'Pets-Well', 'Traveling with your companion', 'Loyalty', 'soon', 'heart', false)
on conflict (id) do update set
  name = excluded.name, tag = excluded.tag, body = excluded.body,
  status = excluded.status, icon = excluded.icon, is_lux = excluded.is_lux;
