-- TravelWell.World — resume position + exploration log.
--
-- Two things we want to remember as a traveler moves through the flow (and
-- back): WHERE they are (to resume), and WHAT they explored (to assist — by us
-- and by Atlas). The journeys/trip_blocks snapshot already holds the committed
-- selections; this adds the last position and an append-only behavioral log.
--
-- Apply:  supabase db push   (or paste into the Supabase SQL editor)
-- Requires 0001 (journeys table + auth).

-- Resume position -------------------------------------------------------------
alter table public.journeys add column if not exists last_path text;

-- Exploration log -------------------------------------------------------------
-- Append-only. One row per meaningful action: viewing an SI/region/provider,
-- selecting/deselecting, adding/removing a trip block, comparing. user_id is
-- null for pre-sign-in exploration (kept against anon_id, claimed on sign-in).
create table if not exists public.journey_events (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users(id) on delete cascade,
  anon_id     text,
  journey_id  uuid references public.journeys(id) on delete set null,
  kind        text not null,   -- view | select | deselect | add | remove | compare
  entity      text not null,   -- si | region | provider | activity | well | guide | destination | trip | page
  entity_id   text,
  context     jsonb not null default '{}'::jsonb,  -- { region, si, well, budget, fromPath, ... }
  occurred_at timestamptz not null default now()
);

create index if not exists journey_events_user_idx on public.journey_events (user_id, occurred_at desc);
create index if not exists journey_events_anon_idx on public.journey_events (anon_id, occurred_at desc);

alter table public.journey_events enable row level security;
do $$
begin
  -- Read only your own (claimed) events.
  create policy "read own events" on public.journey_events
    for select using (auth.uid() = user_id);
  -- Log as yourself when signed in, or anonymously (user_id null) before sign-in.
  create policy "insert events" on public.journey_events
    for insert with check (user_id is null or auth.uid() = user_id);
  -- On sign-in, claim this device's anonymous events (the client filters by anon_id).
  create policy "claim events" on public.journey_events
    for update using (user_id is null) with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;
