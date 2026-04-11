import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Sends PACMAN KRC-20 tokens from the reward wallet to a recipient
// Uses our working krc20Transfer commit-reveal protocol
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

    const { recipient_address, amount_pacman, ticker = 'PACMAN', decimals = 8 } = body;
    if (!recipient_address || !amount_pacman || amount_pacman <= 0) {
      return Response.json({ error: 'recipient_address and amount_pacman required' }, { status: 400 });
    }

    // Fetch the active reward wallet
    const wallets = await base44.asServiceRole.entities.PacmanRewardWallet.filter({ is_active: true });
    if (wallets.length === 0) {
      return Response.json({ error: 'No active PACMAN reward wallet found' }, { status: 404 });
    }

    const wallet = wallets[0];
    const mnemonic = wallet.encrypted_mnemonic;
    const fromAddress = wallet.kaspa_address;

    if (!mnemonic) {
      return Response.json({ error: 'Reward wallet has no mnemonic' }, { status: 500 });
    }

    const toAddr = recipient_address.startsWith('kaspa:') ? recipient_address : `kaspa:${recipient_address}`;
    const fromAddr = fromAddress.startsWith('kaspa:') ? fromAddress : `kaspa:${fromAddress}`;

    console.log(`[KRC20 Reward] Sending ${amount_pacman} ${ticker} to ${toAddr.slice(0, 30)}...`);

    // Use our krc20Transfer function (commit-reveal protocol)
    const res = await base44.asServiceRole.functions.invoke('krc20Transfer', {
      action: 'transfer',
      mnemonic: mnemonic,
      fromAddress: fromAddr,
      toAddress: toAddr,
      amount: amount_pacman.toString(),
      ticker: ticker,
      decimals: decimals,
    });

    const data = res?.data || res;

    if (data?.error) {
      console.error(`[KRC20 Reward] Failed: ${data.error}`);
      return Response.json({
        success: false,
        error: data.error,
        phase: data.phase || 'unknown',
        commitTxId: data.commitTxId || null,
      }, { status: 500 });
    }

    console.log(`[KRC20 Reward] ✓ ${amount_pacman} ${ticker} sent to ${toAddr.slice(0, 24)}...`);
    console.log(`[KRC20 Reward] Commit TX: ${data.commitTxId || 'n/a'}`);
    console.log(`[KRC20 Reward] Reveal TX: ${data.revealTxId || 'n/a'}`);

    return Response.json({
      success: true,
      ticker,
      amount: amount_pacman,
      from: fromAddr,
      to: toAddr,
      commitTxId: data.commitTxId || '',
      revealTxId: data.revealTxId || '',
      phase: data.phase || 'complete',
    });
  } catch (error) {
    console.error('[KRC20 Reward] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});