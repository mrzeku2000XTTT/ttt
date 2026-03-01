import * as bip39 from 'npm:@scure/bip39@1.3.0';
import { wordlist } from 'npm:@scure/bip39@1.3.0/wordlists/english';
import { HDKey } from 'npm:@scure/bip32@1.4.0';

// =============================================================
// Kaspa address encoding
// Kaspa uses a custom bech32 variant:
//   - HRP: "kaspa"
//   - 8-byte checksum (not 6)
//   - Custom generator polynomial
//   - P2PK Schnorr: version byte = 0x00, payload = x-only pubkey (32 bytes) converted to 5-bit groups
// =============================================================

const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

// Kaspa's specific generator (different from Bitcoin's bech32)
const GENERATOR = [
  0x98f2bc8e61n,
  0x79b76d99e2n,
  0xf33e5fb3c4n,
  0xae2eabe2a8n,
  0x1e4f43e470n,
];

function polymod(values) {
  let chk = 1n;
  for (const v of values) {
    const b = chk >> 35n;
    chk = ((chk & 0x07ffffffffn) << 5n) ^ BigInt(v);
    for (let i = 0; i < 5; i++) {
      if ((b >> BigInt(i)) & 1n) chk ^= GENERATOR[i];
    }
  }
  return chk ^ 1n;
}

function hrpExpand(hrp) {
  const ret = [];
  for (const c of hrp) ret.push(c.charCodeAt(0) & 0x1f);
  ret.push(0);
  return ret;
}

function createChecksum(hrp, data) {
  const values = hrpExpand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0, 0, 0]);
  const mod = polymod(values);
  const ret = [];
  for (let p = 7; p >= 0; p--) {
    ret.push(Number((mod >> BigInt(p * 5)) & 31n));
  }
  return ret;
}

function convertBits(data, fromBits, toBits, pad = true) {
  let acc = 0, bits = 0;
  const ret = [];
  const maxv = (1 << toBits) - 1;
  for (const value of data) {
    acc = (acc << fromBits) | value;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      ret.push((acc >> bits) & maxv);
    }
  }
  if (pad && bits > 0) ret.push((acc << (toBits - bits)) & maxv);
  return ret;
}

function kaspaAddress(compressedPubkey) {
  // Extract x-only (32 bytes) from 33-byte compressed pubkey
  const xOnly = compressedPubkey.slice(1); // drop the 02/03 prefix byte

  // Payload: version byte 0 (P2PK Schnorr) + x-only pubkey in 5-bit groups
  const converted = convertBits(Array.from(xOnly), 8, 5, true);
  const payload = [0x00, ...converted];

  const checksum = createChecksum('kaspa', payload);
  let addr = 'kaspa:';
  for (const b of [...payload, ...checksum]) addr += CHARSET[b];
  return addr;
}

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const strength = body.wordCount === 24 ? 256 : 128;

    // 1. Generate mnemonic
    const mnemonic = bip39.generateMnemonic(wordlist, strength);

    // 2. Derive seed (no passphrase)
    const seed = await bip39.mnemonicToSeed(mnemonic);

    // 3. Kaspa HD derivation path: m/44'/111111'/0'/0/0
    const master = HDKey.fromMasterSeed(seed);
    const child = master.derive("m/44'/111111'/0'/0/0");

    if (!child.publicKey) throw new Error('Failed to derive public key');

    // 4. Encode Kaspa address
    const address = kaspaAddress(child.publicKey);

    return Response.json({
      address,
      mnemonic,
      derivationPath: "m/44'/111111'/0'/0/0",
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});