/**
 * CountryMap — divides the simulation grid into named country regions.
 * The world is a procedural grid; countries are rectangular regions on it.
 * Each country has stats derived from the agents/players/assets within its bounds.
 *
 * Countries are NOT factions. They are geographic spawn regions.
 * Existing players never prevent choosing a country — the world is shared.
 */

export const COUNTRIES = [
  { name: "North America", x0: 4, y0: 16, x1: 30, y1: 42 },
  { name: "South America", x0: 14, y0: 44, x1: 32, y1: 64 },
  { name: "Northern Europe", x0: 34, y0: 4, x1: 52, y1: 16 },
  { name: "Southern Europe", x0: 36, y0: 16, x1: 54, y1: 30 },
  { name: "North Africa", x0: 38, y0: 30, x1: 56, y1: 44 },
  { name: "Sub-Saharan Africa", x0: 40, y0: 44, x1: 58, y1: 62 },
  { name: "Middle East", x0: 54, y0: 20, x1: 68, y1: 36 },
  { name: "Central Asia", x0: 56, y0: 8, x1: 76, y1: 24 },
  { name: "South Asia", x0: 64, y0: 26, x1: 80, y1: 42 },
  { name: "East Asia", x0: 78, y0: 10, x1: 100, y1: 34 },
  { name: "Southeast Asia", x0: 72, y0: 36, x1: 92, y1: 52 },
  { name: "Oceania", x0: 82, y0: 52, x1: 102, y1: 66 },
];

export function countryAt(world, x, y) {
  for (const c of COUNTRIES) {
    if (x >= c.x0 && x <= c.x1 && y >= c.y0 && y <= c.y1) return c;
  }
  return null;
}

export function countryStats(world, agents, players, assets, country) {
  const inBounds = (p) =>
    p && p.x >= country.x0 && p.x <= country.x1 && p.y >= country.y0 && p.y <= country.y1;
  const ai = agents.filter((a) => a.status !== "archived" && inBounds(a.position));
  const humans = players.filter((p) => inBounds(p.position));
  const independent = [...ai, ...humans].filter((a) => !a.organization_id).length;
  const orgs = new Set([...ai, ...humans].map((a) => a.organization_id).filter(Boolean));
  const openJobs = assets.filter((a) => inBounds({ x: a.x, y: a.y }));
  const computePrice = world.market.compute || 0;
  const energyPrice = world.market.energy || 0;
  const activity = ai.length + humans.length + openJobs.length;
  const level = activity > 40 ? "HIGH" : activity > 15 ? "MEDIUM" : "LOW";
  return {
    name: country.name,
    aiAgents: ai.length,
    humans: humans.length,
    independent,
    organizations: orgs.size,
    openJobs: Math.min(99, Math.round(activity * 0.3)),
    computePrice,
    energyPrice,
    economicActivity: level,
  };
}

export function randomCellInCountry(world, rng, country) {
  for (let i = 0; i < 200; i += 1) {
    const x = country.x0 + Math.floor(rng() * (country.x1 - country.x0 + 1));
    const y = country.y0 + Math.floor(rng() * (country.y1 - country.y0 + 1));
    if (world.isBuildable(x, y)) return { x, y };
  }
  return {
    x: Math.floor((country.x0 + country.x1) / 2),
    y: Math.floor((country.y0 + country.y1) / 2),
  };
}

export function cellStats(world, agents, players, assets, x, y) {
  const near = (p, r = 6) =>
    p && Math.abs(p.x - x) <= r && Math.abs(p.y - y) <= r;
  const ai = agents.filter((a) => a.status !== "archived" && near(a.position));
  const humans = players.filter((p) => near(p.position));
  const cellAssets = assets.filter((a) => near({ x: a.x, y: a.y }));
  const tile = world.tile(x, y);
  const orgs = new Set([...ai, ...humans].map((a) => a.organization_id).filter(Boolean));
  const owner = world.ownerOrg(x, y);
  return {
    x,
    y,
    label: `CELL ${hex(x)}${hex(y)}`,
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

const hex = (n) => {
  const s = n.toString(16).toUpperCase();
  return s.length < 2 ? `0${s}` : s;
};

const levelWord = (n) => (n >= 3 ? "ABUNDANT" : n === 2 ? "MODERATE" : n === 1 ? "LOW" : "NONE");