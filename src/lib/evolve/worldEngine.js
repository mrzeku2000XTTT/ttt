import {
  BIOMES,
  BIOME_INDEX,
  BUILD_COST,
  BUILD_STATS,
  BASE_PRICES,
  FACTION_INDEX,
  FACTION_BY_INDEX,
} from "./constants";
import { generateWorld, surveyTile } from "./worldGen";

const KINDS = ["server", "city", "energy", "compute", "storage", "deposit"];

/**
 * WorldEngine — the authoritative simulation state.
 * Every mutation to the world goes through here: nothing else writes tiles,
 * ownership, assets, resources or the simulated market.
 */
export class WorldEngine {
  constructor({ seed = 1, size = "medium", scarcity = "medium" } = {}) {
    const gen = generateWorld({ seed, size, scarcity });
    this.seed = gen.seed;
    this.size = gen.size;
    this.width = gen.width;
    this.height = gen.height;
    this.elevation = gen.elevation;
    this.biome = gen.biome;
    this.yieldMul = gen.yieldMul;

    const n = this.width * this.height;
    this.owner = new Uint8Array(n);
    this.sculpt = new Int8Array(n).fill(-1);

    this.assets = [];
    this.assetById = new Map();
    this.assetSeq = KINDS.reduce((m, k) => ({ ...m, [k]: 0 }), {});

    this.resources = { compute: 420, energy: 380, storage: 300, data: 260, information: 180, materials: 520 };
    this.market = { ...BASE_PRICES };
    this.day = 0;
    this.dayTicks = 0;
  }

  /* ------------------------------------------------------------ geometry */
  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }
  idx(x, y) {
    return y * this.width + x;
  }
  biomeKeyAt(x, y) {
    const i = this.idx(x, y);
    const b = this.sculpt[i] >= 0 ? this.sculpt[i] : this.biome[i];
    return BIOMES[b];
  }
  ownerAt(x, y) {
    return FACTION_BY_INDEX[this.owner[this.idx(x, y)]] || "neutral";
  }
  survey(x, y) {
    return surveyTile(this.biome, this.elevation, this.width, x, y, this.yieldMul);
  }
  assetsAt(x, y) {
    return this.assets.filter((a) => a.x === x && a.y === y);
  }
  tile(x, y) {
    if (!this.inBounds(x, y)) return null;
    const b = this.biomeKeyAt(x, y);
    const s = this.survey(x, y);
    return {
      x,
      y,
      key: b.key,
      label: b.label,
      color: b.color,
      water: !!b.water,
      owner: this.ownerAt(x, y),
      sculpted: this.sculpt[this.idx(x, y)] >= 0,
      wood: s.wood,
      energy: s.energy,
      compute: s.compute,
      buildable: s.buildable && !b.water,
      assets: this.assetsAt(x, y),
    };
  }

  /* ------------------------------------------------------------- mutate */
  claim(x, y, faction) {
    if (!this.inBounds(x, y)) return false;
    this.owner[this.idx(x, y)] = FACTION_INDEX[faction] || 0;
    return true;
  }

  sculptTile(x, y, key) {
    const i = BIOME_INDEX[key];
    if (i === undefined || !this.inBounds(x, y)) return false;
    this.sculpt[this.idx(x, y)] = i;
    return true;
  }

  canAfford(cost) {
    return Object.entries(cost || {}).every(([k, v]) => (this.resources[k] || 0) >= v);
  }

  pay(cost) {
    if (!this.canAfford(cost)) return false;
    Object.entries(cost).forEach(([k, v]) => {
      this.resources[k] = Number(((this.resources[k] || 0) - v).toFixed(2));
    });
    return true;
  }

  credit(cost) {
    Object.entries(cost || {}).forEach(([k, v]) => {
      this.resources[k] = Number(((this.resources[k] || 0) + v).toFixed(2));
    });
  }

  placeAsset(kind, x, y, { ownerId = "", faction = "neutral", organizationId = "" } = {}) {
    if (!KINDS.includes(kind) || !this.inBounds(x, y)) return { ok: false, reason: "Invalid build site" };
    const t = this.tile(x, y);
    if (!t.buildable) return { ok: false, reason: `${t.label} cannot carry structures` };
    const cost = BUILD_COST[kind] || {};
    if (!this.canAfford(cost)) return { ok: false, reason: "Insufficient world resources" };
    this.pay(cost);

    const stats = BUILD_STATS[kind];
    this.assetSeq[kind] += 1;
    const sim_id = `SIM_${kind.toUpperCase()}_${String(this.assetSeq[kind]).padStart(4, "0")}`;
    const asset = {
      id: sim_id,
      sim_id,
      kind,
      x,
      y,
      owner_id: ownerId,
      faction,
      organization_id: organizationId,
      value: stats.value,
      defense: stats.defense,
      damage: 0,
      level: 1,
      output: stats.output,
      built_day: this.day,
    };
    this.assets.push(asset);
    this.assetById.set(sim_id, asset);
    if (faction !== "neutral") this.claim(x, y, faction);
    return { ok: true, asset };
  }

  findAsset(simId) {
    return this.assetById.get(simId) || null;
  }

  damageAsset(simId, amount) {
    const a = this.findAsset(simId);
    if (!a) return null;
    a.damage = Math.min(a.defense + a.value, Number((a.damage + amount).toFixed(2)));
    a.defense = Math.max(0, Number((a.defense - amount * 0.7).toFixed(2)));
    return a;
  }

  fortifyAsset(simId, amount) {
    const a = this.findAsset(simId);
    if (!a) return null;
    a.defense = Number((a.defense + amount).toFixed(2));
    a.level += 1;
    return a;
  }

  destroyAsset(simId, faction) {
    const a = this.findAsset(simId);
    if (!a) return null;
    if (faction) a.faction = faction;
    a.owner_id = "";
    a.damage = a.value;
    a.defense = 0;
    a.output = 0;
    return a;
  }

  /* ---------------------------------------------------------- per tick */
  /** Assets produce, the market drifts, the day advances. */
  produce(rng) {
    let gained = 0;
    this.assets.forEach((a) => {
      if (a.output <= 0) return;
      const out = a.output * (a.kind === "energy" ? 1 : 0.6);
      const bucket = a.kind === "energy" ? "energy" : a.kind === "compute" ? "compute" : a.kind === "storage" ? "storage" : "materials";
      this.resources[bucket] = Number((this.resources[bucket] + out * 0.05).toFixed(2));
      gained += out * 0.05;
    });

    Object.keys(this.market).forEach((k) => {
      const drift = (rng() - 0.5) * 0.06;
      const next = Math.max(0.2, Number((this.market[k] * (1 + drift)).toFixed(3)));
      this.market[k] = next;
    });

    this.dayTicks += 1;
    if (this.dayTicks >= 8) {
      this.dayTicks = 0;
      this.day += 1;
    }
    return gained;
  }

  factionShare() {
    const counts = { blue: 0, green: 0, yellow: 0, red: 0, purple: 0 };
    let claimed = 0;
    for (let i = 0; i < this.owner.length; i += 1) {
      const f = FACTION_BY_INDEX[this.owner[i]];
      if (f && f !== "neutral") {
        counts[f] += 1;
        claimed += 1;
      }
    }
    const total = this.owner.length || 1;
    const share = {};
    Object.keys(counts).forEach((f) => {
      share[f] = total ? counts[f] / total : 0;
    });
    share.claimed = claimed / total;
    return share;
  }

  /* ------------------------------------------------------- persistence */
  serialize() {
    const ownership = FACTION_BY_INDEX.map((_, i) => i).length
      ? Array.from(this.owner).map((v) => String(v)).join("")
      : "";
    const sculpted = Array.from(this.sculpt)
      .map((v) => (v < 0 ? "-" : String(v)))
      .join("");
    return { ownership, sculpted };
  }

  applySerialized({ ownership, sculpted }) {
    if (ownership && ownership.length === this.owner.length) {
      for (let i = 0; i < ownership.length; i += 1) this.owner[i] = Number(ownership[i]) || 0;
    }
    if (sculpted && sculpted.length === this.sculpt.length) {
      for (let i = 0; i < sculpted.length; i += 1) {
        this.sculpt[i] = sculpted[i] === "-" ? -1 : Number(sculpted[i]);
      }
    }
  }

  /** Keeps an incrementing counter valid after a reload. */
  syncAssetSeq() {
    this.assets.forEach((a) => {
      const n = Number(String(a.sim_id).split("_").pop());
      if (Number.isFinite(n) && n > (this.assetSeq[a.kind] || 0)) this.assetSeq[a.kind] = n;
    });
  }
}