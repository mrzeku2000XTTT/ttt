import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Judge + Settlement: determines winner, calculates payouts, sends KAS + PACMAN simultaneously
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

        console.log(`\n========== GAME #${game.game_number} BET LEDGER ==========`);
        console.log(`Question: ${game.question}`);
        console.log(`Result: ${result.toUpperCase()} | Reason: ${judgeReason}`);
        console.log(`Pool: total=${totalPool} KAS, YES=${game.yes_pool_kas}(${game.yes_count}), NO=${game.no_pool_kas}(${game.no_count})`);
        allBets.forEach((b, i) => {
          console.log(`  [${b.side.toUpperCase()} #${i+1}] Address: kaspa:${b.user_wallet_address.replace('kaspa:','').slice(0,20)}... | Amount: ${b.amount_kas} KAS | TX_IN: ${b.tx_hash_in || 'none'} | User: ${b.user_email}`);
        });
        console.log(`--- WINNERS: ${winners.length} | LOSERS: ${losers.length} ---`);

        const txHashes = [];
        const settledAt = new Date().toISOString();

        if (result === 'push' || allBets.length === 0) {
          // Refund everyone
          for (const bet of allBets) {
            const toAddr = normalizeAddress(bet.user_wallet_address);
            console.log(`REFUND → ${toAddr} | ${bet.amount_kas} KAS`);
            const txHash = await sendPayout(base44, game, toAddr, bet.amount_kas);
            
            const receipt = {
              result: 'push',
              question: game.question,
              total_pool_kas: totalPool,
              your_bet_kas: bet.amount_kas,
              your_side: bet.side,
              payout_kas: bet.amount_kas,
              kas_tx_hash: txHash || '',
              pacman_bonus: 0,
              pacman_tx_commit: '',
              pacman_tx_reveal: '',
              settled_at: settledAt,
              judge_reason: judgeReason,
              notes: `Game #${game.game_number} ended in a PUSH. Your ${bet.amount_kas} KAS bet was refunded in full.`
            };

            await base44.asServiceRole.entities.GameBet.update(bet.id, {
              status: 'refunded',
              payout_kas: bet.amount_kas,
              tx_hash_out: txHash || '',
              receipt,
            });
            if (txHash) txHashes.push(txHash);
          }
        } else if (winners.length > 0) {
          // Winners split entire pool proportionally (no fee)
          const distributable = totalPool;

          for (const winner of winners) {
            const share = winnerPool > 0 ? (winner.amount_kas / winnerPool) * distributable : 0;
            const payout = parseFloat(share.toFixed(4));
            const toAddr = normalizeAddress(winner.user_wallet_address);
            const pacmanBonus = Math.max(1, Math.round(winner.amount_kas * 10)); // 10 PACMAN per KAS bet

            console.log(`WINNER → ${toAddr} | KAS payout: ${payout} | PACMAN bonus: ${pacmanBonus}`);

            // Send KAS payout + KRC-20 PACMAN bonus SIMULTANEOUSLY
            const [txHash, krc20Result] = await Promise.all([
              sendPayout(base44, game, toAddr, payout),
              sendKRC20Bonus(base44, toAddr, pacmanBonus),
            ]);

            const receipt = {
              result: result.toUpperCase(),
              question: game.question,
              total_pool_kas: totalPool,
              your_bet_kas: winner.amount_kas,
              your_side: winner.side,
              payout_kas: payout,
              kas_tx_hash: txHash || '',
              pacman_bonus: pacmanBonus,
              pacman_tx_commit: krc20Result?.commitTxId || '',
              pacman_tx_reveal: krc20Result?.revealTxId || '',
              settled_at: settledAt,
              judge_reason: judgeReason,
              notes: `🎉 You WON Game #${game.game_number}! You bet ${winner.amount_kas} KAS on ${winner.side.toUpperCase()} and won ${payout} KAS (${totalPool} KAS pool). Bonus: ${pacmanBonus} PACMAN tokens.`
            };

            await base44.asServiceRole.entities.GameBet.update(winner.id, {
              status: 'won',
              payout_kas: payout,
              tx_hash_out: txHash || '',
              receipt,
            });
            if (txHash) txHashes.push(txHash);

            console.log(`✅ Winner ${toAddr.slice(0, 20)}: bet=${winner.amount_kas}, payout=${payout}, kasTx=${txHash || 'none'}, pacman=${pacmanBonus}, krc20Tx=${krc20Result?.commitTxId || 'none'}`);
          }

          for (const loser of losers) {
            const receipt = {
              result: result.toUpperCase(),
              question: game.question,
              total_pool_kas: totalPool,
              your_bet_kas: loser.amount_kas,
              your_side: loser.side,
              payout_kas: 0,
              kas_tx_hash: '',
              pacman_bonus: 0,
              pacman_tx_commit: '',
              pacman_tx_reveal: '',
              settled_at: settledAt,
              judge_reason: judgeReason,
              notes: `Game #${game.game_number}: You bet ${loser.amount_kas} KAS on ${loser.side.toUpperCase()}. Result was ${result.toUpperCase()}. Better luck next time!`
            };

            await base44.asServiceRole.entities.GameBet.update(loser.id, {
              status: 'lost',
              payout_kas: 0,
              receipt,
            });
          }
        } else {
          // No winners — refund all
          for (const bet of allBets) {
            const toAddr = normalizeAddress(bet.user_wallet_address);
            console.log(`REFUND (no winners) → ${toAddr} | ${bet.amount_kas} KAS`);
            const txHash = await sendPayout(base44, game, toAddr, bet.amount_kas);
            
            const receipt = {
              result: 'NO WINNERS',
              question: game.question,
              total_pool_kas: totalPool,
              your_bet_kas: bet.amount_kas,
              your_side: bet.side,
              payout_kas: bet.amount_kas,
              kas_tx_hash: txHash || '',
              pacman_bonus: 0,
              pacman_tx_commit: '',
              pacman_tx_reveal: '',
              settled_at: settledAt,
              judge_reason: judgeReason,
              notes: `Game #${game.game_number} had no winners. Your ${bet.amount_kas} KAS bet was refunded.`
            };

            await base44.asServiceRole.entities.GameBet.update(bet.id, {
              status: 'refunded',
              payout_kas: bet.amount_kas,
              tx_hash_out: txHash || '',
              receipt,
            });
            if (txHash) txHashes.push(txHash);
          }
          judgeReason += ' (No winners — all refunded)';
        }

        await base44.asServiceRole.entities.PredictionGame.update(game.id, {
          status: 'settled',
          result,
          judge_reason: judgeReason,
          bot_status: 'ready',
          settlement_tx_hashes: txHashes,
        });

        // Update bot stats for any bot bets
        try {
          const botBets = allBets.filter(b => b.user_email?.endsWith('@kaching.bot'));
          for (const bb of botBets) {
            const botName = bb.user_email.replace('bot_', '').replace('@kaching.bot', '').replace(/_/g, ' ');
            const botEntities = await base44.asServiceRole.entities.KaChingBot.filter({});
            const bot = botEntities.find(b => b.bot_name.toLowerCase().replace(/\s/g, ' ') === botName);
            if (bot) {
              const isWinner = bb.side === result;
              const profit = isWinner ? (bb.payout_kas || 0) - bb.amount_kas : -bb.amount_kas;
              await base44.asServiceRole.entities.KaChingBot.update(bot.id, {
                total_wins: (bot.total_wins || 0) + (isWinner ? 1 : 0),
                total_profit_kas: (bot.total_profit_kas || 0) + profit,
              });
            }
          }
        } catch (botErr) {
          console.warn('Bot stats update failed:', botErr.message);
        }

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

// Normalize address to always have kaspa: prefix
function normalizeAddress(addr) {
  if (!addr) return '';
  return addr.startsWith('kaspa:') ? addr : `kaspa:${addr}`;
}

// Send payout from game escrow to winner's wallet
async function sendPayout(base44, game, recipientAddress, amountKas) {
  if (!game.escrow_mnemonic || !amountKas || amountKas <= 0) {
    console.log(`Skipping payout: no mnemonic or amount=${amountKas}`);
    return null;
  }

  const toAddr = normalizeAddress(recipientAddress);
  const fromAddr = normalizeAddress(game.escrow_address);

  // Validate recipient address looks real
  const rawAddr = toAddr.replace('kaspa:', '');
  if (rawAddr.length < 60) {
    console.error(`INVALID recipient address (too short): ${toAddr}`);
    return null;
  }

  // Check escrow balance on-chain
  let escrowBalance = 0;
  try {
    const balRes = await fetch(`https://api.kaspa.org/addresses/${fromAddr}/balance`, { signal: AbortSignal.timeout(10000) });
    if (balRes.ok) {
      escrowBalance = ((await balRes.json()).balance || 0) / 1e8;
    }
  } catch (e) {
    console.warn(`Escrow balance check failed: ${e.message}`);
  }

  if (escrowBalance <= 0.001) {
    console.log(`Escrow ${fromAddr.slice(0, 25)} has insufficient balance: ${escrowBalance} KAS`);
    return null;
  }

  const TX_FEE = 0.001;
  const maxSendable = parseFloat((escrowBalance - TX_FEE).toFixed(4));
  const actualSend = parseFloat(Math.min(amountKas, maxSendable).toFixed(4));

  if (actualSend <= 0) {
    console.log(`Payout amount ${amountKas} too small after fee deduction (escrow has ${escrowBalance})`);
    return null;
  }

  // Use sendAll to drain escrow cleanly when close to full balance
  const useSendAll = (actualSend >= maxSendable - 0.001);
  console.log(`PAYOUT: ${useSendAll ? 'ALL' : actualSend + ' KAS'} from escrow(${fromAddr.slice(0, 20)}) → ${toAddr.slice(0, 20)} (escrow bal: ${escrowBalance})`);

  try {
    const txParams = {
      mnemonic: game.escrow_mnemonic,
      fromAddress: fromAddr,
      toAddress: toAddr,
    };
    if (useSendAll) {
      txParams.sendAll = true;
    } else {
      txParams.amountKas = actualSend;
    }
    const res = await base44.asServiceRole.functions.invoke('sendKaspaTransaction', txParams);

    if (res?.error) {
      console.error(`Payout FAILED to ${toAddr.slice(0, 20)}: ${res.error}`);
      return null;
    }

    const txId = res?.txId || res?.data?.txId || '';
    console.log(`✅ Payout sent: ${actualSend} KAS → ${toAddr.slice(0, 20)} | TX: ${txId}`);
    return txId;
  } catch (err) {
    console.error(`Payout exception to ${toAddr.slice(0, 20)}:`, err.message);
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
    const toAddr = normalizeAddress(recipientAddress);
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