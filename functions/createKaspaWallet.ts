import * as bip39 from 'npm:@scure/bip39@1.3.0';
import { wordlist } from 'npm:@scure/bip39@1.3.0/wordlists/english';

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

    const network = body.network || 'testnet';
    
    // Use kaspa-wasm library for proper address derivation
    const { PrivateKey, PublicKey, Address, NetworkType } = await import('npm:kaspa-wasm@0.13.2');
    await (await import('npm:kaspa-wasm@0.13.2')).default();
    
    // Derive private key from mnemonic using kaspa-wasm
    const kaspaNetwork = network === 'testnet' ? NetworkType.Testnet : NetworkType.Mainnet;
    
    // Convert mnemonic to seed
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    
    // Derive Kaspa private key at standard path
    const { XPrv } = await import('npm:kaspa-wasm@0.13.2');
    const xprv = new XPrv(seed);
    const derivedKey = xprv.derivePath("m/44'/111111'/0'/0/0");
    
    // Get address from derived key
    const privateKey = derivedKey.toPrivateKey();
    const publicKey = privateKey.toPublicKey();
    const address = publicKey.toAddress(kaspaNetwork);
    
    return Response.json({
      address: address.toString(),
      privateKey: privateKey.toString(),
      mnemonic,
      derivationPath: "m/44'/111111'/0'/0/0",
      network,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});