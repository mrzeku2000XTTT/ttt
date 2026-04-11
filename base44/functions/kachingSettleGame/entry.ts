import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Judge + Settlement: determines winner, calculates payouts, sends KAS from escrow to winners
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const isAutomation = !!body.automation;
    
    if (!isAutomation) {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Admin only' }, { status: 403 });
      }
    }

    const { game_id, force_result } = body;

    // Get games to settle
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
        await base44.asServiceRole.entities.PredictionGame.update(game.id, {
          status: 'judging',
          bot_status: 'processing',
        });

        // JUDGE: Determine result
        let result = force_result;
        let judgeReason = '';

        if (!result) {
          if (game.category === 'Crypto' && game.source_data) {
            try {
              const r = await judgeCryptoGame(game);
              result = r.result;
              judgeReason = r.reason;
            } catch (e) {
              console.error('Crypto judge failed:', e.message);
              const r = await judgeWithLLM(game, base44);
              result = r.result;
              judgeReason = r.reason;
            }
          } else {
            const r = await judgeWithLLM(game, base44);
            result = r.result;
            judgeReason = r.reason;
          }
        } else {
          judgeReason = 'Manually set by admin';
        }

        console.log(`Game #${game.game_number}: result=${result}, reason=${judgeReason}`);

        // Get all confirmed bets
        const allBets = await base44.asServiceRole.entities.GameBet.filter({
          game_id: game.id,
          status: 'confirmed',
        });

        const winners = allBets.filter(b => b.side === result);
        const losers = allBets.filter(b => b.side !== result);

        const totalPool = allBets.reduce((s, b) => s + b.amount_kas, 0);
        const winnerPool = winners.reduce((s, b) => s + b.amount_kas, 0);
        const loserPool = losers.reduce((s, b) => s + b.amount_kas, 0);

        console.log(`\n========== GAME #${game.game_number} BET LEDGER ==========`);
        console.log(`Question: ${game.question}`);
        console.log(`Result: ${result.toUpperCase()} | Reason: ${judgeReason}`);
        console.log(`Pool: total=${totalPool} KAS, YES=${game.yes_pool_kas}(${game.yes_count}), NO=${game.no_pool_kas}(${game.no_count})`);
        console.log(`--- YES BETS (${allBets.filter(b=>b.side==='yes').length}) ---`);
        allBets.filter(b => b.side === 'yes').forEach((b, i) => {
          console.log(`  [YES #${i+1}] Address: kaspa:${b.user_wallet_address.replace('kaspa:','').slice(0,20)}... | Amount: ${b.amount_kas} KAS | TX_IN: ${b.tx_hash_in || 'none'} | User: ${b.user_email}`);
        });
        console.log(`--- NO BETS (${allBets.filter(b=>b.side==='no').length}) ---`);
        allBets.filter(b => b.side === 'no').forEach((b, i) => {
          console.log(`  [NO  #${i+1}] Address: kaspa:${b.user_wallet_address.replace('kaspa:','').slice(0,20)}... | Amount: ${b.amount_kas} KAS | TX_IN: ${b.tx_hash_in || 'none'} | User: ${b.user_email}`);
        });
        console.log(`--- WINNERS: ${winners.length} | LOSERS: ${losers.length} ---`);

        const txHashes = [];

        if (result === 'push' || allBets.length === 0) {
          // Refund everyone
          for (const bet of allBets) {
            const txHash = await sendPayout(base44, game, bet.user_wallet_address, bet.amount_kas);
            await base44.asServiceRole.entities.GameBet.update(bet.id, {
              status: 'refunded',
              payout_kas: bet.amount_kas,
              tx_hash_out: txHash || '',
            });
            if (txHash) txHashes.push(txHash);
          }
        } else if (winners.length > 0) {
          // Winners split entire pool proportionally (no fee)
          const distributable = totalPool;

          for (const winner of winners) {
            const share = winnerPool > 0 ? (winner.amount_kas / winnerPool) * distributable : 0;
            const payout = parseFloat(share.toFixed(4));

            const txHash = await sendPayout(base44, game, winner.user_wallet_address, payout);

            await base44.asServiceRole.entities.GameBet.update(winner.id, {
              status: 'won',
              payout_kas: payout,
              tx_hash_out: txHash || '',
            });
            if (txHash) txHashes.push(txHash);
            console.log(`Winner ${winner.user_wallet_address.slice(0, 8)}: bet=${winner.amount_kas}, payout=${payout}, tx=${txHash || 'none'}`);
          }

          for (const loser of losers) {
            await base44.asServiceRole.entities.GameBet.update(loser.id, {
              status: 'lost',
              payout_kas: 0,
            });
          }
        } else {
          // No winners — refund all
          for (const bet of allBets) {
            const txHash = await sendPayout(base44, game, bet.user_wallet_address, bet.amount_kas);
            await base44.asServiceRole.entities.GameBet.update(bet.id, {
              status: 'refunded',
              payout_kas: bet.amount_kas,
              tx_hash_out: txHash || '',
            });
            if (txHash) txHashes.push(txHash);
          }
          judgeReason += ' (No winners — all refunded)';
        }

        // Send KRC-20 PACMAN bonus to winners (non-blocking)
        const krc20BonusTxs = [];
        if (winners.length > 0) {
          for (const winner of winners) {
            try {
              const bonusAmount = Math.max(1, Math.round(winner.amount_kas * 10)); // 10 PACMAN per KAS bet
              const krc20Res = await sendKRC20Bonus(base44, winner.user_wallet_address, bonusAmount);
              if (krc20Res) {
                krc20BonusTxs.push({ address: winner.user_wallet_address.slice(0, 16), amount: bonusAmount, commitTx: krc20Res.commitTxId, revealTx: krc20Res.revealTxId });
                console.log(`KRC20 Bonus: ${bonusAmount} PACMAN → ${winner.user_wallet_address.slice(0, 16)}...`);
              }
            } catch (krc20Err) {
              console.warn(`KRC20 bonus failed for ${winner.user_wallet_address.slice(0, 12)}:`, krc20Err.message);
            }
          }
        }

        await base44.asServiceRole.entities.PredictionGame.update(game.id, {
          status: 'settled',
          result,
          judge_reason: judgeReason,
          bot_status: 'ready',
          settlement_tx_hashes: txHashes,
        });

        // Build detailed bet ledger for the response
        const betLedger = allBets.map(b => ({
          side: b.side,
          address: `kaspa:${b.user_wallet_address.replace('kaspa:','')}`,
          amount_kas: b.amount_kas,
          tx_hash_in: b.tx_hash_in || null,
          user_email: b.user_email,
          status: b.status === 'confirmed' ? (b.side === result ? 'won' : (result === 'push' ? 'refunded' : 'lost')) : b.status,
          payout_kas: b.payout_kas || 0,
        }));

        console.log(`--- PAYOUTS ---`);
        betLedger.filter(b => b.payout_kas > 0).forEach(b => {
          console.log(`  💰 ${b.address.slice(0,30)}... → ${b.payout_kas} KAS (${b.status})`);
        });
        console.log(`========== END GAME #${game.game_number} ==========\n`);

        settlements.push({
          game_id: game.id,
          game_number: game.game_number,
          result,
          reason: judgeReason,
          total_pool: totalPool,
          winners: winners.length,
          losers: losers.length,
          tx_hashes: txHashes,
          krc20_bonuses: krc20BonusTxs,
          bet_ledger: betLedger,
        });
      } catch (gameError) {
        console.error(`Settlement failed for game ${game.game_number}:`, gameError.message);
        await base44.asServiceRole.entities.PredictionGame.update(game.id, {
          bot_status: 'error',
          judge_reason: `Settlement error: ${gameError.message}`,
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

// Send payout from game escrow to winner's wallet using direct HTTP call
async function sendPayout(base44, game, recipientAddress, amountKas) {
  if (!game.escrow_mnemonic || !amountKas || amountKas <= 0) {
    console.log(`Skipping payout: no mnemonic or amount=${amountKas}`);
    return null;
  }

  const toAddr = recipientAddress.startsWith('kaspa:') ? recipientAddress : `kaspa:${recipientAddress}`;
  const fromAddr = game.escrow_address.startsWith('kaspa:') ? game.escrow_address : `kaspa:${game.escrow_address}`;

  // Deduct TX fee from payout so escrow can actually send
  const TX_FEE = 0.0002; // 0.0002 KAS covers the Kaspa minimum fee
  const actualSend = parseFloat((amountKas - TX_FEE).toFixed(4));
  if (actualSend <= 0) {
    console.log(`Payout amount ${amountKas} too small after fee deduction`);
    return null;
  }

  try {
    // Call sendKaspaTransaction directly via the SDK service role
    const res = await base44.asServiceRole.functions.invoke('sendKaspaTransaction', {
      mnemonic: game.escrow_mnemonic,
      fromAddress: fromAddr,
      toAddress: toAddr,
      amountKas: actualSend,
    });

    if (res?.error) {
      console.error(`Payout failed to ${recipientAddress.slice(0, 12)}: ${res.error}`);
      return null;
    }

    const txId = res?.txId || res?.data?.txId || '';
    console.log(`Payout ${actualSend} KAS (original ${amountKas}, fee ${TX_FEE}) to ${recipientAddress.slice(0, 12)} | TX: ${txId}`);
    return txId;
  } catch (err) {
    console.error(`Payout exception to ${recipientAddress.slice(0, 12)}:`, err.message);
    return null;
  }
}

// Judge crypto games by fetching current price from CoinGecko
async function judgeCryptoGame(game) {
  const sourceMatch = game.source_data?.match(/CoinGecko (\w+) price/);
  const coinId = sourceMatch?.[1];
  if (!coinId) throw new Error('Could not extract coin ID from source_data');

  const priceMatch = game.question.match(/\$([0-9,.]+)/);
  if (!priceMatch) throw new Error('Could not extract target price from question');
  const targetPrice = parseFloat(priceMatch[1].replace(/,/g, ''));

  const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
  const data = await res.json();
  const currentPrice = data[coinId]?.usd;
  if (!currentPrice) throw new Error(`No price data for ${coinId}`);

  const isAbove = currentPrice > targetPrice;

  return {
    result: isAbove ? 'yes' : 'no',
    reason: `${coinId.toUpperCase()} at settlement: $${currentPrice.toLocaleString()} vs target $${targetPrice.toLocaleString()} → ${isAbove ? 'ABOVE' : 'AT OR BELOW'}`,
  };
}

// Send KRC-20 PACMAN bonus reward to a winner
async function sendKRC20Bonus(base44, recipientAddress, amountPacman) {
  try {
    const toAddr = recipientAddress.startsWith('kaspa:') ? recipientAddress : `kaspa:${recipientAddress}`;
    const res = await base44.asServiceRole.functions.invoke('sendPacmanKRC20Reward', {
      recipient_address: toAddr,
      amount_pacman: amountPacman,
      ticker: 'PACMAN',
      decimals: 8,
    });
    const data = res?.data || res;
    if (data?.error) {
      console.warn(`KRC20 bonus error: ${data.error}`);
      return null;
    }
    return data;
  } catch (err) {
    console.warn(`KRC20 bonus exception: ${err.message}`);
    return null;
  }
}

// Fallback LLM judge
async function judgeWithLLM(game, base44) {
  try {
    const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a prediction market judge. Determine the result:
Question: "${game.question}"
Category: ${game.category} / ${game.subcategory}
Source: ${game.source_data}
Started: ${game.start_time}
Ended: ${game.end_time}

Based on real-world data, what is the result?
Respond: {"result": "yes" or "no" or "push", "reason": "brief explanation"}`,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          result: { type: 'string', enum: ['yes', 'no', 'push'] },
          reason: { type: 'string' },
        },
        required: ['result', 'reason'],
      },
    });
    return { result: r.result, reason: r.reason };
  } catch (e) {
    console.error('Judge LLM failed:', e.message);
    return { result: 'push', reason: 'Judge error — refunding all bets' };
  }
}