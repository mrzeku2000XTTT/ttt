import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Judge + Settlement: determines winner, calculates payouts
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { game_id, force_result } = await req.json().catch(() => ({}));

    // Get games to settle (either specific or all expired open games)
    let games;
    if (game_id) {
      games = await base44.asServiceRole.entities.PredictionGame.filter({ id: game_id });
    } else {
      const allOpen = await base44.asServiceRole.entities.PredictionGame.filter({ status: 'open' });
      const allLocked = await base44.asServiceRole.entities.PredictionGame.filter({ status: 'locked' });
      games = [...allOpen, ...allLocked].filter(g => new Date(g.end_time) <= new Date());
    }

    console.log(`Settling ${games.length} expired games`);
    const settlements = [];

    for (const game of games) {
      try {
        // Mark as judging
        await base44.asServiceRole.entities.PredictionGame.update(game.id, {
          status: 'judging',
          bot_status: 'processing'
        });

        // JUDGE: Determine result
        let result = force_result;
        let judgeReason = '';

        if (!result) {
          // For crypto games, fetch current price from CoinGecko and compare
          if (game.category === 'Crypto' && game.source_data) {
            try {
              result = await judgeCryptoGame(game, base44);
              judgeReason = result.reason;
              result = result.result;
            } catch (e) {
              console.error('Crypto judge failed:', e.message);
              // Fallback to LLM
              const llmResult = await judgWithLLM(game, base44);
              result = llmResult.result;
              judgeReason = llmResult.reason;
            }
          } else {
            const llmResult = await judgWithLLM(game, base44);
            result = llmResult.result;
            judgeReason = llmResult.reason;
          }
        } else {
          judgeReason = 'Manually set by admin';
        }

        console.log(`Game #${game.game_number}: result=${result}, reason=${judgeReason}`);

        // Get all confirmed bets
        const allBets = await base44.asServiceRole.entities.GameBet.filter({
          game_id: game.id,
          status: 'confirmed'
        });

        const winners = allBets.filter(b => b.side === result);
        const losers = allBets.filter(b => b.side !== result);

        // Calculate payouts
        const totalPool = allBets.reduce((s, b) => s + b.amount_kas, 0);
        const winnerPool = winners.reduce((s, b) => s + b.amount_kas, 0);
        const loserPool = losers.reduce((s, b) => s + b.amount_kas, 0);

        console.log(`Pool: total=${totalPool}, winners=${winnerPool} (${winners.length}), losers=${loserPool} (${losers.length})`);

        if (result === 'push' || allBets.length === 0) {
          // Refund everyone
          for (const bet of allBets) {
            await base44.asServiceRole.entities.GameBet.update(bet.id, {
              status: 'refunded',
              payout_kas: bet.amount_kas
            });
          }
        } else if (winners.length > 0) {
          // Winners split the ENTIRE pool proportionally to their bet size
          // payout = (my_bet / total_winner_bets) * total_pool * (1 - fee)
          const feeFraction = 0.02; // 2% platform fee
          const distributable = totalPool * (1 - feeFraction);

          for (const winner of winners) {
            const share = winnerPool > 0 ? (winner.amount_kas / winnerPool) * distributable : 0;
            const profit = share - winner.amount_kas;

            await base44.asServiceRole.entities.GameBet.update(winner.id, {
              status: 'won',
              payout_kas: parseFloat(share.toFixed(4))
            });
            console.log(`Winner ${winner.user_wallet_address.slice(0,8)}: bet=${winner.amount_kas}, payout=${share.toFixed(4)}, profit=${profit.toFixed(4)}`);
          }

          // Mark losers
          for (const loser of losers) {
            await base44.asServiceRole.entities.GameBet.update(loser.id, {
              status: 'lost',
              payout_kas: 0
            });
          }
        } else {
          // No winners — refund all
          for (const bet of allBets) {
            await base44.asServiceRole.entities.GameBet.update(bet.id, {
              status: 'refunded',
              payout_kas: bet.amount_kas
            });
          }
          judgeReason += ' (No winners — all refunded)';
        }

        // Update game as settled
        await base44.asServiceRole.entities.PredictionGame.update(game.id, {
          status: 'settled',
          result,
          judge_reason: judgeReason,
          bot_status: 'ready'
        });

        settlements.push({
          game_id: game.id,
          game_number: game.game_number,
          result,
          reason: judgeReason,
          total_pool: totalPool,
          winners: winners.length,
          losers: losers.length,
          winner_pool: winnerPool,
          loser_pool: loserPool
        });

      } catch (gameError) {
        console.error(`Settlement failed for game ${game.game_number}:`, gameError.message);
        await base44.asServiceRole.entities.PredictionGame.update(game.id, {
          bot_status: 'error',
          judge_reason: `Settlement error: ${gameError.message}`
        });
        settlements.push({ game_id: game.id, error: gameError.message });
      }
    }

    return Response.json({ success: true, settlements });
  } catch (error) {
    console.error('kachingSettleGame error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Judge crypto games by fetching current price from CoinGecko
async function judgeCryptoGame(game, base44) {
  // Extract coin id from source_data like "CoinGecko bitcoin price at $85,000 | 24h: 2.5%"
  const sourceMatch = game.source_data?.match(/CoinGecko (\w+) price/);
  const coinId = sourceMatch?.[1];
  
  if (!coinId) throw new Error('Could not extract coin ID from source_data');

  // Extract target price from question like "Will BTC be above $85,000 in 15 min?"
  const priceMatch = game.question.match(/\$([0-9,.]+)/);
  if (!priceMatch) throw new Error('Could not extract target price from question');
  const targetPrice = parseFloat(priceMatch[1].replace(/,/g, ''));

  // Fetch current price
  const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
  const data = await res.json();
  const currentPrice = data[coinId]?.usd;

  if (!currentPrice) throw new Error(`No price data for ${coinId}`);

  const isAbove = currentPrice > targetPrice;
  
  return {
    result: isAbove ? 'yes' : 'no',
    reason: `${coinId.toUpperCase()} price at settlement: $${currentPrice.toLocaleString()} vs target $${targetPrice.toLocaleString()} → ${isAbove ? 'ABOVE' : 'AT OR BELOW'}`
  };
}

// Fallback LLM judge
async function judgWithLLM(game, base44) {
  try {
    const judgeRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a prediction market judge. Determine the result of this prediction:
      
Question: "${game.question}"
Category: ${game.category} / ${game.subcategory}
Source: ${game.source_data}
Game started: ${game.start_time}
Game ended: ${game.end_time}

Based on real-world data available now, what is the result?
Respond with: {"result": "yes" or "no" or "push", "reason": "brief explanation"}`,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: "object",
        properties: {
          result: { type: "string", enum: ["yes", "no", "push"] },
          reason: { type: "string" }
        },
        required: ["result", "reason"]
      }
    });
    return { result: judgeRes.result, reason: judgeRes.reason };
  } catch (e) {
    console.error('Judge LLM failed:', e.message);
    return { result: 'push', reason: 'Judge error — refunding all bets' };
  }
}