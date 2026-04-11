import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const KASPA_API = 'https://api.kaspa.org';

// Verify a Kaspa transaction on-chain and extract sender + amount to escrow
async function verifyTxOnChain(txHash, escrowAddress) {
  const cleanEscrow = escrowAddress.startsWith('kaspa:') ? escrowAddress : `kaspa:${escrowAddress}`;

  // Fetch TX with resolved inputs to get sender address
  const res = await fetch(`${KASPA_API}/transactions/${txHash}?inputs=true&resolve_previous_outpoints=light`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`TX not found on-chain (${res.status}): ${text.slice(0, 100)}`);
  }
  const tx = await res.json();

  // Extract sender address from resolved inputs
  let senderAddress = null;
  if (tx.inputs && tx.inputs.length > 0) {
    for (const inp of tx.inputs) {
      const addr = inp.previous_outpoint_address || inp.previous_outpoint?.script_public_key_address;
      if (addr) {
        senderAddress = addr;
        break;
      }
    }
  }

  // Extract amount sent to escrow from outputs
  let amountToEscrow = 0;
  if (tx.outputs) {
    for (const out of tx.outputs) {
      const outAddr = out.script_public_key_address || '';
      if (outAddr === cleanEscrow) {
        amountToEscrow += (out.amount || 0);
      }
    }
  }

  // Convert sompi to KAS
  const amountKas = amountToEscrow / 1e8;

  return {
    verified: amountKas > 0,
    sender_address: senderAddress,
    amount_kas: amountKas,
    amount_sompi: amountToEscrow,
    tx_data: {
      block_time: tx.block_time,
      is_accepted: tx.is_accepted,
      accepting_block_hash: tx.accepting_block_hash,
    },
  };
}

// User places a bet by providing a real Kaspa TX hash
// The system verifies the TX on-chain to extract: sender wallet, amount, escrow match
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { game_id, side, tx_hash_in, bot_email, bot_wallet, pacman_amount, tx_hash_pacman_in } = await req.json();

    // Support bot bets with explicit email/wallet override
    const betEmail = bot_email || user.email || '';
    const betWalletOverride = bot_wallet || null;

    if (!game_id || !side || !tx_hash_in) {
      return Response.json({ error: 'Missing fields: game_id, side, tx_hash_in required' }, { status: 400 });
    }

    if (!['yes', 'no'].includes(side)) {
      return Response.json({ error: 'Side must be yes or no' }, { status: 400 });
    }

    // Get game
    const games = await base44.asServiceRole.entities.PredictionGame.filter({ id: game_id });
    const game = games[0];
    if (!game) return Response.json({ error: 'Game not found' }, { status: 404 });
    if (game.status !== 'open') return Response.json({ error: 'Game not open for bets' }, { status: 400 });

    if (new Date(game.end_time) <= new Date()) {
      return Response.json({ error: 'Game has ended' }, { status: 400 });
    }

    // Check if this TX hash was already used
    const existingBets = await base44.asServiceRole.entities.GameBet.filter({ tx_hash_in: tx_hash_in });
    if (existingBets.length > 0) {
      return Response.json({ error: 'This transaction has already been used for a bet' }, { status: 400 });
    }

    // Verify TX on Kaspa blockchain
    console.log(`Verifying TX: ${tx_hash_in} for game #${game.game_number}`);
    const verification = await verifyTxOnChain(tx_hash_in, game.escrow_address);

    if (!verification.verified) {
      return Response.json({
        error: 'Transaction does not send KAS to the game escrow address',
        escrow_address: `kaspa:${game.escrow_address}`,
      }, { status: 400 });
    }

    if (verification.amount_kas < 0.1) {
      return Response.json({ error: `Amount too small: ${verification.amount_kas} KAS (min 0.1)` }, { status: 400 });
    }

    const senderWallet = verification.sender_address
      ? (verification.sender_address.startsWith('kaspa:') ? verification.sender_address.slice(6) : verification.sender_address)
      : 'unknown';

    console.log(`TX VERIFIED: sender=${senderWallet.slice(0, 16)}... amount=${verification.amount_kas} KAS → escrow=${game.escrow_address.slice(0, 16)}...`);

    // Use bot wallet override if provided, otherwise use sender from TX
    const finalWallet = betWalletOverride
      ? (betWalletOverride.startsWith('kaspa:') ? betWalletOverride.slice(6) : betWalletOverride)
      : senderWallet;

    // Create bet record with ON-CHAIN verified data
    const pacAmt = parseFloat(pacman_amount) || 0;
    const betData = {
      game_id: game.id,
      game_number: game.game_number,
      user_wallet_address: finalWallet,
      side,
      amount_kas: verification.amount_kas,
      amount_pacman: pacAmt,
      status: 'confirmed',
      verified: true,
      tx_hash_in: tx_hash_in,
    };
    if (pacAmt > 0 && tx_hash_pacman_in) betData.tx_hash_pacman_in = tx_hash_pacman_in;
    // Include email if available (optional)
    if (betEmail) betData.user_email = betEmail;
    const bet = await base44.asServiceRole.entities.GameBet.create(betData);

    // Update game pool counters (KAS + PACMAN)
    const updateData = {
      total_pool_kas: (game.total_pool_kas || 0) + verification.amount_kas,
    };
    if (pacAmt > 0) {
      updateData.total_pool_pacman = (game.total_pool_pacman || 0) + pacAmt;
    }
    if (side === 'yes') {
      updateData.yes_pool_kas = (game.yes_pool_kas || 0) + verification.amount_kas;
      updateData.yes_count = (game.yes_count || 0) + 1;
      if (pacAmt > 0) updateData.yes_pool_pacman = (game.yes_pool_pacman || 0) + pacAmt;
    } else {
      updateData.no_pool_kas = (game.no_pool_kas || 0) + verification.amount_kas;
      updateData.no_count = (game.no_count || 0) + 1;
      if (pacAmt > 0) updateData.no_pool_pacman = (game.no_pool_pacman || 0) + pacAmt;
    }

    await base44.asServiceRole.entities.PredictionGame.update(game.id, updateData);

    console.log(`BET PLACED: ${senderWallet.slice(0, 12)}... bet ${verification.amount_kas} KAS + ${pacAmt} PACMAN on ${side.toUpperCase()} for game #${game.game_number}`);

    return Response.json({
      success: true,
      bet_id: bet.id,
      verified_on_chain: true,
      sender_address: `kaspa:${senderWallet}`,
      amount_kas: verification.amount_kas,
      pacman_amount: pacAmt,
      side,
      game_number: game.game_number,
      escrow_address: `kaspa:${game.escrow_address}`,
      tx_hash_in,
      updated_pool: {
        total: updateData.total_pool_kas,
        yes: updateData.yes_pool_kas || game.yes_pool_kas || 0,
        no: updateData.no_pool_kas || game.no_pool_kas || 0,
        total_pacman: updateData.total_pool_pacman || game.total_pool_pacman || 0,
        yes_pacman: updateData.yes_pool_pacman || game.yes_pool_pacman || 0,
        no_pacman: updateData.no_pool_pacman || game.no_pool_pacman || 0,
      },
    });
  } catch (error) {
    console.error('kachingPlaceBet error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});