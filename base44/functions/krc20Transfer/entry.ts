// KRC-20 Token Transfer via Kasplex Commit-Reveal Protocol
// Fixed implementation based on coinchimp/kaspa-krc20-apps reference
//
// PROTOCOL:
//   Step 1: Build inscription script (redeem script) with KRC-20 JSON
//   Step 2: Blake2b-256 hash script → derive P2SH address
//   Step 3: COMMIT TX — send 0.3 KAS to P2SH address (via OKX SDK)
//   Step 4: Wait for P2SH UTXO to appear
//   Step 5: REVEAL TX — spend P2SH UTXO back to sender

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { KaspaWallet } from 'npm:@okxweb3/coin-kaspa@2.4.9';
import { blake2b } from 'npm:@noble/hashes@1.4.0/blake2b';
import { schnorr, secp256k1 } from 'npm:@noble/curves@1.4.0/secp256k1';

const KASPA_API = 'https://api.kaspa.org';
const COMMIT_AMOUNT_KAS = 0.3;
const COMMIT_AMOUNT_SOMPI = 30000000n; // 0.3 KAS
const REVEAL_FEE_SOMPI = 50000n; // Fee for the reveal TX

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

function buildInscriptionScript(xOnlyPubKeyHex, krc20Json) {
  const pubKeyBytes = hexToBytes(xOnlyPubKeyHex);
  const kasplexBytes = new TextEncoder().encode('kasplex');
  const jsonBytes = new TextEncoder().encode(krc20Json);
  // addI64(0n) → OP_FALSE (same as coinchimp: addI64(0n))
  const parts = [
    canonicalDataPush(pubKeyBytes),      // <pubkey>
    new Uint8Array([OP_CHECKSIG]),       // OP_CHECKSIG
    new Uint8Array([OP_FALSE]),          // OP_FALSE
    new Uint8Array([OP_IF]),             // OP_IF
    canonicalDataPush(kasplexBytes),     // "kasplex"
    new Uint8Array([OP_FALSE]),          // addI64(0n) = push 0
    canonicalDataPush(jsonBytes),        // JSON payload
    new Uint8Array([OP_ENDIF]),          // OP_ENDIF
  ];
  const totalLen = parts.reduce((s, p) => s + p.length, 0);
  const script = new Uint8Array(totalLen);
  let offset = 0;
  for (const part of parts) { script.set(part, offset); offset += part.length; }
  return script;
}

function createP2SHScriptPublicKey(redeemScript) {
  const hash = blake2b(redeemScript, { dkLen: 32 });
  // P2SH script: OP_BLAKE2B <32-byte-hash> OP_EQUAL
  const scriptPubKey = new Uint8Array(35);
  scriptPubKey[0] = OP_BLAKE2B;
  scriptPubKey[1] = OP_DATA_32;
  scriptPubKey.set(hash, 2);
  scriptPubKey[34] = OP_EQUAL;
  return { scriptPubKey, scriptHash: hash };
}

function scriptHashToAddress(scriptHash, network = 'mainnet') {
  const hrp = network === 'mainnet' ? 'kaspa' : 'kaspatest';
  // Type byte 0x08 = ScriptHash
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
  // payload[0] = type byte (0x00 for pubkey), rest = 32-byte x-only pubkey
  const xOnlyPubKey = payload.slice(1);
  return bytesToHex(xOnlyPubKey);
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

function hashBlake2b(data) {
  return blake2b(data, { dkLen: 32 });
}

// Hash of all outpoints (txId + index)
function hashPrevOutputs(inputs) {
  const parts = [];
  for (const inp of inputs) {
    parts.push(hexToBytes(inp.prevTxId));
    parts.push(writeU32LE(inp.prevIndex));
  }
  return hashBlake2b(concatBytes(...parts));
}

// Hash of all sequences (u64 LE each)
function hashSequences(inputs) {
  const parts = inputs.map(inp => writeU64LE(inp.sequence ?? 0n));
  return hashBlake2b(concatBytes(...parts));
}

// Hash of all sigOpCounts (u8 each)
function hashSigOpCounts(inputs) {
  const parts = inputs.map(inp => writeU8(inp.sigOpCount ?? 1));
  return hashBlake2b(concatBytes(...parts));
}

// Hash of all outputs (value + scriptVersion + scriptLen + script)
function hashOutputs(outputs) {
  const parts = [];
  for (const out of outputs) {
    parts.push(writeU64LE(out.amount));
    parts.push(writeU16LE(out.scriptVersion ?? 0));
    parts.push(writeU64LE(BigInt(out.scriptPubKey.length)));
    parts.push(out.scriptPubKey);
  }
  return hashBlake2b(concatBytes(...parts));
}

/**
 * Kaspa SigHash computation (SigHashAll = 0x01)
 * Reference: https://github.com/aspect-build/rusty-kaspa sighash.rs
 */
function computeSigHash(tx, inputIndex) {
  const inp = tx.inputs[inputIndex];
  const sighashType = 0x01; // SigHashAll

  // For SigHashAll, hash everything
  const prevOutputsHash = hashPrevOutputs(tx.inputs);
  const sequencesHash = hashSequences(tx.inputs);
  const sigOpCountsHash = hashSigOpCounts(tx.inputs);
  const outputsHash = hashOutputs(tx.outputs);

  // Zero-filled fields for native (non-subnetwork) transactions
  const subnetworkId = new Uint8Array(20);
  const payloadHash = new Uint8Array(32);

  // Build the message to hash
  const message = concatBytes(
    writeU16LE(tx.version ?? 0),
    prevOutputsHash,
    sequencesHash,
    sigOpCountsHash,
    // This specific input's outpoint
    hexToBytes(inp.prevTxId),
    writeU32LE(inp.prevIndex),
    // This input's previous output script
    writeU16LE(inp.utxoScriptVersion ?? 0),
    writeU64LE(BigInt(inp.utxoScriptPubKey.length)),
    inp.utxoScriptPubKey,
    // This input's previous output value
    writeU64LE(inp.utxoAmount),
    // Sequence
    writeU64LE(inp.sequence ?? 0n),
    // SigOpCount
    writeU8(inp.sigOpCount ?? 1),
    // Outputs hash
    outputsHash,
    // Locktime
    writeU64LE(tx.locktime ?? 0n),
    // SubnetworkID
    subnetworkId,
    // Gas
    writeU64LE(tx.gas ?? 0n),
    // PayloadHash
    payloadHash,
    // SigHashType
    writeU8(sighashType),
  );

  return hashBlake2b(message);
}

/**
 * Schnorr sign (BIP-340 / x-only as used by Kaspa)
 */
function schnorrSign(messageHash, privateKeyHex) {
  const privBytes = hexToBytes(privateKeyHex);
  return new Uint8Array(schnorr.sign(messageHash, privBytes));
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

  // 1. Wait for commit TX to be ACCEPTED (not just visible)
  console.log(`[reveal] Waiting for commit TX ${commitTxId} to be accepted...`);
  let commitAccepted = false;
  for (let attempt = 0; attempt < 30; attempt++) {
    await new Promise(r => setTimeout(r, 2000));
    try {
      // Check if the transaction exists and is accepted
      const txRes = await fetch(`${KASPA_API}/transactions/${commitTxId}`);
      if (txRes.ok) {
        const txData = await txRes.json();
        // If we can fetch the TX and it has a block, it's accepted
        if (txData && (txData.block_id || txData.accepting_block_hash || txData.is_accepted !== false)) {
          console.log(`[reveal] ✓ Commit TX accepted (attempt ${attempt + 1})`);
          commitAccepted = true;
          break;
        }
      }
    } catch (e) {
      // Transaction not yet indexed, keep waiting
    }
    console.log(`[reveal] Commit TX not yet accepted (attempt ${attempt + 1}/30)...`);
  }

  if (!commitAccepted) {
    console.warn('[reveal] Commit TX acceptance not confirmed after 60s, proceeding with UTXO check...');
  }

  // 2. Wait for P2SH UTXO to appear
  let p2shUtxo = null;
  for (let attempt = 0; attempt < 20; attempt++) {
    await new Promise(r => setTimeout(r, 3000));
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

  // 3. Extra safety wait — ensure UTXO is fully propagated across nodes
  console.log('[reveal] Waiting 5s extra for full DAG propagation...');
  await new Promise(r => setTimeout(r, 5000));

  // 4. Fetch sender UTXOs for gas (exclude UTXOs from the commit TX to avoid orphan)
  const senderRes = await fetch(`${KASPA_API}/addresses/${senderAddress}/utxos`);
  if (!senderRes.ok) throw new Error('Failed to fetch sender UTXOs');
  const senderUtxos = await senderRes.json();

  // Select sender UTXOs for gas — EXCLUDE any from the commit TX (change outputs are unconfirmed)
  let gasTotal = 0n;
  const gasUtxos = [];
  const confirmedSenderUtxos = senderUtxos.filter(u => u.outpoint.transactionId !== commitTxId);
  confirmedSenderUtxos.sort((a, b) => Number(b.utxoEntry.amount) - Number(a.utxoEntry.amount));
  for (const u of confirmedSenderUtxos) {
    if (gasTotal >= REVEAL_FEE_SOMPI) break;
    if (gasUtxos.length >= 10) break;
    gasUtxos.push(u);
    gasTotal += BigInt(u.utxoEntry.amount);
  }

  if (gasTotal < REVEAL_FEE_SOMPI) {
    throw new Error(`Insufficient gas for reveal. Need ${Number(REVEAL_FEE_SOMPI) / 1e8} KAS`);
  }

  // 3. Build sender's P2PK scriptPubKey
  const senderPayload = decodeKaspaBech32(senderAddress);
  const senderPubKeyHash = senderPayload.slice(1);
  const senderScriptPubKey = new Uint8Array(34);
  senderScriptPubKey[0] = OP_DATA_32;
  senderScriptPubKey.set(senderPubKeyHash, 1);
  senderScriptPubKey[33] = OP_CHECKSIG;

  // 4. Build transaction structure
  const p2shAmount = BigInt(p2shUtxo.utxoEntry.amount);
  const totalIn = p2shAmount + gasTotal;
  const changeAmount = totalIn - REVEAL_FEE_SOMPI;

  // ALL inputs: P2SH first (index 0), then gas inputs
  const inputs = [];
  
  // P2SH input (index 0) — this is the inscription input
  inputs.push({
    prevTxId: p2shUtxo.outpoint.transactionId,
    prevIndex: p2shUtxo.outpoint.index,
    utxoScriptVersion: 0,  // Kaspa always uses version 0 for all script types
    utxoScriptPubKey: p2shScriptPubKey,
    utxoAmount: p2shAmount,
    sequence: 0n,
    sigOpCount: 1,
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

  // Single output: change back to sender
  const outputs = [];
  if (changeAmount > 0n) {
    outputs.push({
      amount: changeAmount,
      scriptVersion: 0,
      scriptPubKey: senderScriptPubKey,
    });
  }

  const tx = { version: 0, inputs, outputs, locktime: 0n, gas: 0n };

  // 5. Sign each input
  const signatureScripts = [];

  for (let i = 0; i < inputs.length; i++) {
    const inp = inputs[i];
    
    // Compute sighash for this input
    const sigHash = computeSigHash(tx, i);
    console.log(`[reveal] Input ${i} sigHash: ${bytesToHex(sigHash)}`);

    if (inp.isP2SH) {
      // P2SH input: sign, then build signatureScript = [sig+hashtype, redeemScript]
      const sig = schnorrSign(sigHash, privateKeyHex);
      const sigWithType = concatBytes(sig, new Uint8Array([0x01])); // SigHashAll
      const sigScript = concatBytes(
        canonicalDataPush(sigWithType),
        canonicalDataPush(redeemScript)
      );
      signatureScripts.push(bytesToHex(sigScript));
      console.log(`[reveal] P2SH input ${i} signed (sigScript ${sigScript.length} bytes)`);
    } else {
      // Standard P2PK input: sign normally
      const sig = schnorrSign(sigHash, privateKeyHex);
      const sigWithType = concatBytes(sig, new Uint8Array([0x01]));
      const sigScript = canonicalDataPush(sigWithType);
      signatureScripts.push(bytesToHex(sigScript));
      console.log(`[reveal] Standard input ${i} signed`);
    }
  }

  // 6. Build raw TX for Kaspa REST API submission
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

  // Try with allowOrphan: false first, then retry with allowOrphan: true
  let submitRes = await fetch(`${KASPA_API}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transaction: rawTx, allowOrphan: false }),
  });

  if (!submitRes.ok) {
    const errText = await submitRes.text();
    console.warn(`[reveal] First submit failed (${submitRes.status}): ${errText.slice(0, 200)}`);
    
    // If orphan error, wait longer and retry
    if (errText.includes('orphan')) {
      console.log('[reveal] Orphan error — waiting 10s for DAG propagation and retrying...');
      await new Promise(r => setTimeout(r, 10000));
      
      submitRes = await fetch(`${KASPA_API}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction: rawTx, allowOrphan: false }),
      });
    }
  }

  const submitText = await submitRes.text();
  console.log('[reveal] Submit status:', submitRes.status, submitText.slice(0, 500));

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

    // Normalize private key — OKX SDK may return "0x" prefixed or object
    if (privateKey && typeof privateKey === 'object') {
      privateKey = privateKey.toString();
    }
    if (typeof privateKey === 'string' && privateKey.startsWith('0x')) {
      privateKey = privateKey.slice(2);
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
      console.log(`[krc20] Testing Schnorr signing before commit...`);
      try {
        const testMsg = new Uint8Array(32);
        crypto.getRandomValues(testMsg);
        const testSig = schnorrSign(testMsg, privateKey);
        if (!testSig || testSig.length !== 64) throw new Error('Invalid signature length');
        // Verify the test signature
        const pubKeyBytes = hexToBytes(xOnlyPubKey);
        const valid = schnorr.verify(testSig, testMsg, pubKeyBytes);
        if (!valid) throw new Error('Schnorr signature verification failed');
        console.log(`[krc20] ✓ Schnorr dry-run passed (sign + verify)`);
      } catch (signErr) {
        console.error(`[krc20] ✗ Schnorr dry-run FAILED:`, signErr.message);
        return Response.json({
          success: false,
          error: `Signing test failed — commit TX NOT sent. Error: ${signErr.message}`,
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

      // 6. Auto-execute REVEAL TX
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