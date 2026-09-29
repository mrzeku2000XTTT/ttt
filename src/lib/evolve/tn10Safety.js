// Mocks may run only in an explicitly opted-in, isolated development build.
// This is NOT proof of chain connectivity. Production payments remain blocked.
export const isolatedMockEnabled = import.meta.env.DEV === true && import.meta.env.VITE_EVOLVE_LEDGER_MODE === 'mock';
export const tn10BlockedMessage = 'TN10 payments paused — a compatible server-side signer, TN10 RPC, and authoritative settlement are required.';
export function blockedPayment() {
  return { ok: false, reason: 'TN10_RUNTIME_BLOCKED', message: tn10BlockedMessage };
}