// AWA sentinel-x402 covenant builder — ports the P2SH covenant script from
// mrzeku2000XTTT/kaspa-xmss-covenants (x402-kaspa/sentinel-x402) into a pure-JS
// module that runs in a Base44 Deno backend function (no WASM SDK needed).
//
// The covenant enforces exactly 2 outputs per spend, regardless of branch:
//   IF (check-in/pay):   output0 -> worker (increment), output1 -> next hop covenant (remainder)
//   ELSE (timeout):      output0 -> marketer (refundA), output1 -> marketer (refundB)
//                       (split so output shape matches the IF branch — a Stag Hunt lesson)
//
// We use a Schnorr check-in (worker signs the spend with their TTT/AI wallet key,
// client-side — non-custodial) instead of the repo's XMSS witnesses, so the per-period
// payout is spendable from this platform. The refund branch is permissionless
// (no signature — only the CLTV timeout must have elapsed), so the safety net works
// even if the worker never checks in.
import { blake2b } from 'npm:@noble/hashes@1.4.0/blake2b';
import { concatBytes, bytesToHex, hexToBytes, encodeKaspaAddress, writeU16LE, writeU32LE } from './kaspaTx.ts';

const OP_IF = 0x63, OP_ELSE = 0x67, OP_ENDIF = 0x68, OP_EQUAL = 0x87, OP_EQUALVERIFY = 0x88;
const OP_CLTV = 0xb0, OP_CHECKSIG = 0xac, OP_VERIFY = 0x69, OP_DATA_32 = 0x20;
const OP_TX_OUTPUT_AMOUNT = 0xc2, OP_TX_OUTPUT_SPK = 0xc3;

export const SOMPI_PER_KAS = 100000000n;
export const DEFAULT_FEE_CHECKIN = 40000000n;   // 0.4 KAS — sentinel scripts are ~massy
export const DEFAULT_FEE_REFUND = 40000000n;
export const DEFAULT_PERIOD_BLOCKS = 600;       // ~5 min on Kaspa (~1 block/s DAA)
export const MAX_EPOCHS = 24;

// Push data with minimal Bitcoin-style length prefixes.
export function pd(b) {
  const len = b.length;
  if (len <= 75) return concatBytes(new Uint8Array([len]), b);
  if (len <= 255) return concatBytes(new Uint8Array([0x4c, len]), b);
  if (len <= 65535) return concatBytes(new Uint8Array([0x4d]), writeU16LE(len), b);
  return concatBytes(new Uint8Array([0x4e]), writeU32LE(len), b);
}

// Encode a number as a minimal little-endian script number (BigInt-safe).
export function encodeNum(n) {
  let v = BigInt(n);
  if (v === 0n) return new Uint8Array(0);
  const neg = v < 0n;
  if (neg) v = -v;
  const bytes = [];
  while (v > 0n) { bytes.push(Number(v & 0xffn)); v >>= 8n; }
  if (bytes[bytes.length - 1] & 0x80) bytes.push(neg ? 0x80 : 0x00);
  else if (neg) bytes[bytes.length - 1] |= 0x80;
  return new Uint8Array(bytes);
}

// Kaspa scriptPublicKey includes 2 version bytes before the script when introspected
// by OP_TX_OUTPUT_SPK — match that shape in the pushed comparisons.
function versioned(spk) {
  return concatBytes(new Uint8Array([0x00, 0x00]), spk);
}

// P2SH scriptPublicKey: OP_HASH160 <32-byte blake2b(redeemScript)> OP_EQUAL
export function p2shSpk(scriptBytes) {
  const h = blake2b(scriptBytes, { dkLen: 32 });
  return concatBytes(new Uint8Array([0xaa, 0x20]), h, new Uint8Array([0x87]));
}

// Kaspa P2SH address: bech32m "kaspa:" with version byte 0x08 + 32-byte script hash.
export function p2shAddress(scriptBytes) {
  const h = blake2b(scriptBytes, { dkLen: 32 });
  return encodeKaspaAddress('kaspa', concatBytes(new Uint8Array([0x08]), h));
}

// P2PK scriptPublicKey for a 32-byte x-only (Schnorr) pubkey: <0x20> <pubkey> <OP_CHECKSIG>
export function p2pkSpk(pubKeyHex) {
  const pub = hexToBytes(pubKeyHex);
  if (pub.length !== 32) throw new Error('x-only Schnorr pubkey must be 32 bytes');
  return concatBytes(new Uint8Array([OP_DATA_32]), pub, new Uint8Array([OP_CHECKSIG]));
}

// Build ONE sentinel-x402 epoch covenant with a Schnorr check-in branch.
export function buildSentinelEpoch(workerPubKeyHex, unlockDaa, providerSpk, incrementAmt, nextHopSpk, remainderAmt, customerSpk, refundA, refundB) {
  const workerPub = hexToBytes(workerPubKeyHex);
  const parts = [];
  parts.push(new Uint8Array([OP_IF]));
  // check-in branch: worker Schnorr sig over this tx (pubkey hardcoded in script)
  parts.push(concatBytes(new Uint8Array([OP_DATA_32]), workerPub, new Uint8Array([OP_CHECKSIG, OP_VERIFY])));
  // IF outputs: output0 = provider increment, output1 = next hop remainder
  parts.push(pd(versioned(providerSpk)));
  parts.push(pd(encodeNum(incrementAmt)));
  parts.push(pd(versioned(nextHopSpk)));
  parts.push(pd(encodeNum(remainderAmt)));
  parts.push(new Uint8Array([OP_ELSE]));
  // timeout branch: CLTV on unlockDaa (no DROP — Kaspa quirk), then refund to customer
  parts.push(pd(encodeNum(unlockDaa)));
  parts.push(new Uint8Array([OP_CLTV]));
  parts.push(pd(versioned(customerSpk)));
  parts.push(pd(encodeNum(refundA)));
  parts.push(pd(versioned(customerSpk)));
  parts.push(pd(encodeNum(refundB)));
  parts.push(new Uint8Array([OP_ENDIF]));
  // unconditional output-shape enforcement — identical regardless of which branch ran
  parts.push(pd(encodeNum(1n)));  parts.push(new Uint8Array([OP_TX_OUTPUT_AMOUNT, OP_EQUALVERIFY])); // consumes amt1
  parts.push(pd(encodeNum(1n)));  parts.push(new Uint8Array([OP_TX_OUTPUT_SPK, OP_EQUALVERIFY]));    // consumes spk1
  parts.push(pd(encodeNum(0n)));  parts.push(new Uint8Array([OP_TX_OUTPUT_AMOUNT, OP_EQUALVERIFY])); // consumes amt0
  parts.push(pd(encodeNum(0n)));  parts.push(new Uint8Array([OP_TX_OUTPUT_SPK, OP_EQUAL]));          // consumes spk0 -> bool
  const script = concatBytes(...parts);
  return { script, spk: p2shSpk(script), address: p2shAddress(script) };
}

// Build the full hop chain for a campaign (built AFTER a worker claims, so the worker
// key is known). Returns hops[0..N-1]; hop0 is the one the marketer funds.
//   hop i check-in: pays worker `increment`, relocks `remainder` to hop i+1 (or to the
//   customer as final settlement on the last hop).
//   hop i timeout:  refunds `remainder` to the customer (split A/B).
export function buildCovenantChain({ totalSompi, incrementSompi, numEpochs, feeCheckin, feeRefund, workerPubKeyHex, workerSpk, customerSpk, currentDaa, periodBlocks }) {
  if (numEpochs < 1 || numEpochs > MAX_EPOCHS) throw new Error(`numEpochs must be 1..${MAX_EPOCHS}`);
  const inc = BigInt(incrementSompi);
  const fc = BigInt(feeCheckin);
  const fr = BigInt(feeRefund);
  const total = BigInt(totalSompi);
  if (inc * BigInt(numEpochs) + fc * BigInt(numEpochs) > total) {
    throw new Error('total KAS must cover all increments + per-check-in fees + final refund fee');
  }
  const hops = [];
  // remainder locked at the start of hop i:
  //   R_i = total - i*(increment+feeCheckin)   (what's left after i check-ins)
  for (let i = 0; i < numEpochs; i++) {
    const remainderAtHopI = total - BigInt(i) * (inc + fc);
    const deadlineDaa = Number(BigInt(currentDaa) + BigInt(i + 1) * BigInt(periodBlocks));
    const nextRemainder = remainderAtHopI - inc - fc; // relocked into hop i+1 (or paid out on last)
    const isLast = i === numEpochs - 1;
    let nextHopSpk, nextHopRemainder;
    if (isLast) {
      // last hop: check-in pays worker increment + final remainder (settlement) to customer
      nextHopSpk = customerSpk;
      nextHopRemainder = nextRemainder - fr; // remaining after refund fee goes to customer
    } else {
      // relock to hop i+1 (computed below in backward pass — placeholder, fixed after)
      nextHopSpk = null;
      nextHopRemainder = nextRemainder;
    }
    const refundTotal = remainderAtHopI - fr;
    const refundA = refundTotal / 2n;
    const refundB = refundTotal - refundA;
    hops.push({
      index: i, deadlineDaa,
      increment: inc, feeCheckin: fc, feeRefund: fr,
      remainder: remainderAtHopI, nextRemainder: nextHopRemainder,
      refundA, refundB, isLast, nextHopSpk
    });
  }
  // Backward pass: build hop N-1 first, then hop i references hop i+1's spk.
  const built = new Array(numEpochs);
  for (let i = numEpochs - 1; i >= 0; i--) {
    const h = hops[i];
    const nextSpk = h.isLast ? h.nextHopSpk : built[i + 1].spk;
    const epoch = buildSentinelEpoch(
      workerPubKeyHex, h.deadlineDaa, workerSpk, h.increment,
      nextSpk, h.nextRemainder, customerSpk, h.refundA, h.refundB
    );
    built[i] = {
      index: i,
      deadlineDaa: h.deadlineDaa,
      scriptHex: bytesToHex(epoch.script),
      spkHex: bytesToHex(epoch.spk),
      address: epoch.address,
      remainder: h.remainder.toString(),
      increment: h.increment.toString(),
      refundA: h.refundA.toString(),
      refundB: h.refundB.toString(),
      isLast: h.isLast
    };
  }
  return built;
}

// Check-in scriptSig: <workerSig> <OP_1 (selector=true)> <push redeemScript>
export function buildCheckinScriptSig(workerSigHex, redeemScriptHex) {
  return bytesToHex(concatBytes(pd(hexToBytes(workerSigHex)), new Uint8Array([0x51]), pd(hexToBytes(redeemScriptHex))));
}

// Refund scriptSig: <OP_0 (selector=false)> <push redeemScript> — permissionless, no signature.
export function buildRefundScriptSig(redeemScriptHex) {
  return bytesToHex(concatBytes(new Uint8Array([0x00]), pd(hexToBytes(redeemScriptHex))));
}

// Fetch the current Kaspa virtual DAA blue score.
export async function getCurrentDaa() {
  const r = await fetch('https://api.kaspa.org/info/blockdag');
  if (!r.ok) throw new Error('Could not fetch Kaspa DAA score');
  const j = await r.json();
  return Number(j.virtualDaaScore);
}

// Verify a funding tx paid `expectedSompi` (or more) to `expectedAddress` on L1.
export async function verifyFundingTx(txId, expectedAddress, expectedSompi) {
  const r = await fetch(`https://api.kaspa.org/transactions/${txId}?inputs=false&outputs=true&resolve_previous_outpoints=no`);
  if (!r.ok) return { ok: false, reason: 'Transaction not found on Kaspa L1 yet — wait a few seconds and retry' };
  const tx = await r.json();
  const need = BigInt(expectedSompi);
  const out = (tx.outputs || []).find((o) => o.script_public_key_address === expectedAddress && BigInt(o.amount) >= need);
  if (!out) return { ok: false, reason: `No output paying >= ${Number(need) / 1e8} KAS to ${expectedAddress}` };
  return { ok: true, paidSompi: out.amount, outputIndex: out.transaction_outpoint?.index ?? 0, isAccepted: tx.is_accepted !== false };
}

// Broadcast a raw Kaspa transaction via the public REST endpoint.
export async function broadcastTx(txObj) {
  const r = await fetch('https://api.kaspa.org/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transaction: txObj, allowOrphan: false })
  });
  const text = await r.text();
  let j; try { j = JSON.parse(text); } catch { j = { raw: text }; }
  if (!r.ok) return { ok: false, reason: j?.error || j?.raw || `HTTP ${r.status}` };
  return { ok: true, txId: j.transactionId || j.txid };
}