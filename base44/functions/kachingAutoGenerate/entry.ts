import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import * as bip39 from 'npm:@scure/bip39@1.3.0';
import { wordlist } from 'npm:@scure/bip39@1.3.0/wordlists/english';
import { KaspaWallet } from 'npm:@okxweb3/coin-kaspa@2.4.9';

// Fixed 15-minute round boundaries aligned to UTC clock
const ROUND_MS = 15 * 60 * 1000;

function getCurrentRoundEnd() {
  return new Date(Math.ceil(Date.now() / ROUND_MS) * ROUND_MS);
}

function getCurrentRoundStart() {
  return new Date(Math.floor(Date.now() / ROUND_MS) * ROUND_MS);
}

const COINS = [
  { id: 'bitcoin', symbol: 'BTC', icon: '₿' },
  { id: 'ethereum', symbol: 'ETH', icon: 'Ξ' },
  { id: 'solana', symbol: 'SOL', icon: '◎' },
  { id: 'ripple', symbol: 'XRP', icon: '✕' },
  { id: 'dogecoin', symbol: 'DOGE', icon: 'Ð' },
  { id: 'binancecoin', symbol: 'BNB', icon: '⬡' },
  { id: 'hyperliquid', symbol: 'HYPE', icon: '⚡' },
  { id: 'kaspa', symbol: 'KAS', icon: '◆' },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const roundStart = getCurrentRoundStart();
    const roundEnd = getCurrentRoundEnd();
    const createdGames = [];

    // Check if games already exist for this round
    const existing = await base44.asServiceRole.entities.PredictionGame.filter({
      end_time: roundEnd.toISOString()
    });
    if (existing.length > 0) {
      return Response.json({ success: true, games_created: 0, games: [], message: 'Games already exist for this round' });
    }

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

    // Fetch all coin prices from CoinGecko in one call
    const coinIds = COINS.map(c => c.id).join(',');
    let priceData = {};
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`);
      priceData = await res.json();
    } catch (e) {
      console.error('CoinGecko fetch failed:', e.message);
      return Response.json({ error: 'Failed to fetch prices' }, { status: 500 });
    }

    // Create a prediction game for each coin
    for (const coin of COINS) {
      const data = priceData[coin.id];
      if (!data?.usd) {
        console.log(`No price data for ${coin.symbol}, skipping`);
        continue;
      }

      const price = data.usd;
      const change24h = data.usd_24h_change;

      // Format price nicely based on magnitude
      let target;
      if (price >= 10000) target = Math.round(price);
      else if (price >= 100) target = parseFloat(price.toFixed(1));
      else if (price >= 1) target = parseFloat(price.toFixed(2));
      else if (price >= 0.01) target = parseFloat(price.toFixed(4));
      else target = parseFloat(price.toFixed(6));

      const formattedPrice = target.toLocaleString('en-US', { maximumFractionDigits: 6 });

      try {
        const escrow = await createEscrow();
        const gameNumber = escrow.address.slice(0, 8).toUpperCase();

        // Kaspa gets a special custom question style
        const isKaspa = coin.symbol === 'KAS';
        const question = isKaspa
          ? `Will KAS break above $${formattedPrice} this round?`
          : `Will ${coin.symbol} be above $${formattedPrice} in 15 min?`;

        const game = await base44.asServiceRole.entities.PredictionGame.create({
          game_number: gameNumber,
          escrow_address: escrow.address,
          escrow_private_key: escrow.privateKey,
          escrow_mnemonic: escrow.mnemonic,
          market_id: `crypto_${coin.id}_${roundEnd.getTime()}`,
          question,
          yes_label: `Above $${formattedPrice}`,
          no_label: `At or below $${formattedPrice}`,
          category: 'Crypto',
          subcategory: coin.symbol,
          source_data: `CoinGecko ${coin.id} price at $${formattedPrice} | 24h: ${change24h?.toFixed(2) || '?'}%`,
          status: 'open',
          start_time: roundStart.toISOString(),
          end_time: roundEnd.toISOString(),
          total_pool_kas: 0, yes_pool_kas: 0, no_pool_kas: 0,
          yes_count: 0, no_count: 0, bot_status: 'ready'
        });

        createdGames.push({ id: game.id, game_number: gameNumber, symbol: coin.symbol, question: game.question, price: formattedPrice });
      } catch (e) {
        console.error(`Failed to create ${coin.symbol} game:`, e.message);
      }
    }

    return Response.json({
      success: true,
      games_created: createdGames.length,
      games: createdGames,
      round: { start: roundStart.toISOString(), end: roundEnd.toISOString() }
    });
  } catch (error) {
    console.error('kachingAutoGenerate error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});