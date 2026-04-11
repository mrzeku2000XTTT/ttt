import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { KaspaWallet } from 'npm:@okxweb3/coin-kaspa@2.4.9';

const KASPA_API = 'https://api.kaspa.org';
const FEE_SOMPI = 10000;

// Judge + Bot: determines winner, calculates payouts, sends transactions
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

    const settlements = [];

    for (const game of games) {
      try {
        // Mark as judging
        await base44.asServiceRole.entities.PredictionGame.update(game.id, {
          status: 'judging',
          bot_status: 'processing'
        });

        // JUDGE AGENT: Determine result from live data
        let result = force_result;
        let judgeReason = '';

        if (!result) {
          // Use LLM to judge based on real data
          const judgePrompt = `You are a prediction market judge. Determine the result of this prediction:
          
Question: "${game.question}"
Category: ${game.category} / ${game.subcategory}
Source: ${game.source_data}
Game started: ${game.start_time}
Game ended: ${game.end_time}

Based on real-world data available at the end time, what is the result?
You MUST respond with valid JSON only: {"result": "yes" or "no" or "push", "reason": "brief explanation"}`;

          try {
            const judgeRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
              prompt: judgePrompt,
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
            result = judgeRes.result;
            judgeReason = judgeRes.reason;
          } catch (e) {
            console.error('Judge LLM failed:', e.message);
            result = 'push'; // Default to push if judge fails
            judgeReason = 'Judge error - refunding all bets';
          }
        }

        // Get all confirmed bets
        const allBets = await base44.asServiceRole.entities.GameBet.filter({
          game_id: game.id,
          status: 'confirmed'
        });

        const winners = allBets.filter(b => b.side === result);
        const losers = allBets.filter(b => b.side !== result && b.side !== result);
        
        // Calculate payouts
        const totalPool = allBets.reduce((s, b) => s + b.amount_kas, 0);
        const winnerPool = winners.reduce((s, b) => s + b.amount_kas, 0);
        
        // Get escrow wallet credentials
        const escrowAddress = `kaspa:${game.escrow_address}`;
        const privateKey = game.escrow_private_key;

        if (!privateKey) {
          throw new Error('Escrow private key not found');
        }

        // Check escrow balance
        const balRes = await fetch(`${KASPA_API}/addresses/${escrowAddress}/balance`);
        const balData = await balRes.json();
        const escrowBalanceSompi = balData?.balance || 0;

        const txHashes = [];

        if (result === 'push') {
          // Refund everyone
          for (const bet of allBets) {
            try {
              const refundResult = await sendFromEscrow(
                privateKey, escrowAddress, `kaspa:${bet.user_wallet_address}`,
                bet.amount_kas
              );
              if (refundResult.success) {
                txHashes.push(refundResult.txId);
                await base44.asServiceRole.entities.GameBet.update(bet.id, {
                  status: 'refunded',
                  payout_kas: bet.amount_kas,
                  tx_hash_out: refundResult.txId
                });
              }
            } catch (e) { console.error('Refund failed for bet', bet.id, e.message); }
          }
        } else if (winners.length > 0 && totalPool > 0) {
          // Pay winners proportionally from total pool
          // Each winner gets: (their_bet / total_winner_bets) * total_pool
          const feeFraction = 0.02; // 2% platform fee
          const distributable = totalPool * (1 - feeFraction);
          
          for (const winner of winners) {
            const share = winnerPool > 0 ? (winner.amount_kas / winnerPool) * distributable : 0;
            if (share <= 0.0001) continue; // Skip dust

            try {
              // Wait briefly between transactions to allow UTXO confirmation
              await new Promise(r => setTimeout(r, 2000));
              
              const payResult = await sendFromEscrow(
                privateKey, escrowAddress, `kaspa:${winner.user_wallet_address}`,
                share
              );
              if (payResult.success) {
                txHashes.push(payResult.txId);
                await base44.asServiceRole.entities.GameBet.update(winner.id, {
                  status: 'won',
                  payout_kas: share,
                  tx_hash_out: payResult.txId
                });
              }
            } catch (e) { console.error('Payout failed for bet', winner.id, e.message); }
          }

          // Mark losers
          for (const loser of losers) {
            await base44.asServiceRole.entities.GameBet.update(loser.id, {
              status: 'lost',
              payout_kas: 0
            });
          }
        } else if (winners.length === 0) {
          // No winners — refund everyone (no valid result)
          for (const bet of allBets) {
            try {
              const refundResult = await sendFromEscrow(
                privateKey, escrowAddress, `kaspa:${bet.user_wallet_address}`,
                bet.amount_kas
              );
              if (refundResult.success) {
                txHashes.push(refundResult.txId);
                await base44.asServiceRole.entities.GameBet.update(bet.id, {
                  status: 'refunded',
                  payout_kas: bet.amount_kas,
                  tx_hash_out: refundResult.txId
                });
              }
            } catch (e) { console.error('Refund failed:', e.message); }
          }
        }

        // Update game as settled
        await base44.asServiceRole.entities.PredictionGame.update(game.id, {
          status: 'settled',
          result,
          judge_reason: judgeReason,
          settlement_tx_hashes: txHashes,
          bot_status: 'ready'
        });

        settlements.push({
          game_id: game.id,
          game_number: game.game_number,
          result,
          reason: judgeReason,
          winners: winners.length,
          losers: losers.length,
          total_pool: totalPool,
          tx_count: txHashes.length
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

async function sendFromEscrow(privateKey, fromAddress, toAddress, amountKas) {
  const wallet = new KaspaWallet();
  const amountSompi = Math.round(amountKas * 1e8);
  
  // Fetch UTXOs
  const utxoRes = await fetch(`${KASPA_API}/addresses/${fromAddress}/utxos`);
  const utxos = await utxoRes.json();
  if (!utxos?.length) throw new Error('No UTXOs in escrow');

  const needed = amountSompi + FEE_SOMPI;
  let totalIn = 0;
  const selected = [];
  utxos.sort((a, b) => Number(b.utxoEntry.amount) - Number(a.utxoEntry.amount));
  for (const u of utxos) {
    if (totalIn >= needed) break;
    if (selected.length >= 80) break;
    selected.push(u);
    totalIn += Number(u.utxoEntry.amount);
  }
  if (totalIn < needed) throw new Error(`Insufficient escrow balance: need ${needed/1e8}, have ${totalIn/1e8}`);

  const change = totalIn - amountSompi - FEE_SOMPI;
  const inputs = selected.map(u => ({
    txId: u.outpoint.transactionId,
    vOut: u.outpoint.index,
    address: fromAddress,
    amount: Number(u.utxoEntry.amount),
  }));
  const outputs = [{ address: toAddress, amount: amountSompi }];
  if (change > 0) outputs.push({ address: fromAddress, amount: change });

  const signResult = await wallet.signTransaction({
    data: { inputs, outputs, address: fromAddress, fee: FEE_SOMPI },
    privateKey,
  });

  const signed = typeof signResult === 'string' ? JSON.parse(signResult) : signResult;
  const rawTx = signed.transaction ?? signed.tx ?? signed;

  const submitRes = await fetch(`${KASPA_API}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transaction: rawTx, allowOrphan: false }),
  });

  if (!submitRes.ok) {
    const txt = await submitRes.text();
    throw new Error(`Submit failed: ${txt.slice(0, 200)}`);
  }

  const submitData = await submitRes.json().catch(() => ({}));
  return { success: true, txId: submitData.transactionId || submitData.txid || 'submitted' };
}