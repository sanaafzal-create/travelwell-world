-- ════════════════════════════════════════════════════════════════════════════
-- 0016 · THE ADVISORY CONSENT RECORD — where the traveller's decision persists.
-- ════════════════════════════════════════════════════════════════════════════
--
-- David's consent architecture, item ③: the decision is logged EITHER WAY in the
-- Traveler ID. His words for why: "in case something drastic happens and we are
-- asked if we offered this trip and why. We gave them the advisory and they made
-- the decision."
--
-- ── WHAT WAS ACTUALLY HAPPENING ────────────────────────────────────────────
-- Nothing was logged. `src/lib/consent.ts` wrote the decision to localStorage,
-- capped at 100, and said so in its own comment: "this is a local audit trail,
-- not storage." So a cleared cache erased it, a second device never had it, and
-- we could not read any of it. For the one purpose the ruling exists to serve, a
-- record only the traveller's browser holds is the same as no record.
--
-- (`travel_ids.consent` is NOT this. It is the profile consent flag, sitting
-- beside dietary and accessibility. It was never an advisory record, and reading
-- it as one is how this looked finished.)
--
-- ── APPEND-ONLY, AND THAT IS THE POINT ─────────────────────────────────────
-- There is no UPDATE policy and no DELETE policy, for anyone, including the row's
-- own author. A record that can be edited after the fact is not evidence of what
-- was on the screen that day — it is a claim about it. The whole value here is
-- that nobody can revise it, us included.
--
-- Corrections happen by appending, never by rewriting. That is also why the
-- advisory's own publication date is stored rather than looked up: consent is to
-- the advisory the traveller WAS SHOWN. If the source reissues it the next
-- morning, the old record must remain evidence of that day's screen and not
-- appear to be agreement to something published since.

create table if not exists public.advisory_consents (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,

  -- WHERE. Both the id and the name: the id is the join, the name is what the
  -- traveller actually read, and a destination can be renamed.
  dest_id             text not null,
  dest_name           text not null,
  country             text not null,

  -- WHAT THEY WERE SHOWN. Nullable on purpose — a null level is a fact (we held
  -- none) and must be distinguishable from a level we failed to record.
  level               smallint,
  posture             text,
  advisory_url        text,
  advisory_published  text,

  -- WHAT THEY DECIDED. Both outcomes, never only the decline: a record that
  -- exists only when someone turns back tells you nothing about the ones who
  -- continued, which is the half you would need if a trip went wrong.
  decision            text not null check (decision in ('continued', 'alternatives')),

  -- WHEN. `decided_at` is the client's clock (what the traveller experienced);
  -- `recorded_at` is the server's (when it reached us). Keeping both means a
  -- device with a wrong clock is visible rather than silently authoritative.
  decided_at          timestamptz not null,
  recorded_at         timestamptz not null default now()
);

create index if not exists advisory_consents_user
  on public.advisory_consents (user_id, decided_at desc);
create index if not exists advisory_consents_dest
  on public.advisory_consents (dest_id, decided_at desc);

alter table public.advisory_consents enable row level security;

do $$
begin
  -- A traveller may WRITE their own decision and READ their own history.
  if not exists (select 1 from pg_policies where tablename = 'advisory_consents' and policyname = 'insert own consent') then
    create policy "insert own consent" on public.advisory_consents
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'advisory_consents' and policyname = 'read own consent') then
    create policy "read own consent" on public.advisory_consents
      for select using (auth.uid() = user_id);
  end if;
  -- DELIBERATELY ABSENT: update and delete. With RLS on and no policy granting
  -- them, both are denied to every ordinary role — the append-only property is
  -- enforced by the database rather than by everyone remembering.
end $$;

comment on table public.advisory_consents is
  'Append-only record of a traveller''s decision after reading a travel advisory. '
  'No update or delete policy exists, for anyone: a record that can be revised is '
  'not evidence of what was on the screen. Stores the advisory''s publication date '
  'because consent is to the advisory shown, not to the country.';
