import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const KASPA_API = 'https://api.kaspa.org';

// Bot checks escrow wallet for incoming deposits and confirms bets
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { game_id } = await req.json().catch(() => ({}));

    // Get open games
    let games;
    if (game_id) {
      games = await base44.asServiceRole.entities.PredictionGame.filter({ id: game_id });
    } else {
      games = await base44.asServiceRole.entities.PredictionGame.filter({ status: 'open' });
    }

    const results = [];

    for (const game of games) {
      // Get escrow balance
      const balRes = await fetch(`${KASPA_API}/addresses/kaspa:${game.escrow_address}/balance`);
      const balData = await balRes.json();
      const escrowBalance = (balData?.balance || 0) / 1e8;

      // Get pending bets for this game
      const pendingBets = await base44.asServiceRole.entities.GameBet.filter({
        game_id: game.id,
        status: 'pending_deposit'
      });

      // Check UTXOs for matching deposits
      let utxos = [];
      try {
        const utxoRes = await fetch(`${KASPA_API}/addresses/kaspa:${game.escrow_address}/utxos`);
        utxos = await utxoRes.json();
      } catch {}

      let confirmedCount = 0;
      let yesPool = game.yes_pool_kas || 0;
      let noPool = game.no_pool_kas || 0;
      let totalPool = game.total_pool_kas || 0;
      let yesCount = game.yes_count || 0;
      let noCount = game.no_count || 0;

      // Simple: if escrow has enough balance, confirm bets in order
      const totalPending = pendingBets.reduce((s, b) => s + b.amount_kas, 0);
      
      if (escrowBalance > 0 && pendingBets.length > 0) {
        let availableBalance = escrowBalance - totalPool; // Only new deposits
        
        for (const bet of pendingBets) {
          if (availableBalance >= bet.amount_kas * 0.95) { // 5% tolerance for fees
            await base44.asServiceRole.entities.GameBet.update(bet.id, {
              status: 'confirmed',
              verified: true
            });
            
            if (bet.side === 'yes') {
              yesPool += bet.amount_kas;
              yesCount++;
            } else {
              noPool += bet.amount_kas;
              noCount++;
            }
            totalPool += bet.amount_kas;
            availableBalance -= bet.amount_kas;
            confirmedCount++;
          }
        }

        // Update game pools
        if (confirmedCount > 0) {
          await base44.asServiceRole.entities.PredictionGame.update(game.id, {
            yes_pool_kas: yesPool,
            no_pool_kas: noPool,
            total_pool_kas: totalPool,
            yes_count: yesCount,
            no_count: noCount,
            bot_status: 'ready'
          });
        }
      }

      results.push({
        game_id: game.id,
        game_number: game.game_number,
        escrow_balance: escrowBalance,
        confirmed: confirmedCount,
        pending: pendingBets.length - confirmedCount,
        total_pool: totalPool
      });
    }

    return Response.json({ success: true, results });
  } catch (error) {
    console.error('kachingVerifyDeposits error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});