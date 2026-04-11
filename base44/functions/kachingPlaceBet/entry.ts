import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// User places a bet — records intent and monitors for incoming deposit
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { game_id, side, amount_kas, user_wallet_address, pin_hash } = await req.json();

    if (!game_id || !side || !amount_kas || !user_wallet_address) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Verify PIN matches user's stored hash
    if (pin_hash) {
      const userRecord = await base44.auth.me();
      if (userRecord?.pin_hash && userRecord.pin_hash !== pin_hash) {
        return Response.json({ error: 'Invalid PIN' }, { status: 403 });
      }
    }

    // Get game
    const games = await base44.asServiceRole.entities.PredictionGame.filter({ id: game_id });
    const game = games[0];
    if (!game) return Response.json({ error: 'Game not found' }, { status: 404 });
    if (game.status !== 'open') return Response.json({ error: 'Game not open for bets' }, { status: 400 });

    // Check if game expired
    if (new Date(game.end_time) <= new Date()) {
      return Response.json({ error: 'Game has ended' }, { status: 400 });
    }

    // Create bet record
    const bet = await base44.entities.GameBet.create({
      game_id: game.id,
      game_number: game.game_number,
      user_email: user.email,
      user_wallet_address,
      side,
      amount_kas: parseFloat(amount_kas),
      status: 'pending_deposit',
      verified: !!pin_hash
    });

    // Return escrow address for user to send funds
    return Response.json({
      success: true,
      bet_id: bet.id,
      escrow_address: game.escrow_address,
      amount_kas: parseFloat(amount_kas),
      game_number: game.game_number,
      message: `Send ${amount_kas} KAS to kaspa:${game.escrow_address} to confirm your ${side.toUpperCase()} bet`
    });
  } catch (error) {
    console.error('kachingPlaceBet error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});