import { TRAITS } from "./constants";
import { clamp01 } from "./rng";

/**
 * Genome — the ten strategy traits that selection acts on.
 * Fitness is deliberately NOT a direct reward for any behaviour: it is derived
 * from economic survival, so attacking or cooperating only pays if the economy
 * says it pays.
 */

export function randomGenome(rng) {
  const g = {};
  TRAITS.forEach((t) => {
    g[t.id] = Number(clamp01(0.2 + rng() * 0.7).toFixed(2));
  });
  return g;
}

export function inheritGenome(parent, rng, mutationRate) {
  const child = {};
  const delta = {};
  TRAITS.forEach((t) => {
    const base = parent[t.id] ?? 0.5;
    let next = base;
    if (rng() < mutationRate) next = clamp01(base + (rng() - 0.5) * 0.24);
    next = Number(next.toFixed(2));
    child[t.id] = next;
    delta[t.id] = Number((next - base).toFixed(2));
  });
  return { genome: child, delta };
}

export function mutateGenome(genome, rng, mutationRate) {
  return inheritGenome(genome, rng, mutationRate).genome;
}

export function meanGenome(agents) {
  const out = {};
  if (!agents.length) return out;
  TRAITS.forEach((t) => {
    out[t.id] = Number(
      (agents.reduce((s, a) => s + (a.genome?.[t.id] ?? 0), 0) / agents.length).toFixed(3)
    );
  });
  return out;
}

export const FITNESS_WEIGHTS = {
  wealth: 1,
  profitability: 1.4,
  resources: 0.6,
  age: 0.25,
  descendants: 2.2,
  job_success: 1.8,
  organization: 0.9,
};

/** Configurable, economy-derived. Never "attack = +fitness". */
export function calculateFitness(agent, ctx = {}) {
  const w = ctx.weights || FITNESS_WEIGHTS;
  const profit = agent.lifetime_earnings - agent.lifetime_expenses;
  const profitRate = agent.lifetime_earnings > 0 ? profit / agent.lifetime_earnings : profit < 0 ? -1 : 0;
  const res = agent.assets
    ? Object.values(agent.assets).reduce((s, v) => s + Number(v || 0), 0)
    : 0;
  const org = agent.organization_id && ctx.org ? Math.max(0, ctx.org.reputation) / 100 : 0;
  return Number(
    (
      w.wealth * Math.log10(1 + Math.max(0, agent.balance)) +
      w.profitability * profitRate * 3 +
      w.resources * Math.log10(1 + res) +
      w.age * Math.log10(1 + agent.age_days) +
      w.descendants * Math.log10(1 + (agent.children?.length || 0)) +
      w.job_success * Math.log10(1 + (agent.jobs_completed || 0)) +
      w.organization * org
    ).toFixed(4)
  );
}