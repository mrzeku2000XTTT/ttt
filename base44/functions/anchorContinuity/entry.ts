// anchorContinuity — real Kaspa anchoring of a TTT Builder Continuity Anchor.
//
// Flow:
//   1. Canonicalize the anchor payload (sorted keys) and compute its sha256
//      `content_hash`. This hash is the value being proven; it is stored
//      off-chain in the ContinuityAnchor entity, NEVER on-chain.
//   2. Send a minimal self-transaction from the user's wallet to itself.
//      The on-chain tx (txId + accepted blue score) is the tamper-evident,
//      time-sequenced proof that the anchor existed at that moment and was
//      signed by that wallet. Kaspa standard txs cannot carry an arbitrary
//      data payload, so the link between the on-chain tx and the content
//      hash is the entity record (re-verifiable by recomputing the hash).
//   3. Poll the tx for its accepted block_daa_score (block height).
//
// Keys: the caller supplies wallet credentials. They are used only to sign
// this one transaction and are never stored. Only hashes go on-chain.

import { sha256 } from 'npm:@noble/hashes@1.4.0/sha256';
import { schnorr } from 'npm:@noble/curves@1.4.0/secp256k1';
import {
  MAX_UTXOS, estimateFee, hexToBytes, bytesToHex, concatBytes,
  canonicalDataPush, decodeAnyKaspaAddress, p2pkScriptFromAddress, computeSigHash
} from '../../shared/kaspaTx.ts';

const KASPA_API = 'https://api.kaspa.org';
const ANCHOR_AMOUNT_SOMPI = 10000n; // 0.0001 KAS self-output (cost = fee + dust)

// Deterministic canonicalization of the anchor payload -> sha256 hex.
function computeContentHash(a) {
  const canonical = JSON.stringify({
    anchor_timestamp: a.anchor_timestamp || "",
    context_tags: (a.context_tags || []).slice().sort(),
    deployment_ref: a.deployment_ref || "",
    git_ref: a.git_ref || "",
    manifest_hash: a.manifest_hash || "",
    open_loop: a.open_loop || "",
    pressure: a.pressure || "",
    project_id: a.project_id || "",
    trigger: a.trigger || "",
    vector: a.vector || "",
    weight: a.weight || ""
  });
  return bytesToHex(sha256(new TextEncoder().encode(canonical)));
}

async function sendSelfAnchorTx({ mnemonic, inputPrivateKey, fromAddress }) {
  const normalizedFromAddress = fromAddress.startsWith('kaspa:') ? fromAddress : `kaspa:${fromAddress}`;
  if (!normalizedFromAddress.startsWith('kaspa:')) throw new Error('Only mainnet kaspa: addresses are supported for anchoring');
  decodeAnyKaspaAddress(normalizedFromAddress); // validates checksum + prefix

  let privateKey = inputPrivateKey;
  if (!privateKey) {
    let KaspaWallet;
    try { ({ KaspaWallet } = await import('npm:@okxweb3/coin-kaspa@1.0.6')); }
    catch (e) { throw new Error('Signing module unavailable on server. Provide a private key instead of a mnemonic, or retry.'); }
    const wallet = new KaspaWallet();
    privateKey = await wallet.getDerivedPrivateKey({ mnemonic: mnemonic.trim(), hdPath: "m/44'/111111'/0'/0/0" });
  }
  if (typeof privateKey === 'object') privateKey = privateKey.toString();
  if (typeof privateKey === 'string' && privateKey.startsWith('0x')) privateKey = privateKey.slice(2);

  const utxoRes = await fetch(`${KASPA_API}/addresses/${normalizedFromAddress}/utxos`, { signal: AbortSignal.timeout(15000) });
  if (!utxoRes.ok) throw new Error(`Failed to fetch UTXOs: ${utxoRes.status}`);
  let utxos = await utxoRes.json();
  if (!utxos || utxos.length === 0) throw new Error('No UTXOs — the anchoring wallet has 0 balance or only unconfirmed funds. Send a small amount of KAS to this address first.');

  let virtualDaa = 0;
  try {
    const tipRes = await fetch(`${KASPA_API}/info/virtual-chain-blue-score`, { signal: AbortSignal.timeout(10000) });
    if (tipRes.ok) virtualDaa = Number((await tipRes.json()).blueScore || 0);
  } catch {}
  if (virtualDaa > 0) {
    const mature = utxos.filter(u => { const s = Number(u.utxoEntry?.blockDaaScore || 0); return s > 0 && (virtualDaa - s) >= 10; });
    if (mature.length > 0) utxos = mature;
  }

  utxos.sort((a, b) => Number(b.utxoEntry.amount) - Number(a.utxoEntry.amount));
  const amountSompi = ANCHOR_AMOUNT_SOMPI;
  const maxFee = estimateFee(MAX_UTXOS, 2);
  const target = amountSompi + maxFee;
  let totalIn = 0n;
  const selectedUtxos = [];
  for (const utxo of utxos) {
    if (totalIn >= target) break;
    if (selectedUtxos.length >= MAX_UTXOS) break;
    selectedUtxos.push(utxo);
    totalIn += BigInt(utxo.utxoEntry.amount);
  }
  let currentFee = estimateFee(selectedUtxos.length, 2);
  if (totalIn < amountSompi + currentFee) {
    throw new Error(`Insufficient balance to anchor. Need ~${(Number(amountSompi + currentFee) / 1e8).toFixed(8)} KAS, have ${(Number(totalIn) / 1e8).toFixed(8)} KAS. Send a little KAS to your wallet to cover the anchor fee.`);
  }

  const fromScript = p2pkScriptFromAddress(normalizedFromAddress);
  const inputs = selectedUtxos.map(u => ({
    prevTxId: u.outpoint.transactionId, prevIndex: u.outpoint.index,
    utxoScriptVersion: 0, utxoScriptPubKey: fromScript,
    utxoAmount: BigInt(u.utxoEntry.amount), sequence: 0n, sigOpCount: 1,
  }));

  const MASS_PER_OUTPUT = 38753n, MASS_PER_SOMPI_X_MILLION = 1845n, SAFE_MASS_LIMIT = 450000n;
  let finalAmount = amountSompi, finalChange, submitRes, submitText;

  for (let attempt = 0; attempt < 2; attempt++) {
    finalChange = totalIn - finalAmount - currentFee;
    let outputs = [{ amount: finalAmount, scriptVersion: 0, scriptPubKey: fromScript }];
    if (finalChange > 0n) outputs.push({ amount: finalChange, scriptVersion: 0, scriptPubKey: fromScript });
    if (finalChange > 0n) {
      const totalOutSompi = outputs.reduce((s, o) => s + o.amount, 0n);
      const estMass = MASS_PER_OUTPUT * BigInt(outputs.length) + (MASS_PER_SOMPI_X_MILLION * totalOutSompi) / 1000000n;
      if (estMass > SAFE_MASS_LIMIT) {
        outputs = [{ amount: finalAmount, scriptVersion: 0, scriptPubKey: fromScript }];
        currentFee = estimateFee(selectedUtxos.length, 1);
        finalChange = totalIn - finalAmount - currentFee;
      }
    }
    const tx = { version: 0, inputs, outputs, locktime: 0n, gas: 0n };
    const signatureScripts = inputs.map((_, i) => {
      const sig = schnorr.sign(computeSigHash(tx, i), hexToBytes(privateKey));
      return bytesToHex(canonicalDataPush(concatBytes(new Uint8Array(sig), new Uint8Array([0x01]))));
    });
    const rawTx = {
      version: 0,
      inputs: inputs.map((inp, i) => ({ previousOutpoint: { transactionId: inp.prevTxId, index: inp.prevIndex }, signatureScript: signatureScripts[i], sequence: '0', sigOpCount: inp.sigOpCount })),
      outputs: outputs.map(out => ({ amount: out.amount.toString(), scriptPublicKey: { version: out.scriptVersion, scriptPublicKey: bytesToHex(out.scriptPubKey) } })),
      lockTime: '0', subnetworkId: '0000000000000000000000000000000000000000',
    };
    if (attempt > 0) await new Promise(r => setTimeout(r, 2500));
    submitRes = await fetch(`${KASPA_API}/transactions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction: rawTx, allowOrphan: false }), signal: AbortSignal.timeout(15000),
    });
    submitText = await submitRes.text();
    if (submitRes.ok) break;
    const requiredMatch = submitText.match(/required amount of (\d+)/);
    if (requiredMatch && attempt === 0) { currentFee = BigInt(requiredMatch[1]) + BigInt(requiredMatch[1]) / 10n; continue; }
    if (!submitText.includes('orphan') && !submitText.includes('missing') && !submitText.includes('already')) break;
  }

  if (!submitRes.ok) {
    if (submitText.includes('already spent') || submitText.includes('orphan') || submitText.includes('missing') || submitText.includes('UTXO')) {
      throw new Error('A previous transaction from this wallet is still confirming. Wait ~10 seconds and try again.');
    }
    throw new Error(`Submit failed (${submitRes.status}): ${submitText.slice(0, 300)}`);
  }
  let submitData; try { submitData = JSON.parse(submitText); } catch { submitData = submitText; }
  return submitData.transactionId || submitData.txid || submitData;
}

async function fetchBlockDaaScore(txId) {
  for (let i = 0; i < 6; i++) {
    try {
      const res = await fetch(`${KASPA_API}/transactions/${txId}`, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const data = await res.json();
        const tx = Array.isArray(data) ? data[0] : data;
        if (tx && tx.block_daa_score && !tx.is_accepted) continue;
        if (tx && (tx.is_accepted || tx.block_daa_score)) {
          return { blockDaaScore: Number(tx.block_daa_score || 0), accepted: !!tx.is_accepted };
        }
      }
    } catch {}
    await new Promise(r => setTimeout(r, 2000));
  }
  try {
    const tipRes = await fetch(`${KASPA_API}/info/virtual-chain-blue-score`, { signal: AbortSignal.timeout(8000) });
    if (tipRes.ok) return { blockDaaScore: Number((await tipRes.json()).blueScore || 0), accepted: false };
  } catch {}
  return { blockDaaScore: 0, accepted: false };
}

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { vector, weight, open_loop, pressure, project_id, manifest_hash, git_ref, deployment_ref, trigger, context_tags, anchor_timestamp, mnemonic, privateKey, fromAddress } = body;

    if (!vector || !weight || !open_loop || !pressure) return Response.json({ error: 'Missing anchor fields (vector, weight, open_loop, pressure)' }, { status: 400 });
    if ((!mnemonic && !privateKey) || !fromAddress) return Response.json({ error: 'Missing wallet credentials (mnemonic or privateKey + fromAddress)' }, { status: 400 });

    const anchorPayload = { vector, weight, open_loop, pressure, project_id, manifest_hash, git_ref, deployment_ref, trigger, context_tags, anchor_timestamp: anchor_timestamp || new Date().toISOString() };
    const contentHash = computeContentHash(anchorPayload);

    const txId = await sendSelfAnchorTx({ mnemonic, inputPrivateKey: privateKey, fromAddress });
    const { blockDaaScore, accepted } = await fetchBlockDaaScore(txId);

    return Response.json({
      success: true,
      content_hash: contentHash,
      txId,
      block_daa_score: blockDaaScore,
      is_verified: accepted || blockDaaScore > 0,
      anchor_timestamp: anchorPayload.anchor_timestamp
    });
  } catch (error) {
    const msg = error?.message || String(error) || 'Unknown error';
    console.error('anchorContinuity error:', msg);
    return Response.json({ error: msg }, { status: 500 });
  }
});