// Now powered by the official public Kaspa REST API (api.kaspa.org) — the same
// endpoint already used by getKaspaBalance — instead of the dead Replit
// backend (tttxxx.live, which returned 404 "app not live").
//
// Uses the /addresses/{address}/full-transactions endpoint which returns full
// transaction history with block_time timestamps — exactly what the Agent ZK
// chat needs for balance, transaction list, and recent payment detection.

const KASPA_API_BASE = 'https://api.kaspa.org';

Deno.serve(async (req) => {
  try {
    let address;

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      address = body.address;
    } else {
      const url = new URL(req.url);
      address = url.searchParams.get('address');
    }

    if (!address || !address.trim()) {
      return Response.json({
        success: false,
        error: 'Address is required'
      }, { status: 400 });
    }

    const cleanAddress = address.startsWith('kaspa:') ? address : `kaspa:${address}`;
    console.log('💰 Fetching transactions via api.kaspa.org for:', cleanAddress);

    // Fetch full transactions (incoming + outgoing) with block_time timestamps
    const response = await fetch(
      `${KASPA_API_BASE}/addresses/${encodeURIComponent(cleanAddress)}/full-transactions?limit=50&offset=0&resolve_previous_outpoints=light`,
      {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(20000)
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Kaspa API error: ${response.status} ${errText.slice(0, 120)}`);
    }

    const transactions = await response.json();
    const txs = Array.isArray(transactions) ? transactions : [];

    console.log(`✅ Received ${txs.length} transactions for ${cleanAddress}`);

    // Transform into the history format the Agent ZK chat expects.
    // Keep transactions where this address RECEIVED funds.
    let totalReceived = 0;
    const history = [];

    for (const tx of txs) {
      if (!tx.is_accepted) continue;

      let receivedSompi = 0;
      if (Array.isArray(tx.outputs)) {
        for (const out of tx.outputs) {
          if (out.script_public_key_address === cleanAddress) {
            receivedSompi += Number(out.amount) || 0;
          }
        }
      }

      if (receivedSompi > 0) {
        totalReceived += receivedSompi;
        history.push({
          txId: tx.transaction_id,
          amount: receivedSompi,
          timestamp: tx.block_time ? tx.block_time : null,
          blockDaaScore: tx.block_daa_score || null,
          index: 0,
          isCoinbase: tx.is_coinbase || false
        });
      }
    }

    // Sort by timestamp descending (most recent first)
    history.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    const balanceKAS = totalReceived / 1e8;

    return Response.json({
      success: true,
      address: cleanAddress,
      balance: totalReceived,
      balanceKAS: balanceKAS,
      utxoCount: history.length,
      utxos: history,
      history: history
    });

  } catch (error) {
    console.error('❌ UTXO fetch error:', error.message);
    return Response.json({
      success: false,
      error: error.message,
      utxos: [],
      history: []
    }, { status: 500 });
  }
});