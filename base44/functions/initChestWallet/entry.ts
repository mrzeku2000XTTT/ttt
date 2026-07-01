import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check if chest wallet already exists
    const existing = await base44.asServiceRole.entities.ChestWallet.filter({ is_active: true });
    if (existing.length > 0) {
      return Response.json({
        success: true,
        wallet: { address: existing[0].kaspa_address, exists: true }
      });
    }

    // Use existing createKaspaWallet function to generate a new wallet
    const walletResult = await base44.asServiceRole.functions.invoke('createKaspaWallet', { wordCount: 24 });
    const walletData = walletResult?.data || walletResult;

    if (!walletData?.address) {
      return Response.json({ error: 'Failed to generate wallet' }, { status: 500 });
    }

    await base44.asServiceRole.entities.ChestWallet.create({
      kaspa_address: walletData.address,
      seed_phrase: walletData.mnemonic,
      is_active: true,
      label: 'Community Chest',
    });

    return Response.json({
      success: true,
      wallet: { address: walletData.address, created: true }
    });
  } catch (error) {
    console.error('[initChestWallet] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});