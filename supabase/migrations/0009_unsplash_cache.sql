-- TravelWell.World — Unsplash result cache.
--
-- The `unsplash` Edge Function fetches a photo once per query and stores it here,
-- then serves every later request (grid card AND detail hero, any visitor) from
-- the cache. Two wins: the SAME destination shows the SAME photo everywhere
-- (consistency), and we hit the Unsplash API at most once per query — so even a
-- big grid never blows the rate limit.
--
-- Only the Edge Function (service role, which bypasses RLS) reads/writes this;
-- RLS is on with no policies, so it's not exposed to the browser.
--
-- Apply:  paste into the Supabase SQL editor (or supabase db push).

create table if not exists public.unsplash_cache (
  query        text primary key,   -- normalized (lowercased/trimmed) search query
  url          text not null,
  alt          text,
  credit_name  text,
  credit_link  text,
  fetched_at   timestamptz not null default now()
);

alter table public.unsplash_cache enable row level security;
