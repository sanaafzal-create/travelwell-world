-- TravelWell.World — source-country capture on the Travel ID (the waitlist signal).
--
-- The pre-launch sign-up list IS the waitlist, and "where do our travelers come
-- from" is the demand evidence the raise materials need (Josh's open-questions
-- row, 2026-10-11; the marketing plan's source-market engine reads the same
-- field at launch). One column: the ISO-3166 alpha-2 country the traveler says
-- they travel from, chosen by them at sign-up — never inferred from locale or
-- IP, because an inferred answer poisons the signal it exists to provide.
--
-- Idempotent; RLS unchanged (the row stays owner-readable/writable only).
-- The demand counter, for the monthly one-pager (run as service role):
--   select count(*) as waitlist from public.travel_ids;
--   select home_country, count(*) from public.travel_ids
--     where home_country is not null group by 1 order by 2 desc;

alter table public.travel_ids
  add column if not exists home_country text
  check (home_country is null or home_country ~ '^[A-Z]{2}$');
