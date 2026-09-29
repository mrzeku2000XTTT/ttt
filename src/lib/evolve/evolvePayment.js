/**
 * evolvePayment — orchestrates the EVOLVE economic flow through Scorpion.
 *
 *   EVOLVE BUILDS → SCORPION SIGNS → KASPA TN10 BROADCASTS → EVOLVE OBSERVES TX
 *   → CONFIRMATION WATCHER → CONFIRMED → WORLD ENGINE SETTLES
 *
 * CRITICAL: A TXID means BROADCAST, not settlement.
 * World resources transfer ONLY after TN10 confirmation (CONFIRMED / SETTLED).
 *
 * Flow:
 *   1. Create payment intent (idempotency check)
 *   2. Reserve game resources (if applicable)
 *   3. Show preview to user
 *   4. Scorpion signs + broadcasts → TXID
 *   5. Record chain tx, update intent to BROADCAST
 *   6. Confirmation watcher polls TN10 → CONFIRMED
 *   7. Settlement service transfers world resources → SETTLED
 *
 * If the user cancels in Scorpion, the intent is CANCELLED and reservations
 * are released. Nothing transfers.
 */

import { TxStatus } from "./txStateMachine";
import {
  createPaymentIntent,
  linkBroadcast,
  markCancelled,
  markFailed,
  updateIntentStatus,
} from "./paymentIntentService";
import { recordChainTx } from "./chainTxRecorder";

/**
 * Prepare a payment: create the intent + reservation, then show preview.
 * Does NOT open Scorpion yet.
 */
export async function preparePayment({
  base44,
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
  const intentRes = await createPaymentIntent({
    experimentId,
    idempotencyKey,
    sender,
    recipient,
    amountSompi,
    purpose,
    provider,
    relatedEntityType,
    relatedEntityId,
    reservationId,
    settlementData,
    day,
  });

  if (!intentRes.ok) {
    return intentRes; // { ok: false, reason: "DUPLICATE", existing }
  }

  return { ok: true, intent: intentRes.intent };
}

/**
 * Execute the Scorpion signing + broadcast phase.
 * This is called AFTER the user clicks "REVIEW IN SCORPION" in the preview.
 *
 * Returns { ok: true, txId, intent } on broadcast, or { ok: false, reason } on cancel/failure.
 * World resources are NOT transferred here — only after confirmation.
 */
export async function broadcastPayment({ wallet, base44, experimentId, intent, reservation, onBroadcast }) {
  if (!wallet?.isTN10) return { ok: false, reason: "WALLET_NOT_TN10" };
  if (!intent) return { ok: false, reason: "NO_INTENT" };

  // Update intent to AWAITING_SIGNATURE.
  await updateIntentStatus(intent.id, TxStatus.AWAITING_SIGNATURE);

  wallet.setConnState("SIGNING");
  wallet.setBusy(true);

  let result;
  try {
    result = await wallet.adapter.sendKaspa({
      to: intent.recipient_address,
      amountSompi: intent.amount_sompi,
    });
  } catch (e) {
    wallet.setConnState("CONNECTED_TN10");
    wallet.setBusy(false);
    const reason = e?.message?.toLowerCase?.().includes("reject") ? "USER_CANCELLED" : "SIGN_FAILED";
    if (reason === "USER_CANCELLED") {
      await markCancelled(intent.id);
    } else {
      await markFailed(intent.id, reason, e?.message || "");
    }
    return { ok: false, reason, error: e, intent };
  }

  const { txId } = result;
  wallet.setConnState("BROADCASTING");

  // Record the chain tx.
  const chainTx = await recordChainTx({
    base44,
    experimentId,
    txId,
    sender: { actorId: intent.sender_actor_id, code: intent.sender_code, address: intent.sender_address },
    recipient: { actorId: intent.recipient_actor_id, code: intent.recipient_code, address: intent.recipient_address },
    amountSompi: intent.amount_sompi,
    purpose: intent.purpose,
    worldRef: intent.related_entity_id,
    paymentIntentId: intent.id,
    reservationId: intent.reservation_id,
    idempotencyKey: intent.idempotency_key,
    day: intent.day,
  });

  // Link the broadcast to the intent.
  await linkBroadcast(intent.id, txId, chainTx?.id || "");

  if (onBroadcast) onBroadcast(txId, intent);

  wallet.setConnState("CONNECTED_TN10");
  wallet.setBusy(false);

  // Refresh balance after a short delay.
  setTimeout(() => wallet.silentRefresh(wallet.address).catch(() => {}), 1500);

  // DO NOT settle here. The confirmation watcher will handle that.
  return { ok: true, txId, intent, chainTx };
}

/**
 * Settle a confirmed payment — transfer world resources.
 * Called by the settlement service after the confirmation watcher detects CONFIRMED.
 */
export async function settleConfirmedPayment({ base44, experimentId, intent, onSettle }) {
  await updateIntentStatus(intent.id, TxStatus.CONFIRMED, {
    confirmed_at: new Date().toISOString(),
  });

  if (onSettle) {
    await onSettle(intent);
  }

  await updateIntentStatus(intent.id, TxStatus.SETTLED, {
    settled_at: new Date().toISOString(),
  });

  return { ok: true };
}

/**
 * Release a failed/cancelled payment — release reservations.
 * Called when the payment fails or the user cancels.
 */
export async function releaseFailedPayment({ intent, onRelease }) {
  if (onRelease) {
    await onRelease(intent);
  }
  return { ok: true };
}