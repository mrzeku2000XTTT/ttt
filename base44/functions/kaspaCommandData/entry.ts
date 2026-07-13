Deno.serve(async (req) => {
  try {
    const [aggsRes, priceRes, hashRes, blockdagRes] = await Promise.all([
      fetch("https://nodes.kaspa.ws/data/aggs.json"),
      fetch("https://api.kaspa.org/info/price"),
      fetch("https://api.kaspa.org/info/hashrate?stringOnly=false"),
      fetch("https://api.kaspa.org/info/blockdag"),
    ]);

    const aggs = aggsRes.ok ? await aggsRes.json() : null;
    const price = priceRes.ok ? await priceRes.json() : null;
    const hashrate = hashRes.ok ? await hashRes.json() : null;
    const blockdag = blockdagRes.ok ? await blockdagRes.json() : null;

    return Response.json({ aggs, price, hashrate, blockdag, fetched_at: new Date().toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});