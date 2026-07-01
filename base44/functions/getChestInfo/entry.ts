import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const KASPA_API = 'https://api.kaspa.org';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const wallets = await base44.asServiceRole.entities.ChestWallet.filter({ is_active: true });
    if (wallets.length === 0) {
      return Response.json({ initialized: false });
    }
    const address = wallets[0].kaspa_address;
    let balance = 0;
    try {
      const balRes = await fetch(`${KASPA_API}/addresses/${address}/balance`, { signal: AbortSignal.timeout(10000) });
      if (balRes.ok) {
        const balData = await balRes.json();
        balance = Number(balData.balance || 0) / 1e8;
      }
    } catch {}
    return Response.json({ initialized: true, address, balance });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});