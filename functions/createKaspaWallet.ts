import * as bip39 from 'npm:@scure/bip39@1.3.0';
import { wordlist } from 'npm:@scure/bip39@1.3.0/wordlists/english';
import { HDKey } from 'npm:@scure/bip32@1.4.0';
import * as secp256k1 from 'npm:@noble/secp256k1@2.0.0';
import { bech32m } from 'npm:@scure/base@1.1.5';

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

    // Use proper Kaspa address generation for testnet
    const network = body.network || 'testnet';
    
    // Derive private key from mnemonic
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const hdkey = HDKey.fromMasterSeed(seed);
    const derivedKey = hdkey.derive("m/44'/111111'/0'/0/0");
    
    // Get private key hex
    const privateKey = Buffer.from(derivedKey.privateKey).toString('hex');
    
    // Generate public key using secp256k1
    const pubKeyBytes = secp256k1.getPublicKey(derivedKey.privateKey, true);
    
    // Convert to script public key format (P2PK script)
    const scriptPubKey = new Uint8Array(35);
    scriptPubKey[0] = 0x20; // OP_DATA_32
    scriptPubKey.set(pubKeyBytes.slice(1), 1); // 32 bytes of public key (skip compress byte)
    scriptPubKey[33] = 0xac; // OP_CHECKSIG
    
    // Hash the script public key (BLAKE2b)
    const blake2b = await crypto.subtle.digest('SHA-256', scriptPubKey);
    const scriptHash = new Uint8Array(blake2b);
    
    // Convert to 5-bit groups for bech32m
    const words = [];
    let bits = 0;
    let value = 0;
    
    // Add version byte (0)
    words.push(0);
    
    for (let i = 0; i < scriptHash.length; i++) {
      value = (value << 8) | scriptHash[i];
      bits += 8;
      
      while (bits >= 5) {
        bits -= 5;
        words.push((value >> bits) & 31);
      }
    }
    
    if (bits > 0) {
      words.push((value << (5 - bits)) & 31);
    }
    
    // Encode with correct network prefix
    const prefix = network === 'testnet' ? 'kaspatest' : 'kaspa';
    const finalAddress = bech32m.encode(prefix, words, 1000);

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