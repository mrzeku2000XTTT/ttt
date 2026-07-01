import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import * as bip39 from 'npm:@scure/bip39@1.3.0';
import { wordlist } from 'npm:@scure/bip39@1.3.0/wordlists/english';

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
        address: existing[0].kaspa_address,
        existed: true,
      });
    }

    // Generate new 24-word wallet
    const mnemonic = bip39.generateMnemonic(wordlist, 256);
    const { KaspaWallet } = await import('npm:@okxweb3/coin-kaspa@1.0.6');
    const wallet = new KaspaWallet();
    const privateKey = await wallet.getDerivedPrivateKey({
      mnemonic,
      hdPath: "m/44'/111111'/0'/0/0",
    });
    const { address } = await wallet.getNewAddress({ privateKey });
    const cleanAddress = address.startsWith('kaspa:') ? address : `kaspa:${address}`;

    await base44.asServiceRole.entities.ChestWallet.create({
      kaspa_address: cleanAddress,
      seed_phrase: mnemonic,
      is_active: true,
      created_at: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      address: cleanAddress,
      existed: false,
    });
  } catch (error) {
    console.error('[initChestWallet] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});