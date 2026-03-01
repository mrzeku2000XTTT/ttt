import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { card_id, tusd_amount } = await req.json();

    if (!card_id || tusd_amount === undefined || tusd_amount <= 0) {
      return Response.json({ error: 'Invalid card_id or tusd_amount' }, { status: 400 });
    }

    // Get card
    const card = await base44.entities.DebitCard.get(card_id);

    if (!card || card.user_id !== user.email) {
      return Response.json({ error: 'Card not found or unauthorized' }, { status: 404 });
    }

    if (card.tusd_balance < tusd_amount) {
      return Response.json({ error: 'Insufficient TUSD balance' }, { status: 400 });
    }

    // 1:1 swap: TUSD -> KAS
    const kas_amount = tusd_amount;

    // Update card balance
    const updatedCard = await base44.entities.DebitCard.update(card_id, {
      tusd_balance: card.tusd_balance - tusd_amount,
      kas_balance_locked: card.kas_balance_locked - kas_amount
    });

    // Log transaction
    await base44.entities.TUSDTransaction.create({
      user_id: user.email,
      card_id: card_id,
      type: 'tusd_to_kas',
      tusd_amount: tusd_amount,
      kas_amount_locked: kas_amount,
      status: 'completed',
      description: `Swapped ${tusd_amount} TUSD back to ${kas_amount} KAS`,
      timestamp: new Date().toISOString()
    });

    return Response.json({
      success: true,
      tusd_balance: updatedCard.tusd_balance,
      kas_balance_locked: updatedCard.kas_balance_locked,
      kas_released: kas_amount
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});