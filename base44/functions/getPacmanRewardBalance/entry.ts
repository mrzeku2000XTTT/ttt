import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Use service role to read admin-only entity (only need the public address)
    const wallets = await base44.asServiceRole.entities.PacmanRewardWallet.filter({ is_active: true });
    if (wallets.length === 0) {
      return Response.json({ exists: false, address: null, pacman_balance: 0, kas_balance: 0 });
    }

    const wallet = wallets[0];
    const address = wallet.kaspa_address;
    const cleanAddr = address.startsWith('kaspa:') ? address : `kaspa:${address}`;

    // Fetch KAS balance
    let kasBalance = 0;
    try {
      const balRes = await fetch(`https://api.kaspa.org/addresses/${cleanAddr}/balance`);
      if (balRes.ok) {
        const balData = await balRes.json();
        kasBalance = (balData.balance || 0) / 1e8;
      }
    } catch {}

    // Fetch PACMAN KRC-20 balance from Kasplex
    let pacmanBalance = 0;
    try {
      const krc20Res = await fetch(`https://api.kasplex.org/v1/krc20/address/${cleanAddr}/token/PACMAN`);
      if (krc20Res.ok) {
        const krc20Data = await krc20Res.json();
        const result = krc20Data?.result?.[0];
        if (result?.balance) {
          pacmanBalance = parseInt(result.balance) / (10 ** (parseInt(result.dec) || 8));
        }
      }
    } catch {}

    return Response.json({
      exists: true,
      address: cleanAddr,
      pacman_balance: pacmanBalance,
      kas_balance: kasBalance,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});