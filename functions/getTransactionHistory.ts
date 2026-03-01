import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { card_id, limit = 50 } = await req.json();

    if (!card_id) {
      return Response.json({ error: 'Missing card_id' }, { status: 400 });
    }

    // Verify card ownership
    const card = await base44.entities.DebitCard.get(card_id);

    if (!card || card.user_id !== user.email) {
      return Response.json({ error: 'Card not found or unauthorized' }, { status: 404 });
    }

    // Get transactions
    const transactions = await base44.entities.TUSDTransaction.filter({
      card_id: card_id,
      user_id: user.email
    }, '-timestamp', limit);

    return Response.json({
      success: true,
      transactions: transactions
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});