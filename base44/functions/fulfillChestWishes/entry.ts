import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const KASPA_API = 'https://api.kaspa.org';
const CLAIM_AMOUNT = 2; // KAS per wish
const MAX_PAYOUTS_PER_RUN = 5;
const MIN_CHEST_BALANCE = 5;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get chest wallet
    const chestWallets = await base44.asServiceRole.entities.ChestWallet.filter({ is_active: true });
    if (chestWallets.length === 0) {
      return Response.json({ error: 'No chest wallet found' }, { status: 500 });
    }
    const chest = chestWallets[0];

    // Check chest balance
    let chestBalance = 0;
    try {
      const balRes = await fetch(`${KASPA_API}/addresses/${chest.kaspa_address}/balance`, { signal: AbortSignal.timeout(10000) });
      if (balRes.ok) {
        const balData = await balRes.json();
        chestBalance = Number(balData.balance || 0) / 1e8;
      }
    } catch {}

    if (chestBalance < MIN_CHEST_BALANCE) {
      return Response.json({
        success: true,
        message: 'Chest balance too low to fulfill wishes',
        chestBalance,
        fulfilled: 0,
      });
    }

    // Find approved but unsent wishes
    const pendingWishes = await base44.asServiceRole.entities.ChestWish.filter({
      ai_approved: true,
      status: 'approved',
    }, '-created_date', 50);

    if (pendingWishes.length === 0) {
      return Response.json({
        success: true,
        message: 'No pending wishes to fulfill',
        chestBalance,
        fulfilled: 0,
      });
    }

    // Shuffle and pick random wishes
    const shuffled = [...pendingWishes].sort(() => Math.random() - 0.5);
    const toFulfill = shuffled.slice(0, Math.min(MAX_PAYOUTS_PER_RUN, Math.floor(chestBalance / CLAIM_AMOUNT)));

    const results = [];
    for (const wish of toFulfill) {
      try {
        const sendResult = await base44.asServiceRole.functions.invoke('sendKaspaTransaction', {
          mnemonic: chest.seed_phrase,
          fromAddress: chest.kaspa_address,
          toAddress: wish.kaspa_address,
          amountKas: CLAIM_AMOUNT,
        });

        const txId = sendResult?.data?.txId || sendResult?.data?.transactionId;

        if (sendResult?.data?.success || txId) {
          await base44.asServiceRole.entities.ChestWish.update(wish.id, {
            status: 'sent',
            tx_hash: txId || '',
          });
          results.push({ wishId: wish.id, success: true, txHash: txId });
        } else {
          results.push({ wishId: wish.id, success: false, error: 'Send failed' });
        }
      } catch (err) {
        results.push({ wishId: wish.id, success: false, error: err.message });
      }
    }

    const fulfilled = results.filter(r => r.success).length;

    return Response.json({
      success: true,
      chestBalance,
      fulfilled,
      attempted: toFulfill.length,
      results,
    });
  } catch (error) {
    console.error('[fulfillChestWishes] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});