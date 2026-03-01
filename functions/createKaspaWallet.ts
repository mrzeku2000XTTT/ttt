import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import * as bip39 from 'npm:@scure/bip39@1.3.0';
import { wordlist } from 'npm:@scure/bip39@1.3.0/wordlists/english';
import { HDKey } from 'npm:@scure/bip32@1.4.0';
import { secp256k1 } from 'npm:@noble/curves@1.4.0/secp256k1';

// Kaspa uses schnorr pubkeys with a specific address encoding
// Address format: kaspa:<version><hash_hex>
// Kaspa P2PK address = bech32-like encoding with "kaspa" prefix

// Kaspa custom bech32 encoding
const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const GENERATOR = [0x98f2bc8e61n, 0x79b76d99e2n, 0xf33e5fb3c4n, 0xae2eabe2a8n, 0x1e4f43e470n];

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
  for (const c of hrp) ret.push(c.charCodeAt(0) >> 5);
  ret.push(0);
  for (const c of hrp) ret.push(c.charCodeAt(0) & 31);
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

function kaspaAddress(pubkeyBytes) {
  // Kaspa P2PK uses schnorr x-only pubkey (32 bytes)
  // version byte 0x00 for P2PK schnorr
  const xOnly = pubkeyBytes.slice(1); // remove 04/02/03 prefix, take 32 bytes
  const payload = [0x00, ...convertBits(Array.from(xOnly), 8, 5)];
  const checksum = createChecksum('kaspa', payload);
  let addr = 'kaspa:';
  for (const b of payload.concat(checksum)) addr += CHARSET[b];
  return addr;
}

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const wordCount = body.wordCount === 24 ? 256 : 128; // 12 or 24 words

    // Generate mnemonic
    const mnemonic = bip39.generateMnemonic(wordlist, wordCount);

    // Derive seed
    const seed = await bip39.mnemonicToSeed(mnemonic);

    // Kaspa HD path: m/44'/111111'/0'/0/0
    // coin type 111111 for Kaspa mainnet
    const hdkey = HDKey.fromMasterSeed(seed);
    const child = hdkey.derive("m/44'/111111'/0'/0/0");

    // Get compressed public key
    const pubkey = child.publicKey; // 33 bytes compressed

    // Derive Kaspa address from pubkey
    const address = kaspaAddress(pubkey);

    return Response.json({
      address,
      mnemonic,
      derivationPath: "m/44'/111111'/0'/0/0",
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});