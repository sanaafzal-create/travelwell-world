/**
 * TravelWell.World — Curated cinematic image resolver (placeholder Unsplash).
 * Ported from js/images.js. Swap for licensed/real photography at production.
 */
const U = (id: string, w: number, q = 75) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=${q}`;

const IDS: Record<string, string> = {
  safariGiraffe: "1516426122078-c23e76319801",
  lion: "1547970810-dc1eac37d174",
  safariJeep: "1534177616072-ef7dc120449d",
  elephant: "1564760055775-d63b17a55c44",
  tropicalBeach: "1507525428034-b723cf961d3e",
  oceanAerial: "1505228395891-9a51e7e86bf6",
  maldivesResort: "1582719508461-905c673771fd",
  mountainValley: "1469474968028-56623f02e42e",
  desertDunes: "1509316785289-025f5b846b35",
  northernLights: "1531366936337-7c912a4589a7",
  baliRice: "1518548419970-58e3b4079ab2",
  paris: "1502602898657-3e91760cbb34",
  venice: "1514890547357-a9ee288728e0",
  marrakech: "1597212618440-806262de4f6b",
  dubai: "1512453979798-5ea266f8880c",
  kyoto: "1545569341-9eb8b30979d9",
  santorini: "1533105079780-92b9be482077",
  restaurant: "1414235077428-338989a2e8c0",
  spaWellness: "1540555700478-4be289fbecef",
  luxuryPool: "1571896349842-33c89424de2d",
};

/**
 * INSTANT placeholder per interest — the token that paints before the matched
 * photo arrives (see SI_QUERY below). Nearest-subject token from the verified
 * set above, never a new unverified photo id: a wrong-but-plausible flash for
 * half a second beats a broken image forever. All 35 board ids are present so
 * nothing silently lands on the generic mountain (14 did, and with 17 sharing
 * it the board read as one trip sold thirty-five ways — David's note ⑥ wants
 * every interest impressive on its own).
 */
const SI_IMG: Record<string, string> = {
  ultra: "luxuryPool", tropical: "tropicalBeach", romance: "paris", safari: "safariGiraffe",
  expedition: "mountainValley", adventure: "desertDunes", ski: "northernLights", golf: "baliRice",
  rail: "mountainValley", barge: "venice", privatejet: "dubai", caravan: "desertDunes",
  overland: "safariJeep", motoring: "mountainValley",
  liveaboard: "oceanAerial", river: "venice", diveglobal: "maldivesResort", ocean: "oceanAerial",
  sailing: "oceanAerial", yacht: "maldivesResort",
  wellness: "spaWellness", wildlife: "elephant", glamping: "desertDunes",
  family: "baliRice", group: "tropicalBeach", hiking: "mountainValley", senior: "santorini",
  culinary: "restaurant", wine: "baliRice", culture: "kyoto", deepdive: "marrakech", pilgrimage: "kyoto",
  entertainment: "dubai", sports: "mountainValley", spectator: "dubai",
  // Off the board (retired) — kept so a legacy link still paints something sane.
  olympic: "dubai", nightlife: "dubai", prosports: "paris", compsports: "oceanAerial",
};

/**
 * The MATCHED photo per interest — a curated Unsplash search query, resolved at
 * runtime through the `unsplash` Edge Function (key server-side; results cached
 * in public.unsplash_cache, so each query costs one API call EVER, then every
 * visitor reads the cache). This is how the board gets 35 distinct,
 * subject-true images without hand-picking photo ids nobody here can verify —
 * a query that drifts still returns *a* photo; a dead id returns a broken tile.
 *
 * Precedence in useSiImage: David's dossier hero (`data.hero.url`, then
 * `data.hero.query`) ALWAYS wins over this map — these are the defaults until
 * he names each hero, not a rival channel. Raw interest names make poor
 * queries ("Winter/Ski", "Golf Globally"), which is why this map exists.
 */
export const SI_QUERY: Record<string, string> = {
  ultra: "luxury resort infinity pool sunset",
  tropical: "tropical island beach turquoise palm trees",
  romance: "honeymoon couple sunset beach romantic",
  safari: "african safari savanna wildlife giraffe",
  expedition: "polar expedition ship iceberg antarctica",
  ski: "skiing alps powder snow slope",
  golf: "golf course green fairway morning",
  rail: "scenic mountain railway train viaduct",
  barge: "canal boat waterway france",
  privatejet: "private jet tarmac aviation luxury",
  caravan: "camel caravan sahara desert dunes",
  overland: "overland expedition 4x4 desert track",
  motoring: "classic car scenic coastal road",
  adventure: "adventure paragliding mountains",
  hiking: "hikers mountain ridge trail trekking",
  liveaboard: "dive boat liveaboard tropical sea",
  river: "river cruise danube europe",
  diveglobal: "scuba diving underwater coral reef",
  ocean: "watersports turquoise sea snorkeling",
  sailing: "sailboat sailing regatta open sea",
  yacht: "luxury yacht mediterranean harbor",
  wellness: "spa wellness retreat serene",
  wildlife: "wildlife nature photography animals",
  glamping: "glamping tent luxury camping stars",
  family: "family vacation beach children",
  group: "group of friends traveling together",
  senior: "senior couple traveling europe",
  culture: "ancient temple heritage architecture",
  deepdive: "traditional artisan local market culture",
  pilgrimage: "pilgrimage sacred temple candles",
  entertainment: "live concert stage lights crowd",
  culinary: "fine dining chef plating cuisine",
  sports: "trail running athlete mountains",
  spectator: "stadium crowd sports match floodlights",
  wine: "vineyard rows wine tasting golden hour",
};

const REGION_IMG: Record<string, string> = {
  "01F": "paris", "02F": "santorini", "03F": "northernLights", "04A": "dubai",
  "05A": "safariGiraffe", "06A": "elephant", "07A": "baliRice", "08A": "kyoto",
  "09P": "tropicalBeach", "10S": "mountainValley", "11C": "oceanAerial",
  "12A": "desertDunes", "13A": "northernLights",
};

/**
 * The neutral placeholder for any token we don't recognise. Never return "" —
 * an empty src is a visibly broken image, and the token is only ever the INSTANT
 * placeholder anyway: destination heroes and cards fetch the real, matched photo
 * from Unsplash by "{name}, {country}" and swap it in (see useUnsplashImage).
 * So an ingested dossier can carry any sensible token — or a token we've never
 * seen — and the page still looks right.
 */
export const FALLBACK_IMG = "mountainValley";

export const img = (key: string, w = 1400, q?: number) =>
  U(IDS[key] ?? IDS[FALLBACK_IMG], w, q);
/** The tokens a conformed dossier can use as its placeholder (see docs/ingest-contract.md). */
export const IMAGE_TOKENS = Object.keys(IDS);
export const siImg = (siId: string, w = 900) => img(SI_IMG[siId] || FALLBACK_IMG, w);
export const regionImg = (code: string, w = 900) => img(REGION_IMG[code] || FALLBACK_IMG, w);

/**
 * Share-card crop (og:image / twitter:image) — 1200×630, the platforms'
 * canonical aspect. Same token system as the page images, so a page's card
 * upgrades the day its token does (a supplier asset lands as a token here and
 * every tag pointing at it follows — no further code change). Never returns
 * empty: an unknown or absent token falls back to the brand default, because
 * a share tag that can be empty is a page that shares with no picture.
 */
export const SHARE_IMG_W = 1200;
export const SHARE_IMG_H = 630;
export const shareImg = (key?: string) =>
  `https://images.unsplash.com/photo-${IDS[key ?? FALLBACK_IMG] ?? IDS[FALLBACK_IMG]}?auto=format&fit=crop&w=${SHARE_IMG_W}&h=${SHARE_IMG_H}&q=70`;
export const siShareImg = (siId: string) => shareImg(SI_IMG[siId] || FALLBACK_IMG);
export const regionShareImg = (code: string) => shareImg(REGION_IMG[code] || FALLBACK_IMG);
