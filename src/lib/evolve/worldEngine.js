import {
  BIOMES,
  BIOME_INDEX,
  BUILD_COST,
  BUILD_STATS,
  BASE_PRICES,
  orgColor,
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
    this.owner = new Uint8Array(n); // 0 = unowned, 1+ = org slot
    this.orgSlots = [null]; // index 0 is unused; orgSlots[slot] = orgId
    this.sculpt = new Int8Array(n).fill(-1);

    this.assets = [];
    this.assetById = new Map();
    this.assetsByTile = new Map();
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
  /** Returns the org_id that owns a tile, or null if unclaimed. */
  ownerOrg(x, y) {
    const slot = this.owner[this.idx(x, y)];
    return slot > 0 ? this.orgSlots[slot] || null : null;
  }
  /** Returns the color for the org owning a tile (for rendering). */
  ownerColor(x, y) {
    const orgId = this.ownerOrg(x, y);
    return orgId ? orgColor(orgId) : null;
  }
  survey(x, y) {
    return surveyTile(this.biome, this.elevation, this.width, x, y, this.yieldMul);
  }
  assetsAt(x, y) {
    return this.assetsByTile.get(this.idx(x, y)) || [];
  }
  /** Cheap buildability check that never walks the asset list. */
  isBuildable(x, y) {
    if (!this.inBounds(x, y)) return false;
    const i = this.idx(x, y);
    const b = BIOMES[this.sculpt[i] >= 0 ? this.sculpt[i] : this.biome[i]];
    return !!b.build && !b.water;
  }
  tile(x, y) {
    if (!this.inBounds(x, y)) return null;
    const b = this.biomeKeyAt(x, y);
    const s = this.survey(x, y);
    const orgId = this.ownerOrg(x, y);
    return {
      x,
      y,
      key: b.key,
      label: b.label,
      color: b.color,
      water: !!b.water,
      owner: orgId || "neutral",
      ownerOrg: orgId,
      ownerColor: orgId ? orgColor(orgId) : null,
      sculpted: this.sculpt[this.idx(x, y)] >= 0,
      wood: s.wood,
      energy: s.energy,
      compute: s.compute,
      buildable: s.buildable && !b.water,
      assets: this.assetsAt(x, y),
    };
  }

  /* ------------------------------------------------------------- mutate */
  /** Claims a tile for an organization slot (1+). Slot 0 means unclaim. */
  claim(x, y, orgSlot) {
    if (!this.inBounds(x, y)) return false;
    this.owner[this.idx(x, y)] = orgSlot || 0;
    return true;
  }

  /** Registers an org and returns its territory slot. */
  registerOrg(orgId) {
    const slot = this.orgSlots.length;
    this.orgSlots.push(orgId);
    return slot;
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

  placeAsset(kind, x, y, { ownerId = "", orgSlot = 0, organizationId = "", landOverride = false } = {}) {
    if (!KINDS.includes(kind) || !this.inBounds(x, y)) return { ok: false, reason: "Invalid build site" };
    const t = this.tile(x, y);
    // landOverride: a geographic land cell overrides the abstract biome's buildability.
    if (!t.buildable && !landOverride) return { ok: false, reason: `${t.label} cannot carry structures` };
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
      org_slot: orgSlot,
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
    const key = this.idx(x, y);
    this.assetsByTile.set(key, [...(this.assetsByTile.get(key) || []), asset]);
    // Buying an asset claims the tile and its immediate neighbours for the org.
    if (orgSlot > 0) {
      this.claim(x, y, orgSlot);
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) continue;
          if (this.owner[this.idx(x + dx, y + dy)] === 0) this.claim(x + dx, y + dy, orgSlot);
        }
      }
    }
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

  destroyAsset(simId, orgSlot) {
    const a = this.findAsset(simId);
    if (!a) return null;
    if (orgSlot) a.org_slot = orgSlot;
    a.owner_id = "";
    a.damage = a.value;
    a.defense = 0;
    a.output = 0;
    return a;
  }

  /* ---------------------------------------------------------- per tick */
  /**
   * Resource production with dependencies — the economic pressure chain.
   * Phase 1: energy assets and deposits produce from nothing.
   * Phase 2: compute/storage consume energy to produce.
   * Phase 3: servers/cities consume energy+compute/materials to produce data/information.
   * Damaged assets (damage >= value) produce nothing.
   * Market prices then move toward equilibrium based on pool pressure.
   */
  produce(rng) {
    let gained = 0;
    const active = (a) => a.output > 0 && a.damage < a.value;

    // Phase 1: energy + materials are the base of the chain.
    this.assets.forEach((a) => {
      if (!active(a)) return;
      if (a.kind === "energy") {
        const out = a.output * 0.08;
        this.resources.energy = Number((this.resources.energy + out).toFixed(2));
        gained += out;
      } else if (a.kind === "deposit") {
        const out = a.output * 0.06;
        this.resources.materials = Number((this.resources.materials + out).toFixed(2));
        gained += out;
      }
    });

    // Phase 2: compute + storage need energy.
    this.assets.forEach((a) => {
      if (!active(a)) return;
      if (a.kind === "compute" || a.kind === "storage") {
        const eNeed = a.output * 0.04;
        if (this.resources.energy >= eNeed) {
          this.resources.energy = Number((this.resources.energy - eNeed).toFixed(2));
          const bucket = a.kind === "compute" ? "compute" : "storage";
          const out = a.output * 0.06;
          this.resources[bucket] = Number((this.resources[bucket] + out).toFixed(2));
          gained += out;
        }
      }
    });

    // Phase 3: servers need energy+compute → data; cities need energy+materials → information.
    this.assets.forEach((a) => {
      if (!active(a)) return;
      if (a.kind === "server") {
        const eNeed = a.output * 0.03;
        const cNeed = a.output * 0.02;
        if (this.resources.energy >= eNeed && this.resources.compute >= cNeed) {
          this.resources.energy = Number((this.resources.energy - eNeed).toFixed(2));
          this.resources.compute = Number((this.resources.compute - cNeed).toFixed(2));
          const out = a.output * 0.05;
          this.resources.data = Number((this.resources.data + out).toFixed(2));
          gained += out;
        }
      } else if (a.kind === "city") {
        const eNeed = a.output * 0.04;
        const mNeed = a.output * 0.02;
        if (this.resources.energy >= eNeed && this.resources.materials >= mNeed) {
          this.resources.energy = Number((this.resources.energy - eNeed).toFixed(2));
          this.resources.materials = Number((this.resources.materials - mNeed).toFixed(2));
          const out = a.output * 0.04;
          this.resources.information = Number((this.resources.information + out).toFixed(2));
          gained += out;
        }
      }
    });

    // Market: prices drift toward equilibrium based on pool pressure.
    // Scarce resources (low pool) rise; abundant resources (high pool) fall.
    Object.keys(this.market).forEach((k) => {
      const pool = this.resources[k] || 0;
      const target = 300;
      const pressure = (target - pool) / 1200;
      const noise = (rng() - 0.5) * 0.03;
      const next = Math.max(0.2, Number((this.market[k] * (1 + pressure * 0.05 + noise)).toFixed(3)));
      this.market[k] = next;
    });

    this.dayTicks += 1;
    if (this.dayTicks >= 8) {
      this.dayTicks = 0;
      this.day += 1;
    }
    return gained;
  }

  /** Territory share per organization — computed from actual claimed tiles. */
  orgShare() {
    const counts = {};
    let claimed = 0;
    for (let i = 0; i < this.owner.length; i += 1) {
      const slot = this.owner[i];
      if (slot > 0) {
        const orgId = this.orgSlots[slot] || `ORG_${slot}`;
        counts[orgId] = (counts[orgId] || 0) + 1;
        claimed += 1;
      }
    }
    const total = this.owner.length || 1;
    const share = { claimed: claimed / total };
    Object.keys(counts).forEach((orgId) => {
      share[orgId] = counts[orgId] / total;
    });
    return share;
  }

  /* ------------------------------------------------------- persistence */
  /** Ownership is stored as a compact list of claimed tiles, not per-tile. */
  serialize() {
    const claimed = [];
    for (let i = 0; i < this.owner.length; i += 1) {
      if (this.owner[i] > 0) claimed.push(`${i}:${this.owner[i]}`);
    }
    const sculpted = Array.from(this.sculpt)
      .map((v) => (v < 0 ? "-" : String(v)))
      .join("");
    return { ownership: claimed.join(","), orgSlots: this.orgSlots, sculpted };
  }

  applySerialized({ ownership, orgSlots, sculpted }) {
    this.owner.fill(0);
    if (ownership && typeof ownership === "string") {
      ownership.split(",").forEach((entry) => {
        if (!entry) return;
        const [idx, slot] = entry.split(":").map(Number);
        if (Number.isFinite(idx) && Number.isFinite(slot) && idx < this.owner.length) {
          this.owner[idx] = slot;
        }
      });
    }
    if (orgSlots && Array.isArray(orgSlots)) {
      this.orgSlots = [null, ...orgSlots.filter(Boolean)];
    }
    if (sculpted && sculpted.length === this.sculpt.length) {
      for (let i = 0; i < sculpted.length; i += 1) {
        this.sculpt[i] = sculpted[i] === "-" ? -1 : Number(sculpted[i]);
      }
    }
  }

  /** Rebuilds the tile and id indexes after a reload. */
  reindexAssets() {
    this.assetById = new Map();
    this.assetsByTile = new Map();
    this.assets.forEach((a) => {
      this.assetById.set(a.sim_id, a);
      const key = this.idx(a.x, a.y);
      this.assetsByTile.set(key, [...(this.assetsByTile.get(key) || []), a]);
    });
  }

  /** Keeps an incrementing counter valid after a reload. */
  syncAssetSeq() {
    this.assets.forEach((a) => {
      const n = Number(String(a.sim_id).split("_").pop());
      if (Number.isFinite(n) && n > (this.assetSeq[a.kind] || 0)) this.assetSeq[a.kind] = n;
    });
  }
}