import { clamp01 } from "./rng";

/**
 * AgentEngine — creates agents and decides what they do next.
 * The decision function is a plain policy so it can be swapped for a backend
 * model later: it returns the same structured proposal either way.
 */

const A = ["Vex", "Kor", "Ash", "Nyx", "Ori", "Sil", "Dax", "Mira", "Kel", "Zan", "Rho", "Tev", "Ilo", "Sur", "Bex"];
const B = ["arn", "eth", "ion", "os", "yx", "en", "ari", "un", "ek", "ova", "im", "ur", "el"];

export function agentName(rng) {
  return `${A[Math.floor(rng() * A.length)]}${B[Math.floor(rng() * B.length)]}`;
}

export function createAgent({
  id,
  code,
  name,
  generation = 0,
  parentId = "",
  lineageRoot = "",
  genome,
  faction = "neutral",
  position,
  wallet,
  balance = 0,
  day = 0,
}) {
  return {
    id,
    code,
    name,
    generation,
    parent_id: parentId,
    lineage_root: lineageRoot || id,
    children: [],
    faction,
    organization_id: "",
    wallet_id: wallet?.walletId || "",
    address: wallet?.address || "",
    balance: Number(balance.toFixed(2)),
    lifetime_earnings: Number(balance.toFixed(2)),
    lifetime_expenses: 0,
    jobs_completed: 0,
    jobs_failed: 0,
    genome: genome || {},
    status: "idle",
    current_job_id: "",
    position: position || { x: 0, y: 0 },
    assets: { compute: 0, energy: 0, servers: 0, information: 0 },
    age_days: 0,
    fitness: 0,
    reproductions: 0,
    decisions: [],
    born_day: day,
  };
}

export const recordDecision = (agent, action, meta = {}) => {
  agent.decisions.unshift({
    id: `${agent.id}-${agent.decisions.length + 1}`,
    action,
    ...meta,
  });
  if (agent.decisions.length > 60) agent.decisions.length = 60;
};

/** Simulated operating costs. Every one of them is recorded as an economic event. */
export const OPERATING_COSTS = {
  inference: 0.06,
  compute: 0.05,
  energy: 0.04,
  storage: 0.02,
  research: 0.18,
  reproduction: 4.5,
  defense: 0.35,
  recon: 0.12,
  membership: 0.08,
};

/**
 * The agent's policy. Reads only its own genome and public world state, so an
 * agent with a different genome genuinely behaves differently.
 */
export function decide(agent, ctx) {
  const { jobs, orgs, rng, foreignPool = [], myAsset = null } = ctx;
  const g = agent.genome;
  const roll = rng();

  // Reproduction is a real economic decision — it costs and it needs headroom.
  if (agent.balance > 22 && agent.age_days > 6 && agent.reproductions < 3 && roll < 0.02 + g.investment * 0.03) {
    return { action: "REPRODUCE", targetId: "", reason: "Wealth and age clear the reproduction threshold.", confidence: 0.7 };
  }

  const openJob = jobs.find((j) => j.status === "OPEN");
  if (openJob && roll < 0.34 + g.specialization * 0.2) {
    const worth = openJob.reward / (1 + OPERATING_COSTS.inference * 12);
    return {
      action: "CLAIM_JOB",
      targetId: openJob.id,
      reason: worth > 1 ? "Expected reward exceeds estimated operating cost." : "Claiming to keep the agent productive.",
      confidence: Number(clamp01(0.5 + g.specialization * 0.4).toFixed(2)),
    };
  }

  if (!agent.organization_id && roll < 0.10 + g.cooperation * 0.12 && orgs.length) {
    const org = orgs[Math.floor(rng() * orgs.length)];
    return { action: "JOIN_ORG", targetId: org.id, reason: "Membership buys shared territory and cheaper resources.", confidence: Number((0.5 + g.cooperation * 0.4).toFixed(2)) };
  }

  const foreign = foreignPool.length ? foreignPool[Math.floor(rng() * foreignPool.length)] : null;
  if (foreign && roll < 0.04 + g.risk * 0.10) {
    return { action: "RECON", targetId: foreign.sim_id, reason: "Cheap intelligence before committing resources.", confidence: Number((0.4 + g.information * 0.5).toFixed(2)) };
  }
  if (foreign && roll < 0.06 + g.risk * 0.12) {
    return { action: "ATTACK_SIM_ASSET", targetId: foreign.sim_id, reason: "Expected spoils exceed the cost of the attempt.", confidence: Number((0.3 + g.risk * 0.6).toFixed(2)) };
  }

  if (myAsset && roll < 0.08 + g.saving * 0.14) {
    return { action: "FORTIFY_SIM_ASSET", targetId: myAsset.sim_id, reason: "Protecting existing assets is cheaper than replacing them.", confidence: Number((0.5 + g.saving * 0.3).toFixed(2)) };
  }

  if (roll < 0.30 + g.exploration * 0.2) {
    return { action: "MOVE", targetId: "", reason: "Seeking better resource yields elsewhere.", confidence: Number((0.4 + g.exploration * 0.4).toFixed(2)) };
  }
  if (roll < 0.55 + g.information * 0.2) {
    return { action: "RESEARCH", targetId: "", reason: "Information compounds; buying it now is cheaper than later.", confidence: Number((0.4 + g.information * 0.5).toFixed(2)) };
  }
  return { action: "WORK", targetId: agent.current_job_id || "", reason: "No better expected return this tick.", confidence: 0.5 };
}

/** The structured contract any decision source must satisfy. */
export const proposalFromModel = (raw) => {
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return {
      action: String(parsed.action || "").toUpperCase(),
      targetId: String(parsed.targetId || ""),
      reason: String(parsed.reason || ""),
      confidence: Number(parsed.confidence),
    };
  } catch {
    return null;
  }
};