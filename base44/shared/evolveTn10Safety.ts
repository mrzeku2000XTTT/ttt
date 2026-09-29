// Fail-closed deployment gate, NOT a chain health check or RPC implementation.
// Remove only after a supported Toccata signer/RPC service and atomic settlement exist.
export function tn10Blocked(extra = {}) {
  return {
    ...extra,
    ok: false,
    ready: false,
    network: 'kaspa_testnet_10',
    networkState: 'DEGRADED',
    connectivityVerified: false,
    reason: 'TN10_RUNTIME_BLOCKED',
    message: 'TN10 payments paused: current Rusty Kaspa WASM SDK needs a supported server runtime, configured TN10 RPC, and authoritative settlement.',
    unchanged: true,
  };
}

export async function ensureAgentEconomicPolicy(sr, experimentId, agentId, agentCode = '') {
  const existing = await sr.entities.AgentEconomicPolicy.filter({ experiment_id: experimentId, agent_id: agentId }, '-created_date', 1);
  if (existing[0]) return existing[0];
  return await sr.entities.AgentEconomicPolicy.create({
    experiment_id: experimentId, agent_id: agentId, agent_code: agentCode,
    enabled: true,
    max_transaction_sompi: 200000000,
    max_hourly_spend_sompi: 500000000,
    max_daily_spend_sompi: 2000000000,
    minimum_reserve_sompi: 10000000,
    allowed_purposes: ['RESOURCE_PURCHASE', 'JOB_PAYMENT', 'SERVICE_PAYMENT', 'CONTRACT_PAYMENT', 'DESCENDANT_FUNDING', 'ORG_CONTRIBUTION'],
    hourly_spent_sompi: 0, daily_spent_sompi: 0,
    last_hour_reset: new Date().toISOString(), last_day_reset: new Date().toISOString(),
  });
}