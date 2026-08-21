// Returns spendable (mature, ≥10-confirmation) UTXO balance + counts for an address.
// Mirrors the maturity logic in sendKaspaTransaction so the "insufficient" check
// in the productivity coach reflects what can actually be spent right now.
const KASPA_API = 'https://api.kaspa.org';

Deno.serve(async (req) => {
  try {
    let address;
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      address = body.address;
    } else {
      address = new URL(req.url).searchParams.get('address');
    }
    if (!address || !address.trim()) {
      return Response.json({ success: false, error: 'Address required' }, { status: 400 });
    }
    const clean = address.startsWith('kaspa:') ? address : `kaspa:${address}`;

    const utxoRes = await fetch(
      `${KASPA_API}/addresses/${clean}/utxos`,
      { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) }
    );
    if (!utxoRes.ok) {
      return Response.json({ success: false, error: `UTXO API error: ${utxoRes.status}` }, { status: 502 });
    }
    const utxos = await utxoRes.json();
    const list = Array.isArray(utxos) ? utxos : [];

    let virtualDaa = 0;
    try {
      const tipRes = await fetch(`${KASPA_API}/info/virtual-chain-blue-score`, { signal: AbortSignal.timeout(10000) });
      if (tipRes.ok) virtualDaa = Number((await tipRes.json()).blueScore || 0);
    } catch { /* fall back to all UTXOs */ }

    const mature = virtualDaa > 0
      ? list.filter((u) => {
          const s = Number(u.utxoEntry?.blockDaaScore || 0);
          return s > 0 && virtualDaa - s >= 10;
        })
      : list;

    const totalSompi = list.reduce((a, u) => a + BigInt(u.utxoEntry?.amount || 0), 0n);
    const matureSompi = mature.reduce((a, u) => a + BigInt(u.utxoEntry?.amount || 0), 0n);

    return Response.json({
      success: true,
      address: clean,
      balanceKAS: Number(totalSompi) / 1e8,
      spendableKAS: Number(matureSompi) / 1e8,
      utxoCount: list.length,
      matureUtxoCount: mature.length,
      pendingUtxoCount: Math.max(0, list.length - mature.length),
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});