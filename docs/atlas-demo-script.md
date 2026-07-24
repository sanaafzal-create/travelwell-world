# Atlas VC demo — voice script (v1)

Three jobs at once:
1. **The scripted walk-through** the VC experiences (hands on the wheel), the one David wants nailed.
2. **STT/TTS tuning material** — real place + provider names to test Deepgram keyterm prompting and TTS pronunciation on our actual content, not filler.
3. **Barge-in / accent test lines** — to prove the real-time flow (interrupt + respond) and accent robustness.

**Star SI: Safari / East Africa** — the provider-complete SI *today* (Winter/Ski is still preview; see the VC assessment). Real destinations, real safety data.

## Voice rules baked in (non-negotiable)
- Atlas **≤ 2 short sentences per turn** (~60–70% shorter than text). One warm beat → the fact → hand the turn back.
- **Never speak lists** — options live on the screen; Atlas points, never recites.
- **Never fabricate** a price, provider, or safety fact. Prices/bands are on screen; Atlas doesn't quote invented numbers.
- **Never books** — always "you choose, you book." **Never promises "safe"** — keeps them *informed* (Safer-Informed). Straight over flattering.
- Safety lines must be read from **live data** at demo time (must match what's on the safety card) — the lines below are representative of our current data, not hardcoded truth.

**Notation:** `VC` = spoken by the visitor · `ATLAS` = spoken by Atlas (terse) · `[screen]` = what appears / choreography · `[stage]` = staging note.

---

## Scene 0 — Cold open (the greeting that sets the tone)
`ATLAS:` "Hi — I'm Atlas. Tell me the trip you're dreaming of, in a sentence."
`[screen]` mic live; live words appear as the VC speaks (the mirror).

## Scene 1 — Onboarding, four clean moves (vision · activities · pace · budget)
**1 · Vision**
`VC:` "A safari in East Africa for our anniversary."
`ATLAS:` "A safari for the two of you — beautiful. What would make it unforgettable?"

**2 · Activities**
`VC:` "Game drives, and a balloon at dawn."
`ATLAS:` "The balloon at first light is magic. Do you want it full and busy, or slow and unhurried?"

**3 · Pace**
`VC:` "Unhurried."
`ATLAS:` "Good — room to breathe. And what should the budget feel like?"

**4 · Budget**
`VC:` "Premier. We want to treat ourselves."
`ATLAS:` "Then I've got you: anniversary safari, game drives and a dawn balloon, unhurried, premier. Let me show you — look down here."
`[screen]` the **Safari** interest pulses (choreography — Atlas's word lights the path).

## Scene 2 — Pick the interest + region (voice leads the eye)
`[stage]` VC taps the pulsing Safari tile.
`ATLAS:` "East Africa is your stage — that's where this one belongs."
`[screen]` region resolves to **East Africa (05A)**; destinations surface.

## Scene 3 — Real options, shaped by THEM (the "it knows me" moment)
`[screen]` options matching *safari + premier + East Africa* surface: **Maasai Mara**, **Serengeti**, **Ngorongoro Crater**…
`ATLAS:` "These are matched to you — safari, premier, East Africa. Everything here, we actually have."
`[stage]` VC taps **Maasai Mara** → a real card (Angama Mara, Governors' Camp behind it).

## Scene 4 — The safety beat (the moat: Safer-Informed, out loud)
`VC:` "Is it safe?"
`ATLAS:` "The Mara's at a normal-caution level — book freely, with vetted camps and guides. I'll always tell you straight."
`[stage]` VC glances at the Serengeti option.
`ATLAS:` "One honest note — the Serengeti is extraordinary, but Tanzania's under a *reconsider-travel* advisory right now. I'll show you everything about it; I won't rush you to book it."
`[screen]` the safety card reflects the live level for each place.

## Scene 5 — Budget, three tiers, the median rule
`[screen]` three live tiers appear — **Comfort · Premier · Luxury** — with **Premier** (the middle) marked as the median.
`ATLAS:` "Three ways to do the same trip — the middle one's your premier. Your range, not one price."
`[stage]` Atlas points; he does **not** speak the numbers (they're on screen).

## Scene 6 — The itinerary reveal (Layer 2 — the whole week)
`ATLAS:` "Want to see the whole week I'd shape for you?"
`[screen]` the **Itinerary** button pulses.
`[stage]` VC taps it → a full **Day 1 → Day 7** itinerary opens: flights in, camps, the dawn balloon, game drives, flight home — **get-them-there-and-home**, with the commission/pricing view visible *(VC-only reveal)*.
`ATLAS:` "Day one to home — the flights, the camps, the dawn balloon. I've shaped it; you place it, and you book it."

## Scene 7 — The close (payments-never, in plain words)
`VC:` "Can you book it?"
`ATLAS:` "You'll book right with the camp and the airline — I never touch your card. I just get you to the door, beautifully."

## Scene 8 — The always-there safety buttons (VC clicks them)
`[stage]` VC taps the green cross, then the red emergency.
`ATLAS:` "Wherever you land, help is one tap away — the safety card and emergency line, anywhere in the world."

---

## Appendix A — Pronunciation / keyterm list (STT keyterm prompt + TTS QA)
Feed these to Deepgram as keyterms so accents/place-words resolve; verify TTS says them right.
- **Maasai Mara** — *mah-SY MAH-rah* (Kenya)
- **Serengeti** — *seh-ren-GET-ee* (Tanzania)
- **Ngorongoro** — *n-goh-rohng-GOH-roh* (Tanzania)
- **Angama Mara** — *ahn-GAH-mah MAH-rah* (camp)
- **Mahali Mzuri** — *mah-HAH-lee m-ZOO-ree* (camp)
- **Governors' Camp** · **Mara Serena** · **Sarova**
- Bench nearby for range tests: **Sossusvlei** (*SOH-soos-flay*), **AlUla** (*al-OO-lah*), **Reykjavík** (*RAKE-yah-veek*), **Bora Bora**, **Siem Reap** (*see-em ree-ap*), **Phuket** (*poo-KET*).

## Appendix B — Barge-in / interrupt test (prove the real-time flow)
Interrupt Atlas **mid-sentence** and confirm he stops and follows:
- While Atlas is describing the Mara → `VC:` "Wait — can we do June instead?" → Atlas should cut cleanly and pick up the date change.
- While Atlas lists the week → `VC:` "Skip the balloon, we're scared of heights." → Atlas drops it and continues.

## Appendix C — Accent / hard-input lines (STT robustness)
Say these across a couple of accents; the mirror is the safety net (they read + correct if misheard):
- "We fly out of Nairobi, not Mombasa."
- "Is Ngorongoro included, or just the Mara?"
- "Bump us to luxury for the last two nights."

---
*Reuse note: David okayed dropping the existing Luxury Paris itinerary in as the Layer-2 sample if it's cleaner than a Safari week — the script's Scene 6 works with either; swap the place words + camps for the Paris version if we stage it that way.*
