const API_BASE = "https://api.kaspa.org";

Deno.serve(async (req) => {
  try {
    const { action, query } = await req.json();

    // Detect what the user is looking for
    const q = (query || "").trim();

    if (action === "transaction" || (!action && q.length === 64)) {
      // Transaction lookup by hash
      const txId = q;
      const res = await fetch(`${API_BASE}/transactions/${txId}`);
      if (!res.ok) return Response.json({ error: "Transaction not found", status: res.status });
      const tx = await res.json();
      
      // Summarize
      const inputs = tx.inputs || [];
      const outputs = tx.outputs || [];
      const totalOut = outputs.reduce((sum, o) => sum + (o.amount || 0), 0);
      
      return Response.json({
        type: "transaction",
        transaction_id: tx.transaction_id,
        block_hash: tx.block_hash,
        block_time: tx.block_time,
        is_accepted: tx.is_accepted,
        inputs_count: inputs.length,
        outputs_count: outputs.length,
        total_output_kas: totalOut / 1e8,
        inputs: inputs.slice(0, 10).map(i => ({
          address: i.previous_outpoint_address,
          amount_kas: (i.previous_outpoint_amount || 0) / 1e8,
        })),
        outputs: outputs.slice(0, 10).map(o => ({
          address: o.script_public_key_address,
          amount_kas: (o.amount || 0) / 1e8,
        })),
        explorer_url: `https://explorer.kaspa.org/txs/${txId}`,
      });
    }

    if (action === "address" || (!action && q.startsWith("kaspa:"))) {
      // Address lookup
      const addr = q;
      
      // Parallel: balance + tx count + recent txs
      const [balRes, countRes, txRes] = await Promise.all([
        fetch(`${API_BASE}/addresses/${addr}/balance`),
        fetch(`${API_BASE}/addresses/${addr}/transactions-count`),
        fetch(`${API_BASE}/addresses/${addr}/full-transactions-page?limit=5&resolve_previous_outpoints=light`),
      ]);

      const balance = balRes.ok ? await balRes.json() : null;
      const count = countRes.ok ? await countRes.json() : null;
      const txs = txRes.ok ? await txRes.json() : null;

      return Response.json({
        type: "address",
        address: addr,
        balance_kas: balance ? balance.balance / 1e8 : null,
        transaction_count: count?.total || null,
        recent_transactions: (txs || []).slice(0, 5).map(tx => ({
          transaction_id: tx.transaction_id,
          block_time: tx.block_time,
          is_accepted: tx.is_accepted,
          outputs: (tx.outputs || []).slice(0, 5).map(o => ({
            address: o.script_public_key_address,
            amount_kas: (o.amount || 0) / 1e8,
          })),
        })),
        explorer_url: `https://explorer.kaspa.org/addresses/${addr}`,
      });
    }

    if (action === "block") {
      const res = await fetch(`${API_BASE}/blocks/${q}`);
      if (!res.ok) return Response.json({ error: "Block not found" });
      const block = await res.json();
      
      return Response.json({
        type: "block",
        block_hash: block.header?.hash,
        blue_score: block.header?.blueScore,
        timestamp: block.header?.timestamp,
        bits: block.header?.bits,
        transactions_count: block.transactions?.length || 0,
        explorer_url: `https://explorer.kaspa.org/blocks/${q}`,
      });
    }

    if (action === "network") {
      const [priceRes, hashRes, supplyRes, dagRes, halvingRes] = await Promise.all([
        fetch(`${API_BASE}/info/price`),
        fetch(`${API_BASE}/info/hashrate`),
        fetch(`${API_BASE}/info/coinsupply`),
        fetch(`${API_BASE}/info/blockdag`),
        fetch(`${API_BASE}/info/halving`),
      ]);

      const price = priceRes.ok ? await priceRes.json() : null;
      const hash = hashRes.ok ? await hashRes.json() : null;
      const supply = supplyRes.ok ? await supplyRes.json() : null;
      const dag = dagRes.ok ? await dagRes.json() : null;
      const halving = halvingRes.ok ? await halvingRes.json() : null;

      return Response.json({
        type: "network",
        price_usd: price?.price,
        hashrate: hash?.hashrate,
        circulating_supply: supply?.circulatingSupply,
        max_supply: supply?.maxSupply,
        block_count: dag?.blockCount,
        header_count: dag?.headerCount,
        tip_hashes_count: dag?.tipHashes?.length,
        difficulty: dag?.difficulty,
        next_halving_timestamp: halving?.nextHalvingTimestamp,
        next_halving_date: halving?.nextHalvingDate,
      });
    }

    return Response.json({ error: "Provide an action (transaction, address, block, network) and a query string." });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});