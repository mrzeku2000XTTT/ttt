Deno.serve(async (req) => {
  try {
    const { network } = await req.json().catch(() => ({}));
    const base = network === "galleon"
      ? "https://explorer.galleon-testnet.igralabs.com"
      : "https://explorer.igralabs.com";

    const [statsRes, txRes, coinTxRes] = await Promise.all([
      fetch(`${base}/api/v2/stats`),
      fetch(`${base}/api/v2/main-page/transactions`),
      // Real iKAS value transfers — the newest txs are mostly 0-value attest calls
      fetch(`${base}/api/v2/transactions?filter=validated&type=coin_transfer`),
    ]);
    const stats = await statsRes.json();
    const txRaw = await txRes.json();
    const coinRaw = await coinTxRes.json().catch(() => ({}));
    const latest = Array.isArray(txRaw) ? txRaw : (txRaw.items || []);
    const coinList = (Array.isArray(coinRaw) ? coinRaw : (coinRaw.items || []))
      .filter((tx: any) => Number(tx.value) > 0);

    // Prefer value transfers, fill remaining slots with the latest activity
    const seen = new Set(coinList.map((tx: any) => tx.hash));
    const list = [...coinList, ...latest.filter((tx: any) => !seen.has(tx.hash))];

    const txs = list.slice(0, 8).map((tx: any) => ({
      hash: tx.hash,
      from: tx.from?.hash || null,
      to: tx.to?.hash || null,
      value: tx.value,
      method: tx.method,
      block: tx.block_number ?? tx.block ?? null,
    }));

    return Response.json({
      stats: {
        total_blocks: stats.total_blocks,
        total_transactions: stats.total_transactions,
        total_addresses: stats.total_addresses,
      },
      txs,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});