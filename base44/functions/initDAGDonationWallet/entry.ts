import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import * as bip39 from 'npm:@scure/bip39@1.3.0';
import { wordlist } from 'npm:@scure/bip39@1.3.0/wordlists/english';
import { KaspaWallet } from 'npm:@okxweb3/coin-kaspa@2.4.9';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check if donation wallet already exists
    const existing = await base44.asServiceRole.entities.DAGDonationWallet.filter({ is_active: true });
    if (existing.length > 0) {
      return Response.json({ 
        success: true, 
        wallet: {
          address: existing[0].kaspa_address,
          exists: true
        }
      });
    }

    // Generate new wallet
    const mnemonic = bip39.generateMnemonic(wordlist, 256); // 24 words
    const wallet = new KaspaWallet();
    const privateKey = await wallet.getDerivedPrivateKey({
      mnemonic,
      hdPath: "m/44'/111111'/0'/0/0",
    });

    const { address } = await wallet.getNewAddress({ privateKey });
    const cleanAddress = address.startsWith('kaspa:') ? address : `kaspa:${address}`;

    // Store in database (seed phrase visible to admins only via RLS)
    await base44.asServiceRole.entities.DAGDonationWallet.create({
      kaspa_address: cleanAddress,
      seed_phrase: mnemonic,
      created_at: new Date().toISOString(),
      is_active: true
    });

    return Response.json({ 
      success: true,
      wallet: {
        address: cleanAddress,
        created: true
      }
    });

  } catch (error) {
    console.error("Init wallet error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});