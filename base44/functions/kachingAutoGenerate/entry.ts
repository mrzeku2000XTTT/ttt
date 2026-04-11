import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import * as bip39 from 'npm:@scure/bip39@1.3.0';
import { wordlist } from 'npm:@scure/bip39@1.3.0/wordlists/english';
import { KaspaWallet } from 'npm:@okxweb3/coin-kaspa@2.4.9';

// Auto-generates prediction games every 15 minutes from live data
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const DURATION_MINUTES = 15;
    const now = new Date();
    const endTime = new Date(now.getTime() + DURATION_MINUTES * 60 * 1000);
    const createdGames = [];

    // Helper to create escrow wallet
    async function createEscrow() {
      const mnemonic = bip39.generateMnemonic(wordlist, 128);
      const wallet = new KaspaWallet();
      const privateKey = await wallet.getDerivedPrivateKey({
        mnemonic,
        hdPath: "m/44'/111111'/0'/0/0",
      });
      const { address } = await wallet.getNewAddress({ privateKey });
      const cleanAddress = address.startsWith('kaspa:') ? address.slice(6) : address;
      return { mnemonic, privateKey, address: cleanAddress };
    }

    // 1. NBA Games
    try {
      const tz = 'America/Chicago';
      const dateStr = now.toLocaleDateString('en-CA', { timeZone: tz }).replace(/-/g, '');
      const nbaRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dateStr}`);
      const nbaData = await nbaRes.json();
      
      for (const event of (nbaData?.events || []).slice(0, 3)) {
        const comp = event.competitions?.[0];
        if (!comp) continue;
        const away = comp.competitors?.find(c => c.homeAway === 'away');
        const home = comp.competitors?.find(c => c.homeAway === 'home');
        if (!away || !home) continue;
        if (comp.status?.type?.name === 'STATUS_FINAL') continue;

        const escrow = await createEscrow();
        const gameNumber = escrow.address.slice(0, 8).toUpperCase();

        const game = await base44.asServiceRole.entities.PredictionGame.create({
          game_number: gameNumber,
          escrow_address: escrow.address,
          escrow_private_key: escrow.privateKey,
          escrow_mnemonic: escrow.mnemonic,
          market_id: `nba_${event.id}_${Date.now()}`,
          question: `Will ${home.team.shortDisplayName} be leading ${away.team.shortDisplayName} in 15 min?`,
          yes_label: `${home.team.shortDisplayName} leads`,
          no_label: `${away.team.shortDisplayName} leads or tied`,
          category: 'Sports',
          subcategory: 'NBA',
          source_data: `ESPN game ${event.id}`,
          status: 'open',
          start_time: now.toISOString(),
          end_time: endTime.toISOString(),
          total_pool_kas: 0, yes_pool_kas: 0, no_pool_kas: 0,
          yes_count: 0, no_count: 0, bot_status: 'ready'
        });

        createdGames.push({ id: game.id, game_number: gameNumber, question: game.question });
      }
    } catch (e) { console.error('NBA game gen failed:', e.message); }

    // 2. Crypto price predictions
    try {
      const cryptoRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,kaspa,ethereum&vs_currencies=usd');
      const cryptoData = await cryptoRes.json();
      
      const coins = [
        { id: 'bitcoin', symbol: 'BTC' },
        { id: 'kaspa', symbol: 'KAS' },
        { id: 'ethereum', symbol: 'ETH' },
      ];

      for (const coin of coins) {
        const price = cryptoData[coin.id]?.usd;
        if (!price) continue;

        const escrow = await createEscrow();
        const gameNumber = escrow.address.slice(0, 8).toUpperCase();
        const target = coin.symbol === 'BTC' ? Math.round(price) : parseFloat(price.toFixed(price > 100 ? 0 : 4));

        const game = await base44.asServiceRole.entities.PredictionGame.create({
          game_number: gameNumber,
          escrow_address: escrow.address,
          escrow_private_key: escrow.privateKey,
          escrow_mnemonic: escrow.mnemonic,
          market_id: `crypto_${coin.id}_${Date.now()}`,
          question: `Will ${coin.symbol} be above $${target.toLocaleString()} in 15 minutes?`,
          yes_label: `Above $${target.toLocaleString()}`,
          no_label: `At or below $${target.toLocaleString()}`,
          category: 'Crypto',
          subcategory: coin.symbol,
          source_data: `CoinGecko ${coin.id} price at ${target}`,
          status: 'open',
          start_time: now.toISOString(),
          end_time: endTime.toISOString(),
          total_pool_kas: 0, yes_pool_kas: 0, no_pool_kas: 0,
          yes_count: 0, no_count: 0, bot_status: 'ready'
        });

        createdGames.push({ id: game.id, game_number: gameNumber, question: game.question });
      }
    } catch (e) { console.error('Crypto game gen failed:', e.message); }

    return Response.json({ success: true, games_created: createdGames.length, games: createdGames });
  } catch (error) {
    console.error('kachingAutoGenerate error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});