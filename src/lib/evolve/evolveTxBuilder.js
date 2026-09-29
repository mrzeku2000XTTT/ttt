/**
 * EvolveTransactionBuilder — constructs unsigned rusty-kaspa Safe JSON for
 * complex TN10 transactions that EVOLVE must build itself.
 *
 * Architecture:
 *   WORLD ACTION → ECONOMIC INTENT → TRANSACTION BUILDER → UNSIGNED SAFE JSON
 *   → SCORPION (signPskt) → SIGNED SAFE JSON → BROADCAST (pushTx)
 *
 * EVOLVE decides who pays, who receives, the amount, and the economic purpose.
 * Scorpion only decides whether the user approves and performs signing.
 *
 * All amounts are SOMPI integers (BigInt). 1 KAS = 100,000,000 sompi.
 * Never use JavaScript floating-point for blockchain amounts.
 */

export const SOMPI_PER_KAS = 100_000_000n;

/** Convert a decimal tKAS string (e.g. "2.5") to sompi as BigInt. */
export function kasToSompi(kasDecimal) {
  if (typeof kasDecimal !== "string") kasDecimal = String(kasDecimal);
  const neg = kasDecimal.startsWith("-");
  if (neg) kasDecimal = kasDecimal.slice(1);
  const [whole, frac = ""] = kasDecimal.split(".");
  const fracPadded = (frac + "00000000").slice(0, 8);
  const sompi = BigInt(whole || "0") * SOMPI_PER_KAS + BigInt(fracPadded || "0");
  return neg ? -sompi : sompi;
}

/** Convert sompi BigInt to a display string with 8 decimals (tKAS). */
export function sompiToKas(sompi) {
  const b = BigInt(sompi);
  const neg = b < 0n;
  const abs = neg ? -b : b;
  const whole = abs / SOMPI_PER_KAS;
  const frac = abs % SOMPI_PER_KAS;
  const fracStr = frac.toString().padStart(8, "0");
  const trimmed = fracStr.replace(/0+$/, "") || "0";
  const kas = `${whole.toString()}.${trimmed}`;
  return neg ? `-${kas}` : kas;
}

/** Compact sompi for UI (2 decimals). */
export function sompiToKasShort(sompi) {
  const kas = sompiToKas(sompi);
  const [w, f] = kas.split(".");
  return `${w}.${(f + "00").slice(0, 2)}`;
}

/**
 * Select wallet-owned P2PK UTXOs to cover a target amount.
 * Returns { inputs, totalSompi, changeSompi, signIndexes }.
 * `signIndexes` are the GLOBAL tx.inputs[] positions of the wallet's inputs —
 * these are the ONLY indexes we ask Scorpion to sign (SIGHASH_ALL).
 */
export function selectUtxos(utxos, targetSompi, feeSompi = 1000n) {
  const need = targetSompi + feeSompi;
  const sorted = [...utxos]
    .filter((u) => u && u.amount != null)
    .sort((a, b) => Number(BigInt(b.amount) - BigInt(a.amount)));
  const selected = [];
  let acc = 0n;
  for (const u of sorted) {
    if (acc >= need) break;
    selected.push(u);
    acc += BigInt(u.amount);
  }
  if (acc < need) {
    return { ok: false, reason: "INSUFFICIENT_FUNDS", need, have: acc };
  }
  const change = acc - need;
  return { ok: true, selected, totalSompi: acc, changeSompi: change, feeSompi };
}

/**
 * Build an unsigned rusty-kaspa Safe JSON transaction for a simple KAS payment.
 * The caller passes the global indexes of the wallet's own inputs as signInputs.
 *
 * This is the "complex" path. For most EVOLVE payments, prefer scorpion.sendKaspa
 * (the simple user-confirmed path). This builder exists for transactions EVOLVE
 * must construct itself (escrow releases, multi-output settlements, etc.).
 */
export function buildPaymentTx({ utxos, toAddress, amountSompi, changeAddress, feeSompi = 1000n }) {
  const sel = selectUtxos(utxos, amountSompi, feeSompi);
  if (!sel.ok) return sel;
  const inputs = sel.selected.map((u) => ({
    outpoint: u.outpoint || { transactionId: u.txid, index: u.index },
    amount: String(u.amount),
    scriptSigPath: u.scriptSigPath || "",
    sigOpCount: u.sigOpCount || 1,
  }));
  const outputs = [
    { address: toAddress, amount: String(amountSompi.toString()) },
  ];
  if (sel.changeSompi > 0n && changeAddress) {
    outputs.push({ address: changeAddress, amount: String(sel.changeSompi.toString()) });
  }
  // signInputs = global indexes of the wallet's P2PK funding inputs (all of them here).
  const signInputs = inputs.map((_, i) => i);
  const tx = {
    version: 0,
    inputs,
    outputs,
    lockTime: 0,
    subnetworkId: "0000000000000000000000000000000000000000",
    gas: 0,
    payload: "",
  };
  return {
    ok: true,
    txJsonString: JSON.stringify(tx),
    signInputs,
    feeSompi: sel.feeSompi,
    changeSompi: sel.changeSompi,
    totalSompi: sel.totalSompi,
  };
}