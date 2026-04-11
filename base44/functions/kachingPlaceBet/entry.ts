import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// User places a bet — immediately confirmed & pool updated
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { game_id, side, amount_kas, user_wallet_address } = await req.json();

    if (!game_id || !side || !amount_kas || !user_wallet_address) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const amt = parseFloat(amount_kas);
    if (isNaN(amt) || amt <= 0) {
      return Response.json({ error: 'Invalid amount' }, { status: 400 });
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

    // Clean wallet address (remove kaspa: prefix if present)
    const cleanWallet = user_wallet_address.startsWith('kaspa:') 
      ? user_wallet_address.slice(6) 
      : user_wallet_address;

    // Create bet record — immediately confirmed
    const bet = await base44.asServiceRole.entities.GameBet.create({
      game_id: game.id,
      game_number: game.game_number,
      user_email: user.email,
      user_wallet_address: cleanWallet,
      side,
      amount_kas: amt,
      status: 'confirmed',
      verified: true
    });

    // Update game pool counters immediately
    const updateData = {
      total_pool_kas: (game.total_pool_kas || 0) + amt,
    };
    if (side === 'yes') {
      updateData.yes_pool_kas = (game.yes_pool_kas || 0) + amt;
      updateData.yes_count = (game.yes_count || 0) + 1;
    } else {
      updateData.no_pool_kas = (game.no_pool_kas || 0) + amt;
      updateData.no_count = (game.no_count || 0) + 1;
    }

    await base44.asServiceRole.entities.PredictionGame.update(game.id, updateData);

    console.log(`Bet placed: ${user.email} bet ${amt} KAS on ${side} for game #${game.game_number}`);

    return Response.json({
      success: true,
      bet_id: bet.id,
      escrow_address: game.escrow_address,
      amount_kas: amt,
      side,
      game_number: game.game_number,
      updated_pool: {
        total: updateData.total_pool_kas,
        yes: updateData.yes_pool_kas || game.yes_pool_kas || 0,
        no: updateData.no_pool_kas || game.no_pool_kas || 0
      }
    });
  } catch (error) {
    console.error('kachingPlaceBet error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});