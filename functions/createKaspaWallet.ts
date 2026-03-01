import * as bip39 from 'npm:@scure/bip39@1.3.0';
import { wordlist } from 'npm:@scure/bip39@1.3.0/wordlists/english';
import { HDKey } from 'npm:@scure/bip32@1.4.0';

// =============================================================
// Kaspa address encoding — exact port from rusty-kaspa bech32.rs
// https://github.com/kaspanet/rusty-kaspa/blob/master/crypto/addresses/src/bech32.rs
// =============================================================

const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

function polymod(values) {
  let c = 1n;
  for (const d of values) {
    const c0 = c >> 35n;
    c = ((c & 0x07ffffffffn) << 5n) ^ BigInt(d);
    if (c0 & 0x01n) c ^= 0x98f2bc8e61n;
    if (c0 & 0x02n) c ^= 0x79b76d99e2n;
    if (c0 & 0x04n) c ^= 0xf33e5fb3c4n;
    if (c0 & 0x08n) c ^= 0xae2eabe2a8n;
    if (c0 & 0x10n) c ^= 0x1e4f43e470n;
  }
  return c ^ 1n;
}

// conv8to5: exact port of Rust conv8to5 — converts 8-bit bytes to 5-bit groups with right padding
function conv8to5(payload) {
  const extra = payload.length % 5 === 0 ? 0 : 1;
  const out = new Array(Math.floor(payload.length * 8 / 5) + extra).fill(0);
  let idx = 0, buff = 0, bits = 0;
  for (const c of payload) {
    buff = ((buff << 8) | c) & 0xffff;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out[idx++] = (buff >> bits) & 0x1f;
    }
  }
  if (bits > 0) out[idx] = (buff << (5 - bits)) & 0x1f;
  return out;
}

// checksum: prefix_low5bits + [0] + payload_5bit + [0,0,0,0,0,0,0,0]
function computeChecksum(fiveBitPayload, prefixStr) {
  const prefixBytes = [...prefixStr].map(c => c.charCodeAt(0) & 0x1f);
  const values = [...prefixBytes, 0, ...fiveBitPayload, 0, 0, 0, 0, 0, 0, 0, 0];
  return polymod(values); // returns BigInt
}

function kaspaAddress(compressedPubkey) {
  // P2PK Schnorr: version byte = 0, payload = x-only 32-byte pubkey
  const version = 0x00;
  const xOnly = Array.from(compressedPubkey.slice(1)); // drop 02/03 prefix

  // conv8to5([version, ...xOnly]) — this is what Rust does
  const fiveBitPayload = conv8to5([version, ...xOnly]);

  // Compute checksum u64
  const chk = computeChecksum(fiveBitPayload, 'kaspa');

  // to_be_bytes()[3..] — get bytes 3 through 7 (5 bytes) of the 8-byte big-endian u64
  // u64 max = 2^64-1, fits in BigInt
  const be8 = [];
  for (let i = 7; i >= 0; i--) {
    be8.push(Number((chk >> BigInt(i * 8)) & 0xffn));
  }
  // be8 is now [byte0, byte1, ..., byte7] big-endian
  // Rust: [3..] means bytes at index 3,4,5,6,7
  const chkSlice = be8.slice(3); // 5 bytes

  // conv8to5(chkSlice)
  const fiveBitChecksum = conv8to5(chkSlice);

  let addr = 'kaspa:';
  for (const b of [...fiveBitPayload, ...fiveBitChecksum]) addr += CHARSET[b];
  return addr;
}

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const strength = body.wordCount === 24 ? 256 : 128;

    const mnemonic = bip39.generateMnemonic(wordlist, strength);
    const seed = await bip39.mnemonicToSeed(mnemonic);

    const master = HDKey.fromMasterSeed(seed);
    const child = master.derive("m/44'/111111'/0'/0/0");

    if (!child.publicKey) throw new Error('Failed to derive public key');

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