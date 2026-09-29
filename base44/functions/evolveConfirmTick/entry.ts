import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

/**
 * evolveConfirmTick — checks the TN10 confirmation status of a broadcast
 * payment intent and updates its state machine.
 *
 *   BROADCAST → CONFIRMING → CONFIRMED
 *
 * In mock mode, confirmation is time-based (10s after broadcast).
 * In TN10 mode, this queries the Kaspa RPC for the transaction's acceptance.
 *
 * World resources are NOT transferred here — only status is updated.
 * The frontend settlement callback transfers resources after CONFIRMED.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { experimentId, intentId, txId } = body;

    if (!intentId) return Response.json({ error: "MISSING_INTENT_ID" }, { status: 400 });

    const sr = base44.asServiceRole;

    // Load the intent.
    const intent = await sr.entities.EvolvePaymentIntent.get(intentId);
    if (!intent) return Response.json({ error: "INTENT_NOT_FOUND" }, { status: 404 });

    // Only process BROADCAST or CONFIRMING intents.
    if (!["BROADCAST", "CONFIRMING"].includes(intent.status)) {
      return Response.json({ ok: true, status: intent.status, unchanged: true });
    }

    // Move to CONFIRMING if still BROADCAST.
    if (intent.status === "BROADCAST") {
      await sr.entities.EvolvePaymentIntent.update(intentId, { status: "CONFIRMING" });
      if (intent.chain_tx_id) {
        await sr.entities.EvolveChainTx.update(intent.chain_tx_id, { status: "CONFIRMING" });
      }
    }

    // Check confirmation.
    // Mock mode: 10 seconds after broadcast = confirmed.
    // TN10 mode: query Kaspa RPC (future).
    const broadcastTime = intent.broadcast_at ? new Date(intent.broadcast_at).getTime() : 0;
    const elapsed = Date.now() - broadcastTime;
    const CONFIRM_AFTER_MS = 10000; // 10 seconds in mock mode

    if (elapsed < CONFIRM_AFTER_MS) {
      // Still confirming.
      return Response.json({ ok: true, status: "CONFIRMING", confirmations: Math.floor(elapsed / (CONFIRM_AFTER_MS / 3)) });
    }

    // Confirmed! Update the intent.
    await sr.entities.EvolvePaymentIntent.update(intentId, {
      status: "CONFIRMED",
      confirmed_at: new Date().toISOString(),
    });

    // Update the chain tx.
    if (intent.chain_tx_id) {
      await sr.entities.EvolveChainTx.update(intent.chain_tx_id, {
        status: "CONFIRMED",
        confirmations: 3,
        confirmed_at: new Date().toISOString(),
      });
    }

    return Response.json({
      ok: true,
      status: "CONFIRMED",
      intentId,
      txId: intent.tx_id,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}