import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const KASPA_API = 'https://api.kaspa.org';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get the active chest wallet (service role — seed phrase stays hidden)
    const wallets = await base44.asServiceRole.entities.ChestWallet.filter({ is_active: true });
    if (wallets.length === 0) {
      return Response.json({
        success: false,
        initialized: false,
        address: null,
        balance: 0,
      });
    }

    const address = wallets[0].kaspa_address;

    // Fetch balance from Kaspa API
    let balance = 0;
    try {
      const res = await fetch(`${KASPA_API}/addresses/${address}/balance`, {
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        const data = await res.json();
        balance = data.balance ? parseInt(data.balance) / 1e8 : 0;
      }
    } catch (e) {
      console.error('[getChestInfo] Balance fetch failed:', e.message);
    }

    return Response.json({
      success: true,
      initialized: true,
      address,
      balance,
    });
  } catch (error) {
    console.error('[getChestInfo] Error:', error.message);
    return Response.json({ error: error.message, initialized: false, address: null, balance: 0 }, { status: 500 });
  }
});