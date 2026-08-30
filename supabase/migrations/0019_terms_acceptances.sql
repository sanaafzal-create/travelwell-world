-- ════════════════════════════════════════════════════════════════════════════
-- 0019 · TERMS ACCEPTANCE — the contract-formation record.
-- ════════════════════════════════════════════════════════════════════════════
--
-- Berman v. Freedom Financial Network (9th Cir. 2022): terms bind only with
-- reasonably conspicuous notice and a manifest, unambiguous assent. Until
-- 2026-08-27 this site's Terms were a footer link — browsewrap, unenforceable
-- per se — while the ADVISORY consent screen already kept the append-only,
-- both-clocks, statement-verbatim record courts enforce. The research library
-- said it plainly: the weaker of the two mechanisms was the one carrying the
-- limitation of liability and the merchant-of-record disclaimer.
--
-- Same architecture as 0016, for the same reasons: append-only (no update or
-- delete policy for anyone — a record that can be revised is a claim, not
-- evidence), the statement stored WORD-FOR-WORD (the wording is attorney-
-- pending, so it will change; a row storing `accepted = true` proves nothing
-- after the label is edited), and both clocks kept.

create table if not exists public.terms_acceptances (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,

  -- WHAT THEY AGREED TO. The statement beside the box, verbatim, and the
  -- version of the Terms text it pointed at that day.
  statement     text not null,
  terms_version text not null,
  terms_url     text not null,

  -- WHEN. Client clock (what the traveller experienced) and server clock
  -- (when it reached us) — a wrong device clock is visible, never authoritative.
  accepted_at   timestamptz not null,
  recorded_at   timestamptz not null default now()
);

create index if not exists terms_acceptances_user
  on public.terms_acceptances (user_id, accepted_at desc);

alter table public.terms_acceptances enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'terms_acceptances' and policyname = 'insert own acceptance') then
    create policy "insert own acceptance" on public.terms_acceptances
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'terms_acceptances' and policyname = 'read own acceptance') then
    create policy "read own acceptance" on public.terms_acceptances
      for select using (auth.uid() = user_id);
  end if;
  -- DELIBERATELY ABSENT: update and delete, for anyone.
end $$;

comment on table public.terms_acceptances is
  'Append-only clickwrap record: the exact statement ticked, the Terms version '
  'it referenced, both clocks. No update or delete policy exists for anyone.';
