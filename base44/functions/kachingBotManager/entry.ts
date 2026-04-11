import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import * as bip39 from 'npm:@scure/bip39@1.3.0';
import { wordlist } from 'npm:@scure/bip39@1.3.0/wordlists/english';
import { KaspaWallet } from 'npm:@okxweb3/coin-kaspa@2.4.9';

const KASPA_API = 'https://api.kaspa.org';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { action } = body;
    const isAutomation = !!body.automation;

    if (!isAutomation) {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Admin only' }, { status: 403 });
      }
    }

    // Helper: strip sensitive fields from bot data
    const safeBotData = (b) => ({
      id: b.id,
      bot_name: b.bot_name,
      kaspa_address: b.kaspa_address,
      balance_kas: b.balance_kas || 0,
      is_active: b.is_active || false,
      strategy: b.strategy || 'random',
      bet_amount_kas: b.bet_amount_kas || 1,
      total_bets: b.total_bets || 0,
      total_wins: b.total_wins || 0,
      total_profit_kas: b.total_profit_kas || 0,
      avatar_emoji: b.avatar_emoji || '🤖',
    });

    // ---- LIST BOTS (safe, no mnemonics) ----
    if (action === 'list_bots') {
      const bots = await base44.asServiceRole.entities.KaChingBot.filter({});
      return Response.json({ success: true, bots: bots.map(safeBotData) });
    }

    // ---- CREATE BOTS ----
    if (action === 'create_bots') {
      const existing = await base44.asServiceRole.entities.KaChingBot.filter({});
      if (existing.length >= 2) {
        return Response.json({ success: true, message: 'Bots already exist', bots: existing.map(safeBotData) });
      }

      const botConfigs = [
        { name: 'Agent Alpha', emoji: '🤖', strategy: 'random' },
        { name: 'Agent Omega', emoji: '🧠', strategy: 'contrarian' },
      ];

      const created = [];
      for (const cfg of botConfigs) {
        const alreadyExists = existing.find(b => b.bot_name === cfg.name);
        if (alreadyExists) { created.push(alreadyExists); continue; }

        const mnemonic = bip39.generateMnemonic(wordlist, 128);
        const wallet = new KaspaWallet();
        const privateKey = await wallet.getDerivedPrivateKey({ mnemonic, hdPath: "m/44'/111111'/0'/0/0" });
        const { address } = await wallet.getNewAddress({ privateKey });
        const cleanAddress = address.startsWith('kaspa:') ? address.slice(6) : address;

        const bot = await base44.asServiceRole.entities.KaChingBot.create({
          bot_name: cfg.name,
          kaspa_address: cleanAddress,
          encrypted_mnemonic: mnemonic,
          balance_kas: 0,
          is_active: false,
          strategy: cfg.strategy,
          bet_amount_kas: 1,
          total_bets: 0,
          total_wins: 0,
          total_profit_kas: 0,
          avatar_emoji: cfg.emoji,
        });

        created.push(bot);
        console.log(`Created bot ${cfg.name}: kaspa:${cleanAddress.slice(0, 16)}...`);
      }

      return Response.json({ success: true, bots: created.map(safeBotData) });
    }

    // ---- REFRESH BALANCES ----
    if (action === 'refresh_balances') {
      const bots = await base44.asServiceRole.entities.KaChingBot.filter({});
      const results = [];

      for (const bot of bots) {
        try {
          const addr = bot.kaspa_address.startsWith('kaspa:') ? bot.kaspa_address : `kaspa:${bot.kaspa_address}`;
          const res = await fetch(`${KASPA_API}/addresses/${addr}/balance`, { signal: AbortSignal.timeout(10000) });
          if (res.ok) {
            const data = await res.json();
            const bal = (data.balance || 0) / 1e8;
            await base44.asServiceRole.entities.KaChingBot.update(bot.id, { balance_kas: bal });
            results.push(safeBotData({ ...bot, balance_kas: bal }));
          } else {
            const utxoRes = await fetch(`${KASPA_API}/addresses/${addr}/utxos`, { signal: AbortSignal.timeout(10000) });
            if (utxoRes.ok) {
              const utxos = await utxoRes.json();
              const bal = utxos.reduce((s, u) => s + (u?.utxoEntry?.amount || 0), 0) / 1e8;
              await base44.asServiceRole.entities.KaChingBot.update(bot.id, { balance_kas: bal });
              results.push(safeBotData({ ...bot, balance_kas: bal }));
            }
          }
        } catch (e) {
          console.warn(`Balance fetch failed for ${bot.bot_name}:`, e.message);
          results.push({ ...safeBotData(bot), error: e.message });
        }
      }

      return Response.json({ success: true, results });
    }

    // ---- TOGGLE BOT ----
    if (action === 'toggle_bot') {
      const { bot_id } = body;
      if (!bot_id) return Response.json({ error: 'bot_id required' }, { status: 400 });
      const bots = await base44.asServiceRole.entities.KaChingBot.filter({ id: bot_id });
      const bot = bots[0];
      if (!bot) return Response.json({ error: 'Bot not found' }, { status: 404 });
      await base44.asServiceRole.entities.KaChingBot.update(bot.id, { is_active: !bot.is_active });
      return Response.json({ success: true, bot: safeBotData({ ...bot, is_active: !bot.is_active }) });
    }

    // ---- BOT PLACE BET ----
    if (action === 'bot_bet') {
      const { bot_id, game_id, side } = body;
      if (!bot_id || !game_id) {
        return Response.json({ error: 'bot_id and game_id required' }, { status: 400 });
      }

      const bots = await base44.asServiceRole.entities.KaChingBot.filter({ id: bot_id });
      const bot = bots[0];
      if (!bot) return Response.json({ error: 'Bot not found' }, { status: 404 });
      if (!bot.is_active) return Response.json({ error: 'Bot is not active' }, { status: 400 });

      const games = await base44.asServiceRole.entities.PredictionGame.filter({ id: game_id });
      const game = games[0];
      if (!game || game.status !== 'open') return Response.json({ error: 'Game not open' }, { status: 400 });

      // Check bot hasn't already bet on this game
      const existingBets = await base44.asServiceRole.entities.GameBet.filter({ game_id, user_email: `bot_${bot.bot_name.toLowerCase().replace(/\s/g, '_')}@kaching.bot` });
      if (existingBets.length > 0) {
        return Response.json({ success: true, message: 'Bot already bet on this game', existing: true });
      }

      const betAmount = bot.bet_amount_kas || 1;

      // Check balance
      const addr = bot.kaspa_address.startsWith('kaspa:') ? bot.kaspa_address : `kaspa:${bot.kaspa_address}`;
      let balance = 0;
      try {
        const balRes = await fetch(`${KASPA_API}/addresses/${addr}/balance`, { signal: AbortSignal.timeout(10000) });
        if (balRes.ok) { balance = ((await balRes.json()).balance || 0) / 1e8; }
      } catch {}

      if (balance < betAmount + 0.001) {
        return Response.json({ error: `Insufficient balance: ${balance.toFixed(4)} KAS (need ${betAmount + 0.001})` }, { status: 400 });
      }

      // Determine side
      let betSide = side;
      if (!betSide) {
        if (bot.strategy === 'random') {
          betSide = Math.random() > 0.5 ? 'yes' : 'no';
        } else if (bot.strategy === 'contrarian') {
          betSide = (game.yes_pool_kas || 0) > (game.no_pool_kas || 0) ? 'no' : 'yes';
        } else {
          betSide = Math.random() > 0.5 ? 'yes' : 'no';
        }
      }

      const escrowFull = game.escrow_address.startsWith('kaspa:') ? game.escrow_address : `kaspa:${game.escrow_address}`;

      // Send KAS from bot wallet to escrow
      console.log(`Bot ${bot.bot_name} betting ${betAmount} KAS ${betSide.toUpperCase()} on game #${game.game_number}`);
      const txRes = await base44.asServiceRole.functions.invoke('sendKaspaTransaction', {
        mnemonic: bot.encrypted_mnemonic,
        fromAddress: addr,
        toAddress: escrowFull,
        amountKas: betAmount,
      });

      if (txRes?.error) {
        console.error(`Bot TX failed: ${txRes.error}`);
        return Response.json({ error: `TX failed: ${txRes.error}` }, { status: 500 });
      }

      const txHash = txRes?.txId || txRes?.data?.txId || '';
      console.log(`Bot TX sent: ${txHash}`);

      // Wait for TX indexing then verify
      await new Promise(r => setTimeout(r, 5000));

      let verifyRes = null;
      for (let i = 0; i < 4; i++) {
        try {
          verifyRes = await base44.asServiceRole.functions.invoke('kachingPlaceBet', {
            game_id,
            side: betSide,
            tx_hash_in: txHash,
            bot_email: `bot_${bot.bot_name.toLowerCase().replace(/\s/g, '_')}@kaching.bot`,
            bot_wallet: addr,
          });
          if (verifyRes?.data?.success) break;
        } catch {}
        await new Promise(r => setTimeout(r, 3000));
      }

      // Update bot stats
      await base44.asServiceRole.entities.KaChingBot.update(bot.id, {
        total_bets: (bot.total_bets || 0) + 1,
        balance_kas: Math.max(0, balance - betAmount - 0.0002),
      });

      return Response.json({
        success: true,
        bot: bot.bot_name,
        side: betSide,
        amount: betAmount,
        tx_hash: txHash,
        game_number: game.game_number,
        verified: verifyRes?.data?.success || false,
      });
    }

    // ---- BOT AUTO-BET ON ALL OPEN GAMES ----
    if (action === 'auto_bet_all') {
      const bots = await base44.asServiceRole.entities.KaChingBot.filter({ is_active: true });
      if (bots.length === 0) return Response.json({ success: true, message: 'No active bots' });

      const openGames = await base44.asServiceRole.entities.PredictionGame.filter({ status: 'open' });
      const now = new Date();
      const activeGames = openGames.filter(g => new Date(g.end_time) > now);

      const results = [];
      for (const bot of bots) {
        for (const game of activeGames) {
          try {
            const res = await base44.asServiceRole.functions.invoke('kachingBotManager', {
              action: 'bot_bet',
              bot_id: bot.id,
              game_id: game.id,
            });
            results.push({ bot: bot.bot_name, game: game.game_number, result: res?.data || res });
          } catch (e) {
            results.push({ bot: bot.bot_name, game: game.game_number, error: e.message });
          }
        }
      }

      return Response.json({ success: true, results });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('kachingBotManager error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});