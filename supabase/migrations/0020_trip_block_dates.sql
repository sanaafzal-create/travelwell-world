-- 0020 · THE DATE SOCKET ON TRIP BLOCKS (2026-08-31)
--
-- The research library measured the absent date as the single largest
-- commercial dependency on the board: five systems landed on it in one day —
-- Eat-Well's unfilled-meal rule ("a data question, not a judgement"), Well
-- Whispers' fire target, both populations of the in-trip advisory watch, the
-- TDT fire calendar, and plain sequence ("you land Tuesday" is not sayable).
-- 37 of 42 revenue streams block on it per their measurement.
--
-- Two nullable DATE columns, nothing more: an undated block is an idea, and
-- dates arrive when placement does. The fourth BlockStatus ('travelled') is a
-- client-side union value and needs no schema change (status is plain text).
-- Idempotent, safe to re-run.

alter table public.trip_blocks
  add column if not exists start_on date,
  add column if not exists end_on   date;

comment on column public.trip_blocks.start_on is
  'First day of this block, ISO date. Null = not yet placed (an idea). The itinerary canon renders day-number + weekday + date, always paired.';
comment on column public.trip_blocks.end_on is
  'Last day of this block, ISO date. Null = open-ended or not yet placed.';
