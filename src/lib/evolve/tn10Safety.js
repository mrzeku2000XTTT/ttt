// EVOLVE's civilization runs on the LOCAL simulated ledger in every environment,
// so a user can generate their AI and keep seeing it after a refresh. This ledger
// holds no real funds — it is pure simulation state.
export const localLedgerEnabled = true;
// Retained for existing imports; the local ledger is no longer dev-only.
export const isolatedMockEnabled = localLedgerEnabled;

// Real TN10 money movement is still blocked: every Scorpion payment must pass the
// backend readiness gate (evolveConfirmTick) before an intent or signature exists.
export const tn10BlockedMessage = 'TN10 payments paused — a compatible server-side signer, TN10 RPC, and authoritative settlement are required.';
export function blockedPayment() {
  return { ok: false, reason: 'TN10_RUNTIME_BLOCKED', message: tn10BlockedMessage };
}