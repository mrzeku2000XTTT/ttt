// CORS proxy for kascov.io live covenant data (browser can't fetch it directly)
Deno.serve(async (req) => {
  try {
    const { network } = await req.json().catch(() => ({}));
    const net = network === "mainnet" ? "mainnet" : "testnet-10";
    const res = await fetch(`https://kascov.io/data/${net}-live.json`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return Response.json({ error: `Kascov returned ${res.status}` }, { status: 502 });
    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});