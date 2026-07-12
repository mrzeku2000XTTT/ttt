import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { wallet_address } = body;
    if (!wallet_address) {
      return Response.json({ error: 'wallet_address required' }, { status: 400 });
    }
    const addr = wallet_address.startsWith('kaspa:') ? wallet_address : `kaspa:${wallet_address}`;

    // Works WITHOUT login — identity is the wallet address only
    let isAdmin = false;
    try {
      const u = await base44.auth.me();
      isAdmin = u?.role === 'admin';
    } catch { /* not logged in — fine */ }

    const rows = await base44.asServiceRole.entities.AdventProgress.filter({ wallet_address: addr });
    const progress = rows[0] || null;
    const today = new Date().toISOString().slice(0, 10);

    const activeTasks = await base44.asServiceRole.entities.AdventSponsorTask.filter({ status: 'active' });

    return Response.json({
      keys: progress?.keys || 0,
      doors: progress?.doors || {},
      opened_today: progress?.last_opened_date === today,
      active_sponsor_tasks: activeTasks.length,
      is_admin: isAdmin,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});