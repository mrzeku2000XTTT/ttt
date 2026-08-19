// KaChing coin-control send — manual UTXO selection on top of the same
// P2PK signing path as sendKaspaTransaction. The CALLER chooses which UTXOs
// to spend so unselected UTXOs stay untouched (the privacy feature
// @brt2412 demanded: https://x.com/brt2412/status/2090140716534047222).
//
// Two actions:
//   action:"list"  { address }                       -> spendable UTXOs
//   action:"send"  { toAddress, amountKas, sendAll, inputs:[{txId,index,address,privateKey}] }
import { schnorr } from 'npm:@noble/curves@1.4.0/secp256k1';
import {
  FEE_SOMPI, MAX_UTXOS, estimateFee, hexToBytes, bytesToHex, concatBytes,
  canonicalDataPush, decodeAnyKaspaAddress, p2pkScriptFromAddress, computeSigHash,
} from '../../shared/kaspaTx.ts';

const KASPA_API = 'https://api.kaspa.org';
const MASS_PER_OUTPUT = 38753n;
const MASS_PER_SOMPI_X_MILLION = 1845n;
const SAFE_MASS_LIMIT = 450000n;

function verifyKaspaAddress(addr: string): void { decodeAnyKaspaAddress(addr); }

async function fetchUtxos(addr: string): Promise<any[]> {
  const r = await fetch(`${KASPA_API}/addresses/${addr}/utxos`, { signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`UTXO fetch failed for ${addr}: ${r.status}`);
  return await r.json();
}
async function getVirtualDaa(): Promise<number> {
  try {
    const t = await fetch(`${KASPA_API}/info/virtual-chain-blue-score`, { signal: AbortSignal.timeout(10000) });
    if (t.ok) return Number((await t.json()).blueScore || 0);
  } catch { /* ignore */ }
  return 0;
}

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    // ── LIST: return spendable UTXOs for an address ──────────────────────
    if (action === 'list') {
      const { address } = body;
      if (!address) return Response.json({ error: 'address required' }, { status: 400 });
      const norm = address.startsWith('kaspa:') ? address : `kaspa:${address}`;
      verifyKaspaAddress(norm);
      const utxos = await fetchUtxos(norm);
      const virtualDaa = await getVirtualDaa();
      const list = (utxos || []).map((u: any) => ({
        txId: u.outpoint.transactionId,
        index: u.outpoint.index,
        amount: Number(u.utxoEntry.amount),
        confirmations: virtualDaa ? Math.max(0, virtualDaa - Number(u.utxoEntry.blockDaaScore || 0)) : 0,
      })).sort((a: any, b: any) => b.amount - a.amount);
      return Response.json({ success: true, address: norm, utxos: list });
    }

    // ── SEND: spend only the caller-selected UTXOs ───────────────────────
    const { toAddress, amountKas, sendAll, inputs } = body;
    if (!toAddress || !Array.isArray(inputs) || inputs.length === 0) {
      return Response.json({ error: 'toAddress and inputs[] are required' }, { status: 400 });
    }
    if (inputs.length > MAX_UTXOS) return Response.json({ error: `Too many inputs (max ${MAX_UTXOS})` }, { status: 400 });
    const normTo = toAddress.startsWith('kaspa:') ? toAddress : `kaspa:${toAddress}`;
    verifyKaspaAddress(normTo);

    // Group selected inputs by address so we can fetch each address's UTXOs
    // and confirm the outpoints exist + are still unspent.
    const byAddr = new Map<string, any[]>();
    for (const inp of inputs) {
      const norm = inp.address.startsWith('kaspa:') ? inp.address : `kaspa:${inp.address}`;
      verifyKaspaAddress(norm);
      if (!byAddr.has(norm)) byAddr.set(norm, []);
      byAddr.get(norm)!.push(inp);
    }

    const selected: any[] = [];
    for (const [addr, ins] of byAddr) {
      const utxos = await fetchUtxos(addr);
      for (const inp of ins) {
        const u = utxos.find((x: any) => x.outpoint.transactionId === inp.txId && x.outpoint.index === inp.index);
        if (!u) throw new Error(`UTXO not found or already spent: ${inp.txId}:${inp.index}`);
        selected.push({
          prevTxId: inp.txId,
          prevIndex: inp.index,
          utxoScriptVersion: 0,
          utxoScriptPubKey: p2pkScriptFromAddress(addr),
          utxoAmount: BigInt(u.utxoEntry.amount),
          sequence: 0n,
          sigOpCount: 1,
          privateKey: String(inp.privateKey),
          fromAddress: addr,
        });
      }
    }

    let totalIn = 0n;
    for (const s of selected) totalIn += s.utxoAmount;

    const toScript = p2pkScriptFromAddress(normTo);
    const changeAddr = selected[0].fromAddress;
    const changeScript = p2pkScriptFromAddress(changeAddr);

    let amountSompi = amountKas ? BigInt(Math.round(parseFloat(amountKas) * 1e8)) : 0n;
    if (!sendAll && amountSompi <= 0n) return Response.json({ error: 'Invalid amount' }, { status: 400 });

    let feeSompi = estimateFee(selected.length, 2);
    if (sendAll) {
      feeSompi = estimateFee(selected.length, 1);
      amountSompi = totalIn - feeSompi;
      if (amountSompi <= 0n) throw new Error('Selected balance too low to cover fee');
    } else {
      if (totalIn < amountSompi + feeSompi) {
        throw new Error(`Insufficient selected UTXOs. Need ${(Number(amountSompi + feeSompi) / 1e8).toFixed(8)} KAS, selected ${(Number(totalIn) / 1e8).toFixed(8)} KAS`);
      }
    }

    let currentFee = feeSompi;
    let finalAmount = amountSompi;
    let finalChange = 0n;
    let submitRes: Response | null = null;
    let submitText = '';

    for (let attempt = 0; attempt < 2; attempt++) {
      if (sendAll) {
        finalAmount = totalIn - currentFee;
        if (finalAmount <= 0n) throw new Error('Selected balance too low to cover fee');
      }
      finalChange = totalIn - finalAmount - currentFee;
      let outputs: any[] = [{ amount: finalAmount, scriptVersion: 0, scriptPubKey: toScript }];
      if (finalChange > 0n) outputs.push({ amount: finalChange, scriptVersion: 0, scriptPubKey: changeScript });

      // Storage-mass guard: drop change if it would blow the consensus limit.
      if (finalChange > 0n) {
        const totalOut = outputs.reduce((s, o) => s + o.amount, 0n);
        const estMass = MASS_PER_OUTPUT * BigInt(outputs.length) + (MASS_PER_SOMPI_X_MILLION * totalOut) / 1000000n;
        if (estMass > SAFE_MASS_LIMIT) {
          outputs = [{ amount: finalAmount, scriptVersion: 0, scriptPubKey: toScript }];
          currentFee = estimateFee(selected.length, 1);
          finalChange = totalIn - finalAmount - currentFee;
        }
      }

      const tx = {
        version: 0,
        inputs: selected.map((s) => ({
          prevTxId: s.prevTxId, prevIndex: s.prevIndex,
          utxoScriptVersion: s.utxoScriptVersion, utxoScriptPubKey: s.utxoScriptPubKey,
          utxoAmount: s.utxoAmount, sequence: s.sequence, sigOpCount: s.sigOpCount,
        })),
        outputs, locktime: 0n, gas: 0n,
      };
      const signatureScripts = selected.map((s, i) => {
        const sig = schnorr.sign(computeSigHash(tx, i), hexToBytes(s.privateKey));
        return bytesToHex(canonicalDataPush(concatBytes(new Uint8Array(sig), new Uint8Array([0x01]))));
      });

      const rawTx = {
        version: 0,
        inputs: selected.map((s, i) => ({
          previousOutpoint: { transactionId: s.prevTxId, index: s.prevIndex },
          signatureScript: signatureScripts[i],
          sequence: '0',
          sigOpCount: s.sigOpCount,
        })),
        outputs: outputs.map((o) => ({
          amount: o.amount.toString(),
          scriptPublicKey: { version: o.scriptVersion, scriptPublicKey: bytesToHex(o.scriptPubKey) },
        })),
        lockTime: '0',
        subnetworkId: '0000000000000000000000000000000000000000',
      };

      if (attempt > 0) await new Promise((r) => setTimeout(r, 2500));
      submitRes = await fetch(`${KASPA_API}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction: rawTx, allowOrphan: false }),
        signal: AbortSignal.timeout(15000),
      });
      submitText = await submitRes.text();
      if (submitRes.ok) break;

      console.error(`[sendKaspaCoinControl] submit attempt ${attempt + 1}:`, submitText.slice(0, 400));
      const requiredMatch = submitText.match(/required amount of (\d+)/);
      if (requiredMatch && attempt === 0) {
        currentFee = BigInt(requiredMatch[1]) + BigInt(requiredMatch[1]) / 10n;
        continue;
      }
      if (!submitText.includes('orphan') && !submitText.includes('missing') && !submitText.includes('already')) break;
    }

    if (!submitRes || !submitRes.ok) {
      if (submitText.includes('already spent') || submitText.includes('orphan') || submitText.includes('missing') || submitText.includes('UTXO')) {
        throw new Error('A selected UTXO was already spent or is still confirming. Wait ~10s and retry.');
      }
      throw new Error(`Submit failed (${submitRes?.status}): ${submitText.slice(0, 300)}`);
    }

    let submitData: any;
    try { submitData = JSON.parse(submitText); } catch { submitData = submitText; }

    return Response.json({
      success: true,
      txId: submitData.transactionId || submitData.txid || submitData,
      amountKas: Number(finalAmount) / 1e8,
      fee: Number(currentFee) / 1e8,
      inputsUsed: selected.length,
      changeAddress: finalChange > 0n ? changeAddr : null,
    });
  } catch (error: any) {
    console.error('sendKaspaCoinControl error:', error?.message || error);
    return Response.json({ error: error?.message || String(error) || 'Unknown error' }, { status: 500 });
  }
});