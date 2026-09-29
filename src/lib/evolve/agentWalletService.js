/**
 * AgentWalletService — manages AI agent TN10 wallet identities.
 *
 * HUMANS use SCORPION (popup/PIN signing).
 * AUTONOMOUS AI AGENTS cannot use human popup signing.
 * They use experiment-controlled TN10 wallets managed by this service.
 *
 * Architecture:
 *   AI DECISION → ActionValidator → EconomicPolicyEngine → PaymentIntent
 *   → AgentWalletService (server-side signing) → TN10 → ConfirmationService
 *   → WorldEngine settlement
 *
 * The LLM itself NEVER receives signing secrets.
 * This frontend module only creates wallet IDENTITY records (address only).
 * Actual signing happens in the backend function (evolveAiEconomyTick).
 */

import { base44 } from "@/api/base44Client";

const ALPHABET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";

function generateAddress(seed) {
  let s = (seed * 2654435761) >>> 0;
  let out = "";
  for (let i = 0; i < 58; i += 1) {
    s = (s * 1664525 + 1013904223) >>> 0;
    out += ALPHABET[s >>> 24];
  }
  return `kaspatest:${out}`;
}

/**
 * Create a wallet identity record for an AI agent.
 * Stores ONLY the public address — never private keys.
 */
export async function createAgentWalletIdentity({ experimentId, agentId, agentCode, organizationId = "", isTreasury = false }) {
  if (!base44?.entities?.EvolveAgentWallet) return null;
  const walletId = `W${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1000).toString(36).toUpperCase()}`;
  const seed = Date.now() + Math.floor(Math.random() * 1e9);
  const address = generateAddress(seed);

  try {
    return await base44.entities.EvolveAgentWallet.create({
      experiment_id: experimentId,
      agent_id: agentId,
      agent_code: agentCode,
      wallet_id: walletId,
      network: "kaspa_testnet_10",
      address,
      status: "active",
      last_known_balance_sompi: 0,
      created_at: new Date().toISOString(),
      organization_id: organizationId,
      is_treasury: isTreasury,
    });
  } catch (e) {
    console.warn("EVOLVE: could not create agent wallet identity", e);
    return null;
  }
}

/**
 * Get an agent's wallet identity by agent_id.
 */
export async function getAgentWallet(experimentId, agentId) {
  if (!base44?.entities?.EvolveAgentWallet) return null;
  try {
    const wallets = await base44.entities.EvolveAgentWallet.filter({
      experiment_id: experimentId,
      agent_id: agentId,
    }, "-created_date", 1);
    return wallets[0] || null;
  } catch {
    return null;
  }
}

/**
 * Get an agent's TN10 balance. The database balance is a CACHE ONLY.
 * The blockchain is AUTHORITATIVE.
 * This calls the backend function which queries TN10.
 */
export async function getAgentBalance(experimentId, agentId) {
  try {
    const result = await base44.functions.invoke("evolveGetAgentBalance", {
      experimentId,
      agentId,
    });
    return result;
  } catch (e) {
    // Backend function may not be deployed — fall back to cached balance.
    const wallet = await getAgentWallet(experimentId, agentId);
    return { ok: false, cachedSompi: wallet?.last_known_balance_sompi || 0, error: e?.message };
  }
}

/**
 * Create or load the economic policy for an agent.
 */
export async function ensureAgentPolicy(experimentId, agentId, agentCode = "") {
  if (!base44?.entities?.AgentEconomicPolicy) return null;
  try {
    const existing = await base44.entities.AgentEconomicPolicy.filter({
      experiment_id: experimentId,
      agent_id: agentId,
    }, "-created_date", 1);
    if (existing[0]) return existing[0];
    return await base44.entities.AgentEconomicPolicy.create({
      experiment_id: experimentId,
      agent_id: agentId,
      agent_code: agentCode,
      enabled: true,
    });
  } catch (e) {
    console.warn("EVOLVE: could not ensure agent policy", e);
    return null;
  }
}

/**
 * Create or load the economic memory for an agent.
 */
export async function ensureAgentMemory(experimentId, agentId, agentCode = "") {
  if (!base44?.entities?.AgentEconomicMemory) return null;
  try {
    const existing = await base44.entities.AgentEconomicMemory.filter({
      experiment_id: experimentId,
      agent_id: agentId,
    }, "-created_date", 1);
    if (existing[0]) return existing[0];
    return await base44.entities.AgentEconomicMemory.create({
      experiment_id: experimentId,
      agent_id: agentId,
      agent_code: agentCode,
    });
  } catch (e) {
    console.warn("EVOLVE: could not ensure agent memory", e);
    return null;
  }
}

/**
 * Record an economic event in an agent's memory.
 */
export async function recordEconomicMemory(experimentId, agentId, event) {
  if (!base44?.entities?.AgentEconomicMemory) return null;
  try {
    const mem = await ensureAgentMemory(experimentId, agentId);
    if (!mem) return null;
    const update = {};
    if (event.type === "PAYMENT_SENT") {
      update.total_payments_sent_sompi = (mem.total_payments_sent_sompi || 0) + event.amountSompi;
      update.total_profit_sompi = (mem.total_profit_sompi || 0) - event.amountSompi;
    } else if (event.type === "PAYMENT_RECEIVED") {
      update.total_payments_received_sompi = (mem.total_payments_received_sompi || 0) + event.amountSompi;
      update.total_profit_sompi = (mem.total_profit_sompi || 0) + event.amountSompi;
    } else if (event.type === "JOB_WON") {
      update.jobs_won = (mem.jobs_won || 0) + 1;
    } else if (event.type === "JOB_LOST") {
      update.jobs_lost = (mem.jobs_lost || 0) + 1;
    } else if (event.type === "RESOURCE_PURCHASE") {
      update.resource_purchases = (mem.resource_purchases || 0) + 1;
    } else if (event.type === "RESOURCE_SALE") {
      update.resource_sales = (mem.resource_sales || 0) + 1;
    } else if (event.type === "CONTRACT_COMPLETED") {
      update.contracts_completed = (mem.contracts_completed || 0) + 1;
    } else if (event.type === "CONTRACT_FAILED") {
      update.contracts_failed = (mem.contracts_failed || 0) + 1;
    } else if (event.type === "OPERATING_COST") {
      update.total_operating_costs_sompi = (mem.total_operating_costs_sompi || 0) + event.amountSompi;
    }
    update.last_updated_tick = event.tick || 0;
    return await base44.entities.AgentEconomicMemory.update(mem.id, update);
  } catch (e) {
    console.warn("EVOLVE: could not record economic memory", e);
    return null;
  }
}