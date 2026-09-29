/**
 * chainTxRecorder — persists a broadcast transaction to EvolveChainTx.
 * The confirmation watcher updates its status from BROADCAST → CONFIRMING → CONFIRMED.
 */

import { base44 } from "@/api/base44Client";
import { TxStatus } from "./txStateMachine";

export async function recordChainTx({
  base44: b44,
  experimentId,
  txId,
  sender,
  recipient,
  amountSompi,
  purpose,
  worldRef,
  paymentIntentId = "",
  reservationId = "",
  idempotencyKey = "",
  day,
}) {
  const client = b44 || base44;
  if (!client?.entities?.EvolveChainTx) return null;
  try {
    return await client.entities.EvolveChainTx.create({
      experiment_id: experimentId || "",
      txid: txId,
      network: "kaspa_testnet_10",
      provider: "SCORPION",
      sender_actor_id: sender?.actorId || "",
      sender_code: sender?.code || "",
      sender_address: sender?.address || "",
      recipient_actor_id: recipient?.actorId || "",
      recipient_code: recipient?.code || "",
      recipient_address: recipient?.address || "",
      amount_sompi: Number(amountSompi.toString()),
      purpose,
      world_ref: worldRef || "",
      payment_intent_id: paymentIntentId,
      reservation_id: reservationId,
      idempotency_key: idempotencyKey,
      status: TxStatus.BROADCAST,
      confirmations: 0,
      required_confirmations: 1,
      broadcast_at: new Date().toISOString(),
      day: day || 0,
    });
  } catch (e) {
    console.warn("EVOLVE: could not record chain tx", e);
    return null;
  }
}

/**
 * Update a chain tx's confirmation status.
 */
export async function updateChainTxStatus(chainTxId, status, confirmations = 0, error = "") {
  if (!base44?.entities?.EvolveChainTx) return null;
  try {
    const update = { status, confirmations };
    if (error) update.error = error;
    if (status === TxStatus.CONFIRMED) update.confirmed_at = new Date().toISOString();
    if (status === TxStatus.SETTLED) update.settled_at = new Date().toISOString();
    return await base44.entities.EvolveChainTx.update(chainTxId, update);
  } catch (e) {
    console.warn("EVOLVE: could not update chain tx", e);
    return null;
  }
}

/**
 * Load all pending (BROADCAST / CONFIRMING) chain txs for an experiment.
 */
export async function loadPendingChainTxs(experimentId) {
  if (!base44?.entities?.EvolveChainTx) return [];
  try {
    const all = await base44.entities.EvolveChainTx.filter({
      experiment_id: experimentId,
    }, "-created_date", 200);
    return all.filter((tx) => [TxStatus.BROADCAST, TxStatus.CONFIRMING].includes(tx.status));
  } catch {
    return [];
  }
}