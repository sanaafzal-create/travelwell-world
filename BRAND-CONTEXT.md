# BRAND CONTEXT — briefing for Instagram copy

**Everything below is read from the live codebase on 2026-08-18, not from earlier
brand documents.** Where the code is ambiguous or the content is placeholder, it
says so instead of guessing.

---

## 1 · IDENTITY

### ⚠️ Two names — write toward the new one

| | |
|---|---|
| **Public brand, going forward — USE THIS** | **TravelVisions.World** |
| **Signature line — USE THIS** | **Travel with Vision.** |
| In-code brand today | TravelWell.World |
| In-code domain today | `https://www.travelwell.world` (the apex 308-redirects to `www`) |
| Legal entity in the disclosure text | TravelWell.World LLC |

**The codebase has not been rebranded.** Every string below marked "as it appears
on the site" says *TravelWell*. Report it accurately if you need to quote the
product, but **write new social copy as TravelVisions.World / "Travel with
Vision."**

**Three things a copywriter should know about the old system, because they explain
why the site looks the way it does — do not reproduce them:**

- The old brand is **one word, always**: `TravelWell`, never `Travel Well`. There
  is an automated build check that fails the release if the two-word form ever
  ships.
- The old signature was a fill-in-the-blank formula: **`If It's [X]… TravelWell.™`**
  — the ellipsis and the closing full stop were part of the mark. Real examples as
  they currently render on the site:
  - *If It's Travel… TravelWell.™* (the master line)
  - *If It's Safer Informed Travel… TravelWell.™* (sits in a band under the header on every page)
  - *If It's Love… TravelWell.™* (on the Romance interest page)
  - *If It's Diving… TravelWell.™* (on the Dive Liveaboards page)
- The `[X]` slot took **the thing the traveller wants, not the thing we sell** —
  "Love" not "Romance", "Diving" not "Liveaboards", "the River" not "River
  Cruising". **That instinct is worth carrying into the new brand** even though
  the formula itself is being replaced.

---

## 2 · VOICE & TONE

**Personality.** Warm, plain, specific. Confident without hard-selling. It talks
to one traveller, not an audience. Sentences are short and often start with a
concrete image rather than a benefit.

**Words we use:** *accurate*, *plainly*, *straight*, *clear*, *open*, *worth*,
*matched to you*, *researched*, *step by step*.

**Words we avoid:**

- **"honest" / "honestly"** — banned outright. Use *accurate*, *plainly* or
  *straight*.
- **"safe"** as a promise about a place. The product never states that anywhere
  is safe — see §5. This is a hard rule with an automated check behind it.
- Hype and superlatives that can't be checked: *best*, *#1*, *world-class*,
  *unforgettable* as a claim rather than a description.
- Words implying a complete list — *"everything you need to check"* implies
  completeness. The site says *"things worth reading"* instead, deliberately.

**Formality.** Casual-literate. Contractions yes. Exclamation marks essentially
never — there are none in the site copy.

**Punctuation habits, visible throughout the product:**

- **Em dashes** carry the rhythm — used often, as an aside or a turn.
- **Ellipses** appeared only inside the old signature formula, nowhere else.
- Lists in body copy are comma-separated with an em-dash lead-in:
  *"Flights, stays, dining, transport, activities — each Well…"*
- **Sentence case** for headings, not Title Case.
- Numbers are **spelled out** in prose ("Thirteen regions"), digits in data.

---

## 3 · VISUAL TOKENS

Exact values from the design tokens file.

| Role | Name | Hex |
|---|---|---|
| Background | Ivory ground | `#F7F4EC` |
| Text / ink | Espresso ink | `#1C1B18` |
| Card | Warm white | `#FFFFFF` |
| Banding surface | Linen | `#FBF9F3` |
| **Primary** | **Pine teal** | **`#2C6E68`** |
| Primary hover | Deep pine | `#235A55` |
| Secondary | Sage mist | `#E3EDE9` |
| Muted text | Stone | `#6B6760` |
| **Accent** | **Champagne gold** | **`#C2A35B`** |
| Accent on light backgrounds | Antique gold | darker variant, used for gold *text* so it passes contrast |
| Dark band | Warm charcoal | `#211D17` |
| Emergency / alert | Emergency red | `#B3261E` |
| Border | Sand line | `#E7E2D6` |

**Advisory colour ramp** (used only for safety levels, never decoratively):
green → gold → amber → red, Level 1 to Level 4.

**Fonts**

- **Display / headlines:** `Playfair Display` (serif), falling back to Georgia.
- **Body and UI:** `Inter`, falling back to system sans.
- **Labels / codes / numerals:** also `Inter`, set in the mono slot.

**Accent rules, as implemented**

- **Gold is not a general-purpose colour.** It marks the brand word and luxury
  surfaces only.
- The brand word takes **pine on light backgrounds, gold on dark**. That flip is
  in the CSS and it is deliberate.
- Each of the travel styles carries its own accent hex (e.g. Romance `#A8527A`,
  Tropical Islands `#2E8C8C`, Ultra-Luxury `#A8873F`) used as a single accent per
  page — not as a palette.
- **Colour never carries meaning alone.** Every level, tier and status is also
  written in words. This is a locked accessibility rule.

---

## 4 · PRODUCT FACTS — the source of truth

### The Wells — 13 total, 10 live, 3 coming

Always written **hyphenated and in full**: `Stay-Well`, never "Stay".

| Well | One line | Status |
|---|---|---|
| Fly-Well | Getting there | **Live** |
| Stay-Well | Where you rest | **Live** |
| Eat-Well | What you savor | **Live** |
| Move-Well | Getting around | **Live** |
| Gear-Well | What you carry | **Live** |
| Beauty-Well | Looking & feeling well | **Live** |
| Activities-Well | What excites you | **Live** |
| Shop-Well | Taking it home | **Live** |
| Nanny-Well | Care for the little ones | **Live** (luxury tier) |
| Security-Well | Discreet protection | **Live** (luxury tier) |
| Insure-Well | Peace of mind | Coming soon |
| Ship-Well | Sending it ahead | Coming soon |
| Pets-Well | Traveling with your companion | Coming soon |

**Publish the number as 13.** Note "Activities-Well" is plural — that is settled
and deliberate.

### The traveller flow — four steps, exactly as the site names them

1. **Tell us what moves you** — *"Pick the ways you love to travel — safari, romance, culinary, and more. Or just speak with Atlas."*
2. **Choose where in the world** — *"Thirteen regions, each with researched destinations and an accurate Safety Card you can trust."*
3. **Move through the Wells** — *"Flights, stays, dining, transport, activities — each Well surfaces a shortlist of providers, matched to you."*
4. **Book it — all in one trip** — *"Everything lands in a single itinerary, always saved. You always choose, and you always book."*

### Counts and the exact terms

- **35 travel styles.** The internal term is **Signature Interests**; the
  customer-facing phrase used on the site is **"ways to travel"**. Either works
  for social; "ways to travel" is warmer.
- **8 are live today.** Their display names, exactly: **Ultra-Luxury · Tropical
  Islands · Romance, Marriages & Honeymoons · Safari Adventures · Global
  Expedition Adventures · Winter/Ski · Dive Liveaboards · River Cruises**.
- **13 regions**, named: Western Europe · The Mediterranean · Northern Europe &
  Nordics · Middle East, Gulf & North Africa · East Africa · Southern Africa ·
  South & Southeast Asia · East Asia · Oceania & The Pacific · Latin America ·
  Caribbean & Atlantic · United States · Canada.
- **The AI assistant is called Atlas** — full form "Atlas A.I. Concierge".

---

## 5 · POSITIONING & PROMISES

**What the product calls itself:** *"A travel operating system that designs the
whole trip — around you."* The About page opens: *"One place to dream, plan and
book your whole trip."*

**The six promises, verbatim from the About page:**

1. **We're clear about what's ready** — *"If something is still coming soon, we say so — plainly, right on the page."*
2. **We tell you how we earn** — *"If a booking earns us a commission, you'll see a note right beside it. It never costs you extra."*
3. **Everything lands in one trip** — *"Whatever you add — a flight, a dinner, a safari — it's saved to one itinerary, automatically."*
4. **Your safety travels with you** — *"Every destination has a Safety Card — nearest hospital, your embassy, the local emergency number."*
5. **Easy for everyone** — *"Type or talk. Read or listen. Works with a keyboard alone — and in your language."*
6. **You're always in charge** — *"Atlas suggests; you decide. Nothing is ever booked without you."*

Summarised on the page as four words: **Clear · Open · Safe · Yours**

**Commission disclosure, verbatim:** *"Booking this may earn us a commission, at
no extra cost to you. Disclosed every time."* And on ranking: *"It never changes
your price, and it never changes our ranking — options are ordered by fit to you,
not by commission."*

**Booking model.** The traveller books with the travel provider, not with us. We
surface and hand off through a disclosed affiliate link. **We never take the
payment and never hold the card.**

### What we deliberately do NOT claim — treat as hard limits

- **We never say a place is safe.** The positioning is *Safer Informed Travel* —
  we give travellers the official government advisory so they can decide. There is
  an automated check that fails the build if the words "is safe" appear in safety
  content. **Do not write "safe" about a destination in any caption.**
- **We do not rank or recommend one operator over another**, and we don't call
  anything "best" in a comparative sense.
- **We do not imply a complete list** of what a traveller should check.
- **We do not promise outcomes** — no "trip of a lifetime, guaranteed" framing.

---

## 6 · CURRENT STATUS

**Live today:** the full site — 13 regions, 35 travel styles with 8 bookable, the
13 Wells, Atlas the AI assistant, per-destination Safety Cards with the official
government advisory, and a nine-language interface.

**Just shipped (this week):** the destination catalogue went from 44 to **504
destinations**, and a consent screen that shows a traveller the full government
advisory before any booking in a Level 3 country.

**Building:** Insure-Well, Ship-Well and Pets-Well. Voice conversation with Atlas
is proven but not yet switched on for everyone.

**Planned:** taking bookings on our own surface end to end.

### Launch messaging

The site's own closing lines, currently:

> **"Your next journey, designed around you."**
> **"Your dream trip, one step at a time."**

Both are on-brand for the new name with no change of meaning.

---

## ⚠️ THINGS THAT ARE AMBIGUOUS OR PLACEHOLDER — do not treat as fact

1. ~~"the best 6 providers"~~ **— FIXED 2026-08-18, and worth knowing why.** The
   site claimed six providers per Well in three places, including a large numeral
   on the home page. No code produced six: the caps are four on a destination
   page, three per Well and nine total on a travel-style page, and the Wells
   surface caps nothing. One of the three also invited the reader to "Tap 'See
   more'", an affordance that does not exist. All three now say **"a shortlist,
   matched to you"** and the numeral is gone. **Never reintroduce a provider
   count** — the shortlist length genuinely varies by Well and region, so there is
   no true number to quote.

2. **"504 destinations" is true in the catalogue, not yet on the live site.** The
   data is merged and built but the database step has not been run. Until it has,
   the public site shows 44. **Confirm before publishing the larger number.**

3. **Two Wells are marked live but thinly supplied.** Nanny-Well and Security-Well
   are luxury-tier and live in the data; whether they have real providers behind
   them is not visible in the code.

4. **Some destination copy is representative rather than researched.** The
   original 44 destinations were written as design data. Don't quote a specific
   destination description as a researched claim without checking.

5. **The rebrand is not reflected anywhere in the product.** Every visible string,
   URL, legal document and the entire signature system still say TravelWell. If a
   post links to the site or shows a screenshot, the old name will be on it.
   Worth resolving before a launch push.

6. **"Travel with Vision." has no equivalent in the codebase**, so there is no
   existing usage to copy — no capitalisation precedent, no placement rule, no
   translated forms. Note that the old brand name was **never translated** in any
   of the nine languages; if that rule carries over, "Travel with Vision." should
   be treated as a coined line and left in English.
