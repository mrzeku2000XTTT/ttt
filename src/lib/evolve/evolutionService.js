import { inheritGenome, calculateFitness } from "./genome";
import { OPERATING_COSTS } from "./agentEngine";

/**
 * EvolutionService — reproduction, inheritance, mutation and archiving.
 * Selection is economic: nothing here rewards a behaviour directly.
 */

export const REPRODUCTION_REQUIREMENTS = {
  minWealth: 22,
  minAgeDays: 6,
  minCompute: 3,
  minEnergy: 3,
  cost: OPERATING_COSTS.reproduction,
  populationCap: 900,
};

export class EvolutionService {
  constructor({ world, mutationRate = 0.05, rng }) {
    this.world = world;
    this.mutationRate = mutationRate;
    this.rng = rng;
  }

  canReproduce(agent, population) {
    const r = REPRODUCTION_REQUIREMENTS;
    const fails = [];
    if (agent.balance < r.minWealth) fails.push("wealth");
    if (agent.age_days < r.minAgeDays) fails.push("age");
    if ((agent.assets?.compute || 0) < r.minCompute) fails.push("compute");
    if ((agent.assets?.energy || 0) < r.minEnergy) fails.push("energy");
    if (population >= r.populationCap) fails.push("population capacity");
    return { ok: fails.length === 0, fails, requirements: r };
  }

  /** Returns { genome, delta } — ancestry is never overwritten. */
  inheritGenome(parent) {
    return inheritGenome(parent.genome, this.rng, this.mutationRate);
  }

  calculateFitness(agent, ctx) {
    return calculateFitness(agent, ctx);
  }

  /** Applies the reproduction cost to the parent and returns the mutation record. */
  createDescendant(parent, { id, code, name, wallet, position, day, faction }) {
    const { genome, delta } = this.inheritGenome(parent);
    parent.balance = Number((parent.balance - REPRODUCTION_REQUIREMENTS.cost).toFixed(2));
    parent.lifetime_expenses = Number((parent.lifetime_expenses + REPRODUCTION_REQUIREMENTS.cost).toFixed(2));
    parent.reproductions += 1;
    parent.children.push(id);

    const child = {
      id,
      code,
      name,
      generation: parent.generation + 1,
      parent_id: parent.id,
      lineage_root: parent.lineage_root,
      children: [],
      faction: faction || parent.faction,
      organization_id: parent.organization_id || "",
      wallet_id: wallet?.walletId || "",
      address: wallet?.address || "",
      balance: 0,
      lifetime_earnings: 0,
      lifetime_expenses: 0,
      jobs_completed: 0,
      jobs_failed: 0,
      genome,
      genome_delta: delta,
      status: "idle",
      current_job_id: "",
      position: { ...position },
      assets: { compute: 0, energy: 0, servers: 0, information: 0 },
      age_days: 0,
      fitness: 0,
      reproductions: 0,
      decisions: [
        {
          id: `${id}-0`,
          action: "BORN",
          note: `Descendant of ${parent.code} · mutation rate ${(this.mutationRate * 100).toFixed(0)}%`,
          delta,
        },
      ],
      born_day: day,
    };
    return child;
  }

  archiveAgent(agent, reason) {
    agent.status = "archived";
    agent.archive_reason = reason;
    return agent;
  }
}