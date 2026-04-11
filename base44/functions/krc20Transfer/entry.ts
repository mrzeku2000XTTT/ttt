// KRC-20 Token Transfer via Kasplex Commit-Reveal Protocol
// Reusable function for sending KRC-20 tokens (PACMAN, NACHO, etc.)
// 
// PROTOCOL REFERENCE (audited from multiple GitHub sources):
//   - coinchimp/kaspa-krc20-apps (transfer.ts) — WASM-based CLI
//   - ghost-wallet/web-extension (KRC20Inscription.ts, KRC20Transactions.ts)
//   - KaffinPX/Kaspian-KRC20 — Kaspian wallet integration
//   - codecustard/kaspa (ICP canister commit-reveal)
//   - kaspanet/rusty-kaspa (script_builder.rs, standard.rs) — canonical Rust source
//
// ARCHITECTURE:
//   Step 1: Build inscription script (redeem script) containing KRC-20 transfer JSON
//   Step 2: Blake2b-256 hash the script → derive P2SH address
//   Step 3: COMMIT TX — send 0.3 KAS to P2SH address (locks funds)
//   Step 4: Wait for UTXO maturity (~10s)
//   Step 5: REVEAL TX — spend the P2SH UTXO with the redeem script as signature
//
// CURRENT STATUS: Phase 1 — Script construction + P2SH address + Commit TX
// Phase 2 (Reveal TX) requires raw transaction construction outside OKX SDK
//
// OPCODE REFERENCE (from rusty-kaspa/crypto/txscript/src/opcodes.rs):
//   OpFalse  = 0x00 (Op0)
//   OpData32 = 0x20
//   OpIf     = 0x63
//   OpEndIf  = 0x68
//   OpCheckSig = 0xac
//   OpBlake2b  = 0xaa
//   OpEqual    = 0x87

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { KaspaWallet } from 'npm:@okxweb3/coin-kaspa@2.4.9';
import { blake2b } from 'npm:@noble/hashes@1.4.0/blake2b';
// Kaspa uses bech32 with ':' separator instead of '1'
// We use the bech32 lib for encoding only, with manual adaptation

const KASPA_API = 'https://api.kaspa.org';
const COMMIT_AMOUNT_KAS = 0.3; // Standard commit amount (0.3 KAS = 30000000 sompi)
const COMMIT_AMOUNT_SOMPI = 30000000;
const FEE_SOMPI = 10000;
const REVEAL_GAS_SOMPI = 30000; // ~0.0003 KAS reveal gas fee

// ==========================================
// KASPA SCRIPT BUILDER (Pure JavaScript)
// Replicates rusty-kaspa ScriptBuilder logic
// ==========================================

const OP_FALSE = 0x00;     // Op0
const OP_DATA_1 = 0x01;    // First data push opcode
const OP_DATA_32 = 0x20;   // Push 32 bytes
const OP_1 = 0x51;
const OP_IF = 0x63;
const OP_ENDIF = 0x68;
const OP_BLAKE2B = 0xaa;
const OP_EQUAL = 0x87;
const OP_CHECKSIG = 0xac;
const OP_PUSHDATA1 = 0x4c;
const OP_PUSHDATA2 = 0x4d;

/**
 * Canonical data push — matches rusty-kaspa add_raw_data exactly.
 * See: script_builder.rs lines 130-160
 */
function canonicalDataPush(data) {
  const len = data.length;
  if (len === 0) return new Uint8Array([OP_FALSE]);
  
  // Single byte small int optimization
  if (len === 1 && data[0] >= 1 && data[0] <= 16) {
    return new Uint8Array([(OP_1 - 1) + data[0]]);
  }
  
  // OpData# range (1-75 bytes)
  if (len <= 75) {
    const result = new Uint8Array(1 + len);
    result[0] = len; // OpData length byte
    result.set(data, 1);
    return result;
  }
  
  // OpPushData1 (76-255 bytes)
  if (len <= 255) {
    const result = new Uint8Array(2 + len);
    result[0] = OP_PUSHDATA1;
    result[1] = len;
    result.set(data, 2);
    return result;
  }
  
  // OpPushData2 (256-65535 bytes)
  const result = new Uint8Array(3 + len);
  result[0] = OP_PUSHDATA2;
  result[1] = len & 0xff;
  result[2] = (len >> 8) & 0xff;
  result.set(data, 3);
  return result;
}

/**
 * addI64(0n) — special case: pushes Op0 (0x00)
 * Matches rusty-kaspa add_i64 fast path: "if val == 0 { push Op0 }"
 */
function addI64Zero() {
  return new Uint8Array([OP_FALSE]);
}

/**
 * Build KRC-20 inscription script (redeem script)
 * 
 * Matches the pattern from all audited implementations:
 *   .addData(publicKey.toXOnlyPublicKey())  // 32-byte x-only pubkey
 *   .addOp(OpCheckSig)                       // 0xac
 *   .addOp(OpFalse)                          // 0x00
 *   .addOp(OpIf)                             // 0x63
 *   .addData("kasplex")                      // protocol identifier
 *   .addI64(0n)                              // version
 *   .addData(JSON.stringify(data))            // KRC-20 JSON payload
 *   .addOp(OpEndIf)                          // 0x68
 */
function buildInscriptionScript(xOnlyPubKeyHex, krc20Json) {
  const pubKeyBytes = hexToBytes(xOnlyPubKeyHex);
  const kasplexBytes = new TextEncoder().encode('kasplex');
  const jsonBytes = new TextEncoder().encode(krc20Json);
  
  // Concatenate all script fragments
  const parts = [
    canonicalDataPush(pubKeyBytes),     // 32-byte pubkey push
    new Uint8Array([OP_CHECKSIG]),      // OpCheckSig
    new Uint8Array([OP_FALSE]),         // OpFalse
    new Uint8Array([OP_IF]),            // OpIf
    canonicalDataPush(kasplexBytes),    // "kasplex" data push
    addI64Zero(),                       // 0n
    canonicalDataPush(jsonBytes),       // KRC-20 JSON data push
    new Uint8Array([OP_ENDIF]),         // OpEndIf
  ];
  
  const totalLen = parts.reduce((s, p) => s + p.length, 0);
  const script = new Uint8Array(totalLen);
  let offset = 0;
  for (const part of parts) {
    script.set(part, offset);
    offset += part.length;
  }
  
  return script;
}

/**
 * Create P2SH script public key from redeem script
 * 
 * From standard.rs pay_to_script_hash_script():
 *   1. blake2b_256(redeem_script) → 32 bytes
 *   2. Script: [OpBlake2b, OpData32, ...hash..., OpEqual]
 *   3. ScriptPublicKey version = 1 (ScriptHash class)
 */
function createP2SHScriptPublicKey(redeemScript) {
  const hash = blake2b(redeemScript, { dkLen: 32 });
  
  // Build P2SH script: OpBlake2b + OpData32 + hash(32 bytes) + OpEqual
  const scriptPubKey = new Uint8Array(2 + 32 + 1); // 35 bytes total
  scriptPubKey[0] = OP_BLAKE2B;
  scriptPubKey[1] = OP_DATA_32;
  scriptPubKey.set(hash, 2);
  scriptPubKey[34] = OP_EQUAL;
  
  return { scriptPubKey, scriptHash: hash, version: 1 };
}

/**
 * Derive Kaspa P2SH address from script hash
 * 
 * Kaspa addresses use bech32 encoding with:
 *   - HRP: "kaspa" (mainnet) or "kaspatest" (testnet)
 *   - Payload: [version_byte, ...script_hash_bytes]
 *   - Version byte: 0x00 = PubKey, 0x01 = ECDSA, 0x08 = ScriptHash
 */
function scriptHashToAddress(scriptHash, network = 'mainnet') {
  const hrp = network === 'mainnet' ? 'kaspa' : 'kaspatest';
  
  // Version::ScriptHash = 8 in Kaspa address encoding
  const payload = new Uint8Array(1 + scriptHash.length);
  payload[0] = 0x08; // ScriptHash version
  payload.set(scriptHash, 1);
  
  return encodeKaspaBech32(hrp, payload);
}

/**
 * Get x-only public key from private key
 * Using OKX SDK's internal secp256k1 to derive pubkey, then strip prefix
 */
async function getXOnlyPubKey(privateKeyHex) {
  const wallet = new KaspaWallet();
  const addressResult = await wallet.getNewAddress({ privateKey: privateKeyHex });
  const addr = addressResult.address || addressResult;
  let addrStr = typeof addr === 'string' ? addr : addr.toString();
  
  console.log('[getXOnlyPubKey] Raw address from OKX SDK:', addrStr);
  
  // OKX SDK returns like kaspa:qqpet37fw... — decode the Kaspa bech32
  const payload = decodeKaspaBech32(addrStr);
  
  // First byte is version (0x00=PubKey, 0x01=ECDSA, 0x08=ScriptHash)
  // Rest is the 32-byte x-only public key
  const xOnlyPubKey = payload.slice(1);
  console.log('[getXOnlyPubKey] version:', payload[0], 'x-only pubkey:', bytesToHex(xOnlyPubKey));
  return bytesToHex(xOnlyPubKey);
}

// ==========================================
// MAIN HANDLER
// ==========================================

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      action = 'transfer',  // 'transfer', 'buildScript', 'getP2SHAddress'
      mnemonic,
      privateKey: inputPrivateKey,
      fromAddress,
      toAddress,
      amount,         // Token amount (human readable, e.g. "1000")
      ticker,         // e.g. "PACMAN", "NACHO"
      decimals = 8,   // Token decimals (default 8 for most KRC-20)
      network = 'mainnet',
    } = body;

    // Derive private key
    let privateKey = inputPrivateKey;
    if (!privateKey && mnemonic) {
      const wallet = new KaspaWallet();
      privateKey = await wallet.getDerivedPrivateKey({
        mnemonic: mnemonic.trim(),
        hdPath: "m/44'/111111'/0'/0/0",
      });
    }

    // ---- ACTION: Build inscription script (for debugging/auditing) ----
    if (action === 'buildScript') {
      if (!privateKey || !ticker || !amount || !toAddress) {
        return Response.json({ error: 'Missing: privateKey/mnemonic, ticker, amount, toAddress' }, { status: 400 });
      }

      const xOnlyPubKey = await getXOnlyPubKey(privateKey);
      
      // Build KRC-20 transfer JSON — exact format from all audited sources
      const amtSompiStr = (BigInt(Math.round(parseFloat(amount) * Math.pow(10, decimals)))).toString();
      const krc20Data = { p: 'krc-20', op: 'transfer', tick: ticker.toUpperCase(), amt: amtSompiStr, to: toAddress };
      const krc20Json = JSON.stringify(krc20Data, null, 0);
      
      const redeemScript = buildInscriptionScript(xOnlyPubKey, krc20Json);
      const { scriptHash } = createP2SHScriptPublicKey(redeemScript);
      const p2shAddress = scriptHashToAddress(scriptHash, network);

      return Response.json({
        success: true,
        xOnlyPubKey,
        krc20Json,
        redeemScriptHex: bytesToHex(redeemScript),
        redeemScriptLength: redeemScript.length,
        scriptHashHex: bytesToHex(scriptHash),
        p2shAddress,
        commitAmount: COMMIT_AMOUNT_KAS,
        note: 'Script built. Next: send commit TX to P2SH address, then reveal TX.',
      });
    }

    // ---- ACTION: Full KRC-20 Transfer (Commit phase) ----
    if (action === 'transfer' || action === 'commit') {
      if (!privateKey || !fromAddress || !toAddress || !amount || !ticker) {
        return Response.json({
          error: 'Missing required: mnemonic/privateKey, fromAddress, toAddress, amount, ticker'
        }, { status: 400 });
      }

      const normalizedFrom = fromAddress.startsWith('kaspa:') ? fromAddress : `kaspa:${fromAddress}`;
      const normalizedTo = toAddress.startsWith('kaspa:') ? toAddress : `kaspa:${toAddress}`;

      console.log(`[krc20Transfer] ${ticker} transfer: ${amount} from ${normalizedFrom} to ${normalizedTo}`);

      // 1. Get x-only public key
      const xOnlyPubKey = await getXOnlyPubKey(privateKey);
      console.log(`[krc20Transfer] x-only pubkey: ${xOnlyPubKey}`);

      // 2. Build inscription script
      const amtSompiStr = (BigInt(Math.round(parseFloat(amount) * Math.pow(10, decimals)))).toString();
      const krc20Data = { p: 'krc-20', op: 'transfer', tick: ticker.toUpperCase(), amt: amtSompiStr, to: normalizedTo };
      const krc20Json = JSON.stringify(krc20Data, null, 0);
      console.log(`[krc20Transfer] KRC-20 payload: ${krc20Json}`);

      const redeemScript = buildInscriptionScript(xOnlyPubKey, krc20Json);
      console.log(`[krc20Transfer] Redeem script: ${redeemScript.length} bytes`);

      // 3. Derive P2SH address
      const { scriptHash, scriptPubKey } = createP2SHScriptPublicKey(redeemScript);
      const p2shAddress = scriptHashToAddress(scriptHash, network);
      console.log(`[krc20Transfer] P2SH address: ${p2shAddress}`);

      // 4. Send COMMIT TX — 0.3 KAS to P2SH address
      console.log(`[krc20Transfer] Sending commit TX: ${COMMIT_AMOUNT_KAS} KAS to ${p2shAddress}`);
      
      const commitResult = await base44.asServiceRole.functions.invoke('sendKaspaTransaction', {
        mnemonic: mnemonic || undefined,
        privateKey: inputPrivateKey || undefined,
        fromAddress: normalizedFrom,
        toAddress: p2shAddress,
        amountKas: COMMIT_AMOUNT_KAS,
      });

      if (commitResult?.error) {
        throw new Error(`Commit TX failed: ${commitResult.error}`);
      }

      const commitTxId = commitResult?.txId || commitResult?.data?.txId || '';
      console.log(`[krc20Transfer] ✓ Commit TX: ${commitTxId}`);

      return Response.json({
        success: true,
        phase: 'commit',
        commitTxId,
        p2shAddress,
        ticker: ticker.toUpperCase(),
        amount,
        toAddress: normalizedTo,
        redeemScriptHex: bytesToHex(redeemScript),
        scriptHashHex: bytesToHex(scriptHash),
        scriptPubKeyHex: bytesToHex(scriptPubKey),
        xOnlyPubKey,
        krc20Json,
        note: 'Commit TX sent. Wait ~10s for UTXO maturity, then call action=reveal with commitTxId.',
      });
    }

    // ---- ACTION: Reveal (Phase 2 — requires raw P2SH spending) ----
    if (action === 'reveal') {
      // TODO: Phase 2 — Build raw reveal transaction
      // This requires constructing a transaction that:
      // 1. Has the P2SH UTXO as a priorityEntry input
      // 2. Signs the input with: [signature, redeemScript] as signatureScript
      // 3. The OKX SDK doesn't support P2SH inputs natively
      // 4. Need either: custom raw TX builder, or Kaspa RPC submitTransaction
      
      return Response.json({
        success: false,
        error: 'Reveal phase not yet implemented. Commit TX was sent successfully.',
        phase: 'reveal',
        note: 'The reveal step requires raw P2SH transaction construction. See architecture notes in function header.',
      }, { status: 501 });
    }

    // ---- ACTION: Check Kasplex operation status ----
    if (action === 'status') {
      const { txId } = body;
      if (!txId) return Response.json({ error: 'Missing txId' }, { status: 400 });
      
      const res = await fetch(`https://api.kasplex.org/v1/krc20/op/${txId}`);
      const data = await res.json();
      return Response.json({ success: true, ...data });
    }

    // ---- ACTION: Check KRC-20 token balance ----
    if (action === 'balance') {
      const { address, tick } = body;
      if (!address) return Response.json({ error: 'Missing address' }, { status: 400 });
      
      const normalizedAddr = address.startsWith('kaspa:') ? address : `kaspa:${address}`;
      
      if (tick) {
        const res = await fetch(`https://api.kasplex.org/v1/krc20/address/${normalizedAddr}/token/${tick.toUpperCase()}`);
        const data = await res.json();
        return Response.json({ success: true, ...data });
      } else {
        const res = await fetch(`https://api.kasplex.org/v1/krc20/address/${normalizedAddr}/tokenlist`);
        const data = await res.json();
        return Response.json({ success: true, ...data });
      }
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });

  } catch (error) {
    console.error('[krc20Transfer] Error:', error?.message || error);
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ==========================================
// KASPA BECH32 — custom implementation from rusty-kaspa/crypto/addresses/src/bech32.rs
// Key differences from standard bech32:
//   - 40-bit polymod (>> 35) not 25-bit
//   - 8-character checksum not 6
//   - ':' separator not '1'
//   - Different generator constants
// ==========================================

const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const BECH32_REV_CHARSET = new Uint8Array(123).fill(100);
'qpzry9x8gf2tvdw0s3jn54khce6mua7l'.split('').forEach((c, i) => { BECH32_REV_CHARSET[c.charCodeAt(0)] = i; });

// Kaspa uses BigInt for the 40-bit polymod
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

// Convert 8-bit array to 5-bit array with right padding
function conv8to5(payload) {
  const padding = (payload.length * 8 % 5 !== 0) ? 1 : 0;
  const fiveBit = new Array(Math.floor(payload.length * 8 / 5) + padding).fill(0);
  let idx = 0, buff = 0, bits = 0;
  for (const c of payload) {
    buff = (buff << 8) | c;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      fiveBit[idx++] = (buff >> bits) & 0x1f;
      buff &= (1 << bits) - 1;
    }
  }
  if (bits > 0) fiveBit[idx] = (buff << (5 - bits)) & 0x1f;
  return fiveBit;
}

// Convert 5-bit array to 8-bit array (drop right padding)
function conv5to8(payload) {
  const eightBit = new Array(Math.floor(payload.length * 5 / 8)).fill(0);
  let idx = 0, buff = 0, bits = 0;
  for (const c of payload) {
    buff = (buff << 5) | c;
    bits += 5;
    while (bits >= 8) {
      bits -= 8;
      eightBit[idx++] = (buff >> bits) & 0xff;
      buff &= (1 << bits) - 1;
    }
  }
  return eightBit;
}

function kaspaChecksum(payloadU5, prefixBytes) {
  // prefix_iter: each byte & 0x1f, then 0 separator, then payload, then 8 zeros
  const prefixU5 = Array.from(prefixBytes).map(b => b & 0x1f);
  const values = [...prefixU5, 0, ...payloadU5, 0, 0, 0, 0, 0, 0, 0, 0];
  return polymod(values);
}

function encodeKaspaBech32(hrp, payload) {
  // Version byte + payload bytes → convert to 5-bit
  const fiveBitPayload = conv8to5(Array.from(payload));
  const prefixBytes = new TextEncoder().encode(hrp);
  
  const checksumVal = kaspaChecksum(fiveBitPayload, prefixBytes);
  
  // Convert checksum u64 BE bytes [3..8] to 5-bit
  // checksumVal is a BigInt — extract last 5 bytes (BE)
  const checksumBytes = [];
  let cv = checksumVal;
  for (let i = 0; i < 8; i++) {
    checksumBytes.unshift(Number(cv & 0xffn));
    cv >>= 8n;
  }
  // Take bytes [3..8] = last 5 bytes
  const checksumU5 = conv8to5(checksumBytes.slice(3));
  
  const combined = [...fiveBitPayload, ...checksumU5];
  let result = hrp + ':';
  for (const w of combined) result += BECH32_CHARSET[w];
  return result;
}

function decodeKaspaBech32(addr) {
  const colonIdx = addr.indexOf(':');
  if (colonIdx < 0) throw new Error('Invalid Kaspa address: no colon separator');
  const hrp = addr.substring(0, colonIdx);
  const dataPart = addr.substring(colonIdx + 1);
  
  // Decode characters to 5-bit values
  const addressU5 = [];
  for (const ch of dataPart) {
    const code = ch.charCodeAt(0);
    if (code >= BECH32_REV_CHARSET.length || BECH32_REV_CHARSET[code] === 100) {
      throw new Error(`Invalid bech32 character: ${ch}`);
    }
    addressU5.push(BECH32_REV_CHARSET[code]);
  }
  
  if (addressU5.length < 8) throw new Error('Address payload too short');
  
  // Split payload and checksum (last 8 chars = checksum)
  const payloadU5 = addressU5.slice(0, addressU5.length - 8);
  const checksumU5 = addressU5.slice(addressU5.length - 8);
  
  // Verify checksum
  const prefixBytes = new TextEncoder().encode(hrp);
  const checksumU8 = conv5to8(checksumU5);
  // Pad to 8 bytes (u64 BE): [0,0,0, ...5 bytes]
  const checksumPadded = [0, 0, 0, ...checksumU8];
  let expectedChecksum = 0n;
  for (const b of checksumPadded) expectedChecksum = (expectedChecksum << 8n) | BigInt(b);
  
  const computed = kaspaChecksum(payloadU5, prefixBytes);
  if (computed !== expectedChecksum) {
    throw new Error(`Invalid Kaspa address checksum (got ${computed}, expected ${expectedChecksum})`);
  }
  
  // Convert 5-bit payload to 8-bit
  const payloadU8 = conv5to8(payloadU5);
  return new Uint8Array(payloadU8);
}