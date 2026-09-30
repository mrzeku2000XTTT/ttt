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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const lower = (v: any) => String(v || "").toLowerCase();
const utxoAmount = (u: any) => Number(u?.utxoEntry?.amount || 0);
const utxoId = (u: any) => lower(u?.outpoint?.transactionId);

/** Direct transaction lookup. Returns null when the node does not serve the tx. */
async function lookupTx(txid: string, toAddress: string) {
  const res = await fetch(
    `${TN10_API}/transactions/${encodeURIComponent(txid)}?inputs=true&outputs=true&resolve_previous_outpoints=light`,
    { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000) }
  ).catch(() => null);
  if (!res || !res.ok) return null;
  const tx = await res.json();
  const paidSompi = (tx.outputs || [])
    .filter((o: any) => o.script_public_key_address === toAddress)
    .reduce((s: number, o: any) => s + Number(o.amount || 0), 0);
  const inputAddresses = (tx.inputs || [])
    .map((i: any) => i.previous_outpoint_address)
    .filter(Boolean);
  return { found: true, paidSompi, inputAddresses, txid };
}

/** The address UTXO set — the one TN-10 view that stays current. */
async function addressUtxos(address: string) {
  const res = await fetch(`${TN10_API}/addresses/${encodeURIComponent(address)}/utxos`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10000),
  }).catch(() => null);
  if (!res || !res.ok) return [];
  const list = await res.json().catch(() => []);
  return Array.isArray(list) ? list : [];
}

/**
 * Looks up a TN-10 payment and sums what it paid to `toAddress`.
 *
 * TN-10's node index is unreliable: a confirmed payment sits in the address
 * UTXO set while `/transactions/{txid}` still answers 404 and the address
 * history reads empty. Relying on the tx endpoint alone stranded paid Factory
 * births forever, so the UTXO set is checked as well — it is the same source
 * the balance endpoint reads from.
 *
 * Returns { found, paidSompi, inputAddresses, txid }.
 */
export async function paidToAddress(
  txid: string,
  toAddress: string,
  { attempts = 5 }: { attempts?: number } = {}
) {
  const wanted = lower(txid);
  if (!wanted) return { found: false, paidSompi: 0, inputAddresses: [], txid: "" };

  for (let i = 0; i < attempts; i += 1) {
    const direct = await lookupTx(wanted, toAddress);
    if (direct) return direct;

    const utxos = await addressUtxos(toAddress);
    const match = utxos.find((u: any) => utxoId(u) === wanted);
    if (match) {
      return { found: true, paidSompi: utxoAmount(match), inputAddresses: [], txid: match.outpoint.transactionId };
    }
    if (i < attempts - 1) await sleep(2500);
  }
  return { found: false, paidSompi: 0, inputAddresses: [], txid: wanted };
}

/**
 * A Factory payment that was broadcast but never turned into an agent: the
 * exact total is still sitting at the Factory and is not recorded in any birth.
 * `spentTxids` are the fee txids already tied to a birth.
 */
export async function unclaimedPayment(toAddress: string, amountSompi: number, spentTxids: string[] = []) {
  const spent = spentTxids.map(lower);
  const utxos = await addressUtxos(toAddress);
  const hit = utxos.find((u: any) => utxoAmount(u) === amountSompi && !spent.includes(utxoId(u)));
  return hit ? hit.outpoint.transactionId : null;
}