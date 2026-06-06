// KRC-20 Token Transfer via Kasplex Commit-Reveal Protocol
// Hardened implementation aligned with KASPACOM + coinchimp reference
//
// PROTOCOL:
//   Step 1: Build inscription script (redeem script) with KRC-20 JSON
//   Step 2: Blake2b-256 hash script → derive P2SH address
//   Step 3: COMMIT TX — send 0.3 KAS to P2SH address
//   Step 4: Wait for P2SH UTXO confirmation
//   Step 5: REVEAL TX — spend P2SH UTXO back to sender (inscription broadcast)
//
// KEY FIXES (v5):
//   - Sighash always uses actual UTXO scriptPubKey (P2SH wrapper), NOT redeem script
//   - Kaspa sighash differs from Bitcoin BIP-143: no script substitution for P2SH
//   - Transaction version = 0 (Kaspa native TX version)
//   - P2SH input sigOpCount = 0 (P2SH scriptPubKey has no OP_CHECKSIG)
//   - Transaction IDs reversed to LE in sighash (Kaspa convention)
//   - Sender UTXO retry for change output indexing delay
//   - Bech32 checksum validation on toAddress
//   - Minimum output enforced at 0.1 KAS per KASPACOM
//   - Enhanced retry with exponential backoff

import { blake2b } from 'npm:@noble/hashes@1.4.0/blake2b';
import { schnorr } from 'npm:@noble/curves@1.4.0/secp256k1';

// Lazy-load the OKX Kaspa SDK only when a signing action needs it.
// This keeps balance/status (REST-only) actions working even if the SDK
// fails to resolve, and prevents a broken import from 404-ing the whole function.
let _KaspaWallet = null;
async function getKaspaWallet() {
  if (!_KaspaWallet) {
    const mod = await import('npm:@okxweb3/coin-kaspa@1.0.6');
    _KaspaWallet = mod.KaspaWallet;
  }
  return _KaspaWallet;
}

const KASPA_API = 'https://api.kaspa.org';
const COMMIT_AMOUNT_KAS = 0.3;
const COMMIT_AMOUNT_SOMPI = 30000000n;
const MIN_REVEAL_OUTPUT = 10000000n;  // 0.1 KAS minimum output (KASPACOM: MIN_FOR_SUBMIT_REVEAL_OUTPUT)
const REVEAL_FEE_SOMPI = 100000n;     // 0.001 KAS fee for reveal (generous)

// ==========================================
// OPCODES
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
// SCRIPT BUILDER (matches KASPACOM ScriptBuilder)
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

// Build inscription redeem script:
// <xOnlyPubKey> OP_CHECKSIG OP_FALSE OP_IF <"kasplex"> <0> <jsonData> OP_ENDIF
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
    new Uint8Array([OP_FALSE]),      // addI64(0n) → OP_FALSE
    canonicalDataPush(jsonBytes),
    new Uint8Array([OP_ENDIF]),
  ];
  const totalLen = parts.reduce((s, p) => s + p.length, 0);
  const script = new Uint8Array(totalLen);
  let offset = 0;
  for (const part of parts) { script.set(part, offset); offset += part.length; }
  return script;
}

// Create P2SH scriptPubKey: OP_BLAKE2B <32-byte-hash> OP_EQUAL
function createP2SHScriptPublicKey(redeemScript) {
  const hash = blake2b(redeemScript, { dkLen: 32 });
  const scriptPubKey = new Uint8Array(35);
  scriptPubKey[0] = OP_BLAKE2B;
  scriptPubKey[1] = OP_DATA_32;
  scriptPubKey.set(hash, 2);
  scriptPubKey[34] = OP_EQUAL;
  return { scriptPubKey, scriptHash: hash };
}

function scriptHashToAddress(scriptHash, network = 'mainnet') {
  const hrp = network === 'mainnet' ? 'kaspa' : 'kaspatest';
  const payload = new Uint8Array(1 + scriptHash.length);
  payload[0] = 0x08; // ScriptHash type byte
  payload.set(scriptHash, 1);
  return encodeKaspaBech32(hrp, payload);
}

async function getXOnlyPubKey(privateKeyHex) {
  const KaspaWallet = await getKaspaWallet();
  const wallet = new KaspaWallet();
  const addressResult = await wallet.getNewAddress({ privateKey: privateKeyHex });
  const addr = addressResult.address || addressResult;
  let addrStr = typeof addr === 'string' ? addr : addr.toString();
  const payload = decodeKaspaBech32(addrStr);
  return bytesToHex(payload.slice(1)); // Skip type byte, get 32-byte x-only pubkey
}

// ==========================================
// SIGHASH (Kaspa BIP-143 variant)
// ==========================================
function writeU8(val) { return new Uint8Array([val & 0xff]); }
function writeU16LE(val) {
  const b = new Uint8Array(2);
  b[0] = val & 0xff; b[1] = (val >> 8) & 0xff;
  return b;
}
function writeU32LE(val) {
  const b = new Uint8Array(4);
  for (let i = 0; i < 4; i++) b[i] = (val >> (i * 8)) & 0xff;
  return b;
}
function writeU64LE(val) {
  const n = BigInt(val);
  const b = new Uint8Array(8);
  for (let i = 0; i < 8; i++) b[i] = Number((n >> BigInt(i * 8)) & 0xffn);
  return b;
}

// Kaspa uses KEYED Blake2b for transaction signing hashes
// Key = b"TransactionSigningHash" (from rusty-kaspa blake2b_hasher! macro)
const SIGHASH_KEY = new TextEncoder().encode('TransactionSigningHash');

function hashBlake2b(data) {
  // Plain (unkeyed) blake2b — used for script hashing (P2SH)
  return blake2b(data, { dkLen: 32 });
}

function hashBlake2bKeyed(data) {
  // KEYED blake2b — used for ALL sighash computations
  return blake2b(data, { dkLen: 32, key: SIGHASH_KEY });
}

// Kaspa transaction IDs are 32-byte hashes used as-is (NO byte reversal unlike Bitcoin)
function txIdToBytes(txIdHex) {
  return hexToBytes(txIdHex);
}

// Hash of all outpoints (txId as raw bytes + index as u32 LE)
function hashPrevOutputs(inputs) {
  const parts = [];
  for (const inp of inputs) {
    parts.push(txIdToBytes(inp.prevTxId));
    parts.push(writeU32LE(inp.prevIndex));
  }
  return hashBlake2bKeyed(concatBytes(...parts));
}

function hashSequences(inputs) {
  const parts = inputs.map(inp => writeU64LE(inp.sequence ?? 0n));
  return hashBlake2bKeyed(concatBytes(...parts));
}

function hashSigOpCounts(inputs) {
  const parts = inputs.map(inp => writeU8(inp.sigOpCount));
  return hashBlake2bKeyed(concatBytes(...parts));
}

function hashOutputs(outputs) {
  const parts = [];
  for (const out of outputs) {
    parts.push(writeU64LE(out.amount));
    parts.push(writeU16LE(out.scriptVersion ?? 0));
    parts.push(writeU64LE(BigInt(out.scriptPubKey.length)));
    parts.push(out.scriptPubKey);
  }
  return hashBlake2bKeyed(concatBytes(...parts));
}

/**
 * Kaspa SigHash computation (SigHashAll = 0x01)
 * Reference: kaspa-mdbook.aspectron.com/transactions/sighashes.html
 *
 * IMPORTANT: Unlike Bitcoin BIP-143, Kaspa does NOT substitute the redeem
 * script for P2SH inputs in the sighash. Field 9 is always
 * "txIn.PreviousOutput.ScriptPubKey" — the actual UTXO script on-chain.
 * For P2SH inputs this is the wrapper (OP_BLAKE2B <hash> OP_EQUAL).
 * The redeem script is only revealed in the signatureScript, not in sighash.
 */
function computeSigHash(tx, inputIndex) {
  const inp = tx.inputs[inputIndex];
  const sighashType = 0x01;

  const prevOutputsHash = hashPrevOutputs(tx.inputs);
  const sequencesHash = hashSequences(tx.inputs);
  const sigOpCountsHash = hashSigOpCounts(tx.inputs);
  const outputsHash = hashOutputs(tx.outputs);

  const subnetworkId = new Uint8Array(20);
  const payloadHash = new Uint8Array(32);

  // ALWAYS use the actual UTXO scriptPubKey — no P2SH script substitution in Kaspa
  const scriptForSighash = inp.utxoScriptPubKey;

  const message = concatBytes(
    writeU16LE(tx.version ?? 0),
    prevOutputsHash,
    sequencesHash,
    sigOpCountsHash,
    txIdToBytes(inp.prevTxId),
    writeU32LE(inp.prevIndex),
    writeU16LE(inp.utxoScriptVersion ?? 0),
    writeU64LE(BigInt(scriptForSighash.length)),
    scriptForSighash,
    writeU64LE(inp.utxoAmount),
    writeU64LE(inp.sequence ?? 0n),
    writeU8(inp.sigOpCount),
    outputsHash,
    writeU64LE(tx.locktime ?? 0n),
    subnetworkId,
    writeU64LE(tx.gas ?? 0n),
    payloadHash,
    writeU8(sighashType),
  );

  return hashBlake2bKeyed(message);
}

function schnorrSign(messageHash, privateKeyHex) {
  const privBytes = hexToBytes(privateKeyHex);
  return new Uint8Array(schnorr.sign(messageHash, privBytes));
}

// ==========================================
// COMMIT TX BUILDER (manual, avoids OKX SDK storage mass issues)
// ==========================================
async function buildAndSubmitCommitTx({
  privateKeyHex,
  senderAddress,
  p2shAddress,
  p2shScriptPubKey,
  commitAmountSompi,
}) {
  // Fetch sender UTXOs
  const utxoRes = await fetch(`${KASPA_API}/addresses/${senderAddress}/utxos`, {
    signal: AbortSignal.timeout(15000)
  });
  if (!utxoRes.ok) throw new Error(`Failed to fetch sender UTXOs: ${utxoRes.status}`);
  const allUtxos = await utxoRes.json();
  if (!allUtxos || allUtxos.length === 0) throw new Error('No UTXOs available for commit TX');

  // Select UTXOs (largest first, max 2 to keep mass low)
  allUtxos.sort((a, b) => Number(b.utxoEntry.amount) - Number(a.utxoEntry.amount));
  const feeSompi = 10000n; // 0.0001 KAS
  const needed = commitAmountSompi + feeSompi;
  let totalIn = 0n;
  const selectedUtxos = [];
  for (const u of allUtxos) {
    if (totalIn >= needed) break;
    if (selectedUtxos.length >= 2) break;
    selectedUtxos.push(u);
    totalIn += BigInt(u.utxoEntry.amount);
  }
  if (totalIn < needed) throw new Error(`Insufficient balance for commit: have ${Number(totalIn)/1e8} KAS, need ${Number(needed)/1e8} KAS`);

  // Build sender scriptPubKey
  const senderPayload = decodeKaspaBech32(senderAddress);
  const senderPubKeyHash = senderPayload.slice(1);
  const senderScriptPubKey = new Uint8Array(34);
  senderScriptPubKey[0] = OP_DATA_32;
  senderScriptPubKey.set(senderPubKeyHash, 1);
  senderScriptPubKey[33] = OP_CHECKSIG;

  // Build inputs
  const inputs = selectedUtxos.map(u => ({
    prevTxId: u.outpoint.transactionId,
    prevIndex: u.outpoint.index,
    utxoScriptVersion: 0,
    utxoScriptPubKey: senderScriptPubKey,
    utxoAmount: BigInt(u.utxoEntry.amount),
    sequence: 0n,
    sigOpCount: 1,
    isP2SH: false,
  }));

  // Build outputs: P2SH output + change
  const changeAmount = totalIn - commitAmountSompi - feeSompi;
  const outputs = [
    { amount: commitAmountSompi, scriptVersion: 0, scriptPubKey: p2shScriptPubKey },
  ];
  if (changeAmount >= 10000000n) { // 0.1 KAS min
    outputs.push({ amount: changeAmount, scriptVersion: 0, scriptPubKey: senderScriptPubKey });
  }

  const tx = { version: 0, inputs, outputs, locktime: 0n, gas: 0n };

  // Sign each input
  const signatureScripts = [];
  for (let i = 0; i < inputs.length; i++) {
    const sigHash = computeSigHash(tx, i);
    const sig = schnorrSign(sigHash, privateKeyHex);
    const sigWithType = concatBytes(sig, new Uint8Array([0x01]));
    signatureScripts.push(bytesToHex(canonicalDataPush(sigWithType)));
  }

  // Build raw TX
  const rawTx = {
    version: 0,
    inputs: inputs.map((inp, i) => ({
      previousOutpoint: { transactionId: inp.prevTxId, index: inp.prevIndex },
      signatureScript: signatureScripts[i],
      sequence: "0",
      sigOpCount: inp.sigOpCount,
    })),
    outputs: outputs.map(out => ({
      amount: out.amount.toString(),
      scriptPublicKey: { version: out.scriptVersion, scriptPublicKey: bytesToHex(out.scriptPubKey) },
    })),
    lockTime: "0",
    subnetworkId: "0000000000000000000000000000000000000000",
  };

  // Submit
  console.log(`[commit] Submitting commit TX (${inputs.length} inputs, ${outputs.length} outputs)...`);
  let lastErr = '';
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, 3000));
    const submitRes = await fetch(`${KASPA_API}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction: rawTx, allowOrphan: false }),
      signal: AbortSignal.timeout(15000),
    });
    if (submitRes.ok) {
      const submitData = await submitRes.json().catch(() => ({}));
      const txId = submitData.transactionId || '';
      console.log(`[commit] ✓ Commit TX accepted: ${txId}`);
      return txId;
    }
    lastErr = (await submitRes.text()).slice(0, 500);
    console.warn(`[commit] Attempt ${attempt + 1} failed: ${lastErr}`);
    if (!lastErr.includes('orphan')) break;
  }
  throw new Error(`Commit TX failed: ${lastErr}`);
}

// ==========================================
// REVEAL TX BUILDER
// ==========================================
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

  // 1. Wait for commit TX to be visible in the REST API
  console.log(`[reveal] Waiting for commit TX ${commitTxId} to appear...`);
  let commitVisible = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    const delay = Math.min(2000 + attempt * 500, 5000); // 2s → 5s
    await new Promise(r => setTimeout(r, delay));
    try {
      const txRes = await fetch(`${KASPA_API}/transactions/${commitTxId}`, {
        signal: AbortSignal.timeout(10000)
      });
      if (txRes.ok) {
        const txData = await txRes.json();
        if (txData && txData.transaction_id) {
          console.log(`[reveal] ✓ Commit TX visible (attempt ${attempt + 1})`);
          commitVisible = true;
          break;
        }
      }
    } catch (e) {
      // Not yet indexed
    }
    if (attempt % 5 === 4) {
      console.log(`[reveal] Commit TX not yet visible (attempt ${attempt + 1}/40)...`);
    }
  }
  if (!commitVisible) {
    console.warn('[reveal] Commit TX not confirmed via /transactions endpoint after ~90s');
  }

  // 2. Wait for P2SH UTXO to appear
  let p2shUtxo = null;
  for (let attempt = 0; attempt < 30; attempt++) {
    const delay = Math.min(2000 + attempt * 1000, 5000);
    await new Promise(r => setTimeout(r, delay));
    try {
      const res = await fetch(`${KASPA_API}/addresses/${p2shAddress}/utxos`, {
        signal: AbortSignal.timeout(10000)
      });
      if (res.ok) {
        const utxos = await res.json();
        p2shUtxo = utxos.find(u => u.outpoint.transactionId === commitTxId);
        if (p2shUtxo) {
          console.log(`[reveal] ✓ Found P2SH UTXO: ${p2shUtxo.utxoEntry.amount} sompi (attempt ${attempt + 1})`);
          break;
        }
      }
    } catch (e) {
      // timeout
    }
    if (attempt % 5 === 4) {
      console.log(`[reveal] P2SH UTXO not found (attempt ${attempt + 1}/30)...`);
    }
  }
  if (!p2shUtxo) {
    throw new Error('P2SH UTXO not found after ~90s. Commit TX may not have confirmed.');
  }

  // 3. Extra propagation wait
  console.log('[reveal] Waiting 6s for full DAG propagation...');
  await new Promise(r => setTimeout(r, 6000));

  // 4. Fetch sender UTXOs for gas (with retry for change output indexing delay)
  let gasTotal = 0n;
  let gasUtxos = [];
  for (let gasAttempt = 0; gasAttempt < 5; gasAttempt++) {
    gasTotal = 0n;
    gasUtxos = [];
    const senderRes = await fetch(`${KASPA_API}/addresses/${senderAddress}/utxos`, {
      signal: AbortSignal.timeout(10000)
    });
    if (!senderRes.ok) throw new Error('Failed to fetch sender UTXOs for gas');
    const senderUtxos = await senderRes.json();

    const confirmedUtxos = senderUtxos
      .sort((a, b) => Number(b.utxoEntry.amount) - Number(a.utxoEntry.amount));
    
    for (const u of confirmedUtxos) {
      if (gasTotal >= REVEAL_FEE_SOMPI) break;
      if (gasUtxos.length >= 5) break;
      gasUtxos.push(u);
      gasTotal += BigInt(u.utxoEntry.amount);
    }
    if (gasTotal >= REVEAL_FEE_SOMPI) break;

    // Change output from commit TX may not be indexed yet — wait and retry
    if (gasAttempt < 4) {
      console.log(`[reveal] Sender UTXOs insufficient (${Number(gasTotal) / 1e8} KAS), waiting for change output indexing (attempt ${gasAttempt + 1}/5)...`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  if (gasTotal < REVEAL_FEE_SOMPI) {
    throw new Error(`Insufficient gas for reveal. Need ${Number(REVEAL_FEE_SOMPI) / 1e8} KAS, have ${Number(gasTotal) / 1e8} KAS`);
  }

  console.log(`[reveal] Gas UTXOs: ${gasUtxos.length}, total: ${Number(gasTotal) / 1e8} KAS`);

  // 5. Build sender's P2PK scriptPubKey
  const senderPayload = decodeKaspaBech32(senderAddress);
  const senderPubKeyHash = senderPayload.slice(1);
  const senderScriptPubKey = new Uint8Array(34);
  senderScriptPubKey[0] = OP_DATA_32;
  senderScriptPubKey.set(senderPubKeyHash, 1);
  senderScriptPubKey[33] = OP_CHECKSIG;

  // 6. Build transaction inputs and outputs
  const p2shAmount = BigInt(p2shUtxo.utxoEntry.amount);
  const totalIn = p2shAmount + gasTotal;
  const changeAmount = totalIn - REVEAL_FEE_SOMPI;

  const inputs = [];

  // P2SH input (index 0) — the inscription input
  // sigOpCount = 1: counts OP_CHECKSIG in the executed redeem script, not the P2SH wrapper
  inputs.push({
    prevTxId: p2shUtxo.outpoint.transactionId,
    prevIndex: p2shUtxo.outpoint.index,
    utxoScriptVersion: 0,
    utxoScriptPubKey: p2shScriptPubKey,  // P2SH wrapper (OP_BLAKE2B <hash> OP_EQUAL) — used in sighash
    utxoAmount: p2shAmount,
    sequence: 0n,
    sigOpCount: 1,  // redeem script has OP_CHECKSIG
    isP2SH: true,
  });

  // Gas inputs (standard P2PK)
  for (const u of gasUtxos) {
    inputs.push({
      prevTxId: u.outpoint.transactionId,
      prevIndex: u.outpoint.index,
      utxoScriptVersion: 0,
      utxoScriptPubKey: senderScriptPubKey,
      utxoAmount: BigInt(u.utxoEntry.amount),
      sequence: 0n,
      sigOpCount: 1,
      isP2SH: false,
    });
  }

  // Output: change back to sender
  const outputs = [];
  if (changeAmount >= MIN_REVEAL_OUTPUT) {
    outputs.push({
      amount: changeAmount,
      scriptVersion: 0,
      scriptPubKey: senderScriptPubKey,
    });
  } else {
    console.warn(`[reveal] Change ${changeAmount} sompi below min output ${MIN_REVEAL_OUTPUT}, burning as fee`);
  }

  const tx = { version: 0, inputs, outputs, locktime: 0n, gas: 0n };

  // 7. Sign each input
  const signatureScripts = [];
  for (let i = 0; i < inputs.length; i++) {
    const inp = inputs[i];
    const sigHash = computeSigHash(tx, i);
    console.log(`[reveal] Input ${i} sigHash: ${bytesToHex(sigHash)} (${inp.isP2SH ? 'P2SH' : 'P2PK'})`);

    const sig = schnorrSign(sigHash, privateKeyHex);
    const sigWithType = concatBytes(sig, new Uint8Array([0x01])); // SigHashAll

    if (inp.isP2SH) {
      // P2SH signatureScript: <sig+hashtype> <redeemScript>
      // This mirrors coinchimp: script.encodePayToScriptHashSignatureScript(signature)
      const sigScript = concatBytes(
        canonicalDataPush(sigWithType),
        canonicalDataPush(redeemScript)
      );
      signatureScripts.push(bytesToHex(sigScript));
      console.log(`[reveal] P2SH input ${i} signed (${sigScript.length} bytes)`);
    } else {
      // P2PK signatureScript: <sig+hashtype>
      const sigScript = canonicalDataPush(sigWithType);
      signatureScripts.push(bytesToHex(sigScript));
      console.log(`[reveal] P2PK input ${i} signed`);
    }
  }

  // 8. Build raw TX for REST API submission
  const rawTx = {
    version: 0,
    inputs: inputs.map((inp, i) => ({
      previousOutpoint: {
        transactionId: inp.prevTxId,
        index: inp.prevIndex,
      },
      signatureScript: signatureScripts[i],
      sequence: "0",
      sigOpCount: inp.sigOpCount,
    })),
    outputs: outputs.map(out => ({
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
  console.log(`[reveal] Inputs: ${rawTx.inputs.length}, Outputs: ${rawTx.outputs.length}`);
  console.log(`[reveal] P2SH sigScript length: ${signatureScripts[0].length / 2} bytes`);

  // Submit with retry + backoff
  let lastErr = '';
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) {
      const wait = attempt * 5000;
      console.log(`[reveal] Retry ${attempt}/3 after ${wait / 1000}s...`);
      await new Promise(r => setTimeout(r, wait));
    }

    const submitRes = await fetch(`${KASPA_API}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction: rawTx, allowOrphan: false }),
      signal: AbortSignal.timeout(15000),
    });

    if (submitRes.ok) {
      const submitText = await submitRes.text();
      console.log('[reveal] Submit OK:', submitText.slice(0, 300));
      let submitData;
      try { submitData = JSON.parse(submitText); } catch { submitData = submitText; }
      const revealTxId = submitData.transactionId || submitData.txid || '';
      console.log(`[reveal] ✓ Reveal TX: ${revealTxId}`);
      return revealTxId;
    }

    const errText = await submitRes.text();
    lastErr = errText.slice(0, 300);
    console.warn(`[reveal] Submit attempt ${attempt + 1} failed (${submitRes.status}): ${lastErr}`);

    // If it's not an orphan error, try with allowOrphan on next attempt
    if (!errText.includes('orphan') && !errText.includes('missing')) {
      // Non-orphan error — likely signature/script issue, don't retry
      break;
    }
  }

  throw new Error(`Reveal submit failed after retries: ${lastErr}`);
}

// ==========================================
// MAIN HANDLER
// ==========================================
Deno.serve(async (req) => {
  try {
    // Note: This function signs transactions using the caller-provided mnemonic/privateKey.
    // No user-scoped data is read, so we allow guest (non-logged-in) callers — required for
    // tipping from the public Feed without forcing a login.

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
      const KaspaWallet = await getKaspaWallet();
      const wallet = new KaspaWallet();
      privateKey = await wallet.getDerivedPrivateKey({
        mnemonic: mnemonic.trim(),
        hdPath: "m/44'/111111'/0'/0/0",
      });
    }
    if (privateKey && typeof privateKey === 'object') privateKey = privateKey.toString();
    if (typeof privateKey === 'string' && privateKey.startsWith('0x')) privateKey = privateKey.slice(2);

    // ---- ACTION: Full KRC-20 Transfer (Commit + Reveal) ----
    if (action === 'transfer' || action === 'commit') {
      if (!privateKey || !fromAddress || !toAddress || !amount || !ticker) {
        return Response.json({ error: 'Missing required: mnemonic/privateKey, fromAddress, toAddress, amount, ticker' }, { status: 400 });
      }

      const normalizedFrom = fromAddress.startsWith('kaspa:') ? fromAddress : `kaspa:${fromAddress}`;
      const normalizedTo = toAddress.startsWith('kaspa:') ? toAddress : `kaspa:${toAddress}`;

      // Validate toAddress bech32 checksum to prevent silent fund loss
      try {
        verifyKaspaBech32Checksum(normalizedTo);
      } catch (addrErr) {
        return Response.json({ success: false, error: `Invalid recipient address: ${addrErr.message}` }, { status: 400 });
      }

      console.log(`[krc20] ${ticker} transfer: ${amount} from ${normalizedFrom} to ${normalizedTo}`);

      // 1. Get x-only public key
      const xOnlyPubKey = await getXOnlyPubKey(privateKey);
      console.log(`[krc20] x-only pubkey: ${xOnlyPubKey}`);

      // 2. Build inscription script (lowercase ticker per KASPACOM standard)
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

      // 4. DRY-RUN: Test Schnorr signing BEFORE committing any KAS
      console.log(`[krc20] Testing Schnorr signing...`);
      try {
        const testMsg = new Uint8Array(32);
        crypto.getRandomValues(testMsg);
        const testSig = schnorrSign(testMsg, privateKey);
        if (!testSig || testSig.length !== 64) throw new Error('Invalid sig length');
        const pubKeyBytes = hexToBytes(xOnlyPubKey);
        const valid = schnorr.verify(testSig, testMsg, pubKeyBytes);
        if (!valid) throw new Error('Schnorr verify failed');
        console.log(`[krc20] ✓ Schnorr dry-run OK`);
      } catch (signErr) {
        console.error(`[krc20] ✗ Schnorr dry-run FAILED:`, signErr.message);
        return Response.json({ success: false, error: `Signing test failed — commit NOT sent. ${signErr.message}` }, { status: 400 });
      }

      // 5. Verify sender has enough balance (0.3 KAS + gas) — MANDATORY check
      // Use UTXO-based check with retries since after a recent TX the balance endpoint
      // may be stale (change output not yet indexed)
      const needed = COMMIT_AMOUNT_SOMPI + REVEAL_FEE_SOMPI + 10000000n; // 0.3 + 0.001 + 0.1 buffer
      let balanceCheckPassed = false;
      for (let balAttempt = 0; balAttempt < 8; balAttempt++) {
        // Wait between retries (first attempt is immediate)
        if (balAttempt > 0) {
          const waitMs = 2000 + balAttempt * 1000;
          console.log(`[krc20] Balance check retry ${balAttempt}/7, waiting ${waitMs}ms...`);
          await new Promise(r => setTimeout(r, waitMs));
        }
        try {
          // Prefer UTXO aggregation — more accurate after recent TXs
          const utxoRes = await fetch(`${KASPA_API}/addresses/${normalizedFrom}/utxos`, { signal: AbortSignal.timeout(15000) });
          if (utxoRes.ok) {
            const utxos = await utxoRes.json();
            const totalSompi = (utxos || []).reduce((s, u) => s + BigInt(u?.utxoEntry?.amount || 0), 0n);
            if (totalSompi >= needed) {
              console.log(`[krc20] UTXO balance check OK: ${Number(totalSompi) / 1e8} KAS (attempt ${balAttempt + 1})`);
              balanceCheckPassed = true;
              break;
            } else if (balAttempt >= 7) {
              return Response.json({
                success: false,
                error: `Insufficient KAS balance. You have ${Number(totalSompi) / 1e8} KAS but need at least ${Number(needed) / 1e8} KAS (0.3 KAS commit + gas fees). Please add more KAS to your wallet before sending KRC-20 tokens.`,
              }, { status: 400 });
            }
            // Not enough yet — change output may not be indexed, retry
            console.log(`[krc20] UTXO balance ${Number(totalSompi) / 1e8} KAS < needed ${Number(needed) / 1e8} KAS, retrying...`);
          }
        } catch (e) {
          console.warn(`[krc20] Balance check attempt ${balAttempt + 1} failed:`, e.message);
        }
      }
      if (!balanceCheckPassed) {
        return Response.json({
          success: false,
          error: 'Could not verify your KAS balance after retries (change output may still be indexing). Please try again in a moment.',
        }, { status: 503 });
      }

      // 6. Send COMMIT TX — 0.3 KAS to P2SH address (built manually to avoid OKX SDK storage mass issues with P2SH outputs)
      console.log(`[krc20] Sending commit TX: ${COMMIT_AMOUNT_KAS} KAS → ${p2shAddress}`);
      const commitTxId = await buildAndSubmitCommitTx({
        privateKeyHex: privateKey,
        senderAddress: normalizedFrom,
        p2shAddress,
        p2shScriptPubKey,
        commitAmountSompi: COMMIT_AMOUNT_SOMPI,
      });
      console.log(`[krc20] ✓ Commit TX: ${commitTxId}`);

      // 7. Auto-execute REVEAL TX
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

    // ---- ACTION: Recover stuck P2SH UTXOs from failed reveals ----
    if (action === 'recover') {
      // Two modes:
      //   Mode A: provide redeemScriptHex + commitTxId + p2shAddress directly
      //   Mode B: provide original transfer params (ticker, amount, toAddress) to re-derive
      if (!privateKey) {
        return Response.json({ error: 'Missing mnemonic or privateKey' }, { status: 400 });
      }

      const normalizedFrom = fromAddress?.startsWith('kaspa:') ? fromAddress : `kaspa:${fromAddress}`;
      const xOnlyPubKey = await getXOnlyPubKey(privateKey);

      let redeemScriptBytes, p2shScriptPubKeyBytes, recoveryP2SHAddress;

      if (body.redeemScriptHex) {
        // Mode A: use provided redeem script
        redeemScriptBytes = hexToBytes(body.redeemScriptHex);
        const { scriptPubKey, scriptHash } = createP2SHScriptPublicKey(redeemScriptBytes);
        p2shScriptPubKeyBytes = scriptPubKey;
        recoveryP2SHAddress = body.p2shAddress || scriptHashToAddress(scriptHash, network);
        console.log(`[recover] Mode A: redeemScript provided, P2SH: ${recoveryP2SHAddress}`);
      } else if (ticker && amount && toAddress) {
        // Mode B: re-derive from original params
        const normalizedTo = toAddress.startsWith('kaspa:') ? toAddress : `kaspa:${toAddress}`;
        const amtSompiStr = (BigInt(Math.round(parseFloat(amount) * Math.pow(10, decimals)))).toString();
        const krc20Data = { p: 'krc-20', op: 'transfer', tick: ticker.toUpperCase(), amt: amtSompiStr, to: normalizedTo };
        const krc20Json = JSON.stringify(krc20Data, null, 0);
        redeemScriptBytes = buildInscriptionScript(xOnlyPubKey, krc20Json);
        const { scriptPubKey, scriptHash } = createP2SHScriptPublicKey(redeemScriptBytes);
        p2shScriptPubKeyBytes = scriptPubKey;
        recoveryP2SHAddress = scriptHashToAddress(scriptHash, network);
        console.log(`[recover] Mode B: re-derived P2SH: ${recoveryP2SHAddress}`);
      } else {
        return Response.json({ error: 'Provide either redeemScriptHex, or (ticker + amount + toAddress) to re-derive' }, { status: 400 });
      }

      // Fetch all UTXOs sitting at the P2SH address
      const utxoRes = await fetch(`${KASPA_API}/addresses/${recoveryP2SHAddress}/utxos`, {
        signal: AbortSignal.timeout(15000)
      });
      if (!utxoRes.ok) throw new Error(`Failed to fetch P2SH UTXOs: ${utxoRes.status}`);
      const p2shUtxos = await utxoRes.json();

      if (!p2shUtxos || p2shUtxos.length === 0) {
        return Response.json({
          success: true,
          recovered: 0,
          message: `No UTXOs found at P2SH address ${recoveryP2SHAddress}. Funds may have already been recovered or the address is wrong.`,
          p2shAddress: recoveryP2SHAddress,
        });
      }

      const totalStuck = p2shUtxos.reduce((s, u) => s + BigInt(u.utxoEntry.amount), 0n);
      console.log(`[recover] Found ${p2shUtxos.length} stuck UTXOs totaling ${Number(totalStuck) / 1e8} KAS`);

      // Build sender P2PK scriptPubKey
      const senderPayload = decodeKaspaBech32(normalizedFrom);
      const senderPubKeyHash = senderPayload.slice(1);
      const senderScriptPubKey = new Uint8Array(34);
      senderScriptPubKey[0] = OP_DATA_32;
      senderScriptPubKey.set(senderPubKeyHash, 1);
      senderScriptPubKey[33] = OP_CHECKSIG;

      // Fetch gas UTXOs from sender
      const senderRes = await fetch(`${KASPA_API}/addresses/${normalizedFrom}/utxos`, {
        signal: AbortSignal.timeout(10000)
      });
      if (!senderRes.ok) throw new Error('Failed to fetch sender UTXOs for gas');
      const senderUtxos = await senderRes.json();
      let gasTotal = 0n;
      const gasUtxos = [];
      for (const u of senderUtxos.sort((a, b) => Number(b.utxoEntry.amount) - Number(a.utxoEntry.amount))) {
        if (gasTotal >= REVEAL_FEE_SOMPI) break;
        if (gasUtxos.length >= 3) break;
        gasUtxos.push(u);
        gasTotal += BigInt(u.utxoEntry.amount);
      }
      if (gasTotal < REVEAL_FEE_SOMPI) {
        throw new Error(`Need gas for recovery TX. Have ${Number(gasTotal) / 1e8} KAS, need ${Number(REVEAL_FEE_SOMPI) / 1e8} KAS`);
      }

      // Build inputs: all P2SH UTXOs + gas UTXOs
      const inputs = [];
      for (const u of p2shUtxos) {
        inputs.push({
          prevTxId: u.outpoint.transactionId,
          prevIndex: u.outpoint.index,
          utxoScriptVersion: 0,
          utxoScriptPubKey: p2shScriptPubKeyBytes,
          utxoAmount: BigInt(u.utxoEntry.amount),
          sequence: 0n,
          sigOpCount: 1,  // redeem script has OP_CHECKSIG
          isP2SH: true,
        });
      }
      for (const u of gasUtxos) {
        inputs.push({
          prevTxId: u.outpoint.transactionId,
          prevIndex: u.outpoint.index,
          utxoScriptVersion: 0,
          utxoScriptPubKey: senderScriptPubKey,
          utxoAmount: BigInt(u.utxoEntry.amount),
          sequence: 0n,
          sigOpCount: 1,
          isP2SH: false,
        });
      }

      const totalIn = totalStuck + gasTotal;
      const changeAmount = totalIn - REVEAL_FEE_SOMPI;
      const outputs = [];
      if (changeAmount >= MIN_REVEAL_OUTPUT) {
        outputs.push({
          amount: changeAmount,
          scriptVersion: 0,
          scriptPubKey: senderScriptPubKey,
        });
      }

      const tx = { version: 0, inputs, outputs, locktime: 0n, gas: 0n };

      // Sign each input
      const signatureScripts = [];
      for (let i = 0; i < inputs.length; i++) {
        const inp = inputs[i];
        const sigHash = computeSigHash(tx, i);
        const sig = schnorrSign(sigHash, privateKey);
        const sigWithType = concatBytes(sig, new Uint8Array([0x01]));

        if (inp.isP2SH) {
          signatureScripts.push(bytesToHex(concatBytes(
            canonicalDataPush(sigWithType),
            canonicalDataPush(redeemScriptBytes)
          )));
        } else {
          signatureScripts.push(bytesToHex(canonicalDataPush(sigWithType)));
        }
      }

      // Build raw TX
      const rawTx = {
        version: 0,
        inputs: inputs.map((inp, i) => ({
          previousOutpoint: { transactionId: inp.prevTxId, index: inp.prevIndex },
          signatureScript: signatureScripts[i],
          sequence: "0",
          sigOpCount: inp.sigOpCount,
        })),
        outputs: outputs.map(out => ({
          amount: out.amount.toString(),
          scriptPublicKey: { version: out.scriptVersion, scriptPublicKey: bytesToHex(out.scriptPubKey) },
        })),
        lockTime: "0",
        subnetworkId: "0000000000000000000000000000000000000000",
      };

      // Submit
      console.log(`[recover] Submitting recovery TX (${inputs.length} inputs, ${outputs.length} outputs)...`);
      let lastErr = '';
      for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt > 0) await new Promise(r => setTimeout(r, 3000));
        const submitRes = await fetch(`${KASPA_API}/transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transaction: rawTx, allowOrphan: false }),
          signal: AbortSignal.timeout(15000),
        });
        if (submitRes.ok) {
          const submitData = await submitRes.json().catch(() => ({}));
          const recoveryTxId = submitData.transactionId || '';
          console.log(`[recover] ✓ Recovery TX: ${recoveryTxId}`);
          return Response.json({
            success: true,
            recovered: p2shUtxos.length,
            recoveredKAS: Number(changeAmount) / 1e8,
            recoveryTxId,
            p2shAddress: recoveryP2SHAddress,
            message: `Successfully recovered ${Number(changeAmount) / 1e8} KAS from ${p2shUtxos.length} stuck UTXO(s)`,
          });
        }
        lastErr = (await submitRes.text()).slice(0, 300);
        console.warn(`[recover] Attempt ${attempt + 1} failed: ${lastErr}`);
        if (!lastErr.includes('orphan')) break;
      }

      return Response.json({
        success: false,
        error: `Recovery TX failed: ${lastErr}`,
        p2shAddress: recoveryP2SHAddress,
        stuckUTXOs: p2shUtxos.length,
        stuckKAS: Number(totalStuck) / 1e8,
      });
    }

    // ---- ACTION: Scan all stuck P2SH UTXOs from past failed transfers ----
    if (action === 'scan') {
      if (!privateKey) return Response.json({ error: 'Missing mnemonic or privateKey' }, { status: 400 });

      // Re-derive P2SH addresses for known tickers/amounts if provided, or scan a list
      const { transfers } = body; // [{ticker, amount, toAddress, decimals?}]
      if (!transfers || !Array.isArray(transfers) || transfers.length === 0) {
        return Response.json({ error: 'Provide transfers array: [{ticker, amount, toAddress, decimals?}]' }, { status: 400 });
      }

      const xOnlyPubKey = await getXOnlyPubKey(privateKey);
      const results = [];

      for (const t of transfers) {
        const normalizedTo = (t.toAddress || '').startsWith('kaspa:') ? t.toAddress : `kaspa:${t.toAddress}`;
        const dec = t.decimals || 8;
        const amtSompiStr = (BigInt(Math.round(parseFloat(t.amount) * Math.pow(10, dec)))).toString();
        const krc20Data = { p: 'krc-20', op: 'transfer', tick: (t.ticker || '').toUpperCase(), amt: amtSompiStr, to: normalizedTo };
        const krc20Json = JSON.stringify(krc20Data, null, 0);
        const redeemScript = buildInscriptionScript(xOnlyPubKey, krc20Json);
        const { scriptHash } = createP2SHScriptPublicKey(redeemScript);
        const p2shAddr = scriptHashToAddress(scriptHash, network);

        try {
          const res = await fetch(`${KASPA_API}/addresses/${p2shAddr}/utxos`, { signal: AbortSignal.timeout(10000) });
          const utxos = res.ok ? await res.json() : [];
          const stuck = utxos.reduce((s, u) => s + BigInt(u.utxoEntry.amount), 0n);
          results.push({
            ticker: (t.ticker || '').toUpperCase(),
            amount: t.amount,
            toAddress: normalizedTo,
            p2shAddress: p2shAddr,
            stuckUTXOs: utxos.length,
            stuckKAS: Number(stuck) / 1e8,
            redeemScriptHex: bytesToHex(redeemScript),
          });
        } catch (e) {
          results.push({ ticker: (t.ticker || '').toUpperCase(), amount: t.amount, p2shAddress: p2shAddr, error: e.message });
        }
      }

      const totalStuck = results.reduce((s, r) => s + (r.stuckKAS || 0), 0);
      return Response.json({
        success: true,
        totalStuckKAS: totalStuck,
        totalAddresses: results.filter(r => r.stuckUTXOs > 0).length,
        results,
      });
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

    // ---- ACTION: Verify sighash (debug) ----
    if (action === 'testSighash') {
      if (!privateKey) {
        return Response.json({ error: 'Missing privateKey/mnemonic' }, { status: 400 });
      }
      const xOnlyPubKey = await getXOnlyPubKey(privateKey);
      
      // Build a test P2PK scriptPubKey
      const testPubKeyBytes = hexToBytes(xOnlyPubKey);
      const testScriptPubKey = new Uint8Array(34);
      testScriptPubKey[0] = OP_DATA_32;
      testScriptPubKey.set(testPubKeyBytes, 1);
      testScriptPubKey[33] = OP_CHECKSIG;
      
      // Create a minimal test transaction
      const testTx = {
        version: 0,
        inputs: [{
          prevTxId: '0000000000000000000000000000000000000000000000000000000000000000',
          prevIndex: 0,
          utxoScriptVersion: 0,
          utxoScriptPubKey: testScriptPubKey,
          redeemScript: null,
          utxoAmount: 100000000n,
          sequence: 0n,
          sigOpCount: 1,
        }],
        outputs: [{
          amount: 99900000n,
          scriptVersion: 0,
          scriptPubKey: testScriptPubKey,
        }],
        locktime: 0n,
        gas: 0n,
      };
      
      const sigHash = computeSigHash(testTx, 0);
      const sig = schnorrSign(sigHash, privateKey);
      const valid = schnorr.verify(sig, sigHash, hexToBytes(xOnlyPubKey));
      
      return Response.json({
        success: true,
        xOnlyPubKey,
        sigHashHex: bytesToHex(sigHash),
        signatureHex: bytesToHex(sig),
        signatureValid: valid,
        message: valid ? 'Sighash computation and signing verified OK' : 'SIGNATURE VERIFICATION FAILED',
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

function verifyKaspaBech32Checksum(addr) {
  const colonIdx = addr.indexOf(':');
  if (colonIdx < 0) throw new Error('Invalid Kaspa address: no colon separator');
  const hrp = addr.substring(0, colonIdx);
  if (hrp !== 'kaspa' && hrp !== 'kaspatest') throw new Error(`Invalid address prefix: ${hrp}`);
  const dataPart = addr.substring(colonIdx + 1);
  if (dataPart.length < 10) throw new Error('Address too short');
  const addressU5 = [];
  for (const ch of dataPart) {
    const code = ch.charCodeAt(0);
    if (code >= BECH32_REV_CHARSET.length || BECH32_REV_CHARSET[code] === 100) {
      throw new Error(`Invalid bech32 character: ${ch}`);
    }
    addressU5.push(BECH32_REV_CHARSET[code]);
  }
  const prefixBytes = new TextEncoder().encode(hrp);
  const prefixU5 = Array.from(prefixBytes).map(b => b & 0x1f);
  const values = [...prefixU5, 0, ...addressU5];
  const remainder = polymod(values);
  if (remainder !== 0n) {
    throw new Error('Address checksum verification failed — possible typo');
  }
}

function decodeKaspaBech32(addr) {
  const colonIdx = addr.indexOf(':');
  if (colonIdx < 0) throw new Error('Invalid Kaspa address: no colon');
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