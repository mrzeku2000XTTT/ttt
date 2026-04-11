import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { bet_id, updates } = await req.json();
    if (!bet_id || !updates) {
      return Response.json({ error: 'bet_id and updates required' }, { status: 400 });
    }

    await base44.asServiceRole.entities.GameBet.update(bet_id, updates);
    return Response.json({ success: true, bet_id, updates });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});