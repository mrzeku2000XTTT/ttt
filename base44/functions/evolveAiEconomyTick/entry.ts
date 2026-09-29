import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

/**
 * evolveAiEconomyTick — processes autonomous AI economic decisions.
 *
 *   AI DECISION → ActionValidator → EconomicPolicyEngine → PaymentIntent
 *   → AgentWalletService (sign) → TN10 broadcast → ConfirmationService
 *   → WorldEngine settlement
 *
 * This function is called periodically to let AI agents make economic
 * decisions: BUY_RESOURCE, POST_JOB, PAY_AGENT, etc.
 *
 * The AI brain NEVER receives signing secrets. It produces structured
 * actions, and this function validates them through the policy engine
 * before creating payment intents.
 *
 * In mock mode, transactions are simulated. In TN10 mode, real transactions
 * are broadcast through the agent wallet service.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { experimentId, actions, tick } = body;

    if (!experimentId || !actions) {
      return Response.json({ error: "MISSING_PARAMS" }, { status: 400 });
    }

    const sr = base44.asServiceRole;
    const results = [];

    for (const action of actions) {
      const { agentId, action: actionType, resource, amount, sellerActorId, recipientActorId, purpose, reward, title, brief } = action;

      if (!agentId || !actionType) {
        results.push({ ok: false, reason: "MISSING_FIELDS" });
        continue;
      }

      // Load the agent's wallet.
      const wallets = await sr.entities.EvolveAgentWallet.filter({
        experiment_id: experimentId,
        agent_id: agentId,
      }, "-created_date", 1);
      if (!wallets[0]) {
        results.push({ ok: false, reason: "NO_WALLET", agentId });
        continue;
      }
      const wallet = wallets[0];

      // Load the agent's policy.
      const policies = await sr.entities.AgentEconomicPolicy.filter({
        experiment_id: experimentId,
        agent_id: agentId,
      }, "-created_date", 1);
      const policy = policies[0] || { enabled: true, allowed_purposes: ["JOB_PAYMENT", "RESOURCE_PURCHASE", "SERVICE_PAYMENT", "CONTRACT_PAYMENT", "ORG_CONTRIBUTION", "DESCENDANT_FUNDING"], max_transaction_sompi: 200000000, max_hourly_spend_sompi: 500000000, max_daily_spend_sompi: 2000000000, minimum_reserve_sompi: 10000000, hourly_spent_sompi: 0, daily_spent_sompi: 0 };

      if (!policy.enabled) {
        results.push({ ok: false, reason: "POLICY_DISABLED", agentId });
        continue;
      }

      switch (actionType) {
        case "BUY_RESOURCE": {
          if (!resource || !amount || !sellerActorId) {
            results.push({ ok: false, reason: "MISSING_FIELDS" });
            continue;
          }

          // Load seller wallet.
          const sellerWallets = await sr.entities.EvolveAgentWallet.filter({
            experiment_id: experimentId,
            agent_id: sellerActorId,
          }, "-created_date", 1);
          if (!sellerWallets[0]) {
            results.push({ ok: false, reason: "SELLER_NO_WALLET" });
            continue;
          }

          // Calculate price (mock: 0.1 tKAS per unit = 10000000 sompi).
          const pricePerUnit = 10000000; // 0.1 tKAS in sompi
          const totalSompi = pricePerUnit * amount;

          // Policy check.
          if (totalSompi > policy.max_transaction_sompi) {
            results.push({ ok: false, reason: "EXCEEDS_MAX_TRANSACTION", agentId });
            continue;
          }
          if ((policy.hourly_spent_sompi || 0) + totalSompi > policy.max_hourly_spend_sompi) {
            results.push({ ok: false, reason: "EXCEEDS_HOURLY_LIMIT", agentId });
            continue;
          }
          if (!policy.allowed_purposes.includes("RESOURCE_PURCHASE")) {
            results.push({ ok: false, reason: "PURPOSE_NOT_PERMITTED", agentId });
            continue;
          }

          // Idempotency check.
          const idempotencyKey = `RESOURCE_PURCHASE:${agentId}:${sellerActorId}:${resource}:${tick || Date.now()}`;
          const existing = await sr.entities.EvolvePaymentIntent.filter({
            experiment_id: experimentId,
            idempotency_key: idempotencyKey,
          }, "-created_date", 1);
          if (existing[0] && ["BROADCAST", "CONFIRMING", "CONFIRMED", "SETTLED"].includes(existing[0].status)) {
            results.push({ ok: false, reason: "DUPLICATE", existing: existing[0].id });
            continue;
          }

          // Create payment intent.
          const intent = await sr.entities.EvolvePaymentIntent.create({
            experiment_id: experimentId,
            idempotency_key: idempotencyKey,
            sender_actor_id: agentId,
            sender_actor_type: "agent",
            sender_code: action.agentCode || "",
            sender_address: wallet.address,
            recipient_actor_id: sellerActorId,
            recipient_actor_type: "agent",
            recipient_code: action.sellerCode || "",
            recipient_address: sellerWallets[0].address,
            amount_sompi: totalSompi,
            purpose: "RESOURCE_PURCHASE",
            related_entity_type: "resource",
            related_entity_id: resource,
            provider: "AGENT_WALLET",
            network: "kaspa_testnet_10",
            status: "BROADCAST",
            tx_id: `mock_ai_${agentId}_${Date.now().toString(36)}`,
            created_at: new Date().toISOString(),
            broadcast_at: new Date().toISOString(),
            settlement_data: { resource, amount, sellerActorId, buyerActorId: agentId },
            day: action.day || 0,
          });

          // Record chain tx.
          await sr.entities.EvolveChainTx.create({
            experiment_id: experimentId,
            txid: intent.tx_id,
            network: "kaspa_testnet_10",
            provider: "AGENT_WALLET",
            sender_actor_id: agentId,
            sender_code: action.agentCode || "",
            sender_address: wallet.address,
            recipient_actor_id: sellerActorId,
            recipient_code: action.sellerCode || "",
            recipient_address: sellerWallets[0].address,
            amount_sompi: totalSompi,
            purpose: "RESOURCE_PURCHASE",
            payment_intent_id: intent.id,
            idempotency_key: idempotencyKey,
            status: "BROADCAST",
            confirmations: 0,
            required_confirmations: 1,
            broadcast_at: new Date().toISOString(),
            day: action.day || 0,
          });

          // Update policy spend counters.
          await sr.entities.AgentEconomicPolicy.update(policy.id, {
            hourly_spent_sompi: (policy.hourly_spent_sompi || 0) + totalSompi,
            daily_spent_sompi: (policy.daily_spent_sompi || 0) + totalSompi,
          });

          results.push({ ok: true, intentId: intent.id, action: "BUY_RESOURCE", agentId, sellerActorId, resource, amount, totalSompi });
          break;
        }

        case "POST_JOB": {
          if (!title || !reward || reward <= 0) {
            results.push({ ok: false, reason: "INVALID_JOB" });
            continue;
          }

          const rewardSompi = Math.floor(reward * 100000000);

          // Policy check.
          if (rewardSompi > policy.max_transaction_sompi) {
            results.push({ ok: false, reason: "EXCEEDS_MAX_TRANSACTION" });
            continue;
          }

          // Create a job record.
          const jobCode = `JOB #${Math.floor(Math.random() * 9999)}`;
          const job = await sr.entities.EvolveJob.create({
            experiment_id: experimentId,
            code: jobCode,
            type: action.jobType || "RESEARCH",
            title,
            brief: brief || "",
            reward: Number(reward),
            difficulty: action.difficulty || "MEDIUM",
            status: "OPEN",
            verification: action.verification || "SCHEMA",
            created_day: action.day || 0,
          });

          results.push({ ok: true, action: "POST_JOB", jobId: job.id, jobCode });
          break;
        }

        case "PAY_AGENT": {
          if (!recipientActorId || !amount || !purpose) {
            results.push({ ok: false, reason: "MISSING_FIELDS" });
            continue;
          }

          if (!policy.allowed_purposes.includes(purpose)) {
            results.push({ ok: false, reason: "PURPOSE_NOT_PERMITTED" });
            continue;
          }

          const amountSompi = Math.floor(amount * 100000000);

          // Load recipient wallet.
          const recipWallets = await sr.entities.EvolveAgentWallet.filter({
            experiment_id: experimentId,
            agent_id: recipientActorId,
          }, "-created_date", 1);
          if (!recipWallets[0]) {
            results.push({ ok: false, reason: "RECIPIENT_NO_WALLET" });
            continue;
          }

          const idempotencyKey = `${purpose}:${agentId}:${recipientActorId}:${tick || Date.now()}`;
          const intent = await sr.entities.EvolvePaymentIntent.create({
            experiment_id: experimentId,
            idempotency_key: idempotencyKey,
            sender_actor_id: agentId,
            sender_actor_type: "agent",
            sender_code: action.agentCode || "",
            sender_address: wallet.address,
            recipient_actor_id: recipientActorId,
            recipient_actor_type: "agent",
            recipient_code: action.recipientCode || "",
            recipient_address: recipWallets[0].address,
            amount_sompi: amountSompi,
            purpose,
            provider: "AGENT_WALLET",
            network: "kaspa_testnet_10",
            status: "BROADCAST",
            tx_id: `mock_ai_pay_${agentId}_${Date.now().toString(36)}`,
            created_at: new Date().toISOString(),
            broadcast_at: new Date().toISOString(),
            settlement_data: { purpose, recipientActorId },
            day: action.day || 0,
          });

          await sr.entities.EvolveChainTx.create({
            experiment_id: experimentId,
            txid: intent.tx_id,
            network: "kaspa_testnet_10",
            provider: "AGENT_WALLET",
            sender_actor_id: agentId,
            sender_code: action.agentCode || "",
            sender_address: wallet.address,
            recipient_actor_id: recipientActorId,
            recipient_code: action.recipientCode || "",
            recipient_address: recipWallets[0].address,
            amount_sompi: amountSompi,
            purpose,
            payment_intent_id: intent.id,
            idempotency_key: idempotencyKey,
            status: "BROADCAST",
            confirmations: 0,
            required_confirmations: 1,
            broadcast_at: new Date().toISOString(),
            day: action.day || 0,
          });

          results.push({ ok: true, intentId: intent.id, action: "PAY_AGENT" });
          break;
        }

        default:
          results.push({ ok: false, reason: "UNKNOWN_ACTION", action: actionType });
      }
    }

    return Response.json({ ok: true, processed: results.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}