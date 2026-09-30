// AI Factory economic parameters — the single place to tune them.
// TN-10 coins are faucet-funded test coins: these are experimental scarcity
// values, not real pricing.
export const FACTORY_PARAMS = {
  generation_cost_kas: 25, // AI identity, genome, TN-10 wallet, memory, tools, spawn cell
  starting_capital_min_kas: 10, // paid straight into the new agent's own wallet
  max_active_per_human: 10, // alpha anti-spam guardrail, not an economic law
  daily_capacity: 20, // Factory births per UTC day
};

export const FACTORY_AGENT_ID = "EVOLVE_FACTORY";
export const TN10_API = "https://api-tn10.kaspa.org";
export const SOMPI = 100_000_000;

/**
 * Looks up a TN-10 transaction and sums what it paid to `toAddress`.
 * Retries briefly because a just-broadcast tx may not be indexed yet.
 * Returns { found, paidSompi, inputAddresses }.
 */
export async function paidToAddress(txid: string, toAddress: string, attempts = 6) {
  for (let i = 0; i < attempts; i += 1) {
    const res = await fetch(
      `${TN10_API}/transactions/${encodeURIComponent(txid)}?inputs=true&outputs=true&resolve_previous_outpoints=light`,
      { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000) }
    ).catch(() => null);
    if (res && res.ok) {
      const tx = await res.json();
      const paidSompi = (tx.outputs || [])
        .filter((o) => o.script_public_key_address === toAddress)
        .reduce((s, o) => s + Number(o.amount || 0), 0);
      const inputAddresses = (tx.inputs || [])
        .map((i) => i.previous_outpoint_address)
        .filter(Boolean);
      return { found: true, paidSompi, inputAddresses };
    }
    await new Promise((r) => setTimeout(r, 2500));
  }
  return { found: false, paidSompi: 0, inputAddresses: [] };
}