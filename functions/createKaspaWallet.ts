import * as bip39 from 'npm:@scure/bip39@1.3.0';
import { wordlist } from 'npm:@scure/bip39@1.3.0/wordlists/english';
import { PrivateKey, PublicKey, Address, XPrivateKey } from 'npm:@kaspa/wallet@0.1.0';

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

    // Use Kaspa WASM SDK for proper network-specific address generation
    const network = body.network || 'testnet';
    const networkId = network === 'testnet' ? 'testnet-11' : 'mainnet';
    
    // Derive private key from mnemonic using Kaspa SDK
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const xprv = new XPrivateKey(seed, networkId);
    const derivedKey = xprv.derivePath("m/44'/111111'/0'/0/0");
    
    // Generate address with proper network encoding
    const privateKey = derivedKey.toString();
    const privKeyObj = new PrivateKey(privateKey);
    const publicKey = privKeyObj.toPublicKey();
    const finalAddress = publicKey.toAddress(networkId).toString();

    return Response.json({
      address: finalAddress,
      privateKey,
      mnemonic,
      derivationPath: "m/44'/111111'/0'/0/0",
      network,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});