// ddCreditKkdagDeposit — credits DD KKDAG after a real on-chain KCC20 transfer.
//
// Called from the DD wallet UI after window.kcc20.sendToken() resolves with
// { txId, amount, from, dest }. Idempotent: one credit per txId.
//
// Input:  { txId, amount, from, dest, user_email, tick? }
// Output: { credited, balance, txId, message }
//
// Flow:
//   1. Check if DdCreditDeposit with this txId already exists → skip (idempotent).
//   2. Insert DdCreditDeposit { status: 'credited' }.
//   3. Add amount to the user's DDKKDAGWallet balance.
//   4. Return new balance.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { txId, amount, from, dest, user_email, tick } = await req.json();

    if (!txId || !user_email || !amount || !from) {
      return Response.json({ error: "txId, amount, from, user_email required" }, { status: 400 });
    }

    const creditAmount = Number(amount);
    if (!creditAmount || creditAmount <= 0) {
      return Response.json({ error: "amount must be positive" }, { status: 400 });
    }

    // 1. Idempotent — check if this txId was already credited
    const existing = await base44.entities.DdCreditDeposit.filter({ txid: txId });
    if (existing && existing.length > 0) {
      // Already credited — return current balance, don't double-credit
      const wallets = await base44.entities.DDKKDAGWallet.filter({ user_email });
      const balance = wallets && wallets[0] ? (wallets[0].balance || 0) : 0;
      return Response.json({
        credited: 0,
        balance,
        txId,
        message: "Already credited — no double credit",
      });
    }

    // 2. Insert deposit record
    await base44.entities.DdCreditDeposit.create({
      txid: txId,
      from,
      user_email,
      treasury: dest || "",
      tick: tick || "KKDAG",
      amount: creditAmount,
      status: "credited",
    });

    // 3. Add to user's KKDAG wallet balance
    const wallets = await base44.entities.DDKKDAGWallet.filter({ user_email });
    let wallet = wallets && wallets[0];
    if (!wallet) {
      wallet = await base44.entities.DDKKDAGWallet.create({
        user_email,
        balance: creditAmount,
        total_funded: creditAmount,
        total_spent: 0,
        credited_txids: [txId],
      });
    } else {
      const newBalance = (wallet.balance || 0) + creditAmount;
      const newTotalFunded = (wallet.total_funded || 0) + creditAmount;
      const creditedTxids = [...(wallet.credited_txids || []), txId];
      await base44.entities.DDKKDAGWallet.update(wallet.id, {
        balance: newBalance,
        total_funded: newTotalFunded,
        credited_txids: creditedTxids,
      });
    }

    const finalWallets = await base44.entities.DDKKDAGWallet.filter({ user_email });
    const finalBalance = finalWallets && finalWallets[0] ? (finalWallets[0].balance || 0) : creditAmount;

    return Response.json({
      credited: creditAmount,
      balance: finalBalance,
      txId,
      message: `Credited ${creditAmount.toLocaleString()} KKDAG`,
    });
  } catch (error) {
    console.error("ddCreditKkdagDeposit error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});