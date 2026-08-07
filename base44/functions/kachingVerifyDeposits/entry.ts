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

    // Validate game_id format if provided (prevent injection)
    if (game_id && typeof game_id !== 'string') {
      return Response.json({ error: 'Invalid game_id' }, { status: 400 });
    }

    // Get open games
    let games;
    if (game_id) {
      games = await base44.asServiceRole.entities.PredictionGame.filter({ id: game_id });
    } else {
      games = await base44.asServiceRole.entities.PredictionGame.filter({ status: 'open' });
    }

    const results = [];
    const MIN_CONFIRMATIONS = 1; // Require at least 1 block confirmation

    for (const game of games) {
      // Validate escrow address format
      if (!game.escrow_address || !/^kaspa:[a-z0-9]{60,68}$/.test(game.escrow_address)) {
        results.push({ game_id: game.id, error: 'Invalid escrow address' });
        continue;
      }

      // Get escrow balance
      const balRes = await fetch(`${KASPA_API}/addresses/kaspa:${game.escrow_address}/balance`);
      const balData = await balRes.json();
      const escrowBalance = (balData?.balance || 0) / 1e8;

      // Get pending bets for this game
      const pendingBets = await base44.asServiceRole.entities.GameBet.filter({
        game_id: game.id,
        status: 'pending_deposit'
      });

      // Get confirmed UTXOs (deposits) — only those with sufficient confirmations
      let confirmedUtxos = [];
      try {
        const utxoRes = await fetch(`${KASPA_API}/addresses/kaspa:${game.escrow_address}/utxos`);
        const utxoData = await utxoRes.json();
        confirmedUtxos = (Array.isArray(utxoData) ? utxoData : []).filter(u => 
          (u.confirmations || 0) >= MIN_CONFIRMATIONS
        );
      } catch {}

      let confirmedCount = 0;
      let yesPool = game.yes_pool_kas || 0;
      let noPool = game.no_pool_kas || 0;
      let totalPool = game.total_pool_kas || 0;
      let yesCount = game.yes_count || 0;
      let noCount = game.no_count || 0;

      // Match individual UTXOs to bets by exact amount.
      // This prevents confirming bets that weren't actually deposited.
      // Each UTXO can only confirm one bet (consumed on match).
      const usedUtxoIds = new Set();
      
      for (const bet of pendingBets) {
        const betAmountSatoshis = Math.round(bet.amount_kas * 1e8);
        
        // Find a confirmed UTXO that matches this bet's amount exactly
        const matchingUtxo = confirmedUtxos.find(u => {
          if (usedUtxoIds.has(u.outpoint || u.id)) return false;
          // Match within 0.1% tolerance for dust/fee rounding
          const utxoAmount = u.amount || (u.value || 0);
          return Math.abs(utxoAmount - betAmountSatoshis) <= betAmountSatoshis * 0.001;
        });

        if (matchingUtxo) {
          usedUtxoIds.add(matchingUtxo.outpoint || matchingUtxo.id);
          
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