/**
 * EVOLVE — shared vocabulary for the whole application.
 * Nothing here holds state; it is the contract every service and component reads.
 */

export const EVOLVE_ROUTE = "/Evolve";

/* ---------------------------------------------------------------- palette */
/* Near-black navy base, cyan interactive accent, semantic colours per domain. */
export const C = {
  bg: "#05080f",
  bgDeep: "#03060b",
  panel: "rgba(9,14,24,0.86)",
  panelSolid: "#090e18",
  line: "rgba(120,160,200,0.16)",
  lineStrong: "rgba(120,160,200,0.30)",
  text: "#eef3f9",
  textDim: "#7d90a8",
  textFaint: "#54657c",
  cyan: "#22d3ee",
  green: "#34d399",
  yellow: "#fbbf24",
  red: "#f87171",
  purple: "#a78bfa",
  blue: "#60a5fa",
};

/* -------------------------------------------------------------- factions
 * Factions are NOT assigned at genesis. They are an observer classification
 * for mature persistent organizations. Organizations get dynamically generated
 * colors — there are no predefined BLUE/GREEN/RED factions.
 */
export const FACTIONS = [
  { id: "blue", label: "BLUE", color: "#3b82f6", css: "#3b82f6" },
  { id: "green", label: "GREEN", color: "#22c55e", css: "#22c55e" },
  { id: "yellow", label: "YELLOW", color: "#eab308", css: "#eab308" },
  { id: "red", label: "RED", color: "#ef4444", css: "#ef4444" },
  { id: "purple", label: "PURPLE", color: "#a855f7", css: "#a855f7" },
];
/* Kept for backward compatibility with components that still reference factions. */
export const FACTION_INDEX = { neutral: 0, blue: 1, green: 2, yellow: 3, red: 4, purple: 5 };
export const FACTION_BY_INDEX = ["neutral", "blue", "green", "yellow", "red", "purple"];
export const factionColor = (id) =>
  (FACTIONS.find((f) => f.id === id) || { color: C.textFaint }).color;

/**
 * Generates a deterministic color for an organization from its id.
 * No two orgs share a color unless their ids hash to the same hue.
 */
export const orgColor = (orgId) => {
  if (!orgId) return "#94a3b8";
  let hash = 0;
  for (let i = 0; i < orgId.length; i++) hash = (hash * 31 + orgId.charCodeAt(i)) | 0;
  const h = Math.abs(hash) % 360;
  const s = 55 + (Math.abs(hash >> 8) % 20);
  const l = 50 + (Math.abs(hash >> 16) % 15);
  return `hsl(${h}, ${s}%, ${l}%)`;
};

/* ---------------------------------------------------------------- biomes */
/* idx must stay stable — the persisted world stores biome as a byte. */
export const BIOMES = [
  { key: "DEEP", label: "Deep Ocean", color: "#050f1e", wood: 0, energy: 0, compute: 0, build: false, water: true },
  { key: "OCEAN", label: "Ocean", color: "#08182b", wood: 0, energy: 1, compute: 0, build: false, water: true },
  { key: "COAST", label: "Coastline", color: "#0f2b45", wood: 1, energy: 2, compute: 1, build: true, water: false },
  { key: "PLAINS", label: "Plains", color: "#2c4a2f", wood: 2, energy: 1, compute: 2, build: true, water: false },
  { key: "FOREST", label: "Forest", color: "#1b3a24", wood: 3, energy: 1, compute: 1, build: true, water: false },
  { key: "DESERT", label: "Desert", color: "#4a4023", wood: 0, energy: 3, compute: 1, build: true, water: false },
  { key: "MOUNTAIN", label: "Mountains", color: "#3a3f47", wood: 0, energy: 2, compute: 3, build: true, water: false },
  { key: "SNOW", label: "Snow", color: "#8fa3b8", wood: 1, energy: 1, compute: 2, build: true, water: false },
  { key: "VOLCANIC", label: "Volcanic", color: "#4a2020", wood: 0, energy: 3, compute: 2, build: true, water: false },
  { key: "RIVER", label: "River", color: "#12405e", wood: 1, energy: 2, compute: 1, build: true, water: true },
  { key: "TUNDRA", label: "Tundra", color: "#2b3a44", wood: 1, energy: 1, compute: 1, build: true, water: false },
];
export const BIOME_INDEX = BIOMES.reduce((m, b, i) => ({ ...m, [b.key]: i }), {});
export const biomeAt = (i) => BIOMES[i] || BIOMES[0];
export const LEVEL_WORD = ["NONE", "LOW", "MEDIUM", "HIGH"];

/* ------------------------------------------------------------- resources */
export const RESOURCES = [
  { id: "compute", label: "Compute", color: C.blue },
  { id: "energy", label: "Energy", color: C.yellow },
  { id: "storage", label: "Storage", color: "#64748b" },
  { id: "data", label: "Data", color: "#38bdf8" },
  { id: "information", label: "Information", color: C.purple },
  { id: "materials", label: "Materials", color: C.green },
];
export const RESOURCE_IDS = RESOURCES.map((r) => r.id);
export const BASE_PRICES = { compute: 4.2, energy: 1.8, storage: 0.9, data: 2.4, information: 6.1, materials: 1.2 };

/* ------------------------------------------------------------- job types */
export const JOB_TYPES = [
  "RESEARCH",
  "SUMMARIZATION",
  "DATA_EXTRACTION",
  "CLASSIFICATION",
  "SANDBOXED_CODING",
  "DOCUMENT_GENERATION",
  "VERIFICATION",
];
export const JOB_FLOW = ["OPEN", "CLAIMED", "RUNNING", "SUBMITTED", "VERIFYING", "VERIFIED", "PAYMENT_PENDING", "PAID"];
export const VERIFICATION_METHODS = ["SCHEMA", "TESTS", "MULTI_MODEL", "HUMAN"];

/* --------------------------------------------------------------- genome */
export const TRAITS = [
  { id: "risk", label: "RISK" },
  { id: "cooperation", label: "COOPERATION" },
  { id: "exploration", label: "EXPLORATION" },
  { id: "specialization", label: "SPECIALIZATION" },
  { id: "saving", label: "SAVING" },
  { id: "negotiation", label: "NEGOTIATION" },
  { id: "investment", label: "INVESTMENT" },
  { id: "information", label: "INFORMATION" },
  { id: "adaptability", label: "ADAPTABILITY" },
  { id: "time_preference", label: "TIME PREFERENCE" },
];

/* ------------------------------------------------------- agent decisions */
export const ACTIONS = [
  "IDLE", "WORK", "CLAIM_JOB", "SUBMIT_JOB", "BUY", "SELL", "TRADE", "MOVE", "RESEARCH",
  "RECON", "COOPERATE", "JOIN_ORG", "LEAVE_ORG", "CREATE_ORG", "REPRODUCE",
  "ATTACK_SIM_ASSET", "DEFEND_SIM_ASSET", "FORTIFY_SIM_ASSET",
];

/* -------------------------------------------------------- world toolbar */
export const TOOLS = [
  { id: "OBSERVE", label: "Observe", group: "inspect", hint: "Inspect anything without changing the world" },
  { id: "TERRAIN", label: "Terrain", group: "sculpt", hint: "Reshape the land itself" },
  { id: "WATER", label: "Water", group: "sculpt", hint: "Paint water and coastline" },
  { id: "FOREST", label: "Forest", group: "sculpt", hint: "Grow forest cover" },
  { id: "MOUNTAIN", label: "Mountain", group: "sculpt", hint: "Raise mountains" },
  { id: "RESOURCE", label: "Resource", group: "build", hint: "Survey a resource deposit" },
  { id: "COMPUTE", label: "Compute", group: "build", hint: "Build simulated compute" },
  { id: "ENERGY", label: "Energy", group: "build", hint: "Build simulated energy" },
  { id: "SERVER", label: "Server", group: "build", hint: "Build a simulated server" },
  { id: "CITY", label: "City", group: "build", hint: "Found a population centre" },
  { id: "JOB", label: "Job Board", group: "market", hint: "Open the job market" },
  { id: "FACTION", label: "Faction", group: "territory", hint: "Claim territory for a faction" },
  { id: "ATTACK", label: "Attack", group: "conflict", hint: "Target a simulated world asset" },
  { id: "DEFEND", label: "Defend", group: "conflict", hint: "Fortify your own simulated asset" },
  { id: "TRADE", label: "Trade", group: "market", hint: "Trade resources on a simulated asset" },
];

/* -------------------------------------------------------------- events */
export const EVENT_COLOR = {
  ECONOMY: C.yellow,
  JOB: C.cyan,
  EVOLUTION: C.purple,
  CONFLICT: C.red,
  ORG: C.blue,
  WORLD: C.textDim,
  PAYMENT: C.green,
};

/* --------------------------------------------------------- world sizes */
export const WORLD_SIZES = {
  small: { width: 72, height: 48 },
  medium: { width: 104, height: 68 },
  large: { width: 144, height: 92 },
};

export const SCARCITY_YIELD = { low: 1.45, medium: 1.0, high: 0.62 };

/* Building costs, paid from the world resource pool. */
export const BUILD_COST = {
  server: { materials: 6, energy: 4 },
  city: { materials: 14, energy: 8, information: 3 },
  energy: { materials: 5 },
  compute: { materials: 4, energy: 3 },
  storage: { materials: 4 },
  deposit: {},
};
export const BUILD_STATS = {
  server: { value: 22, defense: 34, output: 3 },
  city: { value: 48, defense: 60, output: 6 },
  energy: { value: 16, defense: 18, output: 5 },
  compute: { value: 18, defense: 22, output: 4 },
  storage: { value: 14, defense: 20, output: 2 },
  deposit: { value: 12, defense: 6, output: 2 },
};

export const fmt = (n, d = 2) =>
  Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
export const fmtInt = (n) => Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });