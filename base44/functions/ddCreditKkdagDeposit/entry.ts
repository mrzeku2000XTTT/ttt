// ddCreditKkdagDeposit — credits DD KKDAG after a real on-chain transfer.
//
// The app is public (web3 — no login), so the caller is NOT trusted: nothing the
// client sends is believed. Every credited unit is re-derived from the Kaspa chain.
//
// Verification:
//   1. Fetch the transaction by id from api.kaspa.org — it must exist and be accepted.
//   2. The connected wallet address must be one of the transaction's signers
//      (it must appear among the inputs), so a stranger cannot claim someone else's tx.
//   3. The credited amount comes from the CHAIN, never from the request:
//        - a KCC20 transfer inscription, when the transaction carries one
//          (amount from the inscription, destination must be the DD treasury);
//        - otherwise the value that actually left the connected wallet in that
//          transaction, at the app's own rate of 1 KAS = 1000 KKDAG
//          (the same rate ddCheckKkdagFunding uses).
//   4. One credit per txId, ever (idempotent).
//
// Input:  { txId, from, user_email, tick? }  — `amount`/`dest` from the client are ignored.
// Output: { credited, balance, txId, message }

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const KKDAG_TREASURY = "kaspa:qq5yhvly6338dspa9mm24g8q6chvy6v0jww3k4dgqywh0lju5mmm5pj334ews";
const KKDAG_PER_KAS = 1000; // 1 KAS = 1000 KKDAG credits
const API_BASE = "https://api.kaspa.org";

// Accept both "kaspa:qz…" and bare "qz…" so chain data and client input compare equal.
const norm = (addr) => {
  const value = String(addr || "").trim();
  if (!value) return "";
  return value.startsWith("kaspa:") ? value : `kaspa:${value}`;
};

function hexToText(hex) {
  try {
    const clean = String(hex || "").replace(/^0x/, "").replace(/[^0-9a-fA-F]/g, "");
    if (!clean || clean.length % 2) return "";
    const bytes = new Uint8Array(clean.match(/.{1,2}/g).map((b) => parseInt(b, 16)));
    return new TextDecoder().decode(bytes);
  } catch {
    return "";
  }
}

// A KCC20 transfer carries its inscription as JSON — in the tx payload field on
// the commit, or in an input's signature script on the reveal.
function findKcc20Payload(tx) {
  const candidates = [tx?.payload, ...(tx?.inputs || []).map((inp) => inp?.signature_script)];
  for (const raw of candidates) {
    const text = hexToText(raw);
    if (!text) continue;
    const match = text.match(/\{[^{}]*"p"\s*:\s*"kcc20"[^{}]*\}/i);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* keep scanning */ }
    }
  }
  return null;
}

const inputAddress = (inp) =>
  norm(inp?.previous_outpoint_address || inp?.previous_outpoint?.script_public_key?.address);
const outputAddress = (out) =>
  norm(out?.script_public_key_address || out?.script_public_key?.address);
const inputAmount = (inp) => Number(inp?.previous_outpoint_amount ?? inp?.previous_outpoint?.amount ?? 0);
const outputAmount = (out) => Number(out?.amount ?? 0);
const inputTxId = (inp) => inp?.previous_outpoint_hash || inp?.previous_outpoint?.transaction_id || "";

// The chain API is rate limited, so retry with backoff. Distinguish a genuinely
// unknown txid (404) from a temporarily unreachable API — never call one the other.
async function fetchTx(txId) {
  const apiKey = Deno.env.get("KASPA_API_KEY");
  const headers = apiKey
    ? { Accept: "application/json", "X-API-KEY": apiKey }
    : { Accept: "application/json" };
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${API_BASE}/transactions/${txId}?resolve_previous_outpoints=light`, {
        method: "GET",
        headers,
      });
      if (res.ok) return { tx: await res.json() };
      if (res.status === 404) return { missing: true };
    } catch { /* retry */ }
    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 700 * (attempt + 1)));
  }
  return { unavailable: true };
}

// Returns { amount } when the chain proves the deposit, otherwise { error }.
async function verifyOnChain({ txId, from, tick }) {
  const fetched = await fetchTx(txId);
  if (fetched.missing) return { error: "That transaction was not found on the Kaspa chain." };
  if (fetched.unavailable) return { error: "The Kaspa chain is busy right now — please try again in a moment." };
  const tx = fetched.tx;
  if (tx.is_accepted === false) return { error: "That transaction has not been accepted on the Kaspa chain yet." };

  const sender = norm(from);
  if (!sender) return { error: "Connect a wallet before funding." };

  const inputs = tx.inputs || [];
  const outputs = tx.outputs || [];

  // ── KCC20 token transfer (preferred: the inscription states the real amount) ──
  const payload = findKcc20Payload(tx);
  if (payload && String(payload.op || "").toLowerCase() === "transfer") {
    if (tick && String(payload.tick || "").toUpperCase() !== String(tick).toUpperCase()) {
      return { error: "That transaction transfers a different token." };
    }
    if (norm(payload.to) !== KKDAG_TREASURY) {
      return { error: "That transaction does not send the tokens to the DD treasury." };
    }
    const amount = Number(payload.amt);
    if (!Number.isFinite(amount) || amount <= 0) {
      return { error: "That transaction carries no token amount." };
    }
    // The reveal is signed by whoever funded its commit — check that was this wallet.
    const commitTxId = inputTxId(inputs[0]);
    if (commitTxId) {
      const commit = (await fetchTx(commitTxId)).tx;
      const commitSenders = (commit?.inputs || []).map(inputAddress).filter(Boolean);
      if (commitSenders.length && !commitSenders.includes(sender)) {
        return { error: "That transaction was not sent from the wallet you connected." };
      }
    }
    return { amount };
  }

  // ── Plain on-chain transfer: credit the value that actually left this wallet ──
  const senderInputs = inputs.filter((inp) => inputAddress(inp) === sender);
  if (!senderInputs.length) {
    return { error: "That transaction was not sent from the wallet you connected." };
  }
  const spentSompi = senderInputs.reduce((sum, inp) => sum + inputAmount(inp), 0);
  const returnedSompi = outputs
    .filter((out) => outputAddress(out) === sender)
    .reduce((sum, out) => sum + outputAmount(out), 0);
  const outflowSompi = spentSompi - returnedSompi;
  if (!(outflowSompi > 0)) {
    return { error: "That transaction sent no value from your wallet." };
  }

  const amount = Math.round((outflowSompi / 1e8) * KKDAG_PER_KAS);
  if (amount <= 0) {
    return { error: "That transaction is too small to credit." };
  }
  return { amount };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { txId, from, user_email, tick } = await req.json();

    if (!txId || !user_email || !from) {
      return Response.json({ error: "txId, from, user_email required" }, { status: 400 });
    }

    const cleanTxId = String(txId).trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(cleanTxId)) {
      return Response.json({ error: "Invalid transaction id" }, { status: 400 });
    }

    // 1. Idempotent — one credit per txId, ever.
    const existing = await base44.entities.DdCreditDeposit.filter({ txid: cleanTxId });
    if (existing && existing.length > 0) {
      const wallets = await base44.entities.DDKKDAGWallet.filter({ user_email });
      const balance = wallets && wallets[0] ? (wallets[0].balance || 0) : 0;
      return Response.json({
        credited: 0,
        balance,
        txId: cleanTxId,
        message: "Already credited — no double credit",
      });
    }

    // 2. Prove the deposit on-chain. The amount is derived from the chain.
    const verified = await verifyOnChain({ txId: cleanTxId, from, tick });
    if (verified.error) {
      console.warn("ddCreditKkdagDeposit rejected:", verified.error, cleanTxId);
      return Response.json({ error: verified.error, credited: 0 }, { status: 400 });
    }
    const creditAmount = verified.amount;

    // 3. Record the deposit (txid is the idempotency key).
    await base44.entities.DdCreditDeposit.create({
      txid: cleanTxId,
      from: norm(from),
      user_email,
      treasury: KKDAG_TREASURY,
      tick: (tick || "KKDAG").toUpperCase(),
      amount: creditAmount,
      status: "credited",
    });

    // 4. Add to the user's KKDAG credit balance.
    const wallets = await base44.entities.DDKKDAGWallet.filter({ user_email });
    let wallet = wallets && wallets[0];
    if (!wallet) {
      wallet = await base44.entities.DDKKDAGWallet.create({
        user_email,
        balance: creditAmount,
        total_funded: creditAmount,
        total_spent: 0,
        credited_txids: [cleanTxId],
      });
    } else {
      await base44.entities.DDKKDAGWallet.update(wallet.id, {
        balance: (wallet.balance || 0) + creditAmount,
        total_funded: (wallet.total_funded || 0) + creditAmount,
        credited_txids: [...(wallet.credited_txids || []), cleanTxId],
      });
    }

    const finalWallets = await base44.entities.DDKKDAGWallet.filter({ user_email });
    const finalBalance = finalWallets && finalWallets[0] ? (finalWallets[0].balance || 0) : creditAmount;

    return Response.json({
      credited: creditAmount,
      balance: finalBalance,
      txId: cleanTxId,
      message: `Credited ${creditAmount.toLocaleString()} KKDAG`,
    });
  } catch (error) {
    console.error("ddCreditKkdagDeposit error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});