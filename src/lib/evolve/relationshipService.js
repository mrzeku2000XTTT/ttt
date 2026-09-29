/**
 * RelationshipService — tracks the history between pairs of agents.
 *
 * Cooperation is LEARNED, not scripted. Two agents start as strangers.
 * Every encounter, trade, shared job and conflict updates their relationship.
 * Only after enough positive history can they form a persistent organization.
 *
 * The human observer can see everything; agents only know what they have
 * discovered through interaction.
 */
export class RelationshipService {
  constructor() {
    this.rels = new Map();
  }

  /** Stable key so A→B and B→A share one record. */
  key(aId, bId) {
    return aId < bId ? `${aId}|${bId}` : `${bId}|${aId}`;
  }

  get(aId, bId) {
    return this.rels.get(this.key(aId, bId)) || null;
  }

  /** Returns the relationship, creating it if this is a first encounter. */
  touch(aId, bId, tick = 0) {
    const k = this.key(aId, bId);
    let r = this.rels.get(k);
    if (!r) {
      r = {
        agentA: aId < bId ? aId : bId,
        agentB: aId < bId ? bId : aId,
        encounters: 0,
        successfulTrades: 0,
        failedTrades: 0,
        sharedJobs: 0,
        cooperationScore: 0,
        trustScore: 0,
        conflictScore: 0,
        economicBenefit: 0,
        lastInteractionTick: tick,
      };
      this.rels.set(k, r);
    }
    return r;
  }

  encounter(aId, bId, tick = 0) {
    const r = this.touch(aId, bId, tick);
    r.encounters += 1;
    r.lastInteractionTick = tick;
    return r;
  }

  recordTrade(aId, bId, success, amount = 0, tick = 0) {
    const r = this.encounter(aId, bId, tick);
    if (success) {
      r.successfulTrades += 1;
      r.cooperationScore += 0.4;
      r.trustScore = Math.min(100, r.trustScore + 1.5);
      r.economicBenefit += amount;
    } else {
      r.failedTrades += 1;
      r.cooperationScore -= 0.15;
      r.trustScore = Math.max(0, r.trustScore - 0.8);
    }
    r.lastInteractionTick = tick;
    return r;
  }

  recordSharedJob(aId, bId, reward, tick = 0) {
    const r = this.encounter(aId, bId, tick);
    r.sharedJobs += 1;
    r.cooperationScore += 0.8;
    r.trustScore = Math.min(100, r.trustScore + 3);
    r.economicBenefit += reward;
    r.lastInteractionTick = tick;
    return r;
  }

  recordConflict(aId, bId, tick = 0) {
    const r = this.encounter(aId, bId, tick);
    r.conflictScore += 1;
    r.cooperationScore -= 0.6;
    r.trustScore = Math.max(0, r.trustScore - 4);
    r.lastInteractionTick = tick;
    return r;
  }

  /** Can these two agents found an organization together? */
  canFormOrg(aId, bId) {
    const r = this.get(aId, bId);
    if (!r) return { ok: false, reason: "No relationship history" };
    if (r.encounters < 3) return { ok: false, reason: "Not enough encounters" };
    if (r.cooperationScore < 2) return { ok: false, reason: "Insufficient cooperation" };
    if (r.economicBenefit < 3) return { ok: false, reason: "No proven economic benefit" };
    return { ok: true };
  }

  /** Best candidate for organization formation from a list of nearby agents. */
  bestPartner(agentId, candidates) {
    let best = null;
    let bestScore = -Infinity;
    for (const c of candidates) {
      if (c.id === agentId) continue;
      const r = this.get(agentId, c.id);
      if (!r) continue;
      const score = r.cooperationScore + r.economicBenefit * 0.1 - r.conflictScore * 0.5;
      if (score > bestScore && r.cooperationScore > 1.5) {
        bestScore = score;
        best = c;
      }
    }
    return best;
  }

  /** All relationships involving a given agent. */
  forAgent(agentId) {
    const out = [];
    this.rels.forEach((r) => {
      if (r.agentA === agentId || r.agentB === agentId) {
        const otherId = r.agentA === agentId ? r.agentB : r.agentA;
        out.push({ ...r, otherId });
      }
    });
    return out.sort((a, b) => b.cooperationScore - a.cooperationScore);
  }

  all() {
    return [...this.rels.values()];
  }

  serialize() {
    return [...this.rels.values()];
  }

  hydrate(records = []) {
    this.rels = new Map();
    records.forEach((r) => {
      this.rels.set(this.key(r.agentA, r.agentB), { ...r });
    });
  }
}

export const ORG_FORMATION_REQUIREMENTS = {
  minEncounters: 3,
  minCooperationScore: 2,
  minEconomicBenefit: 3,
  formationCost: 8,
};