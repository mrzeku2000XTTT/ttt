/**
 * evolvePayment — orchestrates the EVOLVE economic flow through Scorpion.
 *
 *   EVOLVE BUILDS → SCORPION SIGNS → KASPA TN10 BROADCASTS → EVOLVE OBSERVES TX
 *   → WORLD ENGINE SETTLES ACTION
 *
 * EVOLVE determines who pays, who receives, the amount, and the economic purpose.
 * Scorpion only approves and signs. We NEVER auto-sign human transactions.
 *
 * Game resources transfer ONLY after successful settlement (txid recorded + confirmed).
 * If the user cancels in Scorpion, reservations are released and nothing transfers.
 */

/**
 * Execute a simple KAS payment through Scorpion's sendKaspa (user-confirmed).
 * Returns { ok, txId } on broadcast, or { ok:false, reason } on cancel/failure.
 *
 * `onPreview` is called BEFORE opening Scorpion so the UI can show the review sheet.
 * `onBroadcast` is called with the txId once Scorpion returns it.
 */
export async function payWithScorpion({ wallet, intent, onPreview, onBroadcast }) {
  if (!wallet?.isTN10) {
    return { ok: false, reason: "WALLET_NOT_TN10" };
  }
  if (!intent || !intent.toAddress || !intent.amountSompi) {
    return { ok: false, reason: "BAD_INTENT" };
  }
  // Show the review sheet in EVOLVE before opening Scorpion.
  if (onPreview) onPreview(intent);

  wallet.setConnState("SIGNING");
  wallet.setBusy(true);
  let result;
  try {
    result = await wallet.adapter.sendKaspa({
      to: intent.toAddress,
      amountSompi: intent.amountSompi,
    });
  } catch (e) {
    wallet.setConnState("CONNECTED_TN10");
    wallet.setBusy(false);
    // User cancelled or rejected in Scorpion.
    const reason = e?.message?.toLowerCase?.().includes("reject") ? "USER_CANCELLED" : "SIGN_FAILED";
    return { ok: false, reason, error: e };
  }
  const { txId } = result;
  wallet.setConnState("BROADCASTING");
  if (onBroadcast) onBroadcast(txId);
  wallet.setConnState("CONNECTED_TN10");
  wallet.setBusy(false);
  // Refresh balance after a short delay so the broadcast settles.
  setTimeout(() => wallet.silentRefresh(wallet.address).catch(() => {}), 1500);
  return { ok: true, txId };
}

/**
 * Record a broadcast transaction to the EvolveChainTx entity for settlement tracking.
 * The confirmation worker (engine tick) updates status to CONFIRMED.
 */
export async function recordChainTx({
  base44,
  experimentId,
  txId,
  sender,
  recipient,
  amountSompi,
  purpose,
  worldRef,
  day,
}) {
  if (!base44?.entities?.EvolveChainTx) return null;
  try {
    return await base44.entities.EvolveChainTx.create({
      experiment_id: experimentId || "",
      txid: txId,
      network: "kaspa_testnet_10",
      provider: "SCORPION",
      sender_actor_id: sender?.actorId || "",
      sender_code: sender?.code || "",
      sender_address: sender?.address || "",
      recipient_actor_id: recipient?.actorId || "",
      recipient_code: recipient?.code || "",
      recipient_address: recipient?.address || "",
      amount_sompi: Number(amountSompi.toString()),
      purpose,
      world_ref: worldRef || "",
      status: "BROADCAST",
      confirmations: 0,
      day: day || 0,
    });
  } catch (e) {
    console.warn("EVOLVE: could not record chain tx", e);
    return null;
  }
}

/**
 * Full economic settlement for a player action that costs KAS.
 *
 * 1. Reserve the game-side resource (caller does this before calling).
 * 2. Show preview.
 * 3. Scorpion signs + broadcasts.
 * 4. Record txid.
 * 5. On success, settle the world action (onSettle callback).
 * 6. On cancel/failure, release the reservation (onRelease callback).
 */
export async function settlePlayerPayment({
  wallet,
  base44,
  experimentId,
  intent, // { toAddress, amountSompi, purpose, worldRef, sender, recipient }
  onSettle,
  onRelease,
  onPreview,
  onBroadcast,
}) {
  const res = await payWithScorpion({ wallet, intent, onPreview, onBroadcast });
  if (!res.ok) {
    if (onRelease) onRelease(res);
    return res;
  }
  await recordChainTx({
    base44,
    experimentId,
    txId: res.txId,
    sender: intent.sender,
    recipient: intent.recipient,
    amountSompi: intent.amountSompi,
    purpose: intent.purpose,
    worldRef: intent.worldRef,
    day: intent.day,
  });
  if (onSettle) onSettle(res.txId);
  return { ok: true, txId: res.txId };
}