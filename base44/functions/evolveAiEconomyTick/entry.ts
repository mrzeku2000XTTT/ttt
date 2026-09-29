import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { ensureAgentEconomicPolicy, tn10Blocked } from '../../shared/evolveTn10Safety.ts';

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
 * TN10 payment actions are blocked until a supported Toccata signer/RPC
 * and authoritative atomic settlement are configured. No mock TXIDs.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json();
    const { experimentId, actions, tick } = body;

    if (!experimentId || !Array.isArray(actions) || actions.length > 100) {
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

      // Persist missing policy before use; never update an undefined entity ID.
      const policy = await ensureAgentEconomicPolicy(sr, experimentId, agentId, action.agentCode || '');

      if (!policy.enabled) {
        results.push({ ok: false, reason: "POLICY_DISABLED", agentId });
        continue;
      }

      switch (actionType) {
        case "BUY_RESOURCE": {
          results.push(tn10Blocked({ agentId, action: actionType }));
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
          results.push(tn10Blocked({ agentId, action: actionType }));
          break;
        }

        default:
          results.push({ ok: false, reason: "UNKNOWN_ACTION", action: actionType });
      }
    }

    return Response.json({ ok: results.every(result => result.ok), processed: results.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}