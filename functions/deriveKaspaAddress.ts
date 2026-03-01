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

    return Response.json({ address, addressIndex: idx });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});