# TravelWell ↔ Fora — Integration Shape (engineer-to-engineer)

> **Status (2026-07-17): Fora is not proceeding — mutual, clean read on both sides.**
> Merritt confirmed TravelWell isn't a fit for Fora; they're a strong company but
> not set up to partner at the AI-platform level. **This doc is retained as a
> reusable host / advisory-platform integration template** — the integration
> mechanics below (booking handoff, the three integration models, preferred-rate
> routing, the accreditation umbrella, payments-never) are host-agnostic. For the
> next host conversation, swap "Fora" for the new partner and reuse the shape.
> *(When a live prospect appears, generalize the Fora-specific naming — happy to
> do that pass then rather than speculatively now.)*

The concrete technical ask to hand a host platform's engineering/partnerships team,
instead of the vague "can we?" — *"here's the integration shape; which of these can
your stack support?"*

## The ask, in one line
Let TravelWell's AI concierge route **confirmed bookings, at scale**, into Fora's
agent booking system **as agent-of-record**, drawing **preferred-partner rates**,
with **commission flowing through Fora** — TravelWell operating under Fora's
IATA/IATAN accreditation + E&O umbrella, sending high-intent volume. New shape
for Fora: one intelligent concierge producing many bookings, not one human
advisor per client.

## The boundary we hold (important, and in your favor)
**TravelWell never touches card data** — we're PCI SAQ A and stay there. The
traveler's payment happens **supplier-side / Fora-side**, never on our
infrastructure. So this is a *booking-routing + confirmation* integration, not a
payments integration. (Confirm the card transaction lands on your/​the supplier's
side, which keeps both of us clean.)

## What the booking handoff must carry
When a traveler confirms with Atlas, the structured booking we hand off needs:
- **Agent-of-record** — our Fora advisor/entity ID, so the reservation books under us and commission routes to us.
- **Client** — name, contact, party size (+ any traveler details the supplier requires).
- **Supplier + product** — mapped to *your* preferred-partner ID, with room/fare/product, **rate code** (the preferred rate), dates, price, currency.
- **Our booking id** — for reconciliation on both sides.
- **Confirmation-return** — the supplier/Fora confirmation number coming *back* to us (this is the field we already model as upgradeable: email-parse → API).

## Three integration models (which does your stack support?)
1. **Booking API (write) — the scalable target.** Fora exposes a reservation/booking endpoint; we `POST` the structured booking; it creates the record under our agent-of-record with the preferred rate attached, and returns a confirmation number. This is what "at scale" needs.
2. **Prefill / deep-link into the agent portal — the in-between.** Fora exposes a link that pre-populates a booking in your **credentialed agent system** from our structured payload; a human gives it a final confirm. (This is David's "embedded link" — see the refinement below.)
3. **Structured manual keying — the day-1 fallback.** We generate a complete booking package; a person keys it into your portal. Proves the model with zero API work; doesn't scale — the bridge to #1/#2.

Plus a **confirmation-return channel** (any of): API webhook, a report/feed we poll, or parsed confirmation emails.

## Refinement on the "embedded link" shape (David's question)
Directionally right — **we push our structured booking into your system; we don't rebuild any of it.** Two corrections so the engineers hear it precisely:
- It must target Fora's **credentialed agent-booking channel** (behind your accreditation/login), **not** the public preferred-partner sites. Only bookings made *through* your channel draw the preferred rate + agent commission — a generic public deep-link wouldn't.
- So think "**structured booking push (API or prefilled portal) into your agent CRM**," not a generic web embed. The rates and agent-of-record live behind your accreditation; our job is to hand you a clean, complete, correctly-mapped booking.

## Preferred-rate routing
- **On our side:** a mapping from our supplier/property records → your **preferred-partner IDs** (an extension of our provider ledger). Every bookable item carries its Fora-partner mapping + rate code.
- **Through your channel:** the reservation is created under Fora's credentials so the negotiated rate + commission attach. We supply the mapping and the booking; your accreditation supplies the rate.

## What WE build / provide
- Our itinerary item → **Fora-shaped booking payload** (we already model placed → handed-off → confirmed).
- **Supplier → Fora-partner ID mapping** in our provider capability ledger (with source / last_verified / confidence, machine-writable).
- The **push client** (API integration if you have one; else the prefill-package + link, else the manual package).
- **Confirmation-return handling** (ingest your confirmation number + commission back into the traveler's itinerary — email-parse to start, API when available).
- Our **agent-of-record credentials** attached to every booking; commission **reconciliation ledger** on our side.

## What we need YOU to expose
- The **booking-write path** (API endpoint — preferred; or a prefill/deep-link into the agent portal; or a defined structured-import format).
- Your **preferred-partner catalog / IDs** (to map our suppliers) + how a booking selects the **preferred rate** (rate codes / partner agreements).
- The **confirmation-return** mechanism (webhook / report / email) carrying confirmation number + commission attribution.
- **Agent-of-record handling** — how our advisor ID attaches so commission routes to us.

## The accreditation umbrella (the business half — parallel track)
The real prize isn't just booking through you — it's **operating under Fora's IATA/IATAN accreditation + E&O insurance** across the IATA/IATAN supplier network while we send volume. (We hold our **own CLIA**, so cruise is covered our side; your **IATA/IATAN** across air + the broad supplier base is what we're after.) On screen: **"TravelWell — Powered by Fora."** This is a partnerships/compliance conversation running alongside the technical one — the engineers should know each booking rides under your accreditation identifiers so suppliers honor the agent rates.

## Open questions for Fora engineering (the concrete list)
1. Do you have a **booking-write API**? If so — auth model, payload schema, rate-code selection, agent-of-record field?
2. If no API — is there a **prefill/deep-link** into the agent portal, or a **structured import** (CSV/JSON) we can populate?
3. How does a booking **draw the preferred-partner rate** programmatically (rate codes, partner IDs)?
4. How does a **confirmation + commission** come back to us (webhook / report / email)?
5. Where does the **card transaction** occur (supplier-direct / Fora), confirming it's off our infrastructure?
6. What's the **agent-of-record + accreditation** mechanism for an entity like us routing many bookings under your umbrella?
