import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CLAIM_AMOUNT = 0.01; // Minimum sustainable KAS per claim
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

    // 1. Get the chest wallet
    const wallets = await base44.asServiceRole.entities.ChestWallet.filter({ is_active: true });
    if (wallets.length === 0) {
      return Response.json({ error: 'Chest not initialized yet', status: 'no_chest' }, { status: 503 });
    }

    const chestWallet = wallets[0];
    const chestAddress = chestWallet.kaspa_address;
    const mnemonic = chestWallet.seed_phrase;

    // 2. Check chest balance
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

    // 3. AI moderation of the wish
    const moderation = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a content moderator for a crypto community chest called "Ark of Covenants". A user is making a wish to receive free KAS.

Check the wish for:
1. SENSITIVE INFO: Private keys, seed phrases, mnemonics, passwords, API keys, email addresses, phone numbers, physical addresses — these MUST be stripped.
2. SPAM: Pure promotional content, repeated characters, scam links.
3. ABUSE: Hate speech, threats, illegal requests.

If sensitive info is found, REMOVE it and return the cleaned version.
If the wish is pure spam or abuse, set approved=false.

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

    // 4. Store the approved wish
    await base44.asServiceRole.entities.ChestWish.create({
      kaspa_address: normalizedAddress,
      wish,
      sanitized_wish: sanitized,
      ai_approved: true,
      ai_flags: flags,
      amount_kas: CLAIM_AMOUNT,
      status: 'approved',
    });

    // 5. Send KAS from chest wallet
    const sendResult = await base44.asServiceRole.functions.invoke('sendKaspaTransaction', {
      mnemonic,
      fromAddress: chestAddress,
      toAddress: normalizedAddress,
      amountKas: CLAIM_AMOUNT,
    });

    const txHash = sendResult?.data?.txId || sendResult?.txId;

    if (!txHash) {
      return Response.json({
        success: false,
        status: 'send_failed',
        message: 'AI approved your wish but the transaction failed. Please try again.',
        chestAddress,
      }, { status: 500 });
    }

    // 6. Update wish status
    await base44.asServiceRole.entities.ChestWish.create({
      kaspa_address: normalizedAddress,
      wish,
      sanitized_wish: sanitized,
      ai_approved: true,
      ai_flags: flags,
      amount_kas: CLAIM_AMOUNT,
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