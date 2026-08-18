# Canonical `sub_region` Master List (the ONE list)

*Source of truth for the `sub_region` field. Country-internal style (a country splits into its own sub-regions where density earns it; small countries cluster). This style is canonical because it matches the live vocabulary in the provider CSV + generator (tropical + 11C surfaced all 15 stays) and the built dossiers — so existing and future data integrate with zero collision.*

## Rules
1. **The `sub_region` string is authoritative and exact** — dossiers, provider CSVs, and the app must match it character-for-character (that's what makes matching light up).
2. **BUILT strings never get renamed** — existing data locks them (06A's four, 11C's seven).
3. **Proposed regions refine at build time** but keep the country-internal style; update this doc the moment a region's strings are set, so it's never stale.
4. **Region codes confirmed against the MVP 13-region scheme.**
5. **Parked rebalance flags** (don't act yet): a dedicated "DR — South Coast & Capital" (Santo Domingo); a possible ABC split from "Windwards & South."

Wired in the engine today: the 06A + 11C locked strings are attached to their destinations in `places.ts` / the `0005` seed. Remaining regions are wired as their dossiers land.

---

## BUILT / locked (do not rename)

### 06A — Southern Africa
| sub_region | member areas |
|---|---|
| South Africa | Cape Town, Kruger, Garden Route, Winelands, Jo'burg… |
| Okavango & Falls | Botswana (Okavango/Chobe) · Victoria Falls corridor (Zambia/Zimbabwe) |
| Namibia Desert & Coast | Sossusvlei, Etosha, Swakopmund, Skeleton Coast, Fish River… |
| Mozambique & Coast | Bazaruto, Vilanculos, Tofo, Maputo, Gorongosa, Ponta do Ouro… |

*(Indian Ocean Islands — Mauritius/Seychelles/Madagascar — proposed/future within 06A.)*

### 11C — Caribbean & Atlantic  *(v2 — 12, complete)*
| sub_region | member areas |
|---|---|
| DR — Punta Cana & the East | Punta Cana, Bávaro, Cap Cana, Bayahibe, La Romana, Saona, Catalina, Miches… |
| DR — North Coast & Interior | Puerto Plata, Cabarete, Sosúa, Samaná, Las Terrenas, Santo Domingo, Jarabacoa… |
| Jamaica — North Coast & Resorts | Montego Bay, Negril, Ocho Rios, Runaway Bay… |
| Jamaica — Kingston & South-East | Kingston, Port Antonio, the Blue Mountains… |
| Jamaica — South Coast | Treasure Beach, Black River, YS Falls… |
| Bahamas | Nassau, Exuma, the Out Islands, Eleuthera, the Abacos… |
| Turks & Caicos | Providenciales, Grace Bay, Grand Turk… *(strongest liveaboard node)* |
| Puerto Rico | San Juan, Vieques, Culebra, the interior… |
| US Virgin Islands | St. Thomas, St. John, St. Croix… |
| Spanish Virgin Islands | Culebra, Vieques *(as the Spanish VI cluster)*… |
| Eastern Caribbean — Leewards | Antigua, St. Kitts & Nevis, St. Maarten, Anguilla, BVI… |
| Eastern Caribbean — Windwards & South | Barbados, St. Lucia, Grenada, the Grenadines, Dominica, Martinique, Trinidad, ABC (Aruba/Bonaire/Curaçao)… |

---

## PROPOSED (not yet built — same style, sized by 2025 density; refine at build time)

### 01F — Western Europe
France · Germany & Austria · Benelux · Switzerland & the Alps

### 02F — The Mediterranean
Italy · Greece & the Islands · Spain — Catalonia · Spain — Andalusia · Spain — Basque Country & the North · Spain — Madrid & the Center · Spain — the Balearics · Portugal · Adriatic

### 03F — Northern Europe & Nordics
Scandinavia · Nordic Atlantic · Finland & the Baltics · British Isles

### 04A — Middle East, Gulf & North Africa
Egypt & the Nile · The Red Sea · Morocco · The Maghreb · Jordan & the Levant · The Gulf · Oman · Israel & the Holy Land

*Split from flat to eight, David-locked 2026-08-14. A sub-region is a browsing
shelf, and one shelf holding Morocco, Egypt, Dubai, Petra and Oman showed a
traveller five unrelated trips at once — the same reasoning that split Europe
into 36 and took the Caribbean from 7 to 12.*

*Two strings carry a decision. **Morocco** is the plain country name: the first
draft was "Morocco & the Atlas", and the range crosses three countries while
Atlas is our own AI — **never put a coined product name in a geographic string**.
**The Red Sea** is a dive region rather than an Egypt region: it spans Sharm,
Hurghada, Marsa Alam, Dahab, Aqaba and Eilat across three countries, and its
chamber coverage belongs to the water, not to a country.*

*The region TITLE needs no change — "Middle East, Gulf & North Africa" in
`taxonomy.ts` already names all three parts and covers all eight children. This
heading was the thing that was stale, reading "Middle East & Gulf" while the
taxonomy said otherwise.*

*Turkey is NOT here. It sits in 02F (The Mediterranean) in `places.ts` today, and
02F has no Turkey shelf yet — that is an 02F gap to fill from this master, not a
reason to move the country across regions and orphan its existing data.*

### 05A — East Africa
Safari Heartland · Gorilla & Great Lakes · Swahili Coast & Islands · Horn & Highlands

### 07A — South & Southeast Asia
India · Himalaya & the Subcontinent Fringe · Thailand · Indochina · Malay Archipelago · The Philippines

### 08A — East Asia
Japan · Greater China · Korea · Mongolia & the Steppe

### 09P — Oceania & the Pacific
Australia — East Coast · Australia — the Outback & West · New Zealand · Melanesia · Polynesia & Micronesia

### 10S — Latin America  *(strings come verbatim from David's locked 10S master, wired per block as dossiers land — do NOT sketch from memory)*
Confirmed locked so far:
- **`Yucatán (Mérida & Chichén Itzá)`** — the exact string (already on 47 built Mexico dossiers). NOT "Mexico — Yucatán & the Caribbean Coast."
- **Central America is by country** (Guatemala, Belize, Costa Rica, …), country-internal style — *not* a single "Central America" node.

The Mexico anchor tier is built under the locked strings; Central America (by country) is the next block. Remaining 10S strings arrive from the master per block — nothing here is wired to a live destination yet (the three 10S demo destinations carry no sub_region).

### 12A — United States *(use taxonomy.ts strings as-is)*
`Pacific Coast` · `Pacific Northwest` · `Mountain West` · `The Southwest` · `Texas & The Gulf` · `The Midwest` · `The South` · `New England` · `Mid-Atlantic` · `Alaska` · `Hawai‘i`
⚠ **Copy these verbatim** — the validator does exact-string matching. Two gotchas: **`The`** is capitalised in `Texas & The Gulf`, and **`Hawai‘i`** uses the ʻokina (U+2018), not a straight apostrophe. Both previously drifted in this doc and would have failed ingest.
*Pacific Northwest added 2026-08 (Sana's call, on David's prep): the 7 OR/WA ski resorts (Mt Hood, Mt Bachelor, Snoqualmie, Stevens Pass, Crystal, Mt Baker, + Timberline) had no clean home — Pacific Coast reads California-centric, Mountain West is the Rockies. Companion calls: NY/Adirondacks (Lake Placid) → Mid-Atlantic (it's NY); Tahoe + Mammoth → Pacific Coast (by state — Sierra, not the Rockies, keeps Mountain West pure).*

### 13A — Canada *(use taxonomy.ts strings as-is)*
British Columbia · The Rockies · The Prairies · Ontario · Québec · The Maritimes · The North

---

## Count
## Incoming → canon: the sub_region reconcile table

The research library authors against its own geography and we validate on exact
strings, so a mismatch is a hard error at `validate:ingest` and a round trip to
fix. These are the mappings already agreed, recorded here so the next batch casts
to them without asking twice.

**The principle, stated once.** A sub_region is a **browsing shelf**, not a
physiographic feature. It answers "what would a traveller click", and a mountain
range that crosses four shelves is not one. Where an incoming string names a
range, it maps to the shelf the destination actually sits in.

### 04A — after the eight-way split (2026-08-14)

| incoming | canon |
|---|---|
| `Jordan & Petra` | `Jordan & the Levant` |
| `Morocco & the Sahara` | `Morocco` |
| `Tunisia & the Sahara` | `The Maghreb` |
| `Oman — Muscat` | `Oman` |
| `Egypt — Red Sea (liveaboard coast)` | `The Red Sea` |
| `United Arab Emirates — Abu Dhabi` | `The Gulf` |
| `United Arab Emirates — Dubai` | `The Gulf` |
| `Qatar — Doha` | `The Gulf` |
| `Saudi Arabia — AlUla` | `The Gulf` |
| `Saudi Arabia — Riyadh` | `The Gulf` |

*`Egypt & the Nile` already matches.* These 17 rows failed only because 04A was
split **after** the batch was emitted — the strings were correct against the
scheme that existed when they were written.

### 12A — physiographic ranges → census-style shelves

| incoming | canon |
|---|---|
| `Rocky Mountains` | `Mountain West` |
| `Green Mountains` | `New England` |

**And the inconsistency in our own scheme, stated rather than defended.** 12A is
census-style and 13A is not: it carries `The Rockies`, `The Prairies` and
`The North` beside three province names. So "we use census regions, you use
ranges" is not quite true — we use whatever reads as a shelf in that country, and
in Canada a range does. The rule that actually holds is the exact-string one: cast
to the list in `taxonomy.ts` for the region you are in, and do not generalise from
one region's flavour to another's.

### Region codes

**There is no `11U`.** It is not retired — it has never appeared as a token in
any commit in this repository's history (checked across all refs, 2026-08-18).
The 13 codes are `01F 02F 03F 04A 05A 06A 07A 08A 09P 10S 11C 12A 13A`, and
`11C` is Caribbean & Atlantic. An incoming `11U` is a library-side invention with
no counterpart here, so there is nothing to map it to — the rows need a real code.

≈ **95 sub-regions** total across 13 regions (01F 4 · 02F 9 · 03F 4 · 04A 8 · 05A 4 · 06A 4 built +1 future · 07A 6 · 08A 4 · 09P 5 · 10S *from master, per block* · 11C 12 · 12A 11 · 13A 7). At ~12–20 destinations each, the ~1,600-destination "big world, built once" corpus. *(11C refined 7 → 12 at build time; 10S strings come verbatim from David's locked master — Central America is by-country, so its count firms as blocks land; the old "168" figure was an error and is retired.)*
