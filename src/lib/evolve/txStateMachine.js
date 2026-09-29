/**
 * Transaction State Machine — the authoritative lifecycle of an EVOLVE payment.
 *
 *   CREATED → AWAITING_SIGNATURE → SIGNED → BROADCAST → CONFIRMING → CONFIRMED → SETTLED
 *                                                                    ↘ FAILED
 *         ↘ CANCELLED                                              ↘ EXPIRED
 *
 * World resources finalize ONLY at CONFIRMED / SETTLED.
 * A TXID means BROADCAST — it does NOT mean settlement.
 */

export const TxStatus = {
  CREATED: "CREATED",
  AWAITING_SIGNATURE: "AWAITING_SIGNATURE",
  SIGNED: "SIGNED",
  BROADCAST: "BROADCAST",
  CONFIRMING: "CONFIRMING",
  CONFIRMED: "CONFIRMED",
  SETTLED: "SETTLED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
};

/** Valid forward transitions. Anything not listed is rejected. */
const TRANSITIONS = {
  [TxStatus.CREATED]: [TxStatus.AWAITING_SIGNATURE, TxStatus.CANCELLED, TxStatus.FAILED],
  [TxStatus.AWAITING_SIGNATURE]: [TxStatus.SIGNED, TxStatus.CANCELLED, TxStatus.FAILED],
  [TxStatus.SIGNED]: [TxStatus.BROADCAST, TxStatus.FAILED],
  [TxStatus.BROADCAST]: [TxStatus.CONFIRMING, TxStatus.CONFIRMED, TxStatus.FAILED, TxStatus.EXPIRED],
  [TxStatus.CONFIRMING]: [TxStatus.CONFIRMED, TxStatus.FAILED, TxStatus.EXPIRED],
  [TxStatus.CONFIRMED]: [TxStatus.SETTLED, TxStatus.FAILED],
  [TxStatus.SETTLED]: [],
  [TxStatus.FAILED]: [],
  [TxStatus.CANCELLED]: [],
  [TxStatus.EXPIRED]: [],
};

export function canTransition(from, to) {
  const allowed = TRANSITIONS[from] || [];
  return allowed.includes(to);
}

export function transition(from, to) {
  if (!canTransition(from, to)) {
    return { ok: false, reason: `Invalid transition: ${from} → ${to}` };
  }
  return { ok: true };
}

/** True if the transaction is in a state where world resources should be held (reserved). */
export function isHolding(status) {
  return [
    TxStatus.AWAITING_SIGNATURE,
    TxStatus.SIGNED,
    TxStatus.BROADCAST,
    TxStatus.CONFIRMING,
  ].includes(status);
}

/** True if the transaction has reached final settlement — resources can transfer. */
export function isSettled(status) {
  return status === TxStatus.SETTLED;
}

/** True if the transaction definitively failed — resources must be released. */
export function isFailed(status) {
  return [TxStatus.FAILED, TxStatus.CANCELLED, TxStatus.EXPIRED].includes(status);
}

/** True if the tx is in-flight (not final yet, not failed). */
export function isPending(status) {
  return !isSettled(status) && !isFailed(status);
}

/** True if a new payment should be blocked (an existing one is already in-flight). */
export function isBlocking(status) {
  return [
    TxStatus.AWAITING_SIGNATURE,
    TxStatus.SIGNED,
    TxStatus.BROADCAST,
    TxStatus.CONFIRMING,
    TxStatus.CONFIRMED,
    TxStatus.SETTLED,
  ].includes(status);
}

/** Human-readable label for UI. */
export const statusLabel = (s) => {
  const labels = {
    [TxStatus.CREATED]: "Created",
    [TxStatus.AWAITING_SIGNATURE]: "Awaiting Signature",
    [TxStatus.SIGNED]: "Signed",
    [TxStatus.BROADCAST]: "Broadcast",
    [TxStatus.CONFIRMING]: "Confirming",
    [TxStatus.CONFIRMED]: "Confirmed",
    [TxStatus.SETTLED]: "Settled",
    [TxStatus.FAILED]: "Failed",
    [TxStatus.CANCELLED]: "Cancelled",
    [TxStatus.EXPIRED]: "Expired",
  };
  return labels[s] || s;
};

/** Color for UI status indicators. */
export const statusColor = (s) => {
  const colors = {
    [TxStatus.CREATED]: "#54657c",
    [TxStatus.AWAITING_SIGNATURE]: "#fbbf24",
    [TxStatus.SIGNED]: "#fbbf24",
    [TxStatus.BROADCAST]: "#22d3ee",
    [TxStatus.CONFIRMING]: "#22d3ee",
    [TxStatus.CONFIRMED]: "#34d399",
    [TxStatus.SETTLED]: "#34d399",
    [TxStatus.FAILED]: "#f87171",
    [TxStatus.CANCELLED]: "#7d8da3",
    [TxStatus.EXPIRED]: "#7d8da3",
  };
  return colors[s] || "#54657c";
};