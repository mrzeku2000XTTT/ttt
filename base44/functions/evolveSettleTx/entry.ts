import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

/**
 * evolveSettleTx — marks a confirmed payment intent as SETTLED and records
 * the PAYMENT_CONFIRMED economic event. The actual world resource transfer
 * is done by the frontend engine's settlement callback; this function handles
 * the persistent state transition and event recording.
 *
 * Called by the frontend after it has applied the world state changes.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { experimentId, intentId, eventMetadata } = body;

    if (!intentId) return Response.json({ error: "MISSING_INTENT_ID" }, { status: 400 });

    const sr = base44.asServiceRole;

    const intent = await sr.entities.EvolvePaymentIntent.get(intentId);
    if (!intent) return Response.json({ error: "INTENT_NOT_FOUND" }, { status: 404 });

    if (intent.status !== "CONFIRMED") {
      return Response.json({ error: "NOT_CONFIRMED", status: intent.status }, { status: 400 });
    }

    // Mark as SETTLED.
    await sr.entities.EvolvePaymentIntent.update(intentId, {
      status: "SETTLED",
      settled_at: new Date().toISOString(),
    });

    // Update chain tx.
    if (intent.chain_tx_id) {
      await sr.entities.EvolveChainTx.update(intent.chain_tx_id, {
        status: "SETTLED",
        settled_at: new Date().toISOString(),
      });
    }

    // Release the reservation as TRANSFERRED.
    if (intent.reservation_id) {
      try {
        const reservations = await sr.entities.EconomicReservation.filter({
          reservation_key: intent.reservation_id,
        }, "-created_date", 1);
        if (reservations[0]) {
          await sr.entities.EconomicReservation.update(reservations[0].id, {
            status: "TRANSFERRED",
            settled_at: new Date().toISOString(),
          });
        }
      } catch (e) {
        // Non-fatal.
      }
    }

    // Record the PAYMENT_CONFIRMED event.
    const meta = eventMetadata || {};
    try {
      await sr.entities.EvolveEvent.create({
        experiment_id: experimentId || intent.experiment_id,
        type: "PAYMENT_CONFIRMED",
        category: "PAYMENT",
        message: `${intent.sender_code || "—"} → ${intent.recipient_code || "—"} · ${meta.amountLabel || intent.amount_sompi + " sompi"} · ${intent.purpose}`,
        actor_id: intent.sender_actor_id,
        actor_code: intent.sender_code,
        target_id: intent.recipient_actor_id,
        target_code: intent.recipient_code,
        amount: intent.amount_sompi,
        day: intent.day || 0,
      });
    } catch (e) {
      // Non-fatal — event recording is best-effort.
    }

    // Update agent economic memory if both actors are agents.
    try {
      if (intent.sender_actor_id && intent.sender_actor_type === "agent") {
        const mems = await sr.entities.AgentEconomicMemory.filter({
          experiment_id: experimentId,
          agent_id: intent.sender_actor_id,
        }, "-created_date", 1);
        if (mems[0]) {
          await sr.entities.AgentEconomicMemory.update(mems[0].id, {
            total_payments_sent_sompi: (mems[0].total_payments_sent_sompi || 0) + intent.amount_sompi,
            total_profit_sompi: (mems[0].total_profit_sompi || 0) - intent.amount_sompi,
          });
        }
      }
      if (intent.recipient_actor_id && intent.recipient_actor_type === "agent") {
        const mems = await sr.entities.AgentEconomicMemory.filter({
          experiment_id: experimentId,
          agent_id: intent.recipient_actor_id,
        }, "-created_date", 1);
        if (mems[0]) {
          await sr.entities.AgentEconomicMemory.update(mems[0].id, {
            total_payments_received_sompi: (mems[0].total_payments_received_sompi || 0) + intent.amount_sompi,
            total_profit_sompi: (mems[0].total_profit_sompi || 0) + intent.amount_sompi,
          });
        }
      }
    } catch (e) {
      // Non-fatal.
    }

    return Response.json({
      ok: true,
      status: "SETTLED",
      intentId,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}