/**
 * TravelWell.World — Places data: region detail, destinations, sub-regions,
 * providers, well detail, guides, activities. Ported from js/places.js.
 * Design-prototype data — representative, not a real catalog (Law V-2).
 */

// David's additive Special-Interest activities (raw data, same seam as
// safety.json). Folded into ACTIVITIES at module load — see src/data/taxonomy.ts.
import siExtra from "./special-interests.json";

export interface SeasonNote { l: string; m: string; note: string; }
export interface RegionDetail {
  countries: string[];
  season: SeasonNote[];
  blurb: string;
  sub?: boolean;
}

export const REGION_DETAIL: Record<string, RegionDetail> = {
  "01F": { countries: ["France", "Germany", "Netherlands", "Belgium", "Austria", "Switzerland", "Ireland", "Luxembourg"], season: [{ l: "Spring", m: "Apr–Jun", note: "Blossom, mild, fewer crowds" }, { l: "Summer", m: "Jul–Aug", note: "Long days, peak & busy" }, { l: "Autumn", m: "Sep–Oct", note: "Harvest, golden light" }], blurb: "Old-world capitals stitched together by fast trains — a region you can taste, hear and walk." },
  "02F": { countries: ["Spain", "Italy", "Greece", "Portugal", "Croatia", "Malta", "Cyprus", "Turkey", "Montenegro"], season: [{ l: "Shoulder", m: "May–Jun", note: "Warm seas begin, calm" }, { l: "High", m: "Jul–Aug", note: "Hot, lively, book ahead" }, { l: "Golden", m: "Sep–Oct", note: "Warm water, soft crowds" }], blurb: "Sun, sea and centuries — where every coastline hides a ruin and a long lunch." },
  "03F": { countries: ["Norway", "Sweden", "Denmark", "Finland", "Iceland", "Estonia", "Latvia"], season: [{ l: "Midnight Sun", m: "Jun–Jul", note: "Endless daylight" }, { l: "Aurora", m: "Sep–Mar", note: "Northern lights window" }], blurb: "Fjords, clean design and light that refuses to behave." },
  "04A": { countries: ["UAE", "Qatar", "Saudi Arabia", "Oman", "Jordan", "Bahrain"], season: [{ l: "Cool", m: "Nov–Mar", note: "Ideal — warm days, cool nights" }, { l: "Hot", m: "Jun–Sep", note: "Very hot; indoor luxury" }], blurb: "Where ancient incense routes meet glass towers and impossible ambition." },
  "05A": { countries: ["Kenya", "Tanzania", "Rwanda", "Uganda", "Ethiopia"], season: [{ l: "Dry / Migration", m: "Jul–Oct", note: "Best game viewing, river crossings" }, { l: "Green", m: "Nov–Mar", note: "Calving, birdlife, lush" }, { l: "Long Rains", m: "Apr–May", note: "Quiet, some camps close" }], blurb: "The cradle of the safari — golden plains, great migrations, and skies that go forever." },
  "06A": { countries: ["South Africa", "Namibia", "Botswana", "Zambia", "Zimbabwe"], season: [{ l: "Dry", m: "May–Oct", note: "Prime safari, sparse bush" }, { l: "Green", m: "Nov–Apr", note: "Dramatic skies, newborns" }], blurb: "Big skies, bigger game, and a coastline of vineyards at the end of the continent." },
  "07A": { countries: ["Thailand", "Vietnam", "Indonesia", "Cambodia", "Malaysia", "Singapore", "Laos", "Sri Lanka", "Philippines"], season: [{ l: "Dry", m: "Nov–Mar", note: "Cool, sunny, peak" }, { l: "Hot", m: "Apr–May", note: "Hot before the rains" }, { l: "Monsoon", m: "Jun–Oct", note: "Green, lush, fewer crowds" }], blurb: "Temples, islands and spice — a region that rewards slowing right down." },
  "08A": { countries: ["Japan", "South Korea", "China", "Taiwan", "Hong Kong"], season: [{ l: "Cherry Blossom", m: "Mar–Apr", note: "Sakura, crowds, magic" }, { l: "Autumn", m: "Oct–Nov", note: "Maple reds, crisp" }], blurb: "Tradition at the speed of now — bullet trains to thousand-year shrines." },
  "09P": { countries: ["Australia", "New Zealand", "Fiji", "French Polynesia", "Cook Islands", "Samoa"], season: [{ l: "Austral Summer", m: "Dec–Feb", note: "Beach & reef season" }, { l: "Austral Winter", m: "Jun–Aug", note: "Whales, ski, calm" }], blurb: "The end of the map, the start of awe — reefs, glaciers and empty horizons." },
  "10S": { countries: ["Mexico", "Peru", "Argentina", "Chile", "Brazil", "Colombia", "Ecuador", "Costa Rica", "Bolivia", "Uruguay", "Panama"], season: [{ l: "Dry (Andes)", m: "May–Sep", note: "Best for trekking" }, { l: "Patagonia Summer", m: "Nov–Mar", note: "South open & mild" }], blurb: "Color, rhythm and wild horizons — from cloud forest to glacier in one trip." },
  "11C": { countries: ["Bahamas", "Dominican Republic", "Jamaica", "Puerto Rico", "Barbados", "St. Lucia", "Aruba", "Turks & Caicos", "Antigua", "Cuba", "Grenada", "Bermuda", "Cayman Islands"], season: [{ l: "Dry / Peak", m: "Dec–Apr", note: "Sunny, calm, popular" }, { l: "Low", m: "Jun–Nov", note: "Warm, lush, storm window" }], blurb: "A thousand shades of blue — pick an island, any island." },
  "12A": { countries: ["United States"], sub: true, season: [{ l: "Summer", m: "Jun–Aug", note: "Parks & coast peak" }, { l: "Fall", m: "Sep–Oct", note: "Foliage, wine country" }, { l: "Winter", m: "Dec–Mar", note: "Ski & sunbelt" }], blurb: "Fifty ways to wander — explore by the ten travel sub-regions below." },
  "13A": { countries: ["Canada"], sub: true, season: [{ l: "Summer", m: "Jun–Sep", note: "Rockies, road & rail" }, { l: "Winter", m: "Dec–Mar", note: "Powder & aurora" }], blurb: "Vast, wild and gracious — explore by the seven travel sub-regions below." },
};

export interface Destination { id: string; name: string; country: string; line: string; status: "live" | "stub"; img: string; }
const D = (id: string, name: string, country: string, line: string, status: "live" | "stub", img: string): Destination => ({ id, name, country, line, status, img });

export const DESTINATIONS: Record<string, Destination[]> = {
  "01F": [D("paris", "Paris", "France", "The first and last word in romance", "live", "paris"), D("amalfi-x", "Lake District", "Germany", "Storybook lakes and trails", "stub", "mountainValley"), D("amsterdam", "Amsterdam", "Netherlands", "Canals, galleries, easy charm", "live", "venice"), D("alps", "The Alps", "Switzerland", "Peaks, spas and slow trains", "live", "mountainValley")],
  "02F": [D("santorini", "Santorini", "Greece", "Whitewashed cliffs over a caldera", "live", "santorini"), D("amalfi", "Amalfi Coast", "Italy", "Lemon groves and vertical villages", "live", "venice"), D("barcelona", "Barcelona", "Spain", "Gaudí, tapas and Mediterranean light", "live", "marrakech"), D("algarve", "The Algarve", "Portugal", "Golden cliffs and quiet coves", "stub", "tropicalBeach")],
  "03F": [D("reykjavik", "Reykjavík & Ring Road", "Iceland", "Waterfalls, lava and aurora", "live", "northernLights"), D("lofoten", "Lofoten Islands", "Norway", "Sea-cliff drama above the Arctic Circle", "stub", "mountainValley")],
  "04A": [D("dubai", "Dubai", "UAE", "Audacious, golden, around the clock", "live", "dubai"), D("petra", "Petra & Wadi Rum", "Jordan", "Rose-red city and red-sand desert", "live", "desertDunes"), D("alula", "AlUla", "Saudi Arabia", "Ancient tombs in a living desert", "stub", "desertDunes")],
  "05A": [D("masai-mara", "Maasai Mara", "Kenya", "Front-row seat to the Great Migration", "live", "safariGiraffe"), D("serengeti", "Serengeti", "Tanzania", "Endless plains, endless herds", "live", "lion"), D("ngorongoro", "Ngorongoro Crater", "Tanzania", "A natural amphitheatre of wildlife", "live", "elephant"), D("volcanoes", "Volcanoes NP", "Rwanda", "Mountain gorillas in the mist", "stub", "mountainValley")],
  "06A": [D("cape-town", "Cape Town", "South Africa", "Where the mountain meets two oceans", "live", "oceanAerial"), D("kruger", "Greater Kruger", "South Africa", "Big Five in the lowveld", "live", "elephant"), D("sossusvlei", "Sossusvlei", "Namibia", "The world's tallest dunes", "stub", "desertDunes")],
  "07A": [D("bali", "Bali", "Indonesia", "Rice terraces, temples and surf", "live", "baliRice"), D("bangkok", "Bangkok", "Thailand", "Street food capital of the world", "live", "restaurant"), D("kyoto-x", "Phuket & Phi Phi", "Thailand", "Limestone islands and warm seas", "live", "tropicalBeach"), D("siem-reap", "Siem Reap", "Cambodia", "Sunrise over Angkor Wat", "stub", "kyoto")],
  "08A": [D("kyoto", "Kyoto", "Japan", "Geisha districts and golden temples", "live", "kyoto"), D("tokyo", "Tokyo", "Japan", "Neon, Michelin stars and calm shrines", "live", "dubai"), D("seoul", "Seoul", "South Korea", "Palaces, markets and midnight food", "stub", "marrakech")],
  "09P": [D("queenstown", "Queenstown", "New Zealand", "Adventure capital of the south", "live", "mountainValley"), D("bora-bora", "Bora Bora", "French Polynesia", "Overwater bungalows on a lagoon", "live", "maldivesResort"), D("gbr", "Great Barrier Reef", "Australia", "The largest living thing on Earth", "stub", "oceanAerial")],
  "10S": [D("machu", "Machu Picchu", "Peru", "The lost city in the clouds", "live", "mountainValley"), D("patagonia", "Patagonia", "Chile / Argentina", "Granite spires and turquoise lakes", "live", "mountainValley"), D("cartagena", "Cartagena", "Colombia", "Walled city of color and rhythm", "stub", "marrakech")],
  "11C": [D("turks", "Turks & Caicos", "Turks & Caicos", "Grace Bay's impossible blues", "live", "oceanAerial"), D("st-lucia", "St. Lucia", "St. Lucia", "The Pitons above the sea", "live", "tropicalBeach"), D("exuma", "The Exumas", "Bahamas", "Sandbars and swimming pigs", "stub", "maldivesResort")],
  "13A": [D("banff", "Banff & Lake Louise", "Canada", "Turquoise lakes under the Rockies", "live", "mountainValley"), D("vancouver", "Vancouver", "Canada", "Sea, city and mountains at once", "stub", "oceanAerial")],
};

export const SUBREGION_TOP: Record<string, string[]> = {
  "Pacific Coast": ["San Francisco", "Big Sur", "Los Angeles", "San Diego"],
  "Mountain West": ["Aspen", "Jackson Hole", "Park City", "Yellowstone"],
  "The Southwest": ["Sedona", "Grand Canyon", "Santa Fe", "Moab"],
  "Texas & The Gulf": ["Austin", "San Antonio", "New Orleans", "Houston"],
  "The Midwest": ["Chicago", "Twin Cities", "Mackinac Island"],
  "The South": ["Charleston", "Nashville", "Savannah", "Asheville"],
  "New England": ["Boston", "Acadia", "The Berkshires", "Newport"],
  "Mid-Atlantic": ["New York City", "Washington D.C.", "The Hamptons"],
  "Alaska": ["Denali", "Inside Passage", "Kenai Fjords"],
  "Hawai‘i": ["Maui", "Kaua‘i", "O‘ahu", "Big Island"],
  "British Columbia": ["Vancouver", "Whistler", "Tofino", "Okanagan"],
  "The Rockies": ["Banff", "Lake Louise", "Jasper", "Yoho"],
  "The Prairies": ["Calgary", "Winnipeg", "Saskatoon"],
  "Ontario": ["Toronto", "Niagara", "Ottawa", "Muskoka"],
  "Québec": ["Montréal", "Québec City", "Mont-Tremblant", "Charlevoix"],
  "The Maritimes": ["Halifax", "Cape Breton", "PEI", "Bay of Fundy"],
  "The North": ["Yellowknife", "Whitehorse", "Churchill"],
};

export type Tier = "prime" | "vetted" | "prospective";
export type Price = "value" | "comfort" | "premium" | "ultra";
export type Mode = "api" | "widget" | "affiliate" | "first-party";
export interface Provider {
  name: string; well: string; tier: Tier; price: Price; mode: Mode; desc: string; commission: string;
  /** Which Special Interests this provider serves (real taxonomy keys). The matching keystone. */
  si: string[];
  /** Region code where the provider operates (regions.code), or undefined for cross-region (e.g. airlines). */
  region?: string;
}
// si/region default to the current catalog's reality — the Maasai-Mara safari
// demo (safari · East Africa 05A). NEW providers must pass explicit si + region
// so the matching layer (Step 2) can filter by them; the defaults only cover the
// 39 existing demo rows so they don't need editing one-by-one for Step 1.
const p = (
  name: string, well: string, tier: Tier, price: Price, mode: Mode, desc: string, commission: string,
  si: string[] = ["safari"], region: string | undefined = "05A"
): Provider => ({ name, well, tier, price, mode, desc, commission, si, region });

export const PROVIDERS: Record<string, Provider[]> = {
  stay: [
    p("Angama Mara", "stay", "prime", "ultra", "api", "Clifftop tented suites with sweeping Mara views", "Commission partner"),
    p("Governors' Camp", "stay", "prime", "premium", "api", "Front-row tents on the Mara River", "Commission partner"),
    p("Mahali Mzuri", "stay", "prime", "ultra", "widget", "Sir Richard Branson's tented camp", "Commission partner"),
    p("Sarova Mara Game Camp", "stay", "vetted", "comfort", "api", "Reliable comfort in the heart of the reserve", "Commission partner"),
    p("Fairmont Mara Safari Club", "stay", "vetted", "premium", "widget", "Luxury tents in a river bend", "Commission partner"),
    p("Mara Serena Safari Lodge", "stay", "vetted", "comfort", "api", "Hilltop lodge, panoramic plains", "Commission partner"),
    p("Basecamp Explorer", "stay", "vetted", "value", "affiliate", "Eco-camp with community roots", "Affiliate partner"),
    p("Entim Mara Camp", "stay", "prospective", "comfort", "affiliate", "Riverside camp near crossing points", "Prospective partner"),
  ],
  fly: [
    p("Kenya Airways", "fly", "prime", "comfort", "api", "Direct into Nairobi (NBO)", "Commission partner"),
    p("SafariLink", "fly", "prime", "comfort", "api", "Light-aircraft hops to the Mara airstrips", "Commission partner"),
    p("Qatar Airways", "fly", "vetted", "premium", "widget", "One-stop via Doha, award cabins", "Commission partner"),
    p("AirKenya Express", "fly", "vetted", "comfort", "api", "Scheduled bush flights", "Commission partner"),
    p("Emirates", "fly", "vetted", "premium", "widget", "One-stop via Dubai", "Commission partner"),
    p("Skyward Private Jets", "fly", "prospective", "ultra", "affiliate", "Charter direct to camp", "Prospective partner"),
  ],
  eat: [
    p("Bush Dinner by Angama", "eat", "prime", "premium", "api", "Candlelit dining on the plains", "Commission partner"),
    p("Emakoko Restaurant", "eat", "vetted", "comfort", "api", "Farm-to-table at the park gate", "Commission partner"),
    p("Talisman, Nairobi", "eat", "vetted", "comfort", "affiliate", "A Karen institution before you fly out", "Affiliate partner"),
    p("Carnivore Nairobi", "eat", "vetted", "value", "affiliate", "The famous beast-of-a-feast", "Affiliate partner"),
    p("Private Chef — Mara", "eat", "prospective", "premium", "affiliate", "In-camp tasting menus", "Prospective partner"),
  ],
  move: [
    p("Mara Land Cruiser Safaris", "move", "prime", "comfort", "api", "Private 4×4 with expert guide", "Commission partner"),
    p("Abercrombie & Kent Transfers", "move", "prime", "premium", "widget", "Seamless private transfers", "Commission partner"),
    p("Scenic Air Transfers", "move", "vetted", "premium", "api", "Fly between camps", "Commission partner"),
    p("Nairobi Executive Cars", "move", "vetted", "comfort", "affiliate", "Airport & city transfers", "Affiliate partner"),
    p("Self-Drive Kenya", "move", "prospective", "value", "affiliate", "For the independent traveler", "Prospective partner"),
  ],
  gear: [
    p("Safari Outfitters Co.", "gear", "prime", "comfort", "affiliate", "Boots, layers, dry-bags — delivered", "Affiliate partner"),
    p("Optics & Binoculars Rental", "gear", "vetted", "value", "affiliate", "Pro glass for game viewing", "Affiliate partner"),
    p("TravelWell Gear Edit", "gear", "vetted", "comfort", "api", "Our curated safari packing list", "First-party"),
  ],
  beauty: [
    p("Angama Spa", "beauty", "prime", "premium", "api", "Treatments with a view", "Commission partner"),
    p("Sundowner Wellness", "beauty", "vetted", "comfort", "affiliate", "Massage & recovery in-camp", "Affiliate partner"),
  ],
  activities: [
    p("Mara Hot-Air Balloon", "activities", "prime", "premium", "api", "Sunrise flight + champagne breakfast", "Commission partner"),
    p("Maasai Village Cultural Visit", "activities", "prime", "value", "api", "Meet the community, respectfully", "Commission partner"),
    p("Big Cat Tracking Experience", "activities", "vetted", "premium", "widget", "With a resident researcher", "Commission partner"),
    p("Walking Safari — Olare Motorogi", "activities", "vetted", "comfort", "api", "On foot with armed rangers", "Commission partner"),
    p("Photography Safari Workshop", "activities", "vetted", "premium", "affiliate", "Pro tuition in the field", "Affiliate partner"),
    p("Night Game Drive", "activities", "prospective", "comfort", "affiliate", "Spot the nocturnal Mara", "Prospective partner"),
  ],
  shop: [
    p("Maasai Market Curated", "shop", "vetted", "value", "affiliate", "Authentic crafts, fair trade", "Affiliate partner"),
    p("Utamaduni Craft Centre", "shop", "vetted", "comfort", "affiliate", "Quality keepsakes near Nairobi", "Affiliate partner"),
  ],
  insure: [],
  ship: [],
  nanny: [p("Mara Family Nannies", "nanny", "vetted", "premium", "api", "Vetted, multilingual childcare in-camp", "Commission partner")],
  security: [p("Discreet Protection Kenya", "security", "vetted", "ultra", "api", "Close protection, unseen", "Commission partner")],
};

export interface WellDetail { purpose: string; cats: string[]; use: string; }
export const WELL_DETAIL: Record<string, WellDetail> = {
  fly: { purpose: "Getting there should feel like the trip has already begun. Fly-Well finds the routes, cabins and timings that fit your journey — then hands you a clean booking path.", cats: ["Scheduled flights", "Bush & light aircraft", "Private charter", "Upgrades & lounges"], use: "Most flights book via partner airlines or aggregators; commission varies by carrier." },
  stay: { purpose: "Where you rest shapes how you remember a place. Stay-Well curates lodging that matches your trip's character and your budget — from tented camps to city suites.", cats: ["Lodges & camps", "Boutique hotels", "Resorts & villas", "Heritage stays"], use: "Hotels book via direct API or partner widgets; commission paid by the property." },
  eat: { purpose: "The meals you remember aren't accidents. Eat-Well routes you to the tables that matter and handles the reservations.", cats: ["Fine dining", "Local & street food", "Cooking experiences", "In-villa chefs"], use: "Reservations are often free; experiences and chefs may carry a booking commission." },
  move: { purpose: "Getting around without friction. Move-Well covers transfers, drivers, rail and the small logistics that make a trip flow.", cats: ["Private transfers", "Car & driver", "Rail & coach", "Inter-camp flights"], use: "Transfers book in-platform or via partners; commission varies." },
  gear: { purpose: "The right kit, none of the guesswork. Gear-Well turns your trip into a packing list and sources what you don't have.", cats: ["Apparel & layers", "Luggage & bags", "Optics & tech", "Rentals"], use: "Gear links are affiliate; we may earn a commission on purchases." },
  beauty: { purpose: "Looking and feeling your best, on the road. Beauty-Well lines up spa, grooming and recovery so you arrive and depart well.", cats: ["Spa & massage", "Salon & grooming", "Recovery & IV", "Pre-trip prep"], use: "Treatments book via partners; commission varies by provider." },
  activities: { purpose: "The reason you went. Activities-Well is the heart of the trip — the experiences that turn a destination into a story.", cats: ["Guided experiences", "Wildlife & nature", "Culture & history", "Adventure & water"], use: "Experiences book via API, widget or affiliate; disclosure shown per provider." },
  shop: { purpose: "Taking a piece of it home. Shop-Well points you to authentic, fair makers and the keepsakes worth the suitcase space.", cats: ["Artisan & crafts", "Markets", "Design & home", "Edible souvenirs"], use: "Shop links are affiliate; we may earn a commission." },
  insure: { purpose: "Peace of mind, built in. Insure-Well will compare and arrange travel protection suited to your trip and party.", cats: ["Trip protection", "Medical & evacuation", "Cancellation", "Gear & baggage"], use: "Launching with vetted insurance partners." },
  ship: { purpose: "Send it ahead, travel light. Ship-Well will handle luggage forwarding and getting purchases home.", cats: ["Luggage forwarding", "Purchase shipping", "Customs handling", "Returns"], use: "Launching with vetted logistics partners." },
  nanny: { purpose: "Care for the little ones, so the grown-ups get a moment too. Nanny-Well arranges vetted, multilingual childcare in-destination.", cats: ["In-resort childcare", "Private nannies", "Kids' experiences", "Evening sitting"], use: "Available in Luxury & Ultra-Luxury contexts; commission partner." },
  security: { purpose: "Discreet protection when it matters. Security-Well arranges close protection and risk advisory, unseen and unobtrusive.", cats: ["Close protection", "Risk advisory", "Secure transfers", "Event security"], use: "Available in Luxury & Ultra-Luxury contexts; commission partner." },
};

export interface Guide { id: string; type: string; title: string; lede: string; read: string; updated: string; img: string; si: string; region: string; }
const g = (id: string, type: string, title: string, lede: string, read: string, updated: string, img: string, si: string, region: string): Guide => ({ id, type, title, lede, read, updated, img, si, region });
export const GUIDES: Guide[] = [
  g("migration-timing", "Seasonal", "When to See the Great Migration", "Month by month, where the herds are and where to be standing when they cross.", "6 min", "Jun 2026", "safariGiraffe", "safari", "05A"),
  g("safari-packing", "How-To", "What to Pack for a Safari", "The honest list — layers, optics, and the three things first-timers always forget.", "4 min", "May 2026", "desertDunes", "safari", "05A"),
  g("morocco-top8", "Top List", "Morocco in 8 Unforgettable Stops", "A ranked route through imperial cities, desert camps and the Atlas mountains.", "9 min", "Apr 2026", "marrakech", "heritage", "04A"),
  g("first-safari", "Field Guide", "Your First Safari, Demystified", "Camps vs lodges, private vs shared, malaria, tipping — everything no one tells you.", "8 min", "Jun 2026", "lion", "safari", "05A"),
  g("honeymoon-where", "Field Guide", "Where to Honeymoon, by Vibe", "Barefoot beach, alpine hush, or city romance — matched to who you are as a couple.", "7 min", "May 2026", "santorini", "romance", "11C"),
  g("japan-cherry", "Seasonal", "Chasing Cherry Blossom in Japan", "The forecast, the crowds, and the quiet temples where sakura still feels secret.", "6 min", "Mar 2026", "kyoto", "culture", "08A"),
  g("med-sailing", "How-To", "Sailing the Mediterranean, Stress-Free", "Crewed vs bareboat, the best weeks to go, and how to island-hop without rushing.", "5 min", "Apr 2026", "santorini", "sailing", "02F"),
  g("patagonia-trek", "Field Guide", "Trekking Patagonia: The W vs The O", "Two legendary routes compared — distance, difficulty, huts, and the views that earn it.", "10 min", "Mar 2026", "mountainValley", "adventure", "10S"),
  g("culinary-cities", "Top List", "10 Cities Worth Flying For (to Eat)", "Where the table is the destination — from street stalls to three stars.", "8 min", "May 2026", "restaurant", "culinary", "01F"),
];
export const GUIDE_TYPES = ["Field Guide", "Seasonal", "Top List", "How-To"];

export const MOROCCO_TOP8 = [
  { rank: 1, name: "Marrakech", note: "The pulse — souks, riads, and the Jemaa el-Fnaa at dusk." },
  { rank: 2, name: "The Sahara (Merzouga)", note: "Camel trek into the Erg Chebbi dunes; sleep under the stars." },
  { rank: 3, name: "Fes", note: "The world's largest car-free medina; the tanneries; deep history." },
  { rank: 4, name: "Chefchaouen", note: "The blue city, tucked into the Rif mountains." },
  { rank: 5, name: "Atlas Mountains", note: "Berber villages, Mount Toubkal, and mint tea with a view." },
  { rank: 6, name: "Essaouira", note: "Atlantic wind, gnawa music, and grilled-that-morning seafood." },
  { rank: 7, name: "Aït Benhaddou", note: "The fortified ksar of a hundred films, glowing at golden hour." },
  { rank: 8, name: "Casablanca", note: "Art-deco bones and the vast Hassan II Mosque over the sea." },
];

export interface Activity { id: string; name: string; well: string; line: string; }
const a = (id: string, name: string, well: string, line: string): Activity => ({ id, name, well, line });
const BASE_ACTIVITIES: Record<string, Activity[]> = {
  safari: [a("game-drive", "Dawn game drives", "activities", "Golden-hour with a private guide"), a("balloon", "Hot-air balloon safari", "activities", "Float over the herds at sunrise"), a("tented-camp", "Luxury tented camp", "stay", "Canvas suites, no walls between you and the wild"), a("bush-dinner", "Bush dinner under the stars", "eat", "A candlelit table on the plains"), a("walking-safari", "Guided walking safari", "activities", "Track on foot with an armed ranger"), a("conservancy", "Conservancy & community visit", "activities", "Travel that gives back")],
  romance: [a("private-dinner", "Private sunset dinner", "eat", "Just the two of you, somewhere unforgettable"), a("couples-spa", "Couples spa ritual", "beauty", "Side-by-side, unhurried"), a("honeymoon-suite", "Boutique honeymoon suite", "stay", "A room you won't want to leave"), a("sunset-cruise", "Sunset cruise", "activities", "Champagne on calm water"), a("photo-session", "Keepsake photo session", "activities", "A pro to capture the trip")],
  culinary: [a("chefs-table", "Chef's table tasting menu", "eat", "The best seat in the house"), a("market-tour", "Local market food tour", "activities", "Eat where the locals eat"), a("cooking-class", "Hands-on cooking class", "activities", "Take the flavors home"), a("wine-pairing", "Wine-paired dinner", "eat", "Every course, perfectly matched"), a("street-food", "Street-food crawl", "eat", "The soul of a city, one stall at a time")],
  ocean: [a("snorkel", "Reef snorkeling trip", "activities", "Into the world below"), a("beach-resort", "Beachfront resort", "stay", "Wake up to the water"), a("sail", "Sunset sail", "activities", "Wind in your favor"), a("seafood", "Fresh seafood feast", "eat", "Off the boat, onto the plate")],
  wellness: [a("spa-day", "Signature spa day", "beauty", "Come home to yourself"), a("yoga-retreat", "Sunrise yoga & meditation", "activities", "Begin slow, breathe deep"), a("wellness-resort", "Wellness resort stay", "stay", "Built around your rest"), a("clean-dining", "Nourishing clean dining", "eat", "Food that loves you back")],
  culture: [a("guided-old-town", "Guided old-town walk", "activities", "The soul of a place, on foot"), a("artisan", "Artisan workshop visit", "activities", "Meet the makers"), a("heritage-stay", "Heritage boutique stay", "stay", "Sleep inside the history"), a("local-feast", "Family-table local feast", "eat", "A meal that tells a story")],
  adventure: [a("trek", "Multi-day guided trek", "activities", "The trail ahead"), a("summit", "Summit attempt", "activities", "Earn the view"), a("mountain-lodge", "Mountain lodge stay", "stay", "Boots off, fire on"), a("gear-up", "Expedition gear fitting", "gear", "What you carry matters")],
  family: [a("kid-safari", "Kid-friendly wildlife day", "activities", "Wonder for every age"), a("family-suite", "Family suite or villa", "stay", "Room for everyone, together"), a("easy-eats", "Relaxed family dining", "eat", "Happy kids, happy table"), a("nanny", "Trusted local nanny", "nanny", "An afternoon just for the grown-ups")],
  ultra: [a("private-villa", "Private villa with staff", "stay", "Discreet, effortless, yours"), a("private-jet", "Private jet transfer", "fly", "Skip every line"), a("michelin", "In-villa Michelin chef", "eat", "The restaurant comes to you"), a("security", "Discreet close protection", "security", "Peace of mind, unseen"), a("curator", "Personal experience curator", "activities", "Doors that don't open for others")],
  solo: [a("small-group", "Small-group day tour", "activities", "Company when you want it"), a("safe-stay", "Vetted central stay", "stay", "Safe, social, well-placed"), a("communal-table", "Communal chef's table", "eat", "Make friends over dinner")],
};

// Canonical activities + David's additive drop (folded in at module load).
export const ACTIVITIES: Record<string, Activity[]> = { ...BASE_ACTIVITIES, ...(siExtra.activities as Record<string, Activity[]>) };
