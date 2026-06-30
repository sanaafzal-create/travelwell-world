-- TravelWell.World — initial schema
-- Travel ID (Travel Personality), journeys, trip blocks, and a vetted partner
-- catalog. Row-Level Security scopes user data to the authenticated traveler;
-- the taxonomy/provider catalog is world-readable.
--
-- Apply:  supabase db push   (or run via the SQL editor)

-- ---------------------------------------------------------------------------
-- Reference taxonomy (world-readable) — mirrors src/data/*.ts
-- ---------------------------------------------------------------------------
create table if not exists public.special_interests (
  id           text primary key,
  name         text not null,
  signature    text not null,
  status       text not null check (status in ('live','preview','soon')),
  accent       text,
  is_lux        boolean not null default false,
  grp          text not null
);

create table if not exists public.wells (
  id        text primary key,
  name      text not null,
  tag       text not null,
  body      text not null,
  status    text not null check (status in ('live','preview','soon')),
  icon      text not null,
  is_lux     boolean not null default false
);

create table if not exists public.regions (
  code       text primary key,
  name       text not null,
  line       text not null,
  countries  int not null default 0,
  gateways   text,
  status     text not null check (status in ('live','preview','soon')),
  has_sub     boolean not null default false
);

create table if not exists public.providers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  well        text not null references public.wells(id),
  tier        text not null check (tier in ('prime','vetted','prospective')),
  price       text not null check (price in ('essential','comfort','premier','luxury','ultra')),
  mode        text not null check (mode in ('api','widget','affiliate','first-party')),
  description text,
  commission  text not null  -- FTC disclosure text, never hidden
);

-- ---------------------------------------------------------------------------
-- Traveler data (RLS-protected)
-- ---------------------------------------------------------------------------
-- Travel ID / Travel Personality. We store an age RANGE, never a birthday.
create table if not exists public.travel_ids (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  display_name   text,
  age_range      text,
  trip_intent    text,           -- the free-text "dream"
  interests      text[] default '{}',  -- 1–3 special interest ids
  budget_ranges  jsonb default '{}'::jsonb,  -- { wellId: range }
  dietary        text,
  accessibility  text,
  consent        boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- A journey = chosen SIs → region → activities.
create table if not exists public.journeys (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text,
  interests   text[] default '{}',
  region_code text references public.regions(code),
  activities  text[] default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Trip blocks: block = { slot, name, well, provider, status, whom }.
create table if not exists public.trip_blocks (
  id          uuid primary key default gen_random_uuid(),
  journey_id  uuid not null references public.journeys(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  well        text not null references public.wells(id),
  name        text not null,
  meta        text,
  slot        text,  -- dawn | morning | midday | afternoon | evening | night
  whom        text,
  status      text not null default 'idea' check (status in ('idea','pending','confirmed')),
  position    int not null default 0,
  created_at  timestamptz not null default now()
);

-- Atlas conversation log (optional analytics; one row per turn).
create table if not exists public.atlas_messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  role        text not null check (role in ('user','assistant')),
  content     text not null,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
alter table public.travel_ids    enable row level security;
alter table public.journeys      enable row level security;
alter table public.trip_blocks   enable row level security;
alter table public.atlas_messages enable row level security;

do $$
begin
  -- Travelers see and write only their own rows.
  create policy "own travel_id"    on public.travel_ids
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  create policy "own journeys"     on public.journeys
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  create policy "own trip_blocks"  on public.trip_blocks
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  create policy "own atlas_msgs"   on public.atlas_messages
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

-- Taxonomy + provider catalog are world-readable (anon can browse).
alter table public.special_interests enable row level security;
alter table public.wells              enable row level security;
alter table public.regions            enable row level security;
alter table public.providers          enable row level security;

do $$
begin
  create policy "read si"        on public.special_interests for select using (true);
  create policy "read wells"     on public.wells              for select using (true);
  create policy "read regions"   on public.regions            for select using (true);
  create policy "read providers" on public.providers          for select using (true);
exception when duplicate_object then null;
end $$;
