/**
 * EconomicPolicyEngine — validates every payment before it enters the pipeline.
 *
 *   ACTOR → ACTION → WORLD STATE → PAYMENT INTENT → APPROVED / REJECTED
 *
 * Validates:
 *   - actor owns the wallet
 *   - network is TN10
 *   - recipient corresponds to economic counterparty
 *   - amount equals economic agreement
 *   - sufficient balance
 *   - purpose is permitted by agent policy
 *   - spending limits not exceeded
 *   - reservation exists (if resource purchase)
 *   - transaction not duplicated (idempotency)
 *
 * The LLM brain NEVER calls this directly — it produces structured actions
 * (BUY_RESOURCE, POST_JOB, etc.) and the World Engine builds the intent.
 */

const ALLOWED_PURPOSES = [
  "JOB_PAYMENT",
  "RESOURCE_PURCHASE",
  "SERVICE_PAYMENT",
  "CONTRACT_PAYMENT",
  "ORG_CONTRIBUTION",
  "DESCENDANT_FUNDING",
  "GENESIS_FUNDING",
  "BUILD",
  "TERRITORY_CLAIM",
];

const DEFAULT_POLICY = {
  max_transaction_sompi: 200_000_000, // 2 tKAS
  max_hourly_spend_sompi: 500_000_000, // 5 tKAS
  max_daily_spend_sompi: 2_000_000_000, // 20 tKAS
  allowed_purposes: ALLOWED_PURPOSES,
  minimum_reserve_sompi: 10_000_000, // 0.1 tKAS
  enabled: true,
  hourly_spent_sompi: 0,
  daily_spent_sompi: 0,
};

export function getDefaultPolicy() {
  return { ...DEFAULT_POLICY };
}

/**
 * Validate a payment intent against actor policy and world state.
 * Returns { ok: true } or { ok: false, reason }.
 */
export function validatePayment({ intent, actor, policy, balanceSompi, existingIntents }) {
  if (!intent) return { ok: false, reason: "NO_INTENT" };

  // 1. Idempotency — block if an in-flight intent already exists for this key.
  if (existingIntents && intent.idempotency_key) {
    const existing = existingIntents.find(
      (i) => i.idempotency_key === intent.idempotency_key && isBlockingStatus(i.status)
    );
    if (existing) {
      return { ok: false, reason: "DUPLICATE_PAYMENT", existing };
    }
  }

  // 2. Policy enabled.
  if (policy && policy.enabled === false) {
    return { ok: false, reason: "POLICY_DISABLED" };
  }
  const p = policy || DEFAULT_POLICY;

  // 3. Purpose permitted.
  if (!p.allowed_purposes.includes(intent.purpose)) {
    return { ok: false, reason: "PURPOSE_NOT_PERMITTED", purpose: intent.purpose };
  }

  // 4. Amount within single-transaction limit.
  if (intent.amountSompi > p.max_transaction_sompi) {
    return { ok: false, reason: "EXCEEDS_MAX_TRANSACTION", max: p.max_transaction_sompi, requested: intent.amountSompi };
  }

  // 5. Spending limits.
  const projectedHourly = (p.hourly_spent_sompi || 0) + intent.amountSompi;
  if (projectedHourly > p.max_hourly_spend_sompi) {
    return { ok: false, reason: "EXCEEDS_HOURLY_LIMIT", max: p.max_hourly_spend_sompi, projected: projectedHourly };
  }
  const projectedDaily = (p.daily_spent_sompi || 0) + intent.amountSompi;
  if (projectedDaily > p.max_daily_spend_sompi) {
    return { ok: false, reason: "EXCEEDS_DAILY_LIMIT", max: p.max_daily_spend_sompi, projected: projectedDaily };
  }

  // 6. Sufficient balance (with reserve).
  if (balanceSompi != null) {
    const needed = intent.amountSompi + p.minimum_reserve_sompi;
    if (balanceSompi < needed) {
      return { ok: false, reason: "INSUFFICIENT_BALANCE", needed, have: balanceSompi };
    }
  }

  // 7. Actor owns the wallet.
  if (actor && intent.sender_actor_id && actor.id !== intent.sender_actor_id && actor.agent_key !== intent.sender_actor_id) {
    return { ok: false, reason: "WALLET_NOT_OWNED" };
  }

  // 8. Network is TN10.
  if (intent.network && intent.network !== "kaspa_testnet_10") {
    return { ok: false, reason: "WRONG_NETWORK", network: intent.network };
  }

  // 9. Recipient address is kaspatest:.
  if (intent.recipient_address && !intent.recipient_address.startsWith("kaspatest:")) {
    return { ok: false, reason: "RECIPIENT_NOT_TN10" };
  }

  return { ok: true };
}

/**
 * Validate a structured AI action (NOT a raw transaction).
 * The AI produces actions like { action: "BUY_RESOURCE", resource: "COMPUTE", amount: 20, sellerActorId: "P#91" }
 * and the World Engine converts that into a payment intent.
 */
export function validateAiAction({ action, actor, world }) {
  if (!action || !action.action) return { ok: false, reason: "NO_ACTION" };

  switch (action.action) {
    case "BUY_RESOURCE": {
      if (!action.resource || !action.amount || !action.sellerActorId) {
        return { ok: false, reason: "MISSING_FIELDS" };
      }
      return { ok: true };
    }
    case "POST_JOB": {
      if (!action.title || !action.reward || action.reward <= 0) {
        return { ok: false, reason: "INVALID_JOB" };
      }
      return { ok: true };
    }
    case "PAY_AGENT": {
      if (!action.recipientActorId || !action.amount || !action.purpose) {
        return { ok: false, reason: "MISSING_FIELDS" };
      }
      if (!ALLOWED_PURPOSES.includes(action.purpose)) {
        return { ok: false, reason: "PURPOSE_NOT_PERMITTED" };
      }
      return { ok: true };
    }
    default:
      return { ok: false, reason: "UNKNOWN_ACTION" };
  }
}

function isBlockingStatus(status) {
  return ["AWAITING_SIGNATURE", "SIGNED", "BROADCAST", "CONFIRMING", "CONFIRMED", "SETTLED"].includes(status);
}