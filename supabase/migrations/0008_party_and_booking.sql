-- TravelWell.World — two schema additions toward the matching keystone.
--
-- 1. travel_ids.party — persist the SignUp party builder (who's travelling).
--    It was captured in the wizard but dropped on save (Core Engine audit).
-- 2. providers.booking_url — a real affiliate/booking URL per provider, so the
--    /go handoff can actually redirect. URLs come from David's provider intel;
--    this just adds the column (defaults null → /go stays informational until
--    a URL is present).
--
-- Apply:  paste into the Supabase SQL editor (or supabase db push).
-- Idempotent. Schema-only — no data reseed needed.

alter table public.travel_ids add column if not exists party jsonb not null default '[]'::jsonb;
alter table public.providers  add column if not exists booking_url text;
