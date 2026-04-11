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
    const result = await wallet.getNewAddress({ privateKey });
    const rawAddress = result.address || result;
    
    // Always return full kaspa: address
    const address = rawAddress.startsWith('kaspa:') ? rawAddress : `kaspa:${rawAddress}`;
    
    // Validate address format
    if (!/^kaspa:[a-z0-9]{61,63}$/.test(address)) {
      console.error(`[deriveKaspaAddress] Invalid address generated: ${address} (len=${address.length})`);
      return Response.json({ error: `Invalid address format: ${address.slice(0, 30)}...` }, { status: 500 });
    }

    console.log(`[deriveKaspaAddress] Index ${idx}: ${address}`);
    return Response.json({ address, addressIndex: idx });
  } catch (error) {
    console.error('[deriveKaspaAddress] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});