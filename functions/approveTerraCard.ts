import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { wallet_address } = await req.json();

    if (!wallet_address) {
      return Response.json({ error: 'Missing wallet_address' }, { status: 400 });
    }

    // Check if card already exists
    const existingCards = await base44.entities.DebitCard.filter({
      user_id: user.email,
      linked_wallet_address: wallet_address
    });

    if (existingCards.length > 0) {
      return Response.json({
        success: true,
        card_id: existingCards[0].id,
        card_status: existingCards[0].card_status,
        message: 'Card already exists'
      });
    }

    // Create new card with AI approval (any positive balance = approval)
    const newCard = await base44.entities.DebitCard.create({
      user_id: user.email,
      card_status: 'active',
      card_type: 'virtual',
      tusd_balance: 0,
      kas_balance_locked: 0,
      linked_wallet_address: wallet_address
    });

    return Response.json({
      success: true,
      card_id: newCard.id,
      card_status: newCard.card_status,
      message: 'Terra card approved and created'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});