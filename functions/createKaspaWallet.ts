import * as bip39 from 'npm:@scure/bip39@1.3.0';
import { wordlist } from 'npm:@scure/bip39@1.3.0/wordlists/english';
import { HDKey } from 'npm:@scure/bip32@1.4.0';
import { blake2b } from 'npm:@noble/hashes@1.5.0/blake2b';
import { secp256k1 } from 'npm:@noble/curves@1.6.0/secp256k1';

// Convert pubkey to Kaspa address (P2PK)
function pubkeyToKaspaAddress(pubkeyBytes) {
  // Kaspa uses Blake2b-256 on the compressed public key payload (33 bytes)
  const hash = blake2b(pubkeyBytes, { dkLen: 32 });

  // Bech32m encoding helper
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
    for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) >> 5);
    ret.push(0);
    for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) & 31);
    return ret;
  }

  function convertbits(data, frombits, tobits, pad = true) {
    let acc = 0, bits = 0;
    const result = [];
    const maxv = (1 << tobits) - 1;
    for (const value of data) {
      acc = (acc << frombits) | value;
      bits += frombits;
      while (bits >= tobits) {
        bits -= tobits;
        result.push((acc >> bits) & maxv);
      }
    }
    if (pad && bits > 0) result.push((acc << (tobits - bits)) & maxv);
    return result;
  }

  const hrp = 'kaspa';
  // version byte 0x00 = pubkey type
  const payload = [0x00, ...convertbits(Array.from(hash), 8, 5)];
  const combined = [...hrpExpand(hrp), ...payload, 0, 0, 0, 0, 0, 0, 0, 0];
  const mod = polymod(combined);
  const checksum = [];
  for (let i = 5; i >= 0; i--) {
    checksum.push(Number((mod >> BigInt(i * 5)) & 31n));
  }
  const encoded = payload.concat(checksum).map(x => CHARSET[x]).join('');
  return `${hrp}:${encoded}`;
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

    // Derive seed and HD key
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const hdKey = HDKey.fromMasterSeed(seed);
    const derived = hdKey.derive("m/44'/111111'/0'/0/0");

    if (!derived.privateKey) {
      throw new Error('Failed to derive private key');
    }

    // Get compressed public key (33 bytes)
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