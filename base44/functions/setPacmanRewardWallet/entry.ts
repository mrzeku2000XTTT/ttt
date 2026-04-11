import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Admin-only: saves a Terra wallet as the PACMAN KRC-20 reward wallet
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { wallet_name, kaspa_address, encrypted_mnemonic } = await req.json();
    if (!kaspa_address || !encrypted_mnemonic) {
      return Response.json({ error: 'kaspa_address and encrypted_mnemonic required' }, { status: 400 });
    }

    // Deactivate any existing active reward wallets
    const existing = await base44.asServiceRole.entities.PacmanRewardWallet.filter({ is_active: true });
    for (const w of existing) {
      await base44.asServiceRole.entities.PacmanRewardWallet.update(w.id, { is_active: false });
    }

    // Create new active reward wallet
    const wallet = await base44.asServiceRole.entities.PacmanRewardWallet.create({
      wallet_name: wallet_name || 'PACMAN Reward Wallet',
      kaspa_address,
      encrypted_mnemonic,
      is_active: true,
    });

    console.log(`[setPacmanRewardWallet] Set reward wallet: ${kaspa_address.slice(0, 24)}...`);

    return Response.json({
      success: true,
      wallet: {
        id: wallet.id,
        kaspa_address: wallet.kaspa_address,
        wallet_name: wallet.wallet_name,
      },
    });
  } catch (error) {
    console.error('[setPacmanRewardWallet] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});