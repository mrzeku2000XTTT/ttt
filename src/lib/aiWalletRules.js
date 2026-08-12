/* AI Spending Wallet rules.
 * The AI wallet is a metered spending wallet — it may ONLY self-send
 * (pay for AI usage by sending KAS to its own address). Any outbound
 * transfer to a different address is rejected here, before signing.
 */
export const AI_WALLET_RULES = [
  "Can only send KAS to itself (self-send) — no outbound transfers",
  "Funded exclusively from your TTT wallet",
  "Keys stay on this device and are never sent to a server",
];

export function assertSelfSendOnly(fromAddress, toAddress) {
  const from = (fromAddress || "").trim().toLowerCase();
  const to = (toAddress || "").trim().toLowerCase();
  if (!from || !to || from !== to) {
    throw new Error("AI wallet rule: this wallet can only send KAS to itself.");
  }
  return true;
}