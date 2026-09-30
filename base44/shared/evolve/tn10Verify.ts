/**
 * tn10Verify — the STRONG settlement verifier for EVOLVE territory claims.
 *
 * WHY THIS EXISTS (the real root cause of `inputAddresses: []`)
 *
 * The shared Factory helper `paidToAddress()` tries `/transactions/{txid}`
 * first and falls back to the address UTXO set. On TN-10 that first call does
 * not merely lag — it 404s *always*, for confirmed transactions, at every
 * `resolve_previous_outpoints` setting, on every TN-10 host reachable from the
 * runtime. The address-history indexer is empty too (`/full-transactions` →
 * `[]`). The ONLY view of the chain this node serves correctly is
 * `/addresses/{addr}/utxos`.
 *
 * So verification was really succeeding through the UTXO fallback, and that
 * fallback returns `inputAddresses: []` *by construction* — it reads outputs,
 * never inputs. Nothing was broken in the old code; the evidence it needed
 * simply is not published by the node.
 *
 * CONSEQUENCE, stated honestly: on TN-10 today, a transaction's INPUTS CANNOT
 * BE RESOLVED FROM THE CHAIN. Sender verification therefore reports
 * `senderVerified: false` and this module NEVER infers a sender from a balance
 * change, from the fact that EVOLVE built the transaction, or from what the
 * claim expected. It reports exactly what the chain proves.
 *
 * What the chain DOES prove, and how strongly:
 *
 *   RECIPIENT  the treasury's UTXO set contains an entry whose outpoint txid is
 *              the settlement txid AND whose `address` is the treasury. The
 *              entry carries its own address, so this is direct chain evidence.
 *   AMOUNT     that same entry's `utxoEntry.amount` is the exact paid amount.
 *   SENDER     not resolvable from inputs. A *binding* is still obtainable and
 *              is recorded separately as `senderBinding`: the tx created an
 *              output (the change output) to the expected sender's address,
 *              visible in that address's UTXO set, and that output's P2PK
 *              script commits to the sender's own public key. This is chain
 *              evidence that the transaction paid the sender's key — which is
 *              what a change output is — but it is NOT the same claim as
 *              "the sender's address appears in the inputs", so it is labelled
 *              and never collapsed into `senderVerified`.
 *
 * Verification levels:
 *   FULL_SETTLEMENT_VERIFIED   inputs resolved AND expected sender is among
 *                              them, plus recipient + amount. (Unreachable on
 *                              TN-10 today; reachable the moment a node serves
 *                              the tx endpoint, with no code change.)
 *   RECIPIENT_AMOUNT_VERIFIED  recipient + amount proven; sender not resolvable
 *                              on this chain. This is the honest ceiling today.
 *   SENDER_UNVERIFIED          tx found and paid the recipient, but the sender
 *                              binding could not be established.
 *   NOT_FOUND                  the chain shows nothing for this txid.
 *
 * No secrets. Public addresses and txids only.
 */

export const TN10_VERIFY_API = 'https://api-tn10.kaspa.org';

const lower = (v: any) => String(v || '').toLowerCase();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type SettlementVerification = {
  verified: boolean;
  txId: string;
  senderVerified: boolean;
  recipientVerified: boolean;
  amountVerified: boolean;
  expectedSenderAddress: string;
  expectedRecipientAddress: string;
  paidSompi: number;
  inputAddresses: string[];
  evidenceSource: string;
  verificationTimestamp: string;
  failureReason: string;
  verificationLevel: string;
  senderBinding: any;
};

/** The tx endpoint. Returns null when the node does not serve the transaction. */
async function fetchTx(txid: string) {
  const url =
    `${TN10_VERIFY_API}/transactions/${encodeURIComponent(txid)}` +
    `?inputs=true&outputs=true&resolve_previous_outpoints=light`;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;
    const tx = await res.json();
    // A tx object without outputs is not usable evidence.
    if (!tx || (!tx.outputs && !tx.inputs)) return null;
    return tx;
  } catch {
    return null;
  }
}

/** The address UTXO set — the one TN-10 view that stays current. */
async function addressUtxos(address: string) {
  try {
    const res = await fetch(`${TN10_VERIFY_API}/addresses/${encodeURIComponent(address)}/utxos`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return [];
    const list = await res.json();
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/**
 * Resolve a transaction's inputs to their originating addresses.
 *
 *   tx → inputs → previous_outpoint {hash, index} → previous tx outputs → address
 *
 * Returns [] when the node cannot serve the tx or its ancestors. It never
 * invents an address to fill the gap.
 */
async function resolveInputAddresses(tx: any, api = TN10_VERIFY_API) {
  const inputs = tx?.inputs || [];
  const found: string[] = [];
  const cache = new Map<string, any>();

  for (const inp of inputs) {
    // Some nodes resolve it for us.
    const direct =
      inp?.previous_outpoint_address ||
      (Array.isArray(inp?.previous_outpoint_addresses) ? inp.previous_outpoint_addresses[0] : null);
    if (direct) {
      found.push(direct);
      continue;
    }
    const hash = inp?.previous_outpoint_hash || inp?.previous_outpoint?.transactionId;
    const index = Number(inp?.previous_outpoint_index ?? inp?.previous_outpoint?.index ?? 0);
    if (!hash) continue;
    if (!cache.has(hash)) {
      try {
        const r = await fetch(`${api}/transactions/${hash}?outputs=true`, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(10000),
        });
        cache.set(hash, r.ok ? await r.json() : null);
      } catch {
        cache.set(hash, null);
      }
    }
    const prev = cache.get(hash);
    const addr = prev?.outputs?.[index]?.script_public_key_address;
    if (addr) found.push(addr);
  }
  return Array.from(new Set(found));
}

/**
 * Verify a TN-10 settlement against the chain.
 *
 * Proves, to the strongest level the chain actually supports:
 *   txId matches + recipient matches + amount >= expected (+ sender, when resolvable)
 *
 * Fails closed: `verified` is only true when the txid, the recipient AND the
 * amount are all proven from chain evidence.
 */
export async function verifyTn10Settlement({
  txId,
  expectedSenderAddress,
  expectedRecipientAddress,
  expectedAmountSompi,
  attempts = 5,
  intervalMs = 2500,
}: {
  txId: string;
  expectedSenderAddress?: string;
  expectedRecipientAddress: string;
  expectedAmountSompi: number;
  attempts?: number;
  intervalMs?: number;
}): Promise<SettlementVerification> {
  const wanted = lower(txId);
  const sender = String(expectedSenderAddress || '');
  const recipient = String(expectedRecipientAddress || '');
  const expected = Number(expectedAmountSompi || 0);
  const now = () => new Date().toISOString();

  const base: SettlementVerification = {
    verified: false,
    txId: wanted,
    senderVerified: false,
    recipientVerified: false,
    amountVerified: false,
    expectedSenderAddress: sender,
    expectedRecipientAddress: recipient,
    paidSompi: 0,
    inputAddresses: [],
    evidenceSource: 'none',
    verificationTimestamp: now(),
    failureReason: '',
    verificationLevel: 'NOT_FOUND',
    senderBinding: null,
  };

  if (!wanted) return { ...base, failureReason: 'NO_TXID' };

  for (let i = 0; i < attempts; i += 1) {
    /* ---------------------------------------------- 1. the tx endpoint --- */
    const tx = await fetchTx(wanted);
    if (tx) {
      const paidSompi = (tx.outputs || [])
        .filter((o: any) => lower(o.script_public_key_address) === lower(recipient))
        .reduce((s: number, o: any) => s + Number(o.amount || 0), 0);
      const inputAddresses = await resolveInputAddresses(tx);
      const recipientVerified = paidSompi > 0;
      const amountVerified = paidSompi >= expected && expected > 0;
      const senderVerified = !!sender && inputAddresses.some((a) => lower(a) === lower(sender));
      const level = senderVerified && recipientVerified && amountVerified
        ? 'FULL_SETTLEMENT_VERIFIED'
        : recipientVerified && amountVerified
          ? 'RECIPIENT_AMOUNT_VERIFIED'
          : 'NOT_FOUND';
      return {
        ...base,
        verified: recipientVerified && amountVerified,
        senderVerified,
        recipientVerified,
        amountVerified,
        paidSompi,
        inputAddresses,
        evidenceSource: 'transaction_endpoint',
        verificationTimestamp: now(),
        failureReason: senderVerified
          ? ''
          : 'SENDER_NOT_IN_RESOLVED_INPUTS',
        verificationLevel: level,
        senderBinding: senderVerified ? { method: 'input_address', address: sender } : null,
      };
    }

    /* --------------------------- 2. the recipient's UTXO set (TN-10 now) -- */
    const recipientUtxos = await addressUtxos(recipient);
    const hit = recipientUtxos.find((u: any) => lower(u?.outpoint?.transactionId) === wanted);
    if (hit) {
      const paidSompi = Number(hit?.utxoEntry?.amount || 0);
      const recipientVerified = true; // the entry belongs to the queried address
      const amountVerified = paidSompi >= expected && expected > 0;

      // Sender BINDING (not sender verification): the tx created an output to
      // the expected sender's own address — the change output. Chain evidence
      // that the tx paid the sender's key; labelled distinctly and never
      // collapsed into senderVerified.
      let senderBinding = null;
      if (sender) {
        const senderUtxos = await addressUtxos(sender);
        const change = senderUtxos.find((u: any) => lower(u?.outpoint?.transactionId) === wanted);
        if (change) {
          senderBinding = {
            method: 'change_output',
            address: sender,
            outputIndex: change?.outpoint?.index ?? null,
            amountSompi: Number(change?.utxoEntry?.amount || 0),
            note: 'Transaction produced an output to the expected sender address',
          };
        }
      }

      return {
        ...base,
        verified: recipientVerified && amountVerified,
        senderVerified: false, // inputs are not resolvable on this node — never inferred
        recipientVerified,
        amountVerified,
        paidSompi,
        inputAddresses: [],
        evidenceSource: 'recipient_utxo_set',
        verificationTimestamp: now(),
        failureReason: amountVerified
          ? senderBinding
            ? 'SENDER_INPUTS_NOT_INDEXED_BY_NODE'
            : 'SENDER_BINDING_UNAVAILABLE'
          : 'UNDERPAID',
        verificationLevel: amountVerified ? 'RECIPIENT_AMOUNT_VERIFIED' : 'NOT_FOUND',
        senderBinding,
      };
    }

    if (i < attempts - 1) await sleep(intervalMs);
  }

  return { ...base, evidenceSource: 'recipient_utxo_set', failureReason: 'NOT_FOUND_ON_CHAIN', verificationLevel: 'NOT_FOUND' };
}