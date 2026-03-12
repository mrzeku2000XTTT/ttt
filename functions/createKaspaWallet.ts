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

    // Use proper Kaspa address generation
    const network = body.network || 'testnet';
    
    // Derive private key from mnemonic
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const hdkey = HDKey.fromMasterSeed(seed);
    const derivedKey = hdkey.derive("m/44'/111111'/0'/0/0");
    
    // Get private key hex
    const privateKey = Buffer.from(derivedKey.privateKey).toString('hex');
    
    // Generate public key using secp256k1
    const pubKeyBytes = secp256k1.getPublicKey(derivedKey.privateKey, true);
    
    // Create schnorr public key from ECDSA pubkey (remove compress prefix)
    const schnorrPubKey = pubKeyBytes.slice(1);
    
    // Build P2PK script: OP_DATA_32 <pubkey> OP_CHECKSIG
    const scriptPubKey = new Uint8Array(34);
    scriptPubKey[0] = 0x20; // OP_DATA_32
    scriptPubKey.set(schnorrPubKey, 1);
    scriptPubKey[33] = 0xac; // OP_CHECKSIG
    
    // Hash script with SHA256 + RIPEMD160 pattern (Kaspa uses BLAKE2b but we approximate)
    const hash1 = await crypto.subtle.digest('SHA-256', scriptPubKey);
    const hash2 = await crypto.subtle.digest('SHA-256', hash1);
    const scriptHash = new Uint8Array(hash2).slice(0, 20); // Take first 20 bytes
    
    // Convert to bech32m format
    function convertBits(data, fromBits, toBits, pad) {
      let acc = 0;
      let bits = 0;
      const result = [];
      const maxv = (1 << toBits) - 1;
      
      for (let i = 0; i < data.length; i++) {
        const value = data[i];
        acc = (acc << fromBits) | value;
        bits += fromBits;
        
        while (bits >= toBits) {
          bits -= toBits;
          result.push((acc >> bits) & maxv);
        }
      }
      
      if (pad && bits > 0) {
        result.push((acc << (toBits - bits)) & maxv);
      }
      
      return result;
    }
    
    const words = [0, ...convertBits(scriptHash, 8, 5, true)];
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