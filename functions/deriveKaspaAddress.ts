import { KaspaWallet } from 'npm:@okxweb3/coin-kaspa@2.4.9';

Deno.serve(async (req) => {
  try {
    const { mnemonic, addressIndex } = await req.json();
    if (!mnemonic) return Response.json({ error: 'mnemonic required' }, { status: 400 });

    const wallet = new KaspaWallet();
    const idx = addressIndex ?? 0;

    // Derive address at the requested index (receive path)
    const privateKey = await wallet.getDerivedPrivateKey({
      mnemonic: mnemonic.trim(),
      hdPath: `m/44'/111111'/0'/0/${idx}`,
    });
    const { address } = await wallet.getNewAddress({ privateKey });
    
    // Strip kaspa: prefix if present to ensure consistency
    const cleanAddress = address.startsWith('kaspa:') ? address.slice(6) : address;

    return Response.json({ address: cleanAddress, addressIndex: idx });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});