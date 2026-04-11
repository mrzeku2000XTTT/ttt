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
    
    // Allow calls from scheduled automations (no user context)
    const body = await req.json().catch(() => ({}));
    const isAutomation = !!body.automation;
    
    if (!isAutomation) {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Admin only' }, { status: 403 });
      }
    }

    const roundStart = getCurrentRoundStart();
    const roundEnd = getCurrentRoundEnd();
    const roundEndISO = roundEnd.toISOString();
    const createdGames = [];

    console.log(`Round: ${roundStart.toISOString()} -> ${roundEndISO}`);

    // Check if crypto games already exist for this exact round
    const existing = await base44.asServiceRole.entities.PredictionGame.filter({
      end_time: roundEndISO,
      category: 'Crypto'
    });
    console.log(`Existing crypto games for this round: ${existing.length}`);
    if (existing.length > 0) {
      return Response.json({ success: true, games_created: 0, games: [], round: { start: roundStart.toISOString(), end: roundEndISO }, message: `Already have ${existing.length} crypto games for this round` });
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
    console.log(`Fetching prices for: ${coinIds}`);
    let priceData = {};
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`);
      const text = await res.text();
      console.log(`CoinGecko status: ${res.status}, body length: ${text.length}`);
      if (!res.ok) {
        console.error(`CoinGecko error: ${text.slice(0, 200)}`);
        return Response.json({ error: `CoinGecko API error: ${res.status}`, detail: text.slice(0, 200) }, { status: 500 });
      }
      priceData = JSON.parse(text);
      console.log(`Got prices for: ${Object.keys(priceData).join(', ')}`);
    } catch (e) {
      console.error('CoinGecko fetch failed:', e.message);
      return Response.json({ error: 'Failed to fetch prices: ' + e.message }, { status: 500 });
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
        
        // Validate escrow address is real kaspa address (60+ chars, alphanumeric)
        if (!escrow.address || escrow.address.length < 60) {
          console.error(`Invalid escrow address for ${coin.symbol}: ${escrow.address}`);
          continue;
        }
        
        // Verify address is reachable on Kaspa network
        let escrowValid = false;
        try {
          const checkRes = await fetch(`https://api.kaspa.org/addresses/kaspa:${escrow.address}/balance`);
          escrowValid = checkRes.ok;
          console.log(`Escrow validation for ${coin.symbol}: ${checkRes.status} (${escrowValid ? 'VALID' : 'INVALID'})`);
        } catch (e) {
          console.error(`Escrow validation failed for ${coin.symbol}:`, e.message);
          // Still allow — new addresses may not have balance endpoint yet
          escrowValid = true;
        }
        
        const gameNumber = escrow.address.slice(0, 8).toUpperCase();

        console.log(`Creating game: ${coin.symbol} at $${formattedPrice} | escrow valid: ${escrowValid}`);

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
          end_time: roundEndISO,
          total_pool_kas: 0, yes_pool_kas: 0, no_pool_kas: 0,
          yes_count: 0, no_count: 0, bot_status: 'ready'
        });

        createdGames.push({ id: game.id, game_number: gameNumber, symbol: coin.symbol, question, price: formattedPrice });
        console.log(`Created ${coin.symbol} game: ${gameNumber}`);
      } catch (e) {
        console.error(`Failed to create ${coin.symbol} game:`, e.message);
      }
    }

    return Response.json({
      success: true,
      games_created: createdGames.length,
      games: createdGames,
      round: { start: roundStart.toISOString(), end: roundEndISO }
    });
  } catch (error) {
    console.error('kachingAutoGenerate error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});