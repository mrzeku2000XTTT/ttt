import { derivePrivateKeyFromMnemonic, addressFromPrivateKey } from '../../shared/kaspaAddress.ts';

Deno.serve(async (req) => {
  try {
    const { mnemonic, addressIndex } = await req.json();
    if (!mnemonic) return Response.json({ error: 'mnemonic required' }, { status: 400 });

    const idx = addressIndex ?? 0;

    // Derive address at the requested index (receive path)
    const privateKey = derivePrivateKeyFromMnemonic(mnemonic, `m/44'/111111'/0'/0/${idx}`);
    const address = addressFromPrivateKey(privateKey, 'kaspa');

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