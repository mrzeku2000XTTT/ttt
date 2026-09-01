// Off-chain verification that a Scorpion (KCC20) wallet user self-sent KAS.
// A self-send = a transaction where the address is BOTH a spender (input)
// and a recipient (output). That transaction pays the Kaspa miner fee, which
// is the "payment" that unlocks the App Store for a 30-minute window.
//
// No auth required — AppStoreV2 is public. No custody, no signatures, no keys.
// We only read public Kaspa chain data.

const API_BASE = 'https://api.kaspa.org';
const MIN_SOMPI = 10000;          // 0.0001 KAS floor — filters dust
const WINDOW_MS = 30 * 60 * 1000; // 30-minute access window

function norm(addr) {
  return String(addr || '').replace(/^kaspa:/, '').trim();
}

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { address, sinceTs } = body;
    const addr = norm(address);
    if (!addr) {
      return Response.json({ verified: false, error: 'address required' }, { status: 400 });
    }
    // Look back ~5 minutes so a just-broadcast self-send is caught even if the
    // user taps "verify" a few seconds later.
    const since = parseInt(sinceTs) || (Date.now() - 5 * 60 * 1000);

    const apiKey = Deno.env.get('KASPA_API_KEY') || '';
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['X-API-KEY'] = apiKey;
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // api.kaspa.org requires the `kaspa:` prefix in the path and only the
    // `/full-transactions` endpoint returns data for an address; the bare
    // `/transactions` route 404s even for active addresses.
    const addrPath = encodeURIComponent(`kaspa:${addr}`);
    let res;
    for (let i = 0; i < 3; i++) {
      try {
        res = await fetch(`${API_BASE}/addresses/${addrPath}/full-transactions?limit=100`, { headers });
      } catch (e) {
        if (i < 2) { await new Promise((s) => setTimeout(s, 800)); continue; }
        return Response.json({ verified: false, error: 'Kaspa API unreachable' });
      }
      if (res.ok || res.status === 404) break;
      const delay = res.status === 429 ? 2000 : 600;
      if (i < 2) await new Promise((s) => setTimeout(s, delay));
    }
    if (!res) {
      return Response.json({ verified: false, error: 'Kaspa API unavailable' });
    }
    if (res.status === 404) {
      // Address has no on-chain activity yet.
      return Response.json({ verified: false, message: 'No transactions for this address yet' });
    }
    if (!res.ok) {
      return Response.json({ verified: false, error: 'Kaspa API unavailable' });
    }

    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.transactions || []);

    for (const tx of list) {
      if (!tx.block_time) continue;
      let t = Number(tx.block_time);
      if (t > 1e13) t = Math.floor(t / 1000);   // microseconds -> ms
      else if (t < 1e10) t = t * 1000;           // seconds -> ms
      if (t < since) continue;

      const inputs = tx.inputs || [];
      const outputs = tx.outputs || [];

      // A true self-send: the wallet spent its own UTXOs (input from this address)
      // AND received an output back to itself. If the API didn't resolve input
      // addresses, fall back to "output to self" only (still pays a fee).
      const inputsResolved = inputs.some((inp) => inp.previous_outpoint_address);
      const isSender = inputs.some((inp) => norm(inp.previous_outpoint_address) === addr);
      const senderOk = inputsResolved ? isSender : true;

      let selfOut = null;
      for (const out of outputs) {
        if (norm(out.script_public_key_address) === addr) {
          const amt = Number(out.amount || 0);
          if (amt >= MIN_SOMPI) {
            selfOut = { amount: amt, address: out.script_public_key_address };
            break;
          }
        }
      }

      if (senderOk && selfOut) {
        return Response.json({
          verified: true,
          transaction: {
            id: tx.transaction_id,
            amount: selfOut.amount / 1e8,
            timestamp: t,
          },
          grantedUntil: Date.now() + WINDOW_MS,
          windowMs: WINDOW_MS,
        });
      }
    }

    return Response.json({ verified: false, message: 'No recent self-send found' });
  } catch (e) {
    console.error('verifyAppStoreAccess error:', e);
    return Response.json({ verified: false, error: e?.message || 'Verification error' }, { status: 500 });
  }
});