/**
 * CountryMap — REAL EARTH geographic lookup layer.
 *
 * EVOLVE uses the real Earth map. Countries are real geographic boundaries
 * defined by latitude/longitude, NOT rectangular grid zones.
 *
 * Architecture:
 *   REAL EARTH GEOGRAPHY (lat/lng)
 *     ↓
 *   COUNTRY / REGION (ISO code, lat/lng bounds)
 *     ↓
 *   EVOLVE GAME CELLS (grid overlay)
 *     ↓
 *   AI + HUMAN ACTORS
 *
 * The simulation grid maps to Earth via equirectangular projection:
 *   lng = (x / width) * 360 - 180
 *   lat = 90 - (y / height) * 180
 *
 * A country is NOT a rectangular simulation zone. It is a real geographic
 * region. Gameplay cells are overlays on top of real geography.
 *
 * The bounding boxes here are simplified rectangular approximations of real
 * country extents. They can be replaced with published GeoJSON boundary
 * data without changing any function signatures — every lookup goes through
 * latLngToCountry(), so swapping the point-in-polygon implementation is the
 * only change needed.
 */

/* ------------------------------------------------------------------ projection */
export function gridToLatLng(x, y, width, height) {
  const lng = (x / width) * 360 - 180;
  const lat = 90 - (y / height) * 180;
  return { lat, lng };
}

export function latLngToGrid(lat, lng, width, height) {
  const x = Math.floor(((lng + 180) / 360) * width);
  const y = Math.floor(((90 - lat) / 180) * height);
  return { x, y };
}

/* ------------------------------------------------------- real country data
 * ISO 3166-1 alpha-2 codes with real lat/lng bounding boxes.
 * Source: approximate continental extents. These are rectangular
 * approximations — the lookup layer is the only place that knows about
 * geography, so real GeoJSON polygons can replace these without touching
 * any other file.
 */
export const COUNTRIES = [
  { iso: "US", name: "United States", lat0: 24, lat1: 49, lng0: -125, lng1: -66 },
  { iso: "CA", name: "Canada", lat0: 49, lat1: 70, lng0: -141, lng1: -52 },
  { iso: "MX", name: "Mexico", lat0: 14, lat1: 33, lng0: -118, lng1: -86 },
  { iso: "BR", name: "Brazil", lat0: -34, lat1: 5, lng0: -74, lng1: -34 },
  { iso: "AR", name: "Argentina", lat0: -55, lat1: -22, lng0: -74, lng1: -53 },
  { iso: "CO", name: "Colombia", lat0: -4, lat1: 12, lng0: -79, lng1: -67 },
  { iso: "CL", name: "Chile", lat0: -56, lat1: -17, lng0: -76, lng1: -66 },
  { iso: "PE", name: "Peru", lat0: -18, lat1: 0, lng0: -82, lng1: -69 },
  { iso: "GB", name: "United Kingdom", lat0: 50, lat1: 59, lng0: -8, lng1: 2 },
  { iso: "FR", name: "France", lat0: 42, lat1: 51, lng0: -5, lng1: 8 },
  { iso: "DE", name: "Germany", lat0: 47, lat1: 55, lng0: 6, lng1: 15 },
  { iso: "ES", name: "Spain", lat0: 36, lat1: 44, lng0: -9, lng1: 3 },
  { iso: "IT", name: "Italy", lat0: 36, lat1: 47, lng0: 7, lng1: 18 },
  { iso: "PT", name: "Portugal", lat0: 37, lat1: 42, lng0: -10, lng1: -6 },
  { iso: "NL", name: "Netherlands", lat0: 51, lat1: 54, lng0: 3, lng1: 7 },
  { iso: "SE", name: "Sweden", lat0: 55, lat1: 69, lng0: 11, lng1: 24 },
  { iso: "NO", name: "Norway", lat0: 58, lat1: 71, lng0: 5, lng1: 31 },
  { iso: "FI", name: "Finland", lat0: 60, lat1: 70, lng0: 21, lng1: 32 },
  { iso: "PL", name: "Poland", lat0: 49, lat1: 55, lng0: 14, lng1: 24 },
  { iso: "UA", name: "Ukraine", lat0: 45, lat1: 52, lng0: 22, lng1: 40 },
  { iso: "RU", name: "Russia", lat0: 41, lat1: 78, lng0: 19, lng1: 180 },
  { iso: "TR", name: "Turkey", lat0: 36, lat1: 42, lng0: 26, lng1: 45 },
  { iso: "EG", name: "Egypt", lat0: 22, lat1: 32, lng0: 25, lng1: 35 },
  { iso: "ZA", name: "South Africa", lat0: -35, lat1: -22, lng0: 17, lng1: 33 },
  { iso: "NG", name: "Nigeria", lat0: 4, lat1: 14, lng0: 3, lng1: 15 },
  { iso: "KE", name: "Kenya", lat0: -5, lat1: 5, lng0: 34, lng1: 42 },
  { iso: "ET", name: "Ethiopia", lat0: 3, lat1: 15, lng0: 33, lng1: 48 },
  { iso: "SA", name: "Saudi Arabia", lat0: 16, lat1: 32, lng0: 35, lng1: 55 },
  { iso: "AE", name: "United Arab Emirates", lat0: 22, lat1: 26, lng0: 51, lng1: 56 },
  { iso: "IR", name: "Iran", lat0: 25, lat1: 40, lng0: 44, lng1: 63 },
  { iso: "IQ", name: "Iraq", lat0: 29, lat1: 37, lng0: 39, lng1: 49 },
  { iso: "IN", name: "India", lat0: 8, lat1: 36, lng0: 68, lng1: 97 },
  { iso: "PK", name: "Pakistan", lat0: 24, lat1: 37, lng0: 61, lng1: 78 },
  { iso: "CN", name: "China", lat0: 18, lat1: 50, lng0: 74, lng1: 135 },
  { iso: "JP", name: "Japan", lat0: 31, lat1: 46, lng0: 130, lng1: 146 },
  { iso: "KR", name: "South Korea", lat0: 33, lat1: 39, lng0: 125, lng1: 130 },
  { iso: "ID", name: "Indonesia", lat0: -11, lat1: 6, lng0: 95, lng1: 141 },
  { iso: "TH", name: "Thailand", lat0: 5, lat1: 20, lng0: 97, lng1: 106 },
  { iso: "VN", name: "Vietnam", lat0: 8, lat1: 24, lng0: 102, lng1: 110 },
  { iso: "PH", name: "Philippines", lat0: 5, lat1: 19, lng0: 117, lng1: 127 },
  { iso: "MY", name: "Malaysia", lat0: 1, lat1: 7, lng0: 100, lng1: 119 },
  { iso: "AU", name: "Australia", lat0: -44, lat1: -10, lng0: 113, lng1: 154 },
  { iso: "NZ", name: "New Zealand", lat0: -47, lat1: -34, lng0: 166, lng1: 179 },
];

const COUNTRY_BY_NAME = COUNTRIES.reduce((m, c) => ({ ...m, [c.name]: c }), {});

/* -------------------------------------------------------- point → country
 * Returns the country whose lat/lng bounds contain the point, or null.
 * This is the single geographic lookup — everything else delegates to it.
 */
export function latLngToCountry(lat, lng) {
  for (const c of COUNTRIES) {
    if (lat >= c.lat0 && lat <= c.lat1 && lng >= c.lng0 && lng <= c.lng1) return c;
  }
  return null;
}

/* Grid cell → country. Converts grid coords to lat/lng then looks up. */
export function countryAt(world, x, y) {
  const { lat, lng } = gridToLatLng(x, y, world.width, world.height);
  return latLngToCountry(lat, lng);
}

/* Country → grid bounds on the current world. */
export function countryGridBounds(world, country) {
  const x0 = Math.max(0, Math.floor(((country.lng0 + 180) / 360) * world.width));
  const x1 = Math.min(world.width - 1, Math.floor(((country.lng1 + 180) / 360) * world.width));
  const y0 = Math.max(0, Math.floor(((90 - country.lat1) / 180) * world.height));
  const y1 = Math.min(world.height - 1, Math.floor(((90 - country.lat0) / 180) * world.height));
  return { x0, y0, x1, y1 };
}

/* ----------------------------------------------- country → actor stats
 * Aggregates actors geographically located within the country.
 * Existing players/AI never prevent choosing a country — this is read-only.
 */
export function countryStats(world, agents, players, assets, country) {
  const { x0, y0, x1, y1 } = countryGridBounds(world, country);
  const inBounds = (p) =>
    p && p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1;
  const ai = agents.filter((a) => a.status !== "archived" && inBounds(a.position));
  const humans = players.filter((p) => inBounds(p.position));
  const cellAssets = assets.filter((a) => inBounds({ x: a.x, y: a.y }));
  const independent = [...ai, ...humans].filter((a) => !a.organization_id).length;
  const orgIds = new Set([...ai, ...humans].map((a) => a.organization_id).filter(Boolean));
  const openJobs = Math.min(99, Math.round((ai.length + cellAssets.length) * 0.3));
  const computePrice = world.market.compute || 0;
  const energyPrice = world.market.energy || 0;
  const activity = ai.length + humans.length + cellAssets.length;
  const level = activity > 40 ? "HIGH" : activity > 15 ? "MEDIUM" : "LOW";
  return {
    iso: country.iso,
    name: country.name,
    aiAgents: ai.length,
    humans: humans.length,
    independent,
    organizations: orgIds.size,
    openJobs,
    computePrice,
    energyPrice,
    economicActivity: level,
  };
}

/* ----------------------------------------- country → spawn cell lookup */
export function randomCellInCountry(world, rng, country) {
  const { x0, y0, x1, y1 } = countryGridBounds(world, country);
  for (let i = 0; i < 300; i += 1) {
    const x = x0 + Math.floor(rng() * (x1 - x0 + 1));
    const y = y0 + Math.floor(rng() * (y1 - y0 + 1));
    if (world.isBuildable(x, y)) return { x, y };
  }
  return { x: Math.floor((x0 + x1) / 2), y: Math.floor((y0 + y1) / 2) };
}

/* --------------------------------------------------- cell → stats
 * Cell inspector data. Now includes the real country the cell falls in.
 */
export function cellStats(world, agents, players, assets, x, y) {
  const near = (p, r = 6) => p && Math.abs(p.x - x) <= r && Math.abs(p.y - y) <= r;
  const ai = agents.filter((a) => a.status !== "archived" && near(a.position));
  const humans = players.filter((p) => near(p.position));
  const cellAssets = assets.filter((a) => near({ x: a.x, y: a.y }));
  const tile = world.tile(x, y);
  const orgs = new Set([...ai, ...humans].map((a) => a.organization_id).filter(Boolean));
  const owner = world.ownerOrg(x, y);
  const country = countryAt(world, x, y);
  return {
    x,
    y,
    label: `CELL ${hex(x)}${hex(y)}`,
    country: country ? country.name : "International Waters",
    countryIso: country ? country.iso : null,
    biome: tile?.label || "Unknown",
    buildable: tile?.buildable || false,
    independentAI: ai.filter((a) => !a.organization_id).length,
    humans: humans.length,
    organizations: orgs.size,
    openJobs: Math.min(20, Math.round(ai.length * 0.5 + cellAssets.length * 0.3)),
    energy: tile ? levelWord(tile.energy) : "NONE",
    compute: tile ? levelWord(tile.compute) : "NONE",
    economicActivity: ai.length + humans.length > 8 ? "HIGH" : ai.length + humans.length > 3 ? "MEDIUM" : "LOW",
    control: owner ? "CLAIMED" : "UNCLAIMED",
  };
}

export function listCountries() {
  return COUNTRIES;
}

export function countryByName(name) {
  return COUNTRY_BY_NAME[name] || null;
}

const hex = (n) => {
  const s = n.toString(16).toUpperCase();
  return s.length < 2 ? `0${s}` : s;
};

const levelWord = (n) => (n >= 3 ? "ABUNDANT" : n === 2 ? "MODERATE" : n === 1 ? "LOW" : "NONE");