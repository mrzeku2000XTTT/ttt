// KRC-20 Token Transfer via Kasplex Commit-Reveal Protocol
// Full implementation: Commit TX + auto Reveal TX
//
// PROTOCOL (from coinchimp/kaspa-krc20-apps & ghost-wallet):
//   Step 1: Build inscription script (redeem script) with KRC-20 JSON
//   Step 2: Blake2b-256 hash script → derive P2SH address
//   Step 3: COMMIT TX — send 0.3 KAS to P2SH address
//   Step 4: Wait for UTXO to appear (~5-10s)
//   Step 5: REVEAL TX — spend the P2SH UTXO using redeem script as signatureScript

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { KaspaWallet } from 'npm:@okxweb3/coin-kaspa@2.4.9';
import { blake2b } from 'npm:@noble/hashes@1.4.0/blake2b';
import { schnorr } from 'npm:@noble/curves@1.4.0/secp256k1';

const KASPA_API = 'https://api.kaspa.org';
const COMMIT_AMOUNT_KAS = 0.3;
const COMMIT_AMOUNT_SOMPI = 30000000;
const FEE_SOMPI = 10000;
const REVEAL_FEE_SOMPI = 50000; // Higher fee for reveal (P2SH is heavier)

// ==========================================
// OPCODES (from rusty-kaspa)
// ==========================================
const OP_FALSE = 0x00;
const OP_DATA_32 = 0x20;
const OP_1 = 0x51;
const OP_IF = 0x63;
const OP_ENDIF = 0x68;
const OP_BLAKE2B = 0xaa;
const OP_EQUAL = 0x87;
const OP_CHECKSIG = 0xac;
const OP_PUSHDATA1 = 0x4c;
const OP_PUSHDATA2 = 0x4d;

// ==========================================
// SCRIPT BUILDER
// ==========================================
function canonicalDataPush(data) {
  const len = data.length;
  if (len === 0) return new Uint8Array([OP_FALSE]);
  if (len === 1 && data[0] >= 1 && data[0] <= 16) {
    return new Uint8Array([(OP_1 - 1) + data[0]]);
  }
  if (len <= 75) {
    const result = new Uint8Array(1 + len);
    result[0] = len;
    result.set(data, 1);
    return result;
  }
  if (len <= 255) {
    const result = new Uint8Array(2 + len);
    result[0] = OP_PUSHDATA1;
    result[1] = len;
    result.set(data, 2);
    return result;
  }
  const result = new Uint8Array(3 + len);
  result[0] = OP_PUSHDATA2;
  result[1] = len & 0xff;
  result[2] = (len >> 8) & 0xff;
  result.set(data, 3);
  return result;
}

function addI64Zero() { return new Uint8Array([OP_FALSE]); }

function buildInscriptionScript(xOnlyPubKeyHex, krc20Json) {
  const pubKeyBytes = hexToBytes(xOnlyPubKeyHex);
  const kasplexBytes = new TextEncoder().encode('kasplex');
  const jsonBytes = new TextEncoder().encode(krc20Json);
  const parts = [
    canonicalDataPush(pubKeyBytes),
    new Uint8Array([OP_CHECKSIG]),
    new Uint8Array([OP_FALSE]),
    new Uint8Array([OP_IF]),
    canonicalDataPush(kasplexBytes),
    addI64Zero(),
    canonicalDataPush(jsonBytes),
    new Uint8Array([OP_ENDIF]),
  ];
  const totalLen = parts.reduce((s, p) => s + p.length, 0);
  const script = new Uint8Array(totalLen);
  let offset = 0;
  for (const part of parts) { script.set(part, offset); offset += part.length; }
  return script;
}

function createP2SHScriptPublicKey(redeemScript) {
  const hash = blake2b(redeemScript, { dkLen: 32 });
  const scriptPubKey = new Uint8Array(35);
  scriptPubKey[0] = OP_BLAKE2B;
  scriptPubKey[1] = OP_DATA_32;
  scriptPubKey.set(hash, 2);
  scriptPubKey[34] = OP_EQUAL;
  return { scriptPubKey, scriptHash: hash, version: 1 };
}

function scriptHashToAddress(scriptHash, network = 'mainnet') {
  const hrp = network === 'mainnet' ? 'kaspa' : 'kaspatest';
  const payload = new Uint8Array(1 + scriptHash.length);
  payload[0] = 0x08;
  payload.set(scriptHash, 1);
  return encodeKaspaBech32(hrp, payload);
}

async function getXOnlyPubKey(privateKeyHex) {
  const wallet = new KaspaWallet();
  const addressResult = await wallet.getNewAddress({ privateKey: privateKeyHex });
  const addr = addressResult.address || addressResult;
  let addrStr = typeof addr === 'string' ? addr : addr.toString();
  const payload = decodeKaspaBech32(addrStr);
  const xOnlyPubKey = payload.slice(1);
  return bytesToHex(xOnlyPubKey);
}

// ==========================================
// KASPA SIGHASH (BIP-143 variant)
// ==========================================
function writeU16LE(val) {
  const b = new Uint8Array(2);
  b[0] = val & 0xff; b[1] = (val >> 8) & 0xff;
  return b;
}
function writeU32LE(val) {
  const b = new Uint8Array(4);
  b[0] = val & 0xff; b[1] = (val >> 8) & 0xff;
  b[2] = (val >> 16) & 0xff; b[3] = (val >> 24) & 0xff;
  return b;
}
function writeU64LE(val) {
  // val is a BigInt or number
  const n = BigInt(val);
  const b = new Uint8Array(8);
  for (let i = 0; i < 8; i++) b[i] = Number((n >> BigInt(i * 8)) & 0xffn);
  return b;
}

function hashBlake2b(data) {
  return blake2b(data, { dkLen: 32 });
}

/**
 * Compute previousOutputsHash: blake2b of all input outpoints
 */
function computePrevOutputsHash(inputs) {
  const parts = [];
  for (const inp of inputs) {
    parts.push(hexToBytes(inp.prevTxId));
    parts.push(writeU32LE(inp.prevIndex));
  }
  return hashBlake2b(concatBytes(...parts));
}

/**
 * Compute sequencesHash: blake2b of all input sequences
 */
function computeSequencesHash(inputs) {
  const parts = [];
  for (const inp of inputs) {
    parts.push(writeU64LE(inp.sequence ?? 0n));
  }
  return hashBlake2b(concatBytes(...parts));
}

/**
 * Compute sigOpCountsHash: blake2b of all input sigOpCounts
 */
function computeSigOpCountsHash(inputs) {
  const parts = [];
  for (const inp of inputs) {
    parts.push(new Uint8Array([inp.sigOpCount ?? 1]));
  }
  return hashBlake2b(concatBytes(...parts));
}

/**
 * Compute outputsHash: blake2b of all outputs
 */
function computeOutputsHash(outputs) {
  const parts = [];
  for (const out of outputs) {
    parts.push(writeU64LE(out.amount));
    parts.push(writeU16LE(out.scriptVersion ?? 0));
    // Script length as u64 LE then script bytes
    parts.push(writeU64LE(out.scriptPubKey.length));
    parts.push(out.scriptPubKey);
  }
  return hashBlake2b(concatBytes(...parts));
}

/**
 * Build sighash for input at given index
 * Based on Kaspa BIP-143 variant
 */
function computeSigHash(tx, inputIndex, sighashType = 0x01) {
  const inp = tx.inputs[inputIndex];
  
  const prevOutputsHash = computePrevOutputsHash(tx.inputs);
  const sequencesHash = computeSequencesHash(tx.inputs);
  const sigOpCountsHash = computeSigOpCountsHash(tx.inputs);
  const outputsHash = computeOutputsHash(tx.outputs);
  
  // SubnetworkID for native tx = 20 zero bytes
  const subnetworkId = new Uint8Array(20);
  // PayloadHash for native tx = 32 zero bytes
  const payloadHash = new Uint8Array(32);
  
  const message = concatBytes(
    writeU16LE(tx.version ?? 0),            // 1. version
    prevOutputsHash,                         // 2. previousOutputsHash
    sequencesHash,                           // 3. sequencesHash
    sigOpCountsHash,                         // 4. sigOpCountsHash
    hexToBytes(inp.prevTxId),               // 5. prevOutpoint.txId
    writeU32LE(inp.prevIndex),              // 6. prevOutpoint.index
    writeU16LE(inp.scriptVersion ?? 0),     // 7. prevOutput.scriptPubKeyVersion
    writeU64LE(inp.scriptPubKey.length),    // 8. prevOutput.scriptPubKey.length
    inp.scriptPubKey,                        // 9. prevOutput.scriptPubKey
    writeU64LE(inp.amount),                 // 10. prevOutput.value
    writeU64LE(inp.sequence ?? 0n),         // 11. sequence
    new Uint8Array([inp.sigOpCount ?? 1]),  // 12. sigOpCount
    outputsHash,                             // 13. outputsHash
    writeU64LE(tx.locktime ?? 0n),          // 14. locktime
    subnetworkId,                            // 15. subnetworkId
    writeU64LE(tx.gas ?? 0n),               // 16. gas
    payloadHash,                             // 17. payloadHash
    new Uint8Array([sighashType]),           // 18. sighashType
  );
  
  return hashBlake2b(message);
}

/**
 * Schnorr sign (x-only / BIP-340 style used by Kaspa)
 */
function schnorrSign(messageHash, privateKeyHex) {
  // @noble/curves schnorr.sign expects (Uint8Array, Uint8Array)
  // Convert hex to proper Uint8Array
  const privBytes = new Uint8Array(32);
  for (let i = 0; i < 64; i += 2) privBytes[i / 2] = parseInt(privateKeyHex.substr(i, 2), 16);
  const msgBytes = messageHash instanceof Uint8Array ? new Uint8Array(messageHash) : messageHash;
  const sig = schnorr.sign(msgBytes, privBytes);
  return new Uint8Array(sig);
}

// ==========================================
// RAW TRANSACTION BUILDER FOR REVEAL
// ==========================================

/**
 * Build and submit the reveal transaction
 * 
 * Inputs:
 *  - P2SH UTXO (the commit output) — signed with redeem script
 *  - Sender UTXOs (for gas) — signed normally
 * 
 * Output:
 *  - Change back to sender
 */
async function buildAndSubmitRevealTx({
  privateKeyHex,
  xOnlyPubKeyHex,
  senderAddress,
  redeemScript,
  p2shAddress,
  p2shScriptPubKey,
  commitTxId,
  network = 'mainnet',
}) {
  console.log('[reveal] Starting reveal TX construction...');
  
  // 1. Wait for P2SH UTXO to appear
  let p2shUtxo = null;
  for (let attempt = 0; attempt < 20; attempt++) {
    await new Promise(r => setTimeout(r, 3000)); // wait 3s between polls
    console.log(`[reveal] Polling P2SH UTXO (attempt ${attempt + 1}/20)...`);
    
    const res = await fetch(`${KASPA_API}/addresses/${p2shAddress}/utxos`);
    if (res.ok) {
      const utxos = await res.json();
      p2shUtxo = utxos.find(u => u.outpoint.transactionId === commitTxId);
      if (p2shUtxo) {
        console.log(`[reveal] ✓ Found P2SH UTXO: ${p2shUtxo.utxoEntry.amount} sompi`);
        break;
      }
    }
  }
  
  if (!p2shUtxo) {
    throw new Error('P2SH UTXO not found after 60s. Commit TX may not have confirmed.');
  }
  
  // 2. Fetch sender UTXOs for gas
  const senderRes = await fetch(`${KASPA_API}/addresses/${senderAddress}/utxos`);
  if (!senderRes.ok) throw new Error('Failed to fetch sender UTXOs');
  const senderUtxos = await senderRes.json();
  
  // Select enough sender UTXOs for gas fee
  let gasTotal = 0;
  const gasUtxos = [];
  senderUtxos.sort((a, b) => Number(b.utxoEntry.amount) - Number(a.utxoEntry.amount));
  for (const u of senderUtxos) {
    if (gasTotal >= REVEAL_FEE_SOMPI) break;
    if (gasUtxos.length >= 10) break;
    gasUtxos.push(u);
    gasTotal += Number(u.utxoEntry.amount);
  }
  
  if (gasTotal < REVEAL_FEE_SOMPI) {
    throw new Error(`Insufficient gas for reveal. Need ${REVEAL_FEE_SOMPI / 1e8} KAS, have ${gasTotal / 1e8} KAS`);
  }
  
  // 3. Decode sender address to get its scriptPubKey
  const senderPayload = decodeKaspaBech32(senderAddress);
  const senderVersion = senderPayload[0]; // 0x00 = PubKey
  const senderPubKeyHash = senderPayload.slice(1);
  // Standard P2PK scriptPubKey: [OP_DATA_32, pubkey_hash(32), OP_CHECKSIG]
  const senderScriptPubKey = new Uint8Array(34);
  senderScriptPubKey[0] = OP_DATA_32;
  senderScriptPubKey.set(senderPubKeyHash, 1);
  senderScriptPubKey[33] = OP_CHECKSIG;
  
  // 4. Build transaction inputs
  const p2shAmount = Number(p2shUtxo.utxoEntry.amount);
  const totalIn = p2shAmount + gasTotal;
  const changeAmount = totalIn - REVEAL_FEE_SOMPI;
  
  // P2SH input first (index 0)
  const txInputs = [
    {
      prevTxId: p2shUtxo.outpoint.transactionId,
      prevIndex: p2shUtxo.outpoint.index,
      scriptVersion: 1, // P2SH version
      scriptPubKey: p2shScriptPubKey,
      amount: BigInt(p2shAmount),
      sequence: 0n,
      sigOpCount: 1,
      isP2SH: true,
    },
  ];
  
  // Gas inputs
  for (const u of gasUtxos) {
    txInputs.push({
      prevTxId: u.outpoint.transactionId,
      prevIndex: u.outpoint.index,
      scriptVersion: 0,
      scriptPubKey: senderScriptPubKey,
      amount: BigInt(Number(u.utxoEntry.amount)),
      sequence: 0n,
      sigOpCount: 1,
      isP2SH: false,
    });
  }
  
  // 5. Build outputs (just change back to sender)
  const txOutputs = [];
  if (changeAmount > 0) {
    txOutputs.push({
      amount: BigInt(changeAmount),
      scriptVersion: 0,
      scriptPubKey: senderScriptPubKey,
    });
  }
  
  const tx = {
    version: 0,
    inputs: txInputs,
    outputs: txOutputs,
    locktime: 0n,
    gas: 0n,
  };
  
  // 6. Sign each input
  const signatureScripts = [];
  
  for (let i = 0; i < txInputs.length; i++) {
    const inp = txInputs[i];
    const sigHash = computeSigHash(tx, i, 0x01); // SigHashAll
    
    if (inp.isP2SH) {
      // P2SH input: Schnorr sign with redeemScript
      console.log(`[reveal] Signing P2SH input ${i}, sigHash: ${bytesToHex(sigHash)}`);
      const sig = schnorrSign(sigHash, privateKeyHex);
      // signatureScript = [sig_push(65 bytes: 64 sig + 1 sighashtype), redeemScript_push]
      const sigWithType = concatBytes(sig, new Uint8Array([0x01])); // append SigHashAll
      const sigScript = concatBytes(
        canonicalDataPush(sigWithType),
        canonicalDataPush(redeemScript)
      );
      signatureScripts.push(bytesToHex(sigScript));
    } else {
      // Standard P2PK input: Schnorr sign
      console.log(`[reveal] Signing standard input ${i}, sigHash: ${bytesToHex(sigHash)}`);
      const sig = schnorrSign(sigHash, privateKeyHex);
      const sigWithType = concatBytes(sig, new Uint8Array([0x01]));
      const sigScript = canonicalDataPush(sigWithType);
      signatureScripts.push(bytesToHex(sigScript));
    }
  }
  
  // 7. Build the raw transaction for submission
  const rawTx = {
    version: 0,
    inputs: txInputs.map((inp, i) => ({
      previousOutpoint: {
        transactionId: inp.prevTxId,
        index: inp.prevIndex,
      },
      signatureScript: signatureScripts[i],
      sequence: "0",
      sigOpCount: inp.sigOpCount,
    })),
    outputs: txOutputs.map(out => ({
      amount: out.amount.toString(),
      scriptPublicKey: {
        version: out.scriptVersion,
        scriptPublicKey: bytesToHex(out.scriptPubKey),
      },
    })),
    lockTime: "0",
    subnetworkId: "0000000000000000000000000000000000000000",
  };
  
  console.log('[reveal] Submitting reveal TX...');
  console.log('[reveal] Inputs:', rawTx.inputs.length, 'Outputs:', rawTx.outputs.length);
  
  const submitRes = await fetch(`${KASPA_API}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transaction: rawTx, allowOrphan: false }),
  });
  
  const submitText = await submitRes.text();
  console.log('[reveal] Submit status:', submitRes.status, submitText.slice(0, 300));
  
  if (!submitRes.ok) {
    throw new Error(`Reveal submit failed (${submitRes.status}): ${submitText.slice(0, 300)}`);
  }
  
  let submitData;
  try { submitData = JSON.parse(submitText); } catch { submitData = submitText; }
  const revealTxId = submitData.transactionId || submitData.txid || '';
  console.log(`[reveal] ✓ Reveal TX: ${revealTxId}`);
  
  return revealTxId;
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
      action = 'transfer',
      mnemonic,
      privateKey: inputPrivateKey,
      fromAddress,
      toAddress,
      amount,
      ticker,
      decimals = 8,
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

    // ---- ACTION: Full KRC-20 Transfer (Commit + Reveal) ----
    if (action === 'transfer' || action === 'commit') {
      if (!privateKey || !fromAddress || !toAddress || !amount || !ticker) {
        return Response.json({
          error: 'Missing required: mnemonic/privateKey, fromAddress, toAddress, amount, ticker'
        }, { status: 400 });
      }

      const normalizedFrom = fromAddress.startsWith('kaspa:') ? fromAddress : `kaspa:${fromAddress}`;
      const normalizedTo = toAddress.startsWith('kaspa:') ? toAddress : `kaspa:${toAddress}`;

      console.log(`[krc20] ${ticker} transfer: ${amount} from ${normalizedFrom} to ${normalizedTo}`);

      // 1. Get x-only public key
      const xOnlyPubKey = await getXOnlyPubKey(privateKey);
      console.log(`[krc20] x-only pubkey: ${xOnlyPubKey}`);

      // 2. Build inscription script
      const amtSompiStr = (BigInt(Math.round(parseFloat(amount) * Math.pow(10, decimals)))).toString();
      const krc20Data = { p: 'krc-20', op: 'transfer', tick: ticker.toUpperCase(), amt: amtSompiStr, to: normalizedTo };
      const krc20Json = JSON.stringify(krc20Data, null, 0);
      console.log(`[krc20] Payload: ${krc20Json}`);

      const redeemScript = buildInscriptionScript(xOnlyPubKey, krc20Json);
      console.log(`[krc20] Redeem script: ${redeemScript.length} bytes`);

      // 3. Derive P2SH address
      const { scriptHash, scriptPubKey: p2shScriptPubKey } = createP2SHScriptPublicKey(redeemScript);
      const p2shAddress = scriptHashToAddress(scriptHash, network);
      console.log(`[krc20] P2SH address: ${p2shAddress}`);

      // 4. DRY-RUN: Test Schnorr signing BEFORE sending any KAS
      //    This prevents wasting 0.3 KAS on commit if reveal signing will fail
      console.log(`[krc20] Testing Schnorr signing before commit...`);
      try {
        const testMsg = new Uint8Array(32); // dummy 32-byte message
        const testPrivBytes = new Uint8Array(32);
        for (let i = 0; i < 64; i += 2) testPrivBytes[i / 2] = parseInt(privateKey.substr(i, 2), 16);
        const testSig = schnorr.sign(testMsg, testPrivBytes);
        if (!testSig || testSig.length !== 64) throw new Error('Schnorr signing produced invalid signature');
        console.log(`[krc20] ✓ Schnorr signing dry-run passed`);
      } catch (signErr) {
        console.error(`[krc20] ✗ Schnorr signing dry-run FAILED:`, signErr.message);
        return Response.json({
          success: false,
          error: `Signing test failed — commit TX NOT sent (no KAS wasted). Error: ${signErr.message}`,
        }, { status: 400 });
      }

      // 5. Send COMMIT TX — 0.3 KAS to P2SH address
      console.log(`[krc20] Sending commit TX: ${COMMIT_AMOUNT_KAS} KAS to ${p2shAddress}`);
      
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
      console.log(`[krc20] ✓ Commit TX: ${commitTxId}`);

      // 5. Auto-execute REVEAL TX
      try {
        const revealTxId = await buildAndSubmitRevealTx({
          privateKeyHex: privateKey,
          xOnlyPubKeyHex: xOnlyPubKey,
          senderAddress: normalizedFrom,
          redeemScript,
          p2shAddress,
          p2shScriptPubKey,
          commitTxId,
          network,
        });

        return Response.json({
          success: true,
          phase: 'complete',
          commitTxId,
          revealTxId,
          ticker: ticker.toUpperCase(),
          amount,
          toAddress: normalizedTo,
          p2shAddress,
        });
      } catch (revealErr) {
        console.error(`[krc20] Reveal failed:`, revealErr.message);
        // Return commit success + reveal error so user knows what happened
        return Response.json({
          success: false,
          phase: 'commit_only',
          commitTxId,
          p2shAddress,
          ticker: ticker.toUpperCase(),
          amount,
          error: `Commit succeeded but reveal failed: ${revealErr.message}`,
          redeemScriptHex: bytesToHex(redeemScript),
        });
      }
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

    // ---- ACTION: Build script (debug) ----
    if (action === 'buildScript') {
      if (!privateKey || !ticker || !amount || !toAddress) {
        return Response.json({ error: 'Missing: privateKey/mnemonic, ticker, amount, toAddress' }, { status: 400 });
      }
      const xOnlyPubKey = await getXOnlyPubKey(privateKey);
      const amtSompiStr = (BigInt(Math.round(parseFloat(amount) * Math.pow(10, decimals)))).toString();
      const krc20Data = { p: 'krc-20', op: 'transfer', tick: ticker.toUpperCase(), amt: amtSompiStr, to: toAddress };
      const krc20Json = JSON.stringify(krc20Data, null, 0);
      const redeemScript = buildInscriptionScript(xOnlyPubKey, krc20Json);
      const { scriptHash } = createP2SHScriptPublicKey(redeemScript);
      const p2shAddress = scriptHashToAddress(scriptHash, network);
      return Response.json({
        success: true, xOnlyPubKey, krc20Json,
        redeemScriptHex: bytesToHex(redeemScript),
        scriptHashHex: bytesToHex(scriptHash),
        p2shAddress,
      });
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
  for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  return bytes;
}

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function concatBytes(...arrays) {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) { result.set(a, offset); offset += a.length; }
  return result;
}

// ==========================================
// KASPA BECH32
// ==========================================
const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const BECH32_REV_CHARSET = new Uint8Array(123).fill(100);
'qpzry9x8gf2tvdw0s3jn54khce6mua7l'.split('').forEach((c, i) => { BECH32_REV_CHARSET[c.charCodeAt(0)] = i; });

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

function conv8to5(payload) {
  const padding = (payload.length * 8 % 5 !== 0) ? 1 : 0;
  const fiveBit = new Array(Math.floor(payload.length * 8 / 5) + padding).fill(0);
  let idx = 0, buff = 0, bits = 0;
  for (const c of payload) {
    buff = (buff << 8) | c; bits += 8;
    while (bits >= 5) { bits -= 5; fiveBit[idx++] = (buff >> bits) & 0x1f; buff &= (1 << bits) - 1; }
  }
  if (bits > 0) fiveBit[idx] = (buff << (5 - bits)) & 0x1f;
  return fiveBit;
}

function conv5to8(payload) {
  const eightBit = new Array(Math.floor(payload.length * 5 / 8)).fill(0);
  let idx = 0, buff = 0, bits = 0;
  for (const c of payload) {
    buff = (buff << 5) | c; bits += 5;
    while (bits >= 8) { bits -= 8; eightBit[idx++] = (buff >> bits) & 0xff; buff &= (1 << bits) - 1; }
  }
  return eightBit;
}

function kaspaChecksum(payloadU5, prefixBytes) {
  const prefixU5 = Array.from(prefixBytes).map(b => b & 0x1f);
  const values = [...prefixU5, 0, ...payloadU5, 0, 0, 0, 0, 0, 0, 0, 0];
  return polymod(values);
}

function encodeKaspaBech32(hrp, payload) {
  const fiveBitPayload = conv8to5(Array.from(payload));
  const prefixBytes = new TextEncoder().encode(hrp);
  const checksumVal = kaspaChecksum(fiveBitPayload, prefixBytes);
  const checksumBytes = [];
  let cv = checksumVal;
  for (let i = 0; i < 8; i++) { checksumBytes.unshift(Number(cv & 0xffn)); cv >>= 8n; }
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
  const addressU5 = [];
  for (const ch of dataPart) {
    const code = ch.charCodeAt(0);
    if (code >= BECH32_REV_CHARSET.length || BECH32_REV_CHARSET[code] === 100) {
      throw new Error(`Invalid bech32 character: ${ch}`);
    }
    addressU5.push(BECH32_REV_CHARSET[code]);
  }
  if (addressU5.length < 8) throw new Error('Address payload too short');
  const payloadU5 = addressU5.slice(0, addressU5.length - 8);
  const payloadU8 = conv5to8(payloadU5);
  return new Uint8Array(payloadU8);
}