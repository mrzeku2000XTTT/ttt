import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Check if wallet already exists
    const existing = await base44.asServiceRole.entities.PacmanRewardWallet.filter({ is_active: true });
    if (existing.length > 0) {
      return Response.json({ error: 'Active reward wallet already exists', address: existing[0].kaspa_address });
    }

    // Create a new Kaspa wallet
    const walletRes = await base44.asServiceRole.functions.invoke('createKaspaWallet', {});
    const walletData = walletRes?.data || walletRes;
    
    if (!walletData?.address || !walletData?.mnemonic) {
      return Response.json({ error: 'Failed to create wallet' }, { status: 500 });
    }

    // Store the mnemonic directly in the admin-only entity (RLS restricts to admin)
    await base44.asServiceRole.entities.PacmanRewardWallet.create({
      wallet_name: 'PACMAN Reward Wallet',
      kaspa_address: walletData.address,
      encrypted_mnemonic: walletData.mnemonic,
      is_active: true,
    });

    // Return the mnemonic ONCE for admin to backup — frontend must NOT persist it
    return Response.json({
      success: true,
      address: walletData.address,
      mnemonic_backup: walletData.mnemonic,
      message: 'SAVE THIS MNEMONIC NOW. It will never be shown again on the frontend.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});