/**
 * territoryPolicy — EVOLVE Phase 2 expansion policy, the geographic→world-resource
 * adapter, and the AI frontier evaluation.
 *
 * Pure and import-free beyond the shared cell math, so it runs identically in the
 * Deno backend and the browser.
 *
 * It reuses the EXISTING economic model:
 *   - world resources are the ids WorldEngine already owns
 *     (compute, energy, storage, data, information, materials) — no new currency.
 *   - infrastructure kinds + their cost/output mirror src/lib/evolve/constants.js
 *     BUILD_COST / BUILD_STATS exactly (base44 cannot import from src/).
 *
 * Direction is strictly: GEOGRAPHIC CELL → RESOURCE ADAPTER → EXISTING WORLD
 * RESOURCE MODEL. The legacy world.owner[] grid is never read here.
 */
import { parseCellId, getNeighborCellIds } from './geoCell.ts';

export const TERRITORY_POLICY = {
  /**
   * TN-10 settlement for one bounded expansion — 0.25 tKAS.
   *
   * Sized by KIP-0009, not by taste: storage mass = C·(Σ C/o − C/ΣI) with
   * C = 10^12 and sompi values. A 0.02 tKAS output alone contributes
   * 10^12/2,000,000 = 500,000 mass, which is already the consensus cap, so any
   * payment at or below ~0.02 tKAS is structurally unbroadcastable from a large
   * UTXO. 0.25 tKAS keeps the destination term at 40,000, comfortably inside the
   * 100,000 standard transaction mass limit. The fee cannot help — N depends only
   * on the inputs, P only on the outputs.
   */
  claim_tkas_sompi: 25_000_000, // 0.25 tKAS
  /** The world-resource cost of one expansion, in existing resource ids. */
  expansion_resource_cost: { materials: 5, energy: 3, compute: 2, storage: 1 },
  /** Smallest reasonable foothold: at least one operational infrastructure asset. */
  infrastructure_requirement: { min_assets: 1, kinds: ['energy', 'compute', 'server', 'storage', 'city', 'deposit'] },
  /** How many days of asset output one expansion is allowed to draw on. */
  expansion_horizon_days: 3,
  confirmation_attempts: 5,
  confirmation_interval_ms: 2500,
  max_pending_claims_per_actor: 2,
  /** A frontier cell must clear this utility before the AI will expand into it. */
  min_utility_threshold: 0.35,
  treasury_actor_id: 'EVOLVE_TERRITORY_TREASURY',
  /** The single build kind used to establish the minimum legitimate foothold. */
  development_kind: 'energy',
};

/** Mirrors BUILD_COST in src/lib/evolve/constants.js. */
export const BUILD_COST: Record<string, Record<string, number>> = {
  server: { materials: 6, energy: 4 },
  city: { materials: 14, energy: 8, information: 3 },
  energy: { materials: 5 },
  compute: { materials: 4, energy: 3 },
  storage: { materials: 4 },
  deposit: {},
};

/** Mirrors BUILD_STATS in src/lib/evolve/constants.js. */
export const BUILD_STATS: Record<string, { value: number; defense: number; output: number }> = {
  server: { value: 22, defense: 34, output: 3 },
  city: { value: 48, defense: 60, output: 6 },
  energy: { value: 16, defense: 18, output: 5 },
  compute: { value: 18, defense: 22, output: 4 },
  storage: { value: 14, defense: 20, output: 2 },
  deposit: { value: 12, defense: 6, output: 2 },
};

/** States where a claim still holds its cell + resources. */
export const ACTIVE_STATUSES = [
  'REQUESTED', 'VALIDATING', 'RESOURCES_RESERVED', 'PAYMENT_BUILDING',
  'PAYMENT_BROADCAST', 'PAYMENT_CONFIRMING', 'PAYMENT_CONFIRMED', 'OWNERSHIP_COMMITTING',
];

/** States that will never progress again. */
export const TERMINAL_STATUSES = [
  'OWNERSHIP_COMMITTED', 'VALIDATION_FAILED', 'INSUFFICIENT_RESOURCES', 'POLICY_REJECTED',
  'INSUFFICIENT_TKAS', 'PAYMENT_FAILED', 'PAYMENT_TIMEOUT', 'SETTLEMENT_UNVERIFIED', 'OWNERSHIP_FAILED',
];

const num = (v: any, d: number) => (Number.isFinite(v) ? v : d);

/** Deterministic 0..1 value from a string. Stable forever for the same input. */
function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/**
 * Geographic cell → deterministic resource potential.
 *
 * Mirrors worldGen.surveyTile()'s contract exactly: { wood, energy, compute,
 * buildable }, each of wood/energy/compute on the same 0..3 integer scale.
 * Derived from the cell's OWN coordinates, never from world.owner[].
 */
export function cellResourcePotential(cellId: string) {
  const c = parseCellId(cellId);
  if (!c) return null;
  const elevation = hash01(`${cellId}|elev`);
  const rich = (v: number) => Math.min(3, Math.max(0, Math.round(v)));
  const wood = rich(0.4 + hash01(`${cellId}|wood`) * 2.6);
  const energy = rich(0.3 + hash01(`${cellId}|energy`) * 2.7);
  const compute = rich(0.2 + hash01(`${cellId}|compute`) * 2.8);
  return {
    cellId,
    elevation: Number(elevation.toFixed(3)),
    wood,
    energy,
    compute,
    buildable: elevation > 0.06,
  };
}

/**
 * Potential → the world resource ids the existing build/economy system uses.
 * DISCOVERED potential only. It is NOT added to any actor's balance by ownership.
 */
export function potentialToWorldResources(p: any) {
  if (!p) return { materials: 0, energy: 0, compute: 0, storage: 0 };
  return {
    materials: p.wood,
    energy: p.energy,
    compute: p.compute,
    storage: p.buildable ? 1 : 0,
  };
}

export function expansionCostUnits(policy = TERRITORY_POLICY) {
  return Object.values(policy.expansion_resource_cost).reduce((s, v) => s + v, 0);
}

/**
 * ExpansionCapacity — derived from REAL existing state only.
 * Never from the dead EvolveAgent.assets.* counters.
 */
export function evaluateExpansionCapacity({
  territory,
  assets,
  pendingUnits = 0,
  policy = TERRITORY_POLICY,
}: {
  territory: any[];
  assets: any[];
  pendingUnits?: number;
  policy?: typeof TERRITORY_POLICY;
}) {
  const supporting = (assets || []).filter((a) =>
    policy.infrastructure_requirement.kinds.includes(a.kind)
  );
  const capacityUnits =
    supporting.reduce((s, a) => s + (BUILD_STATS[a.kind]?.output || 1), 0) *
    policy.expansion_horizon_days;
  const requiredUnits = expansionCostUnits(policy);

  const reasons: string[] = [];
  if (!territory || territory.length < 1) reasons.push('NO_TERRITORIAL_FOOTHOLD');
  if (supporting.length < policy.infrastructure_requirement.min_assets) {
    reasons.push('NO_OPERATIONAL_INFRASTRUCTURE');
  }
  if (capacityUnits < pendingUnits + requiredUnits) reasons.push('INSUFFICIENT_EXPANSION_CAPACITY');

  return {
    eligible: reasons.length === 0,
    supportingAssets: supporting.map((a) => ({ kind: a.kind, sim_id: a.sim_id, output: a.output || 0 })),
    capacityUnits,
    pendingUnits,
    requiredUnits,
    worldResourceCost: { ...policy.expansion_resource_cost },
    reasons,
  };
}

/**
 * Bounded AI frontier evaluation. Returns EXPAND or DECLINE plus fully
 * explainable per-cell data. Territory is NEVER itself fitness — utility is
 * what the cell's real potential is worth to this actor's economy.
 */
export function evaluateFrontier({
  ownedCells,
  candidates,
  genome,
  assets,
  policy = TERRITORY_POLICY,
}: {
  ownedCells: any[];
  candidates: { cellId: string; potential: any }[];
  genome: any;
  assets: any[];
  policy?: typeof TERRITORY_POLICY;
}) {
  const supporting = (assets || []).filter((a) =>
    policy.infrastructure_requirement.kinds.includes(a.kind)
  );
  const capacityUnits =
    supporting.reduce((s, a) => s + (BUILD_STATS[a.kind]?.output || 1), 0) *
    policy.expansion_horizon_days;
  const requiredUnits = expansionCostUnits(policy);
  const hasFoothold = (ownedCells || []).length > 0;
  const hasInfra = supporting.length >= policy.infrastructure_requirement.min_assets;

  const exploration = num(genome?.exploration, 0.5);
  const saving = num(genome?.saving, 0.5);
  const risk = num(genome?.risk, 0.5);
  const investment = num(genome?.investment, 0.5);

  const rows = (candidates || []).map((c) => {
    const p = c.potential || { wood: 0, energy: 0, compute: 0, buildable: false };
    const benefit = ((p.wood + p.energy + p.compute) / 9) * 0.7 + (p.buildable ? 0.15 : 0);
    const utility = Number(
      (
        benefit * (1 + exploration * 0.4 + investment * 0.2) -
        0.25 * (1 + saving) -
        (1 - risk) * 0.2
      ).toFixed(4)
    );
    const reasons: string[] = [];
    if (!hasFoothold) reasons.push('NO_TERRITORIAL_FOOTHOLD');
    if (!hasInfra) reasons.push('NO_OPERATIONAL_INFRASTRUCTURE');
    if (capacityUnits < requiredUnits) reasons.push('INSUFFICIENT_EXPANSION_CAPACITY');
    if (utility < policy.min_utility_threshold) reasons.push('BELOW_UTILITY_THRESHOLD');
    return {
      cellId: c.cellId,
      potential: p,
      worldResources: potentialToWorldResources(p),
      utility,
      expectedBenefit: Number(benefit.toFixed(4)),
      simulatedCost: policy.expansion_resource_cost,
      tkasCost: policy.claim_tkas_sompi,
      eligible: reasons.length === 0,
      reasons,
    };
  });
  rows.sort((a, b) => b.utility - a.utility);

  const best = rows[0] || null;
  return {
    decision: best && best.eligible ? 'EXPAND' : 'DECLINE',
    best,
    cells: rows,
    capacity: { capacityUnits, requiredUnits, hasFoothold, hasInfra, supportingAssets: supporting.length },
    genomeFactors: { exploration, saving, risk, investment },
    threshold: policy.min_utility_threshold,
  };
}

export { parseCellId, getNeighborCellIds };