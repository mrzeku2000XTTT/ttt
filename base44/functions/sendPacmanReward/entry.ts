import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Sends KAS from the PACMAN reward wallet to a recipient
// The bot calls this after settlement to distribute bonus rewards
// KRC-20 token transfers require a different mechanism (inscriptions),
// so this handles KAS gas/bonus payouts from the reward wallet
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const isAutomation = !!body.automation;

    if (!isAutomation) {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Admin only' }, { status: 403 });
      }
    }

    const { recipient_address, amount_kas } = body;
    if (!recipient_address || !amount_kas || amount_kas <= 0) {
      return Response.json({ error: 'recipient_address and amount_kas required' }, { status: 400 });
    }

    // Fetch the reward wallet (admin-only entity, accessed via service role)
    const wallets = await base44.asServiceRole.entities.PacmanRewardWallet.filter({ is_active: true });
    if (wallets.length === 0) {
      return Response.json({ error: 'No active reward wallet found' }, { status: 404 });
    }

    const wallet = wallets[0];
    const mnemonic = wallet.encrypted_mnemonic;
    const fromAddress = wallet.kaspa_address;

    if (!mnemonic) {
      return Response.json({ error: 'Reward wallet has no mnemonic' }, { status: 500 });
    }

    const toAddr = recipient_address.startsWith('kaspa:') ? recipient_address : `kaspa:${recipient_address}`;
    const fromAddr = fromAddress.startsWith('kaspa:') ? fromAddress : `kaspa:${fromAddress}`;

    // Send KAS using the existing transaction function
    const txRes = await base44.asServiceRole.functions.invoke('sendKaspaTransaction', {
      mnemonic: mnemonic,
      fromAddress: fromAddr,
      toAddress: toAddr,
      amountKas: amount_kas,
    });

    const txData = txRes?.data || txRes;
    if (txData?.error) {
      console.error(`PACMAN reward payout failed: ${txData.error}`);
      return Response.json({ error: txData.error }, { status: 500 });
    }

    const txId = txData?.txId || '';
    console.log(`PACMAN reward sent: ${amount_kas} KAS to ${toAddr.slice(0, 24)}... | TX: ${txId}`);

    return Response.json({
      success: true,
      tx_id: txId,
      amount_kas: amount_kas,
      from: fromAddr,
      to: toAddr,
    });
  } catch (error) {
    console.error('sendPacmanReward error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});