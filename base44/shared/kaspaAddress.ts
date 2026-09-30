/**
 * kaspaAddress — self-contained Kaspa testnet (TN-10) wallet derivation.
 *
 * Why this exists: @okxweb3/coin-kaspa pulls in a transitive dependency with a
 * top-level await that the Base44 bundler rejects. This module reimplements
 * the Kaspa bech32 address encoding and BIP32/BIP39 key derivation using only
 * clean, bundler-safe libraries (@scure/bip39, @scure/bip32, @noble/curves).
 *
 * The address format is identical to what @okxweb3/coin-kaspa produces — only
 * the prefix changes from "kaspa" (mainnet) to "kaspatest" (testnet).
 */

import { generateMnemonic, mnemonicToSeedSync } from 'npm:@scure/bip39@1.3.0';
import { wordlist } from 'npm:@scure/bip39@1.3.0/wordlists/english';
import { HDKey } from 'npm:@scure/bip32@1.1.0';
import { secp256k1 } from 'npm:@noble/curves@1.4.0/secp256k1';

export const DERIVATION_PATH = "m/44'/111111'/0'/0/0";

/* --- Kaspa bech32 address encoding (copied from @okxweb3/coin-kaspa lib) --- */
const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

function prefixToArray(prefix: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < prefix.length; i++) out.push(prefix.charCodeAt(i) & 31);
  return out;
}

function checksumToArray(checksum: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < 8; ++i) {
    out.push(checksum & 31);
    checksum = Math.floor(checksum / 32);
  }
  return out.reverse();
}

const GEN1 = [0x98, 0x79, 0xf3, 0xae, 0x1e];
const GEN2 = [0xf2bc8e61, 0xb76d99e2, 0x3e5fb3c4, 0x2eabe2a8, 0x4f43e470];

function polymod(data: Uint8Array): number {
  let c0 = 0, c1 = 1, C = 0;
  for (let j = 0; j < data.length; j++) {
    C = c0 >>> 3;
    c0 &= 0x07;
    c0 <<= 5;
    c0 |= c1 >>> 27;
    c1 &= 0x07ffffff;
    c1 <<= 5;
    c1 ^= data[j];
    for (let i = 0; i < GEN1.length; ++i) {
      if (C & (1 << i)) { c0 ^= GEN1[i]; c1 ^= GEN2[i]; }
    }
  }
  c1 ^= 1;
  if (c1 < 0) { c1 ^= 1 << 31; c1 += (1 << 30) * 2; }
  return c0 * (1 << 30) * 4 + c1;
}

function convertBits(data: Uint8Array, from: number, to: number, strict: boolean): Uint8Array {
  const len = strict ? Math.floor((data.length * from) / to) : Math.ceil((data.length * from) / to);
  const mask = (1 << to) - 1;
  const out = new Uint8Array(len);
  let idx = 0, acc = 0, bits = 0;
  for (let i = 0; i < data.length; ++i) {
    acc = (acc << from) | data[i];
    bits += from;
    while (bits >= to) { bits -= to; out[idx++] = (acc >> bits) & mask; }
  }
  if (!strict && bits > 0) out[idx] = (acc << (to - bits)) & mask;
  return out;
}

function base32Encode(data: Uint8Array): string {
  let s = '';
  for (let i = 0; i < data.length; ++i) s += CHARSET[data[i]];
  return s;
}

/** Encodes a 32-byte X-only public key into a Kaspa bech32 address. */
export function encodePubKeyAddress(pubKeyXOnly: Uint8Array, prefix: string): string {
  const eight0 = [0, 0, 0, 0, 0, 0, 0, 0];
  const prefixData = prefixToArray(prefix).concat([0]);
  const versionByte = 0;
  const pubKeyArray = Array.from(pubKeyXOnly);
  const payloadData = convertBits(new Uint8Array([versionByte, ...pubKeyArray]), 8, 5, false);
  const checksumData = new Uint8Array(prefixData.length + payloadData.length + eight0.length);
  checksumData.set(prefixData);
  checksumData.set(payloadData, prefixData.length);
  checksumData.set(eight0, prefixData.length + payloadData.length);
  const polymodData = checksumToArray(polymod(checksumData));
  const payload = new Uint8Array(payloadData.length + polymodData.length);
  payload.set(payloadData);
  payload.set(polymodData, payloadData.length);
  return prefix + ':' + base32Encode(payload);
}

/**
 * Generates a fresh Kaspa testnet (TN-10) wallet.
 * Returns the mnemonic (server-only — never send to the browser) and the
 * public kaspatest: address.
 */
export function generateTestnetWallet() {
  const mnemonic = generateMnemonic(wordlist, 128);
  const seed = mnemonicToSeedSync(mnemonic, '');
  const hd = HDKey.fromMasterSeed(seed).derive(DERIVATION_PATH);
  if (!hd.privateKey || !hd.publicKey) throw new Error('BIP32 derivation failed');
  // Kaspa uses the X-only pubkey: compressed pubkey (33 bytes) minus the prefix byte.
  const xOnly = hd.publicKey.slice(1, 33);
  const address = encodePubKeyAddress(xOnly, 'kaspatest');
  if (!/^kaspatest:[a-z0-9]{61,63}$/.test(address)) {
    throw new Error(`Invalid testnet address generated: ${address}`);
  }
  return { mnemonic, address, privateKey: hd.privateKey, derivationPath: DERIVATION_PATH };
}

export function bytesToHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0');
  return out;
}

/**
 * Derives the hex private key for a mnemonic at a BIP44 path.
 * Replaces the @okxweb3/coin-kaspa `getDerivedPrivateKey` call.
 */
export function derivePrivateKeyFromMnemonic(mnemonic: string, hdPath: string = DERIVATION_PATH): string {
  const seed = mnemonicToSeedSync(mnemonic.trim(), '');
  const hd = HDKey.fromMasterSeed(seed).derive(hdPath);
  if (!hd.privateKey) throw new Error('BIP32 derivation failed');
  return bytesToHex(hd.privateKey);
}

/** Kaspa uses the X-only (32-byte) public key — the compressed key minus its prefix byte. */
export function xOnlyPubKeyFromPrivateKey(privateKeyHex: string): Uint8Array {
  const compressed = secp256k1.getPublicKey(privateKeyHex.replace(/^0x/, ''), true);
  return compressed.slice(1, 33);
}

/**
 * Kaspa address for a hex private key.
 * `prefix` stays "kaspa" (mainnet) to match the addresses these functions already
 * return — callers and stored records depend on that exact format.
 */
export function addressFromPrivateKey(privateKeyHex: string, prefix = 'kaspa'): string {
  return encodePubKeyAddress(xOnlyPubKeyFromPrivateKey(privateKeyHex), prefix);
}