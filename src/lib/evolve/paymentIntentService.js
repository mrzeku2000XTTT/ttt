/**
 * PaymentIntentService — creates and manages persistent payment intents.
 *
 * Every economic payment gets an idempotency key:
 *   TRADE:{tradeId}:PAYMENT
 *   JOB:{jobId}:REWARD
 *   CONTRACT:{contractId}:PAYMENT:{index}
 *
 * Before creating another payment, check for existing intents.
 * If an intent already has BROADCAST / CONFIRMING / CONFIRMED / SETTLED,
 * do NOT create another transaction.
 */

import { base44 } from "@/api/base44Client";
import { TxStatus, isBlocking } from "./txStateMachine";

/** Build an idempotency key from purpose + entity id. */
export function makeIdempotencyKey(purpose, entityId, suffix = "") {
  const parts = [purpose, entityId];
  if (suffix) parts.push(suffix);
  return parts.join(":");
}

/**
 * Find an existing intent by idempotency key.
 * Returns the intent if one is in-flight or settled, null otherwise.
 */
export async function findExistingIntent(experimentId, idempotencyKey) {
  if (!idempotencyKey) return null;
  try {
    const existing = await base44.entities.EvolvePaymentIntent.filter({
      experiment_id: experimentId,
      idempotency_key: idempotencyKey,
    }, "-created_date", 5);
    // Return the most recent one that is blocking (in-flight or settled).
    return existing.find((i) => isBlocking(i.status)) || null;
  } catch {
    return null;
  }
}

/**
 * Create a persistent payment intent. Checks idempotency first.
 * Returns { ok: true, intent } or { ok: false, reason, existing? }.
 */
export async function createPaymentIntent({
  experimentId,
  idempotencyKey,
  sender,
  recipient,
  amountSompi,
  purpose,
  provider = "SCORPION",
  relatedEntityType = "",
  relatedEntityId = "",
  reservationId = "",
  settlementData = null,
  day = 0,
}) {
  // Idempotency check.
  const existing = await findExistingIntent(experimentId, idempotencyKey);
  if (existing) {
    return { ok: false, reason: "DUPLICATE", existing };
  }

  try {
    const intent = await base44.entities.EvolvePaymentIntent.create({
      experiment_id: experimentId,
      idempotency_key: idempotencyKey,
      sender_actor_id: sender?.actorId || sender?.id || "",
      sender_actor_type: sender?.type || "player",
      sender_code: sender?.code || "",
      sender_address: sender?.address || "",
      recipient_actor_id: recipient?.actorId || recipient?.id || "",
      recipient_actor_type: recipient?.type || "agent",
      recipient_code: recipient?.code || "",
      recipient_address: recipient?.address || "",
      amount_sompi: Number(amountSompi.toString()),
      purpose,
      related_entity_type: relatedEntityType,
      related_entity_id: relatedEntityId,
      reservation_id: reservationId,
      provider,
      network: "kaspa_testnet_10",
      status: TxStatus.CREATED,
      created_at: new Date().toISOString(),
      settlement_data: settlementData,
      day,
    });
    return { ok: true, intent };
  } catch (e) {
    return { ok: false, reason: "CREATE_FAILED", error: e };
  }
}

/**
 * Update an intent's status. Validates the transition.
 */
export async function updateIntentStatus(intentId, newStatus, extra = {}) {
  try {
    return await base44.entities.EvolvePaymentIntent.update(intentId, {
      status: newStatus,
      ...extra,
    });
  } catch (e) {
    console.warn("EVOLVE: could not update intent status", e);
    return null;
  }
}

/**
 * Link a broadcast txid to an intent.
 */
export async function linkBroadcast(intentId, txId, chainTxId) {
  return updateIntentStatus(intentId, TxStatus.BROADCAST, {
    tx_id: txId,
    chain_tx_id: chainTxId,
    broadcast_at: new Date().toISOString(),
  });
}

/**
 * Mark an intent as confirming.
 */
export async function markConfirming(intentId) {
  return updateIntentStatus(intentId, TxStatus.CONFIRMING);
}

/**
 * Mark an intent as confirmed.
 */
export async function markConfirmed(intentId) {
  return updateIntentStatus(intentId, TxStatus.CONFIRMED, {
    confirmed_at: new Date().toISOString(),
  });
}

/**
 * Mark an intent as settled — world resources have transferred.
 */
export async function markSettled(intentId) {
  return updateIntentStatus(intentId, TxStatus.SETTLED, {
    settled_at: new Date().toISOString(),
  });
}

/**
 * Mark an intent as failed.
 */
export async function markFailed(intentId, errorCode, errorMessage) {
  return updateIntentStatus(intentId, TxStatus.FAILED, {
    error_code: errorCode || "",
    error_message: errorMessage || "",
  });
}

/**
 * Mark an intent as cancelled (user rejected in Scorpion).
 */
export async function markCancelled(intentId) {
  return updateIntentStatus(intentId, TxStatus.CANCELLED);
}

/**
 * Load all pending (BROADCAST / CONFIRMING) intents for an experiment.
 * Used on reload to resume confirmation watches.
 */
export async function loadPendingIntents(experimentId) {
  try {
    const all = await base44.entities.EvolvePaymentIntent.filter({
      experiment_id: experimentId,
    }, "-created_date", 200);
    return all.filter((i) => [TxStatus.BROADCAST, TxStatus.CONFIRMING].includes(i.status));
  } catch {
    return [];
  }
}

/**
 * Load all intents for an actor (pending + recent settled).
 */
export async function loadActorIntents(experimentId, actorId, limit = 50) {
  try {
    const sent = await base44.entities.EvolvePaymentIntent.filter({
      experiment_id: experimentId,
      sender_actor_id: actorId,
    }, "-created_date", limit);
    const received = await base44.entities.EvolvePaymentIntent.filter({
      experiment_id: experimentId,
      recipient_actor_id: actorId,
    }, "-created_date", limit);
    // Merge and dedupe by id.
    const map = new Map();
    [...sent, ...received].forEach((i) => map.set(i.id, i));
    return [...map.values()].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, limit);
  } catch {
    return [];
  }
}