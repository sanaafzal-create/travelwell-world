-- TravelWell.World — standardize budget tiers on the canonical five.
--
-- We move from the original 4-band set (value, comfort, premium, ultra) to
-- David's canonical five shared across providers AND destinations:
--   essential, comfort, premier, luxury, ultra
-- Mapping for existing rows:  value → essential,  premium → premier
--   (comfort and ultra unchanged; `luxury` is a new band, tagged going forward.)
--
-- Order matters: drop the old CHECK first, then remap (the new values would
-- violate the old constraint), then add the new CHECK. Idempotent + safe to
-- re-run.
--
-- Apply:  paste into the Supabase SQL editor (or supabase db push).

alter table public.providers drop constraint if exists providers_price_check;

update public.providers set price = 'essential' where price = 'value';
update public.providers set price = 'premier'   where price = 'premium';

alter table public.providers
  add constraint providers_price_check
  check (price in ('essential','comfort','premier','luxury','ultra'));
