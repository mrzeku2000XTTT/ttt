import * as bip39 from 'npm:@scure/bip39@1.3.0';
import { wordlist } from 'npm:@scure/bip39@1.3.0/wordlists/english';
import { HDKey } from 'npm:@scure/bip32@1.4.0';

// =============================================================
// Kaspa address encoding — ported directly from:
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

// Convert 8-bit array to 5-bit array with right padding (matches Rust conv8to5)
function conv8to5(payload) {
  const extra = payload.length % 5 === 0 ? 0 : 1;
  const result = new Array(Math.floor(payload.length * 8 / 5) + extra).fill(0);
  let idx = 0, buff = 0, bits = 0;
  for (const c of payload) {
    buff = (buff << 8) | c;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      result[idx++] = (buff >> bits) & 0x1f;
    }
  }
  if (bits > 0) result[idx] = (buff << (5 - bits)) & 0x1f;
  return result;
}

function checksum(payload, prefixStr) {
  // prefix low-5-bits + [0] + payload + [0,0,0,0,0,0,0,0]
  const prefixBytes = [...prefixStr].map(c => c.charCodeAt(0) & 0x1f);
  const values = [...prefixBytes, 0, ...payload, 0, 0, 0, 0, 0, 0, 0, 0];
  return polymod(values);
}

function kaspaAddress(compressedPubkey) {
  // P2PK Schnorr: version = 0, payload = x-only pubkey (32 bytes)
  const xOnly = Array.from(compressedPubkey.slice(1)); // drop 02/03 prefix

  // Encode: conv8to5([version, ...payload])
  const fiveBitPayload = conv8to5([0x00, ...xOnly]);

  // Compute checksum (u64), take bytes [3..8] (last 5 bytes of 8-byte big-endian)
  const chk = checksum(fiveBitPayload, 'kaspa');
  const chkBig = BigInt(chk);
  // Convert u64 to 8 big-endian bytes, take last 5
  const chkBytes = [];
  for (let i = 7; i >= 0; i--) {
    chkBytes.unshift(Number((chkBig >> BigInt(i * 8)) & 0xffn));
  }
  const chkLast5 = chkBytes.slice(3); // bytes [3..8]
  const fiveBitChecksum = conv8to5(chkLast5);

  let addr = 'kaspa:';
  for (const b of [...fiveBitPayload, ...fiveBitChecksum]) addr += CHARSET[b];
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

    // 3. Kaspa HD derivation: m/44'/111111'/0'/0/0
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