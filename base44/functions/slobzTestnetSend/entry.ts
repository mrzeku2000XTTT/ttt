// Slobz Testnet (TN10) engine: TKAS balance, address conversion (kaspa: -> kaspatest:)
// and real testnet transactions — same manual P2PK signer as mainnet, testnet params.
import { schnorr } from 'npm:@noble/curves@1.4.0/secp256k1';
import {
  MAX_UTXOS, estimateFee, hexToBytes, bytesToHex, concatBytes,
  writeU8, canonicalDataPush, decodeAnyKaspaAddress, encodeKaspaAddress,
  p2pkScriptFromAddress, computeSigHash
} from '../../shared/kaspaTx.ts';

const TESTNET_API = 'https://api-tn10.kaspa.org';
const TESTNET_HRP = 'kaspatest';

// Convert any kaspa:/kaspatest: address to its testnet twin (same pubkey)
function toTestnetAddress(addr) {
  const a = addr.includes(':') ? addr : `kaspa:${addr}`;
  if (a.startsWith('kaspatest:')) { decodeAnyKaspaAddress(a); return a; }
  return encodeKaspaAddress(TESTNET_HRP, decodeAnyKaspaAddress(a));
}

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'convert') {
      const testnetAddress = toTestnetAddress(body.address);
      return Response.json({ success: true, testnetAddress });
    }

    if (action === 'balance') {
      const addr = toTestnetAddress(body.address);
      const res = await fetch(`${TESTNET_API}/addresses/${addr}/balance`, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`Testnet API error: ${res.status}`);
      const data = await res.json();
      return Response.json({ success: true, testnetAddress: addr, balanceTkas: (data.balance || 0) / 1e8 });
    }

    if (action !== 'send') {
      return Response.json({ error: 'Unknown action' }, { status: 400 });
    }

    const { mnemonic, privateKey: inputPrivateKey, fromAddress, toAddress, amountKas } = body;
    if ((!mnemonic && !inputPrivateKey) || !fromAddress || !toAddress || !amountKas) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const from = toTestnetAddress(fromAddress);
    const to = toTestnetAddress(toAddress);
    let amountSompi = BigInt(Math.round(parseFloat(amountKas) * 1e8));
    if (amountSompi <= 0n) return Response.json({ error: 'Invalid amount' }, { status: 400 });

    let privateKey = inputPrivateKey;
    if (!privateKey) {
      const { KaspaWallet } = await import('npm:@okxweb3/coin-kaspa@1.0.6');
      const wallet = new KaspaWallet();
      privateKey = await wallet.getDerivedPrivateKey({ mnemonic: mnemonic.trim(), hdPath: "m/44'/111111'/0'/0/0" });
    }
    if (typeof privateKey === 'object') privateKey = privateKey.toString();
    if (typeof privateKey === 'string' && privateKey.startsWith('0x')) privateKey = privateKey.slice(2);

    const utxoRes = await fetch(`${TESTNET_API}/addresses/${from}/utxos`, { signal: AbortSignal.timeout(15000) });
    if (!utxoRes.ok) throw new Error(`Failed to fetch testnet UTXOs: ${utxoRes.status}`);
    const utxos = await utxoRes.json();
    if (!utxos || utxos.length === 0) throw new Error('No TKAS in your testnet wallet. Grab free TKAS from the faucet first.');

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
      throw new Error(`Insufficient TKAS. Need ${(Number(amountSompi + feeSompi) / 1e8).toFixed(4)}, have ${(Number(totalIn) / 1e8).toFixed(4)}`);
    }

    const fromScript = p2pkScriptFromAddress(from);
    const toScript = p2pkScriptFromAddress(to);
    const inputs = selectedUtxos.map(u => ({
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
        outputs: outputs.map(out => ({
          amount: out.amount.toString(),
          scriptPublicKey: { version: out.scriptVersion, scriptPublicKey: bytesToHex(out.scriptPubKey) },
        })),
        lockTime: '0',
        subnetworkId: '0000000000000000000000000000000000000000',
      };

      if (attempt > 0) await new Promise(r => setTimeout(r, 2500));
      submitRes = await fetch(`${TESTNET_API}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction: rawTx, allowOrphan: false }),
        signal: AbortSignal.timeout(15000),
      });
      submitText = await submitRes.text();
      if (submitRes.ok) break;

      console.error(`[slobzTestnetSend] attempt ${attempt + 1} error:`, submitText.slice(0, 400));
      const requiredMatch = submitText.match(/required amount of (\d+)/);
      if (requiredMatch && attempt === 0) {
        currentFee = BigInt(requiredMatch[1]) + BigInt(requiredMatch[1]) / 10n;
        continue;
      }
      break;
    }

    if (!submitRes.ok) throw new Error(`Testnet submit failed (${submitRes.status}): ${submitText.slice(0, 300)}`);

    let submitData;
    try { submitData = JSON.parse(submitText); } catch { submitData = submitText; }

    return Response.json({
      success: true,
      network: 'testnet-10',
      txId: submitData.transactionId || submitData.txid || submitData,
      amountTkas: Number(amountSompi) / 1e8,
      fee: Number(currentFee) / 1e8,
      from,
      to,
    });
  } catch (error) {
    const msg = error?.message || String(error) || 'Unknown error';
    console.error('slobzTestnetSend error:', msg);
    return Response.json({ error: msg }, { status: 500 });
  }
});