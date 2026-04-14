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
  { id: 'kaspa', symbol: 'KAS', icon: '◆' },
  { id: 'bitcoin', symbol: 'BTC', icon: '₿' },
  { id: 'ethereum', symbol: 'ETH', icon: 'Ξ' },
  { id: 'solana', symbol: 'SOL', icon: '◎' },
  { id: 'ripple', symbol: 'XRP', icon: '✕' },
  { id: 'dogecoin', symbol: 'DOGE', icon: 'Ð' },
  { id: 'binancecoin', symbol: 'BNB', icon: '⬡' },
  { id: 'hyperliquid', symbol: 'HYPE', icon: '⚡' },
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

    // Check existing games for this round — only create coins that are missing
    const existing = await base44.asServiceRole.entities.PredictionGame.filter({
      end_time: roundEndISO,
      category: 'Crypto'
    });
    const existingSymbols = new Set(existing.map(g => g.subcategory));
    console.log(`Existing crypto games for this round: ${existing.length} [${[...existingSymbols].join(',')}]`);

    // Filter to only coins that don't have a game yet
    const coinsToCreate = COINS.filter(c => !existingSymbols.has(c.symbol));
    if (coinsToCreate.length === 0) {
      return Response.json({ success: true, games_created: 0, games: [], round: { start: roundStart.toISOString(), end: roundEndISO }, message: `Already have all ${existing.length} crypto games for this round` });
    }
    console.log(`Creating ${coinsToCreate.length} missing games: ${coinsToCreate.map(c => c.symbol).join(', ')}`);

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

    // Fetch all coin prices — try multiple sources
    const coinIds = coinsToCreate.map(c => c.id).join(',');
    console.log(`Fetching prices for: ${coinIds}`);
    let priceData = {};

    // CoinGecko symbol-to-Binance mapping for fallback
    const BINANCE_SYMBOLS = {
      kaspa: 'KASUSDT', bitcoin: 'BTCUSDT', ethereum: 'ETHUSDT',
      solana: 'SOLUSDT', ripple: 'XRPUSDT', dogecoin: 'DOGEUSDT',
      binancecoin: 'BNBUSDT', hyperliquid: 'HYPEUSDT',
    };

    // Source 1: CoinGecko
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`);
      if (res.ok) {
        priceData = await res.json();
        console.log(`CoinGecko OK: ${Object.keys(priceData).join(', ')}`);
      } else {
        console.log(`CoinGecko rate limited (${res.status}), trying fallbacks...`);
      }
    } catch (e) {
      console.log(`CoinGecko failed: ${e.message}, trying fallbacks...`);
    }

    // Source 2: Binance public API (no key needed) — fill missing coins
    const missingCoins = coinsToCreate.filter(c => !priceData[c.id]?.usd);
    if (missingCoins.length > 0) {
      console.log(`Trying Binance for ${missingCoins.length} missing coins...`);
      for (const coin of missingCoins) {
        const sym = BINANCE_SYMBOLS[coin.id];
        if (!sym) continue;
        try {
          const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${sym}`);
          if (res.ok) {
            const data = await res.json();
            if (data.price) {
              priceData[coin.id] = { usd: parseFloat(data.price), usd_24h_change: 0 };
              console.log(`Binance ${coin.id}: $${data.price}`);
            }
          }
        } catch (e) {
          console.log(`Binance ${coin.id} failed: ${e.message}`);
        }
      }
    }

    // Source 3: CryptoCompare (no key needed for basic) — fill any still missing
    const stillMissing = coinsToCreate.filter(c => !priceData[c.id]?.usd);
    if (stillMissing.length > 0) {
      const symbols = stillMissing.map(c => c.symbol).join(',');
      console.log(`Trying CryptoCompare for: ${symbols}`);
      try {
        const res = await fetch(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${symbols}&tsyms=USD`);
        if (res.ok) {
          const data = await res.json();
          for (const coin of stillMissing) {
            if (data[coin.symbol]?.USD) {
              priceData[coin.id] = { usd: data[coin.symbol].USD, usd_24h_change: 0 };
              console.log(`CryptoCompare ${coin.symbol}: $${data[coin.symbol].USD}`);
            }
          }
        }
      } catch (e) {
        console.log(`CryptoCompare failed: ${e.message}`);
      }
    }

    const finalMissing = coinsToCreate.filter(c => !priceData[c.id]?.usd);
    if (finalMissing.length > 0) {
      console.log(`Still missing prices for: ${finalMissing.map(c => c.symbol).join(', ')}`);
    }
    if (Object.keys(priceData).length === 0) {
      return Response.json({ error: 'All price sources failed' }, { status: 500 });
    }
    console.log(`Final prices available: ${Object.keys(priceData).join(', ')}`);

    // Create a prediction game for each missing coin
    for (const coin of coinsToCreate) {
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
      const question = `Will ${coin.symbol} be above $${formattedPrice} at round end?`;

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