import * as bip39 from 'npm:@scure/bip39@1.3.0';
import { wordlist } from 'npm:@scure/bip39@1.3.0/wordlists/english';
import { HDKey } from 'npm:@scure/bip32@1.3.3';
import { secp256k1 } from 'npm:@noble/curves@1.3.0/secp256k1';
import { ripemd160 } from 'npm:@noble/hashes@1.3.3/ripemd160';
import { sha256 } from 'npm:@noble/hashes@1.3.3/sha256';

// Bech32m encoding for Kaspa addresses
const BECH32M_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const BECH32M_CONST = 0x2bc830a3;

function bech32mPolymod(values) {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const v of values) {
    const b = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) {
      if ((b >> i) & 1) chk ^= GEN[i];
    }
  }
  return chk;
}

function bech32mEncode(prefix, data) {
  const values = new Uint8Array(data.length + 7);
  values.set(data);
  
  const mod = bech32mPolymod([...prefix.split('').map(c => c.charCodeAt(0) >> 5), 0, ...prefix.split('').map(c => c.charCodeAt(0) & 31), ...values]) ^ BECH32M_CONST;
  
  for (let i = 0; i < 6; i++) {
    values[data.length + 1 + i] = (mod >> (5 * (5 - i))) & 31;
  }
  
  return prefix + '1' + Array.from(values).map(v => BECH32M_CHARSET[v]).join('');
}

function convertBits(data, fromBits, toBits) {
  let acc = 0;
  let bits = 0;
  const result = [];
  const maxv = (1 << toBits) - 1;
  
  for (const value of data) {
    acc = (acc << fromBits) | value;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      result.push((acc >> bits) & maxv);
    }
  }
  
  if (bits > 0) {
    result.push((acc << (toBits - bits)) & maxv);
  }
  
  return new Uint8Array(result);
}

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

    const network = body.network || 'mainnet';
    
    // Standard Kaspa derivation: m/44'/111111'/0'/0/0
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const hdkey = HDKey.fromMasterSeed(seed);
    const derived = hdkey.derive("m/44'/111111'/0'/0/0");
    
    if (!derived.privateKey) {
      throw new Error('Failed to derive private key');
    }
    
    // Generate Kaspa address from public key
    const publicKey = secp256k1.getPublicKey(derived.privateKey, true); // compressed
    
    // Kaspa uses RIPEMD160(SHA256(pubkey)) for script pub key
    const sha256Hash = sha256(publicKey);
    const scriptHash = ripemd160(sha256Hash);
    
    // Encode with bech32m
    const prefix = network === 'testnet' ? 'kaspatest' : 'kaspa';
    const version = new Uint8Array([0]); // version 0 for P2PK
    const payload = new Uint8Array([...version, ...scriptHash]);
    const words = convertBits(payload, 8, 5);
    const address = bech32mEncode(prefix, words);
    
    const privateKeyHex = Array.from(derived.privateKey).map(b => b.toString(16).padStart(2, '0')).join('');
    
    return Response.json({
      address,
      privateKey: privateKeyHex,
      mnemonic,
      derivationPath: "m/44'/111111'/0'/0/0",
      network,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});