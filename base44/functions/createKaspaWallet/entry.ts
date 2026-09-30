import * as bip39 from 'npm:@scure/bip39@1.3.0';
import { wordlist } from 'npm:@scure/bip39@1.3.0/wordlists/english';
import { DERIVATION_PATH, derivePrivateKeyFromMnemonic, addressFromPrivateKey } from '../../shared/kaspaAddress.ts';

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));

    let mnemonic;
    if (body.importMode && body.mnemonic) {
      mnemonic = body.mnemonic.trim();
      if (!bip39.validateMnemonic(mnemonic, wordlist)) {
        return Response.json({ error: 'Invalid mnemonic phrase' }, { status: 400 });
      }
    } else {
      const strength = body.wordCount === 24 ? 256 : 128;
      mnemonic = bip39.generateMnemonic(wordlist, strength);
    }

    const privateKey = derivePrivateKeyFromMnemonic(mnemonic, DERIVATION_PATH);
    const address = addressFromPrivateKey(privateKey, 'kaspa');

    // Validate
    if (!/^kaspa:[a-z0-9]{61,63}$/.test(address)) {
      console.error(`[createKaspaWallet] Invalid address: ${address} (len=${address.length})`);
      return Response.json({ error: `Generated invalid address format` }, { status: 500 });
    }

    console.log(`[createKaspaWallet] Created: ${address}`);

    return Response.json({
      address,
      privateKey,
      mnemonic,
      derivationPath: "m/44'/111111'/0'/0/0",
    });
  } catch (error) {
    console.error('[createKaspaWallet] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});