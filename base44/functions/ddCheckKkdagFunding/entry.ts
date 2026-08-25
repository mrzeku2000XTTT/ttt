// ddCheckKkdagFunding — detects on-chain KAS sent from the user's KCC20 wallet
// to the DD treasury and credits KKDAG credits to their off-chain ledger.
//
// Uses the /addresses/{addr}/full-transactions endpoint (same as getKaspaUTXOs)
// with the full kaspa: prefix URL-encoded and resolve_previous_outpoints=light
// to identify senders. Credits KKDAG at 1 KAS = 1000 KKDAG.
//
// Input:  { kcc20_address, user_email }
// Output: { credited, balance, new_txids, message }

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const KKDAG_TREASURY = "kaspa:qq5yhvly6338dspa9mm24g8q6chvy6v0jww3k4dgqywh0lju5mmm5pj334ews";
const KKDAG_PER_KAS = 1000; // 1 KAS = 1000 KKDAG credits
const API_BASE = "https://api.kaspa.org";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { kcc20_address, user_email } = await req.json();

    if (!kcc20_address || !user_email) {
      return Response.json({ error: "kcc20_address and user_email required" }, { status: 400 });
    }

    // Normalize — the API expects the full kaspa: prefix, URL-encoded
    const treasuryParam = encodeURIComponent(KKDAG_TREASURY);
    const cleanSender = kcc20_address.startsWith("kaspa:") ? kcc20_address.slice(6) : kcc20_address;
    const fullSender = kcc20_address.startsWith("kaspa:") ? kcc20_address : `kaspa:${kcc20_address}`;

    // Fetch treasury full-transactions with sender resolution
    const txRes = await fetch(
      `${API_BASE}/addresses/${treasuryParam}/full-transactions?limit=50&offset=0&resolve_previous_outpoints=light`,
      { method: "GET", headers: { "Accept": "application/json" }, signal: AbortSignal.timeout(20000) }
    );
    if (!txRes.ok) {
      return Response.json({ credited: 0, message: "Treasury not reachable yet — try again in a moment" });
    }
    const txData = await txRes.json();
    const transactions = Array.isArray(txData) ? txData : (txData.transactions || []);

    // Get or create the user's KKDAG wallet
    const existing = await base44.entities.DDKKDAGWallet.filter({ user_email });
    let wallet = existing && existing[0];
    if (!wallet) {
      wallet = await base44.entities.DDKKDAGWallet.create({
        user_email,
        balance: 0,
        total_funded: 0,
        total_spent: 0,
        credited_txids: [],
      });
    }

    const alreadyCredited = new Set(wallet.credited_txids || []);

    // Find incoming transactions from the user's KCC20 address
    const incomingFromUser = [];
    for (const tx of transactions) {
      const txid = tx.transaction_id || tx.hash;
      if (!txid || alreadyCredited.has(txid)) continue;

      // Outputs to the treasury (incoming)
      const treasuryOutputs = (tx.outputs || []).filter(
        (out) => out.script_public_key?.address === KKDAG_TREASURY
      );
      if (treasuryOutputs.length === 0) continue;

      // Inputs from the user's KCC20 address (sender)
      const userInputs = (tx.inputs || []).filter((inp) => {
        const addr = inp.previous_outpoint?.script_public_key?.address ||
                     inp.previous_outpoint?.address;
        return addr === cleanSender || addr === fullSender;
      });
      if (userInputs.length === 0) continue;

      const amountSompi = treasuryOutputs.reduce((s, o) => s + (o.amount || 0), 0);
      if (amountSompi > 0) {
        incomingFromUser.push({ txid, amountSompi });
      }
    }

    if (incomingFromUser.length === 0) {
      return Response.json({ credited: 0, balance: wallet.balance, message: "No matching transactions from your KCC20 address yet" });
    }

    // Credit KKDAG for new transactions
    let totalCredited = 0;
    const allCreditedTxids = [...(wallet.credited_txids || [])];
    const matchedTxids = [];
    for (const tx of incomingFromUser) {
      const kkdag = Math.round((tx.amountSompi / 1e8) * KKDAG_PER_KAS);
      totalCredited += kkdag;
      allCreditedTxids.push(tx.txid);
      matchedTxids.push(tx.txid);
    }

    const newBalance = (wallet.balance || 0) + totalCredited;
    const newTotalFunded = (wallet.total_funded || 0) + totalCredited;
    await base44.entities.DDKKDAGWallet.update(wallet.id, {
      balance: newBalance,
      total_funded: newTotalFunded,
      credited_txids: allCreditedTxids,
    });

    return Response.json({
      credited: totalCredited,
      balance: newBalance,
      new_txids: matchedTxids,
      message: `Credited ${totalCredited.toLocaleString()} KKDAG from ${matchedTxids.length} transaction(s)`,
    });
  } catch (error) {
    console.error("ddCheckKkdagFunding error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});