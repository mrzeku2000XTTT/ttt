import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CLAIM_AMOUNT = 0.2; // KAS per approved wish — minimum practical amount (smaller outputs are rejected by Kaspa's storage mass rules)
const KASPA_API = 'https://api.kaspa.org';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const { kaspa_address, wish } = body;
    if (!kaspa_address || !wish) {
      return Response.json({ error: 'Address and wish are required' }, { status: 400 });
    }

    const normalizedAddress = kaspa_address.startsWith('kaspa:') ? kaspa_address : `kaspa:${kaspa_address}`;

    // 0. Server-side 24h per-address cooldown check
    const COOLDOWN_MS = 24 * 60 * 60 * 1000;
    const recentClaims = await base44.asServiceRole.entities.ChestWish.filter({
      kaspa_address: normalizedAddress,
      status: 'sent',
    }, '-created_date', 5);

    if (recentClaims.length > 0) {
      const lastClaim = new Date(recentClaims[0].created_date).getTime();
      const elapsed = Date.now() - lastClaim;
      if (elapsed < COOLDOWN_MS) {
        const hoursLeft = Math.ceil((COOLDOWN_MS - elapsed) / (60 * 60 * 1000));
        return Response.json({
          success: false,
          status: 'cooldown',
          message: `Already claimed. Try again in ~${hoursLeft}h.`,
          hoursLeft,
        }, { status: 429 });
      }
    }

    // 1. Get the chest wallet
    const wallets = await base44.asServiceRole.entities.ChestWallet.filter({ is_active: true });
    if (wallets.length === 0) {
      return Response.json({ error: 'Chest not initialized yet', status: 'no_chest' }, { status: 503 });
    }

    const chestWallet = wallets[0];
    const chestAddress = chestWallet.kaspa_address;
    const mnemonic = chestWallet.seed_phrase;

    // 2. Check chest balance and UTXO health
    let chestBalance = 0;
    try {
      const res = await fetch(`${KASPA_API}/addresses/${chestAddress}/balance`, {
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        const data = await res.json();
        chestBalance = data.balance ? parseInt(data.balance) / 1e8 : 0;
      }
    } catch {}

    if (chestBalance < CLAIM_AMOUNT + 0.001) {
      return Response.json({
        error: 'The chest is empty. Donations needed!',
        status: 'empty',
        chestAddress,
        chestBalance,
      }, { status: 503 });
    }

    // 2b. Pre-check UTXO sizes — Kaspa rejects transactions whose storage mass
    // exceeds 500,000. Storage mass ≈ total_output_sompi / 500, so any single
    // UTXO over ~2.5 KAS is unspendable. We need multiple small UTXOs.
    let utxos = [];
    try {
      const utxoRes = await fetch(`${KASPA_API}/addresses/${chestAddress}/utxos`, {
        signal: AbortSignal.timeout(10000),
      });
      if (utxoRes.ok) utxos = await utxoRes.json();
    } catch {}

    const MAX_SPENDABLE_SOMPI = 500000n * 500n; // 250,000,000 sompi = 2.5 KAS
    const spendableUtxos = utxos.filter(u => BigInt(u.utxoEntry.amount) <= MAX_SPENDABLE_SOMPI);
    if (utxos.length > 0 && spendableUtxos.length === 0) {
      const largestUtxo = utxos.reduce((max, u) => Number(u.utxoEntry.amount) > Number(max.utxoEntry.amount) ? u : max);
      return Response.json({
        success: false,
        status: 'utxo_too_large',
        message: 'Chest UTXOs are too large for Kaspa\'s transaction mass limit. An admin needs to send smaller donations (under 2.5 KAS each) to the chest address to create spendable UTXOs.',
        chestAddress,
        chestBalance,
        largestUtxoKas: Number(largestUtxo.utxoEntry.amount) / 1e8,
      }, { status: 503 });
    }

    // 3. AI moderation of the wish
    const moderation = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a content moderator for a crypto community chest called "Ark of Covenants". A user is making a wish to receive free KAS.

This is a LEGITIMATE use case — people describe what they'll do with the KAS (marketing, content creation, learning, tipping, etc). Only reject for the following:

1. SENSITIVE INFO: Private keys, seed phrases, mnemonics, passwords, API keys — strip these from the wish but DO NOT reject for them.
2. SCAM LINKS: URLs to phishing sites, fake giveaways, or scam projects — reject.
3. ABUSE: Hate speech, threats, illegal activity, targeted harassment — reject.
4. BOT SPAM: Gibberish, repeated characters (e.g. "aaaaaa"), or empty/near-empty content — reject.

DO NOT reject for: promotional language, mentioning projects or products, expressing enthusiasm, or describing how KAS will be used for content/marketing/education. These are all valid wishes.

Return JSON: { "approved": boolean, "sanitized_wish": "cleaned version", "flags": ["issues"], "reason": "brief explanation" }

User's wish: "${wish}"`,
      response_json_schema: {
        type: 'object',
        properties: {
          approved: { type: 'boolean' },
          sanitized_wish: { type: 'string' },
          flags: { type: 'array', items: { type: 'string' } },
          reason: { type: 'string' },
        },
        required: ['approved', 'sanitized_wish'],
      },
    });

    const approved = moderation?.approved !== false;
    const sanitized = moderation?.sanitized_wish || wish;
    const flags = moderation?.flags || [];
    const reason = moderation?.reason || '';

    if (!approved) {
      await base44.asServiceRole.entities.ChestWish.create({
        kaspa_address: normalizedAddress,
        wish,
        sanitized_wish: sanitized,
        ai_approved: false,
        ai_flags: flags,
        amount_kas: CLAIM_AMOUNT,
        status: 'flagged',
      });

      return Response.json({
        success: false,
        status: 'flagged',
        message: reason || 'Wish was not approved by AI moderation.',
        chestAddress,
      });
    }

    // 4. Store the approved wish (single record, updated after send)
    const wishRecord = await base44.asServiceRole.entities.ChestWish.create({
      kaspa_address: normalizedAddress,
      wish,
      sanitized_wish: sanitized,
      ai_approved: true,
      ai_flags: flags,
      amount_kas: CLAIM_AMOUNT,
      status: 'approved',
    });

    // 5. Send KAS from chest wallet (real transaction signing)
    let sendResult;
    try {
      sendResult = await base44.asServiceRole.functions.invoke('sendKaspaTransaction', {
        mnemonic,
        fromAddress: chestAddress,
        toAddress: normalizedAddress,
        amountKas: CLAIM_AMOUNT,
      });
    } catch (sendErr) {
      const sendErrDetail = sendErr?.response?.data?.error || sendErr?.response?.data?.message || sendErr?.message || String(sendErr);
      console.error('[submitChestWish] sendKaspaTransaction threw:', sendErrDetail, JSON.stringify(sendErr?.response?.data));
      await base44.asServiceRole.entities.ChestWish.update(wishRecord.id, {
        status: 'failed',
      });
      return Response.json({
        success: false,
        status: 'send_failed',
        message: `Transaction failed: ${sendErrDetail}`,
        chestAddress,
      }, { status: 500 });
    }

    const txHash = sendResult?.data?.txId || sendResult?.txId;

    if (!txHash) {
      await base44.asServiceRole.entities.ChestWish.update(wishRecord.id, {
        status: 'failed',
      });
      return Response.json({
        success: false,
        status: 'send_failed',
        message: 'AI approved your wish but the transaction failed. Please try again.',
        chestAddress,
      }, { status: 500 });
    }

    // 6. Update wish record to sent with tx hash
    await base44.asServiceRole.entities.ChestWish.update(wishRecord.id, {
      tx_hash: txHash,
      status: 'sent',
    });

    return Response.json({
      success: true,
      status: 'sent',
      txHash,
      amount: CLAIM_AMOUNT,
      chestAddress,
      sanitized_wish: sanitized,
    });
  } catch (error) {
    console.error('[submitChestWish] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});