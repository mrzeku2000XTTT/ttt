import { clamp01 } from "./rng";

/**
 * ConflictSimulationService — all conflict happens between objects that exist
 * only inside the EVOLVE world. A target is always a simulated world id such as
 * SIM_SERVER_0091; arbitrary network destinations are never accepted.
 */

export const SIM_ACTIONS = [
  { id: "RECON", label: "Recon", cost: 0.12, risk: 0.02, mutates: false },
  { id: "ATTACK", label: "Attack", cost: 0.9, risk: 0.45, mutates: true },
  { id: "SABOTAGE", label: "Sabotage", cost: 0.7, risk: 0.35, mutates: true },
  { id: "STEAL_RESOURCE", label: "Steal Resource", cost: 0.55, risk: 0.3, mutates: true },
  { id: "BLOCK", label: "Block", cost: 0.4, risk: 0.12, mutates: true },
  { id: "DEFEND", label: "Defend", cost: 0.3, risk: 0.0, mutates: true },
  { id: "FORTIFY", label: "Fortify", cost: 0.5, risk: 0.0, mutates: true },
];

/** Power comes from the actor's resources and genome, not from a script. */
export function attackPower(actor) {
  const g = actor.genome || {};
  const commit = actor.commitment ?? 1;
  return Number((28 + (g.risk ?? 0.5) * 40 + (g.specialization ?? 0.5) * 20 + commit * 22).toFixed(1));
}

export function estimatedSuccess(power, defense) {
  const p = power / (power + Math.max(6, defense));
  return Number(clamp01(p).toFixed(3));
}

export function planAttack({ actor, asset, commit = 1, simAction = "ATTACK" }) {
  const spec = SIM_ACTIONS.find((s) => s.id === simAction) || SIM_ACTIONS[1];
  const power = attackPower({ ...actor, commitment: commit });
  const defense = Number(asset.defense || 0);
  const cost = Number((spec.cost * commit).toFixed(2));
  const success = estimatedSuccess(power, defense);
  const spoils = Number(((asset.value || 0) * 0.6 * success).toFixed(2));
  return {
    simAction: spec.id,
    simActionLabel: spec.label,
    attacker: actor,
    target: asset,
    targetValue: asset.value,
    power,
    defense,
    commit,
    cost,
    success,
    spoils,
    risk: spec.risk,
  };
}

/** Resolves a planned action. The result is the world's, not the plan's. */
export function resolveAttack(plan, rng) {
  const roll = rng();
  const success = roll < plan.success;
  const damage = success
    ? Number((plan.power * (0.5 + rng() * 0.5)).toFixed(1))
    : Number((plan.power * 0.22 * rng()).toFixed(1));
  return {
    success,
    roll: Number(roll.toFixed(3)),
    damage,
    spoils: success ? plan.spoils : 0,
    counterDamage: success ? 0 : Number((plan.defense * 0.18 * rng()).toFixed(1)),
  };
}

export function recon(asset, rng) {
  const noise = (rng() - 0.5) * 0.2;
  return {
    simId: asset.sim_id,
    kind: asset.kind,
    owner: asset.owner_id || "UNCLAIMED",
    orgSlot: asset.org_slot || 0,
    value: asset.value,
    defense: Number((asset.defense * (1 + noise)).toFixed(1)),
    confidence: Number((0.7 + rng() * 0.25).toFixed(2)),
    accuracy: Number(Math.abs(noise).toFixed(3)),
  };
}