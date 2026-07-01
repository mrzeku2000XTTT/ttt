import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const KASPA_API = 'https://api.kaspa.org';
const CLAIM_AMOUNT = 2; // KAS per fulfilled wish
const MIN_CHEST_BALANCE = 5; // Don't send if chest below this

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { kaspa_address, wish } = body;

    if (!kaspa_address || !wish) {
      return Response.json({ error: 'Address and wish are required' }, { status: 400 });
    }

    const normalizedAddress = kaspa_address.startsWith('kaspa:') ? kaspa_address : `kaspa:${kaspa_address}`;

    // Get chest wallet
    const chestWallets = await base44.asServiceRole.entities.ChestWallet.filter({ is_active: true });
    if (chestWallets.length === 0) {
      return Response.json({ error: 'Chest wallet not initialized. Admin must run initChestWallet.' }, { status: 500 });
    }
    const chest = chestWallets[0];

    // Get chest balance
    let chestBalance = 0;
    try {
      const balRes = await fetch(`${KASPA_API}/addresses/${chest.kaspa_address}/balance`, { signal: AbortSignal.timeout(10000) });
      if (balRes.ok) {
        const balData = await balRes.json();
        chestBalance = Number(balData.balance || 0) / 1e8;
      }
    } catch {}

    // AI moderation of the wish
    const moderation = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a content moderator for a crypto community chest. A user is making a wish to receive free KAS.

Check the wish for:
1. SENSITIVE INFO: Private keys, seed phrases, mnemonics, passwords, API keys, email addresses, phone numbers, physical addresses — strip these from the stored wish.
2. SPAM: Pure promotional content, repeated characters, scam links.
3. ABUSE: Hate speech, threats, illegal requests.

If sensitive info is found, REMOVE it and return the cleaned version.
If pure spam or abuse, set approved=false.

Return JSON:
{
  "approved": boolean,
  "sanitized_wish": "cleaned version with sensitive info removed",
  "flags": ["list of issues found"],
  "reason": "brief explanation"
}

User's wish: "${wish}"`,
      response_json_schema: {
        type: "object",
        properties: {
          approved: { type: "boolean" },
          sanitized_wish: { type: "string" },
          flags: { type: "array", items: { type: "string" } },
          reason: { type: "string" },
        },
        required: ["approved", "sanitized_wish"],
      },
    });

    const approved = moderation?.approved !== false;
    const sanitized = moderation?.sanitized_wish || wish;
    const flags = moderation?.flags || [];
    const reason = moderation?.reason || '';

    // Store the wish
    const wishRecord = await base44.asServiceRole.entities.ChestWish.create({
      kaspa_address: normalizedAddress,
      wish: wish,
      sanitized_wish: sanitized,
      ai_approved: approved,
      ai_flags: flags,
      amount_kas: CLAIM_AMOUNT,
      status: approved ? 'approved' : 'flagged',
    });

    if (!approved) {
      return Response.json({
        success: false,
        approved: false,
        reason: reason || 'Wish not approved by AI moderation.',
        flags,
      });
    }

    // Try to send KAS if chest has enough funds
    if (chestBalance < MIN_CHEST_BALANCE) {
      return Response.json({
        success: true,
        approved: true,
        sent: false,
        message: 'Your wish has been approved! The chest is currently refilling. KAS will be sent soon.',
        chestBalance,
        wishId: wishRecord.id,
      });
    }

    // Send KAS from chest wallet
    const sendResult = await base44.asServiceRole.functions.invoke('sendKaspaTransaction', {
      mnemonic: chest.seed_phrase,
      fromAddress: chest.kaspa_address,
      toAddress: normalizedAddress,
      amountKas: CLAIM_AMOUNT,
    });

    const txId = sendResult?.data?.txId || sendResult?.data?.transactionId;

    if (sendResult?.data?.success || txId) {
      await base44.asServiceRole.entities.ChestWish.update(wishRecord.id, {
        status: 'sent',
        tx_hash: txId || '',
      });

      return Response.json({
        success: true,
        approved: true,
        sent: true,
        txHash: txId,
        amount: CLAIM_AMOUNT,
        chestBalance,
      });
    } else {
      return Response.json({
        success: true,
        approved: true,
        sent: false,
        message: 'Wish approved! KAS will be sent shortly.',
        chestBalance,
        wishId: wishRecord.id,
      });
    }
  } catch (error) {
    console.error('[submitChestWish] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});