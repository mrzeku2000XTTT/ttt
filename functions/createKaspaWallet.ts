import * as bip39 from 'npm:@scure/bip39@1.3.0';
import { wordlist } from 'npm:@scure/bip39@1.3.0/wordlists/english';
import { HDKey } from 'npm:@scure/bip32@1.4.0';
import { secp256k1 } from 'npm:@noble/curves@1.6.0/secp256k1';
import { blake2b } from 'npm:@noble/hashes@1.5.0/blake2b';

// Bech32m helpers for Kaspa address encoding
const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const GENERATOR = [0x98f2bc8e61n, 0x79b76d99e2n, 0xf33e5fb3c4n, 0xae2eabe2a8n, 0x1e4f43e470n];

function polymod(values) {
  let chk = 1n;
  for (const v of values) {
    const top = chk >> 35n;
    chk = ((chk & 0x07ffffffffn) << 5n) ^ BigInt(v);
    for (let i = 0; i < 5; i++) {
      if ((top >> BigInt(i)) & 1n) chk ^= GENERATOR[i];
    }
  }
  return chk ^ 1n;
}

function hrpExpand(hrp) {
  const ret = [];
  for (const c of hrp) ret.push(c.charCodeAt(0) >> 5);
  ret.push(0);
  for (const c of hrp) ret.push(c.charCodeAt(0) & 31);
  return ret;
}

function convertbits(data, frombits, tobits) {
  let acc = 0, bits = 0;
  const result = [];
  const maxv = (1 << tobits) - 1;
  for (const v of data) {
    acc = (acc << frombits) | v;
    bits += frombits;
    while (bits >= tobits) {
      bits -= tobits;
      result.push((acc >> bits) & maxv);
    }
  }
  if (bits > 0) result.push((acc << (tobits - bits)) & maxv);
  return result;
}

function pubkeyToKaspaAddress(pubkeyBytes) {
  // Blake2b-256 hash of the 33-byte compressed pubkey
  const hash = blake2b(pubkeyBytes, { dkLen: 32 });
  const hrp = 'kaspa';
  // version 0x00 = P2PK-schnorr (uses 32-byte pubkey hash)
  const payload = [0x00, ...convertbits(Array.from(hash), 8, 5)];
  const checkData = [...hrpExpand(hrp), ...payload, 0, 0, 0, 0, 0, 0, 0, 0];
  const mod = polymod(checkData);
  const checksum = [];
  for (let i = 5; i >= 0; i--) {
    checksum.push(Number((mod >> BigInt(i * 5)) & 31n));
  }
  const encoded = [...payload, ...checksum].map(x => CHARSET[x]).join('');
  return `kaspa:${encoded}`;
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

    const seed = await bip39.mnemonicToSeed(mnemonic);
    const hdKey = HDKey.fromMasterSeed(seed);
    const derived = hdKey.derive("m/44'/111111'/0'/0/0");

    if (!derived.privateKey) {
      throw new Error('Failed to derive private key');
    }

    const pubkeyBytes = secp256k1.getPublicKey(derived.privateKey, true);
    const address = pubkeyToKaspaAddress(pubkeyBytes);

    return Response.json({
      address: address.replace('kaspa:', ''),
      mnemonic,
      derivationPath: "m/44'/111111'/0'/0/0",
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});