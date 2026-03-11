import * as bip39 from 'npm:@scure/bip39@1.3.0';
import { HDKey } from 'npm:@scure/bip32@1.4.0';
import { KaspaWallet } from 'npm:@okxweb3/coin-kaspa@2.4.9';

Deno.serve(async (req) => {
  try {
    const { mnemonic, addressIndex } = await req.json();
    if (!mnemonic) return Response.json({ error: 'mnemonic required' }, { status: 400 });

    const wallet = new KaspaWallet();
    const idx = addressIndex ?? 0;

    const privateKey = await wallet.getDerivedPrivateKey({
      mnemonic: mnemonic.trim(),
      hdPath: `m/44'/111111'/0'/0/${idx}`,
    });
    const { address } = await wallet.getNewAddress({ privateKey });
    const cleanAddress = address.startsWith('kaspa:') ? address.slice(6) : address;

    // Derive compressed public key (33 bytes) from mnemonic using bip32
    const seed = await bip39.mnemonicToSeed(mnemonic.trim());
    const root = HDKey.fromMasterSeed(seed);
    const child = root.derive(`m/44'/111111'/0'/0/${idx}`);
    const publicKey = child.publicKey
      ? Array.from(child.publicKey).map(b => b.toString(16).padStart(2, '0')).join('')
      : null;

    // Extended public key at account level (m/44'/111111'/0')
    const accountKey = root.derive(`m/44'/111111'/0'`);
    const extendedPublicKey = accountKey.publicExtendedKey || null;

    return Response.json({ address: cleanAddress, addressIndex: idx, publicKey, extendedPublicKey });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});