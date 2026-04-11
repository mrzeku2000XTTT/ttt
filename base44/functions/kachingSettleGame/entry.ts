import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Judge + Settlement: determines winner, calculates payouts, sends KAS + PACMAN
// PACMAN is peer-to-peer: losers' PACMAN goes to winners proportionally
// If one-sided (no losers), admin can optionally send bonus PACMAN from reward wallet
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
        const totalPacmanPool = allBets.reduce((s, b) => s + (b.amount_pacman || 0), 0);
        const winnerPacmanPool = winners.reduce((s, b) => s + (b.amount_pacman || 0), 0);
        const isOneSided = losers.length === 0 && winners.length > 0;

        console.log(`\n========== GAME #${game.game_number} BET LEDGER ==========`);
        console.log(`Question: ${game.question}`);
        console.log(`Result: ${result.toUpperCase()} | Reason: ${judgeReason}`);
        console.log(`KAS Pool: total=${totalPool}, YES=${game.yes_pool_kas}(${game.yes_count}), NO=${game.no_pool_kas}(${game.no_count})`);
        console.log(`PACMAN Pool: total=${totalPacmanPool}, YES=${game.yes_pool_pacman || 0}, NO=${game.no_pool_pacman || 0}`);
        console.log(`One-sided: ${isOneSided} | Winners: ${winners.length} | Losers: ${losers.length}`);

        const txHashes = [];
        const settledAt = new Date().toISOString();

        if (result === 'push' || allBets.length === 0) {
          // Refund everyone — KAS refunded, PACMAN stays (already in escrow address, they sent to it)
          for (const bet of allBets) {
            const toAddr = normalizeAddress(bet.user_wallet_address);
            console.log(`REFUND → ${toAddr} | ${bet.amount_kas} KAS`);
            const txHash = await sendPayout(base44, game, toAddr, bet.amount_kas);
            
            // Refund PACMAN KRC-20 if they sent any
            let pacmanRefundTx = '';
            if ((bet.amount_pacman || 0) > 0) {
              const krc20Res = await sendKRC20FromEscrow(base44, game, toAddr, bet.amount_pacman);
              pacmanRefundTx = krc20Res?.commitTxId || '';
            }

            const receipt = {
              result: 'push',
              question: game.question,
              total_pool_kas: totalPool,
              total_pool_pacman: totalPacmanPool,
              your_bet_kas: bet.amount_kas,
              your_bet_pacman: bet.amount_pacman || 0,
              your_side: bet.side,
              payout_kas: bet.amount_kas,
              payout_pacman: bet.amount_pacman || 0,
              kas_tx_hash: txHash || '',
              pacman_tx_hash: pacmanRefundTx,
              pacman_bonus: 0,
              pacman_tx_commit: '',
              pacman_tx_reveal: '',
              settled_at: settledAt,
              judge_reason: judgeReason,
              notes: `Game #${game.game_number} ended in a PUSH. Your ${bet.amount_kas} KAS${bet.amount_pacman ? ` + ${bet.amount_pacman} PACMAN` : ''} bet was refunded.`
            };

            await base44.asServiceRole.entities.GameBet.update(bet.id, {
              status: 'refunded',
              payout_kas: bet.amount_kas,
              payout_pacman: bet.amount_pacman || 0,
              tx_hash_out: txHash || '',
              receipt,
            });
            if (txHash) txHashes.push(txHash);
          }
        } else if (winners.length > 0) {
          // Winners split losers' KAS + PACMAN proportionally
          const distributableKas = totalPool; // 0% fee
          const distributablePacman = totalPacmanPool; // All PACMAN in pool goes to winners

          for (const winner of winners) {
            // KAS payout: proportional share of total KAS pool
            const kasShare = winnerPool > 0 ? (winner.amount_kas / winnerPool) * distributableKas : 0;
            const kasPayout = parseFloat(kasShare.toFixed(4));

            // PACMAN payout: proportional share of total PACMAN pool (peer-to-peer)
            const pacmanShare = winnerPacmanPool > 0
              ? ((winner.amount_pacman || 0) / winnerPacmanPool) * distributablePacman
              : (winners.length > 0 ? distributablePacman / winners.length : 0);
            const pacmanPayout = Math.round(pacmanShare);

            const toAddr = normalizeAddress(winner.user_wallet_address);
            console.log(`WINNER → ${toAddr} | KAS: ${kasPayout} | PACMAN: ${pacmanPayout}`);

            // Send KAS payout + KRC-20 PACMAN payout
            const [txHash, krc20Result] = await Promise.all([
              sendPayout(base44, game, toAddr, kasPayout),
              pacmanPayout > 0 ? sendKRC20FromEscrow(base44, game, toAddr, pacmanPayout) : Promise.resolve(null),
            ]);

            // Admin bonus PACMAN (only if one-sided — no losers to take from)
            let adminBonus = 0;
            let adminBonusResult = null;
            if (isOneSided) {
              adminBonus = Math.max(1, Math.round(winner.amount_kas * 10));
              try {
                adminBonusResult = await sendAdminPacmanBonus(base44, toAddr, adminBonus);
              } catch (e) { console.warn('Admin bonus failed:', e.message); }
            }

            const receipt = {
              result: result.toUpperCase(),
              question: game.question,
              total_pool_kas: totalPool,
              total_pool_pacman: totalPacmanPool,
              your_bet_kas: winner.amount_kas,
              your_bet_pacman: winner.amount_pacman || 0,
              your_side: winner.side,
              payout_kas: kasPayout,
              payout_pacman: pacmanPayout,
              kas_tx_hash: txHash || '',
              pacman_tx_hash: krc20Result?.commitTxId || '',
              pacman_bonus: adminBonus,
              pacman_tx_commit: adminBonusResult?.commitTxId || '',
              pacman_tx_reveal: adminBonusResult?.revealTxId || '',
              settled_at: settledAt,
              judge_reason: judgeReason,
              notes: isOneSided
                ? `🎉 You WON Game #${game.game_number}! One-sided bet — KAS refunded (${kasPayout} KAS). ${adminBonus > 0 ? `Admin bonus: ${adminBonus} PACMAN.` : ''}`
                : `🎉 You WON Game #${game.game_number}! You bet ${winner.amount_kas} KAS${winner.amount_pacman ? ` + ${winner.amount_pacman} PACMAN` : ''} on ${winner.side.toUpperCase()} and won ${kasPayout} KAS${pacmanPayout > 0 ? ` + ${pacmanPayout} PACMAN` : ''} from the pool.`
            };

            await base44.asServiceRole.entities.GameBet.update(winner.id, {
              status: 'won',
              payout_kas: kasPayout,
              payout_pacman: pacmanPayout,
              tx_hash_out: txHash || '',
              tx_hash_pacman_out: krc20Result?.commitTxId || '',
              receipt,
            });
            if (txHash) txHashes.push(txHash);
            console.log(`✅ Winner settled: kas=${kasPayout}, pacman=${pacmanPayout}, adminBonus=${adminBonus}`);
          }

          for (const loser of losers) {
            const receipt = {
              result: result.toUpperCase(),
              question: game.question,
              total_pool_kas: totalPool,
              total_pool_pacman: totalPacmanPool,
              your_bet_kas: loser.amount_kas,
              your_bet_pacman: loser.amount_pacman || 0,
              your_side: loser.side,
              payout_kas: 0,
              payout_pacman: 0,
              kas_tx_hash: '',
              pacman_tx_hash: '',
              pacman_bonus: 0,
              pacman_tx_commit: '',
              pacman_tx_reveal: '',
              settled_at: settledAt,
              judge_reason: judgeReason,
              notes: `Game #${game.game_number}: You bet ${loser.amount_kas} KAS${loser.amount_pacman ? ` + ${loser.amount_pacman} PACMAN` : ''} on ${loser.side.toUpperCase()}. Result was ${result.toUpperCase()}. Better luck next time!`
            };

            await base44.asServiceRole.entities.GameBet.update(loser.id, {
              status: 'lost',
              payout_kas: 0,
              payout_pacman: 0,
              receipt,
            });
          }
        } else {
          // No winners — refund all
          for (const bet of allBets) {
            const toAddr = normalizeAddress(bet.user_wallet_address);
            const txHash = await sendPayout(base44, game, toAddr, bet.amount_kas);
            
            const receipt = {
              result: 'NO WINNERS',
              question: game.question,
              total_pool_kas: totalPool,
              total_pool_pacman: totalPacmanPool,
              your_bet_kas: bet.amount_kas,
              your_bet_pacman: bet.amount_pacman || 0,
              your_side: bet.side,
              payout_kas: bet.amount_kas,
              payout_pacman: bet.amount_pacman || 0,
              kas_tx_hash: txHash || '',
              pacman_tx_hash: '',
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
              payout_pacman: bet.amount_pacman || 0,
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

        // Update bot stats
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
          total_pool_pacman: totalPacmanPool,
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

// Send KAS payout from game escrow to winner's wallet
async function sendPayout(base44, game, recipientAddress, amountKas) {
  if (!game.escrow_mnemonic || !amountKas || amountKas <= 0) {
    console.log(`Skipping KAS payout: no mnemonic or amount=${amountKas}`);
    return null;
  }

  const toAddr = normalizeAddress(recipientAddress);
  const fromAddr = normalizeAddress(game.escrow_address);

  const rawAddr = toAddr.replace('kaspa:', '');
  if (rawAddr.length < 60) {
    console.error(`INVALID recipient address (too short): ${toAddr}`);
    return null;
  }

  // Check escrow balance
  let escrowBalance = 0;
  try {
    const balRes = await fetch(`https://api.kaspa.org/addresses/${fromAddr}/balance`, { signal: AbortSignal.timeout(10000) });
    if (balRes.ok) escrowBalance = ((await balRes.json()).balance || 0) / 1e8;
  } catch (e) { console.warn(`Escrow balance check failed: ${e.message}`); }

  if (escrowBalance <= 0.001) {
    console.log(`Escrow has insufficient balance: ${escrowBalance} KAS`);
    return null;
  }

  const TX_FEE = 0.001;
  const maxSendable = parseFloat((escrowBalance - TX_FEE).toFixed(4));
  const actualSend = parseFloat(Math.min(amountKas, maxSendable).toFixed(4));
  if (actualSend <= 0) return null;

  const useSendAll = (actualSend >= maxSendable - 0.001);

  try {
    const txParams = {
      mnemonic: game.escrow_mnemonic,
      fromAddress: fromAddr,
      toAddress: toAddr,
    };
    if (useSendAll) txParams.sendAll = true;
    else txParams.amountKas = actualSend;
    
    const res = await base44.asServiceRole.functions.invoke('sendKaspaTransaction', txParams);
    if (res?.error) { console.error(`Payout FAILED: ${res.error}`); return null; }
    const txId = res?.txId || res?.data?.txId || '';
    console.log(`✅ KAS Payout: ${actualSend} KAS → ${toAddr.slice(0, 20)} | TX: ${txId}`);
    return txId;
  } catch (err) {
    console.error(`Payout exception:`, err.message);
    return null;
  }
}

// Send KRC-20 PACMAN from escrow wallet to recipient (peer-to-peer settlement)
async function sendKRC20FromEscrow(base44, game, recipientAddress, amountPacman) {
  if (!game.escrow_mnemonic || !amountPacman || amountPacman <= 0) return null;
  try {
    const toAddr = normalizeAddress(recipientAddress);
    const fromAddr = normalizeAddress(game.escrow_address);
    const res = await base44.asServiceRole.functions.invoke('krc20Transfer', {
      action: 'transfer',
      mnemonic: game.escrow_mnemonic,
      fromAddress: fromAddr,
      toAddress: toAddr,
      amount: amountPacman.toString(),
      ticker: 'PACMAN',
      decimals: 8,
    });
    const data = res?.data || res;
    if (data?.error) { console.warn(`KRC20 escrow payout error: ${data.error}`); return null; }
    console.log(`✅ PACMAN Payout: ${amountPacman} → ${toAddr.slice(0, 20)} | TX: ${data?.commitTxId || 'n/a'}`);
    return data;
  } catch (err) {
    console.warn(`KRC20 escrow payout exception: ${err.message}`);
    return null;
  }
}

// Send admin PACMAN bonus from reward wallet (only for one-sided games)
async function sendAdminPacmanBonus(base44, recipientAddress, amountPacman) {
  try {
    const toAddr = normalizeAddress(recipientAddress);
    const res = await base44.asServiceRole.functions.invoke('sendPacmanKRC20Reward', {
      recipient_address: toAddr,
      amount_pacman: amountPacman,
      ticker: 'PACMAN',
      decimals: 8,
    });
    const data = res?.data || res;
    if (data?.error) { console.warn(`Admin bonus error: ${data.error}`); return null; }
    return data;
  } catch (err) {
    console.warn(`Admin bonus exception: ${err.message}`);
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