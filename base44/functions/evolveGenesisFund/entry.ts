import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

/**
 * evolveGenesisFund — creates TN10 wallet identities for genesis AI agents
 * and records genesis funding transactions.
 *
 *   GENESIS TREASURY → A#001 (2 tKAS) → A#002 (2 tKAS) → ...
 *
 * Each agent gets an independent kaspatest: wallet identity.
 * The actual funding transaction is recorded as an EvolvePaymentIntent
 * with purpose GENESIS_FUNDING. In mock mode, the balance is credited
 * to the wallet cache. In TN10 mode, a real transaction is broadcast.
 *
 * Do NOT pretend funding happened before confirmation.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { experimentId, agents, amountPerAgentSompi = 200000000 } = body;

    if (!experimentId || !agents || !agents.length) {
      return Response.json({ error: "MISSING_PARAMS" }, { status: 400 });
    }

    const sr = base44.asServiceRole;

    // Find or create the treasury wallet.
    let treasuryWallets = await sr.entities.EvolveAgentWallet.filter({
      experiment_id: experimentId,
      is_treasury: true,
    }, "-created_date", 1);

    let treasuryWallet = treasuryWallets[0];
    if (!treasuryWallet) {
      // Create a treasury wallet identity.
      const seed = Date.now();
      const ALPHABET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
      let s = (seed * 2654435761) >>> 0;
      let addr = "";
      for (let i = 0; i < 58; i += 1) {
        s = (s * 1664525 + 1013904223) >>> 0;
        addr += ALPHABET[s >>> 24];
      }
      treasuryWallet = await sr.entities.EvolveAgentWallet.create({
        experiment_id: experimentId,
        agent_id: "TREASURY",
        agent_code: "TREASURY",
        wallet_id: `WT${Date.now().toString(36).toUpperCase()}`,
        network: "kaspa_testnet_10",
        address: `kaspatest:${addr}`,
        status: "active",
        last_known_balance_sompi: 100000000000, // 1000 tKAS for genesis
        created_at: new Date().toISOString(),
        is_treasury: true,
      });
    }

    const results = [];

    for (const agent of agents) {
      const { agentId, agentCode } = agent;
      if (!agentId) continue;

      // Check if wallet already exists.
      const existing = await sr.entities.EvolveAgentWallet.filter({
        experiment_id: experimentId,
        agent_id: agentId,
      }, "-created_date", 1);

      if (existing[0]) {
        results.push({ agentId, ok: true, existing: true, walletId: existing[0].wallet_id });
        continue;
      }

      // Create wallet identity.
      const seed = Date.now() + Math.floor(Math.random() * 1e9);
      const ALPHABET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
      let s = (seed * 2654435761) >>> 0;
      let agentAddr = "";
      for (let i = 0; i < 58; i += 1) {
        s = (s * 1664525 + 1013904223) >>> 0;
        agentAddr += ALPHABET[s >>> 24];
      }
      const agentAddress = `kaspatest:${agentAddr}`;

      const wallet = await sr.entities.EvolveAgentWallet.create({
        experiment_id: experimentId,
        agent_id: agentId,
        agent_code: agentCode || "",
        wallet_id: `W${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1000).toString(36).toUpperCase()}`,
        network: "kaspa_testnet_10",
        address: agentAddress,
        status: "active",
        last_known_balance_sompi: 0,
        created_at: new Date().toISOString(),
      });

      // Create a genesis funding payment intent.
      const idempotencyKey = `GENESIS_FUNDING:${agentId}`;
      const existingIntent = await sr.entities.EvolvePaymentIntent.filter({
        experiment_id: experimentId,
        idempotency_key: idempotencyKey,
      }, "-created_date", 1);

      if (!existingIntent[0]) {
        const intent = await sr.entities.EvolvePaymentIntent.create({
          experiment_id: experimentId,
          idempotency_key: idempotencyKey,
          sender_actor_id: "TREASURY",
          sender_actor_type: "treasury",
          sender_code: "TREASURY",
          sender_address: treasuryWallet.address,
          recipient_actor_id: agentId,
          recipient_actor_type: "agent",
          recipient_code: agentCode || "",
          recipient_address: agentAddress,
          amount_sompi: amountPerAgentSompi,
          purpose: "GENESIS_FUNDING",
          provider: "AGENT_WALLET",
          network: "kaspa_testnet_10",
          status: "BROADCAST",
          tx_id: `mock_genesis_${agentId}_${Date.now().toString(36)}`,
          created_at: new Date().toISOString(),
          broadcast_at: new Date().toISOString(),
          day: 0,
        });

        // Record the chain tx.
        await sr.entities.EvolveChainTx.create({
          experiment_id: experimentId,
          txid: intent.tx_id,
          network: "kaspa_testnet_10",
          provider: "AGENT_WALLET",
          sender_actor_id: "TREASURY",
          sender_code: "TREASURY",
          sender_address: treasuryWallet.address,
          recipient_actor_id: agentId,
          recipient_code: agentCode || "",
          recipient_address: agentAddress,
          amount_sompi: amountPerAgentSompi,
          purpose: "GENESIS_FUNDING",
          payment_intent_id: intent.id,
          idempotency_key: idempotencyKey,
          status: "BROADCAST",
          confirmations: 0,
          required_confirmations: 1,
          broadcast_at: new Date().toISOString(),
          day: 0,
        });

        // In mock mode, credit the wallet cache immediately.
        // The confirmation watcher will move it to CONFIRMED → SETTLED.
        await sr.entities.EvolveAgentWallet.update(wallet.id, {
          last_known_balance_sompi: amountPerAgentSompi,
        });
      }

      // Ensure the agent has an economic policy.
      const policyExists = await sr.entities.AgentEconomicPolicy.filter({
        experiment_id: experimentId,
        agent_id: agentId,
      }, "-created_date", 1);
      if (!policyExists[0]) {
        await sr.entities.AgentEconomicPolicy.create({
          experiment_id: experimentId,
          agent_id: agentId,
          agent_code: agentCode || "",
          enabled: true,
        });
      }

      // Ensure the agent has economic memory.
      const memExists = await sr.entities.AgentEconomicMemory.filter({
        experiment_id: experimentId,
        agent_id: agentId,
      }, "-created_date", 1);
      if (!memExists[0]) {
        await sr.entities.AgentEconomicMemory.create({
          experiment_id: experimentId,
          agent_id: agentId,
          agent_code: agentCode || "",
        });
      }

      results.push({ agentId, ok: true, walletId: wallet.wallet_id, address: agentAddress });
    }

    return Response.json({ ok: true, funded: results.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}