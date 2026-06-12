# Handoff: TravelWell.World — Full Platform

## Overview
TravelWell.World is a premium, editorial travel platform — "a Travel Operating System." It routes a traveler from a *feeling* (Special Interest) → a *place* (Region) → *what excites them* (Activities) → *their needs* (the 10 Wells) → a *booked trip* (Itinerary + Book It), monetized through disclosed partners. This bundle contains the complete high-fidelity prototype: 30+ screens across 8 functional modules, a shared design-token system, and a global shell (nav, mega-menu, footer, Concierge "Atlas", Your-Trip tray, Emergency, Whisper, locale/RTL).

## About the Design Files
The files in this bundle are **design references created in HTML/CSS/vanilla-JS** — prototypes showing the intended look, copy, and interaction. They are **not production code to ship directly**. The task is to **recreate these designs in the target codebase's environment** (the team's stack is React + TypeScript + Tailwind + Supabase/Postgres + Edge functions + Claude API) using its established patterns. Where no component exists yet, build it to match these references precisely. The prototype's data layer (`js/data.js`, `js/places.js`) is representative placeholder content, not a real catalog — wire real data/APIs in implementation.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, radii, shadows, component states, and copy are all settled and should be recreated pixel-faithfully using the codebase's libraries. Imagery is placeholder (Unsplash URLs + a few deliberate CSS product renders) — swap for real assets. Investor economics are intentionally shown as **illustrative placeholders** and must be replaced with audited figures before any real investor use.

## Design Tokens
All defined in `styles/tokens.css` as CSS custom properties (light theme is default; dark is reserved for footer/investor bands only).

**Color (hex / oklch token):**
- Ivory ground `--background` #F7F4EC
- Warm white `--card` #FFFFFF · Linen `--surface-alt` #FBF9F3
- Espresso ink `--foreground` #1C1B18 · Stone `--muted-foreground` #6B6760
- Pine teal `--primary` #2C6E68 · Deep pine `--primary-hover` #235A55 · Sage mist `--secondary` #E3EDE9
- Champagne gold `--accent` #C2A35B (decorative only — never body text on light) · Antique gold `--gold-deep` #A8873F (gold text on light)
- Warm charcoal `--dark-band` #211D17 · Sand line `--border` #E7E2D6 · Emergency red `--destructive` #B3261E
- Safety ramp 1–4: green #3F7E55 / gold #C2A35B / amber #C9772F / red #B3261E (color is ALWAYS paired with a number + label)

**Type:** Playfair Display (serif, display/headings, wt 400–600) over Inter (sans, everything, wt 400–600). Arabic companions: Noto Sans Arabic + Noto Naskh Arabic under `[dir="rtl"][lang="ar"]`. Scale: Display XL 72/1.02 → Display L 56 → H2 36 → H3 24 → Lead 20 → Body 16/1.6 → Body-S 14 → Micro 12. Mobile scales display down (~40px) under 640px. Body never below 14px.

**Spacing:** 4px base (`--s-1`…`--s-32`). Content max 1200px (`--content-max`), reading column 720px, gutters 24px, section rhythm 96–128px.

**Material:** radius 12px cards/buttons (`--radius`), 8px inputs, 16px large, pill for chips/CTAs. Shadows `--e1`/`--e2`/`--e3` (soft, warm). 1px Sand-Line borders. Focus ring: 3px `--ring` (pine), offset 2px. `prefers-reduced-motion` honored.

## The Trust Language (hard rules — enforce everywhere)
- **Live vs Preview:** real content = teal "Live" pill; placeholder/schema = stone "Preview" pill + desaturated media (`.is-preview .media`).
- **"Activated at Launch":** Insure-Well & Ship-Well appear but are clearly un-actionable.
- **FTC disclosure** sits adjacent to every monetized/affiliate CTA — never hidden.
- **Nanny-Well & Security-Well** appear ONLY in Luxury/Ultra contexts.
- **Safety Card:** level 1–4, color + number + label; nearest hospital / embassy / local emergency number.
- Design every state: empty, loading, error, RTL. WCAG AA contrast, visible focus, full keyboard paths.
- Concierge is named **"Atlas"** in the UI ("Speak with Atlas"); keep the subtle "powered by Claude" credit in the panel.

## Architecture of the Code
- `styles/` — `tokens.css` (the system, imported everywhere) + per-area sheets: `shell.css`, `journey.css`, `wells.css`, `itinerary.css`, `checkout.css`, `onboarding.css`, `profile.css`, `luxury.css`, `investor.css`.
- `js/` — `data.js` (taxonomy: 25 SIs, 10+2 Wells, 13 regions, locales, SI↔region affinity), `places.js` (region detail, destinations, sub-regions, providers, well detail, guides), `images.js` (placeholder image resolver), `shell.js` (the global chrome controller + `TWW.ICON` set + `TWW.mountShell()` + favicon), `itinerary.js`, `checkout.js`.
- Each screen is one HTML file that links tokens + shell + its area sheet, then calls `TWW.mountShell({active})`.

## Screens / Views (by module)
See `Sitemap.html` for the clickable map. Modules and key behaviors:

1. **Entry & Home** — `Home.html` (= `index.html`): hero w/ image-slot, "what is TravelWell" explainer, selectable Special-Interest cards (pick up to 3, 2 = sweet spot, chosen cards light up gold w/ numbered badge + bottom pick-bar → carries to regions), providers explainer, Atlas concierge feature w/ live looping demo. `plan.html`: date-aware seasonal banner, 10-Well coverage checklist, featured destinations/guides, SI grid.
2. **Onboarding / Travel ID** — `Sign Up.html` (6-step wizard: builds "Travel Personality" via Travel Intelligence rail; step 6 = Budget Ranges with per-Well multi-select dropdowns — ranges are Luxury · High-End · Mid-Range · Family Friendly · Budget Conscious for all Wells, except **Fly-Well = First/Business/Coach**; plus a "Speak with Atlas" verbal/written path). `Activation.html` (verify · location/Emergency · notifications · Whisper dial; labeled progress dots + "Next:" hints). `Sign In.html`, `Verify Email.html`, `Profile.html` (passport-style Identity Card + editable sections + reset).
3. **Dream Journey** — `special-interests.html`, `si-detail.html`, `regions.html`, `region-detail.html` (+ nested USA/Canada sub-regions w/ ranked Top lists), `activities.html`, `wells-surface.html` (the centerpiece), `destinations.html`, `destination-detail.html` (hero + Safety Card + provider stacks by Well).
4. **Wells & Partners** — `wells.html` (body-metaphor index), `well-detail.html`, `providers.html` (filterable, Prime-first, FTC), `go.html` (affiliate redirect interstitial).
5. **Itinerary & Booking** — `itinerary.html` (6 time-blocks Dawn→Night, idea→pending→confirmed lifecycle, for-whom overlay, Well-gap panel, AI review, whispers) + Book It checkout (`js/checkout.js`: API search→quote→pay→confirm, widget, affiliate tracks).
6. **Content & Premium** — `guides.html`, `guide-detail.html`, `luxury.html` (`?tier=ultra|luxury`, chooser-first), `first-aid-kit.html` (QR Safety-Card, pre-order).
7. **Investor / System** — `demo.html`, `vc-demo.html` (gated, code `TWW2026`), `about.html`.
8. **Design Reference** — `Foundations.html`, `Global Shell.html`, `Logo Concepts.html` / `Logo Concepts II.html` (chosen mark = #6 Wordmark: "Travel" ink · "Well" teal · italic gold ".world"), `Sitemap.html`.

## Key Interactions & Behavior
- **SI selection:** multi-select max 3, toast on 4th; sticky pick-bar; persists to `localStorage tww:journeySIs`; carries through region→activities→wells.
- **Wells surface:** always-visible Well bar; per-Well provider list shows **best 6 first, "See more" for the rest**; budget-matched; Book It adds to Your-Trip tray + coverage bar; pre-launch Wells show "Activated at Launch".
- **Book It:** routes by provider `mode` (api/widget/affiliate); affiliate → `go.html` handoff → "mark as booked" return.
- **Itinerary:** for-whom overlay dims non-matching blocks; lifecycle pills; AI review injects suggestions; reduced-motion safe.
- **Demo state-switcher pills** (bottom of Sign In, Profile, SI index, Itinerary, etc.) are **review aids — remove in production.**
- Responsive: mobile-first; nav→burger+mega-menu; trays full-width; grids collapse to single column; type scales down. Breakpoints 920/900/880/760/700/560px.

## State Management (for implementation)
- Travel ID / Travel Personality: party (age ranges, never birthdays), interests (1–3), per-Well budget ranges, trip intent + free-text dream, dietary/accessibility, contact + consent.
- Journey: chosen SIs → region → activities → well selections → trip blocks (block = {slot, name, well, provider, status: idea|pending|confirmed, whom}).
- Booking: provider mode → checkout track → status transition.
- Persisted demo keys: `tww:journeySIs`, `tww:journeyActs`, `tww:whisperDial`.

## Assets
Placeholder imagery via Unsplash (`js/images.js` resolver) — replace with licensed/real photography. Product/first-aid visuals are CSS renders (placeholders). Icons are an inline SVG set in `js/shell.js` (`TWW.ICON`). Fonts via Google Fonts (Playfair Display, Inter, Noto Sans/Naskh Arabic). Logo is type-only (no image asset). Favicon injected as inline SVG by the shell.

## Files
All HTML files at project root + `styles/*.css` + `js/*.js` are included in this bundle. Start from `Sitemap.html` and `Home.html`. `Foundations.html` is the living token reference.
