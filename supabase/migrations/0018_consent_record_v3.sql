-- ════════════════════════════════════════════════════════════════════════════
-- 0018 · THE CONSENT RECORD, COMPLETED — the seven fields, founder-locked.
-- ════════════════════════════════════════════════════════════════════════════
--
-- BOOK-WITH-WARNING-v1 §4 specified five log fields; the v2 consent screen that
-- superseded it dropped the logging section entirely — lost, not rescinded
-- (found 2026-08-23). The locked record is now SEVEN fields (David, 2026-08-23):
--
--   1  WHO            user_id                                   (0016)
--   2  WHAT           dest_id · country · the named FCDO area · which threshold
--   3  WHEN           decided_at — the tick, not the page load  (0016)
--   4  WHICH VERSION  the advisory date AND the exact text shown
--   5  THE ACT        decision — which box, ticked by the traveller (0016)
--   6  THE PROFILE    travel_ids.accepts_advisory_destinations
--   7  THE HISTORY    statement — the acknowledgement WORD-FOR-WORD
--
-- FIELD 7 IS NOT A DUPLICATE OF FIELD 5. Field 5 records that a box was ticked;
-- field 7 records WHAT IT SAID. Those come apart the moment the wording changes
-- — and the wording is attorney-pending, so it will change at least once. A log
-- storing `decision = 'continued'` proves nothing after the label is edited.
--
-- All new columns are nullable: rows written before this migration are evidence
-- of what was recorded THEN, and back-filling them would forge it.

alter table public.advisory_consents add column if not exists fcdo_area     text;
alter table public.advisory_consents add column if not exists advisory_text text;
alter table public.advisory_consents add column if not exists statement     text;

-- The refusal screen's first box is also an acknowledgement worth keeping —
-- "I have read and understood this complete safety advisory" on a screen where
-- nothing can be sold. Widen the decision vocabulary to carry it.
alter table public.advisory_consents drop constraint if exists advisory_consents_decision_check;
alter table public.advisory_consents add constraint advisory_consents_decision_check
  check (decision in ('continued', 'alternatives', 'acknowledged-hold'));

-- FIELD 6 — the profile attribute (the one with product value). A traveller who
-- reads a complete advisory and chooses to continue has told us something
-- durable: they accept a destination carrying a qualifying safety statement.
--
-- PRIVACY-BEARING, SO ITS PERMITTED USES ARE STATED AND CLOSED: avoid re-asking
-- a question already answered, and prove what was disclosed. It must NEVER be
-- used to route someone toward a riskier destination. Retention and permitted
-- use are attorney-pending; until that lands, nothing reads this but the
-- consent surfaces themselves.
alter table public.travel_ids add column if not exists
  accepts_advisory_destinations boolean not null default false;

comment on column public.travel_ids.accepts_advisory_destinations is
  'The traveller has, at least once, read a complete safety advisory and chosen '
  'to continue (advisory_consents holds the record). Permitted uses: avoid '
  're-asking an answered question; prove what was disclosed. NEVER to be used '
  'to route someone toward a riskier destination.';

comment on column public.advisory_consents.statement is
  'The acknowledgement statement word-for-word as it read on screen that day. '
  'The wording is attorney-pending and will change; this is what keeps an old '
  'record legible after it does.';
