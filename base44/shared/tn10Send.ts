// Server-side Kaspa TN-10 (testnet-10) P2PK sender.
// Same manual signer used elsewhere in the app, with testnet parameters.
// Used by the AI Factory to forward an agent's starting capital from the
// Factory wallet into the new agent's own wallet — so the human only ever
// signs ONE payment.
import { schnorr } from 'npm:@noble/curves@1.4.0/secp256k1';
import {
  MAX_UTXOS, estimateFee, hexToBytes, bytesToHex, concatBytes,
  writeU8, canonicalDataPush, decodeAnyKaspaAddress, encodeKaspaAddress,
  p2pkScriptFromAddress, computeSigHash
} from './kaspaTx.ts';
import { DERIVATION_PATH, derivePrivateKeyFromMnemonic } from './kaspaAddress.ts';

export const TN10_SEND_API = 'https://api-tn10.kaspa.org';
const TESTNET_HRP = 'kaspatest';

/** Convert any kaspa:/kaspatest: address to its testnet twin (same pubkey). */
export function toTestnetAddress(addr: string) {
  const a = addr.includes(':') ? addr : `kaspa:${addr}`;
  if (a.startsWith('kaspatest:')) { decodeAnyKaspaAddress(a); return a; }
  return encodeKaspaAddress(TESTNET_HRP, decodeAnyKaspaAddress(a));
}

/** Balance of a TN-10 address in sompi (integer). */
export async function tn10BalanceSompi(address: string) {
  const addr = toTestnetAddress(address);
  const res = await fetch(`${TN10_SEND_API}/addresses/${addr}/balance`, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`TN-10 balance lookup failed (${res.status})`);
  const data = await res.json();
  return BigInt(data.balance || 0);
}

/**
 * Sign and broadcast a TN-10 P2PK payment from a mnemonic-held wallet.
 * Returns { txId, feeSompi }. Throws on insufficient funds or submit failure.
 */
export async function sendTn10({ mnemonic, fromAddress, toAddress, amountSompi }: {
  mnemonic: string; fromAddress: string; toAddress: string; amountSompi: bigint;
}) {
  if (amountSompi <= 0n) throw new Error('Invalid amount');
  const from = toTestnetAddress(fromAddress);
  const to = toTestnetAddress(toAddress);

  let privateKey = derivePrivateKeyFromMnemonic(mnemonic, DERIVATION_PATH);
  if (typeof privateKey === 'object') privateKey = privateKey.toString();
  if (typeof privateKey === 'string' && privateKey.startsWith('0x')) privateKey = privateKey.slice(2);

  const utxoRes = await fetch(`${TN10_SEND_API}/addresses/${from}/utxos`, { signal: AbortSignal.timeout(15000) });
  if (!utxoRes.ok) throw new Error(`Failed to fetch TN-10 UTXOs: ${utxoRes.status}`);
  const utxos = await utxoRes.json();
  if (!utxos || utxos.length === 0) throw new Error('Factory wallet has no TN-10 funds');

  utxos.sort((a, b) => Number(b.utxoEntry.amount) - Number(a.utxoEntry.amount));
  let totalIn = 0n;
  const selectedUtxos = [];
  const maxFee = estimateFee(MAX_UTXOS, 2);
  for (const utxo of utxos) {
    if (totalIn >= amountSompi + maxFee) break;
    if (selectedUtxos.length >= MAX_UTXOS) break;
    selectedUtxos.push(utxo);
    totalIn += BigInt(utxo.utxoEntry.amount);
  }
  let feeSompi = estimateFee(selectedUtxos.length, 2);
  if (totalIn < amountSompi + feeSompi) {
    throw new Error(`Insufficient TN-10 funds. Need ${(Number(amountSompi + feeSompi) / 1e8).toFixed(4)}, have ${(Number(totalIn) / 1e8).toFixed(4)}`);
  }

  const fromScript = p2pkScriptFromAddress(from);
  const toScript = p2pkScriptFromAddress(to);
  const inputs = selectedUtxos.map((u) => ({
    prevTxId: u.outpoint.transactionId,
    prevIndex: u.outpoint.index,
    utxoScriptVersion: 0,
    utxoScriptPubKey: fromScript,
    utxoAmount: BigInt(u.utxoEntry.amount),
    sequence: 0n,
    sigOpCount: 1,
  }));

  let submitRes, submitText;
  let currentFee = feeSompi;
  for (let attempt = 0; attempt < 2; attempt++) {
    const change = totalIn - amountSompi - currentFee;
    const outputs = [{ amount: amountSompi, scriptVersion: 0, scriptPubKey: toScript }];
    if (change > 0n) outputs.push({ amount: change, scriptVersion: 0, scriptPubKey: fromScript });

    const tx = { version: 0, inputs, outputs, locktime: 0n, gas: 0n };
    const signatureScripts = inputs.map((_, i) => {
      const sig = schnorr.sign(computeSigHash(tx, i), hexToBytes(privateKey));
      return bytesToHex(canonicalDataPush(concatBytes(new Uint8Array(sig), new Uint8Array([0x01]))));
    });

    const rawTx = {
      version: 0,
      inputs: inputs.map((inp, i) => ({
        previousOutpoint: { transactionId: inp.prevTxId, index: inp.prevIndex },
        signatureScript: signatureScripts[i],
        sequence: '0',
        sigOpCount: inp.sigOpCount,
      })),
      outputs: outputs.map((out) => ({
        amount: out.amount.toString(),
        scriptPublicKey: { version: out.scriptVersion, scriptPublicKey: bytesToHex(out.scriptPubKey) },
      })),
      lockTime: '0',
      subnetworkId: '0000000000000000000000000000000000000000',
    };

    if (attempt > 0) await new Promise((r) => setTimeout(r, 2500));
    submitRes = await fetch(`${TN10_SEND_API}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction: rawTx, allowOrphan: false }),
      signal: AbortSignal.timeout(15000),
    });
    submitText = await submitRes.text();
    if (submitRes.ok) break;

    const requiredMatch = submitText.match(/required amount of (\d+)/);
    if (requiredMatch && attempt === 0) {
      currentFee = BigInt(requiredMatch[1]) + BigInt(requiredMatch[1]) / 10n;
      continue;
    }
    // Kaspad also rejects on the storage-mass cap: the fee is too small for the
    // transaction's serialized size. A larger fee lowers storage mass, so retry
    // once with a bigger fee rather than failing the payment.
    if (/storage mass/i.test(submitText) && attempt === 0) {
      currentFee = currentFee * 3n + 2000n;
      continue;
    }
    break;
  }

  if (!submitRes || !submitRes.ok) throw new Error(`TN-10 submit failed (${submitRes?.status}): ${String(submitText).slice(0, 300)}`);

  let submitData;
  try { submitData = JSON.parse(submitText); } catch { submitData = submitText; }
  const txId = submitData?.transactionId || submitData?.txid || submitData;
  return { txId, feeSompi: currentFee };
}