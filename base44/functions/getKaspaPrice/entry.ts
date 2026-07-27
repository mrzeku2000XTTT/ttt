Deno.serve(async (req) => {
  try {
    console.log('💰 Fetching live KAS price...');

    const opts = { method: 'GET', signal: AbortSignal.timeout(8000), headers: { 'Accept': 'application/json' } };

    // 1. Gate.io — has both price and 24h change percentage
    try {
      const gateRes = await fetch('https://api.gateio.ws/api/v4/spot/tickers?currency_pair=KAS_USDT', opts);
      if (gateRes.ok) {
        const gateData = await gateRes.json();
        const tick = Array.isArray(gateData) ? gateData[0] : null;
        if (tick?.last) {
          const price = parseFloat(tick.last);
          const change24h = parseFloat(tick.change_percentage || 0);
          console.log(`✅ Gate.io KAS Price: $${price} (${change24h > 0 ? '+' : ''}${change24h.toFixed(2)}%)`);
          return Response.json({ success: true, price, priceUSD: price, change24h, source: 'gateio' });
        }
      }
    } catch (e) { console.log('Gate.io failed:', e.message); }

    // 2. KuCoin — price only (no 24h change in this endpoint)
    try {
      const kuRes = await fetch('https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=KAS-USDT', opts);
      if (kuRes.ok) {
        const kuData = await kuRes.json();
        const price = parseFloat(kuData?.data?.price);
        if (price) {
          console.log(`✅ KuCoin KAS Price: $${price}`);
          return Response.json({ success: true, price, priceUSD: price, change24h: 0, source: 'kucoin' });
        }
      }
    } catch (e) { console.log('KuCoin failed:', e.message); }

    // 3. MEXC — price only
    try {
      const mexcRes = await fetch('https://api.mexc.com/api/v3/ticker/price?symbol=KASUSDT', opts);
      if (mexcRes.ok) {
        const mexcData = await mexcRes.json();
        const price = parseFloat(mexcData?.price);
        if (price) {
          console.log(`✅ MEXC KAS Price: $${price}`);
          return Response.json({ success: true, price, priceUSD: price, change24h: 0, source: 'mexc' });
        }
      }
    } catch (e) { console.log('MEXC failed:', e.message); }

    // 4. CoinGecko Free
    try {
      const cgRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=kaspa&vs_currencies=usd&include_24hr_change=true', opts);
      if (cgRes.ok) {
        const cgData = await cgRes.json();
        if (cgData?.kaspa?.usd) {
          const price = cgData.kaspa.usd;
          const change24h = cgData.kaspa.usd_24h_change || 0;
          console.log(`✅ CoinGecko KAS Price: $${price}`);
          return Response.json({ success: true, price, priceUSD: price, change24h, source: 'coingecko_free' });
        }
      }
    } catch (e) { console.log('CoinGecko failed:', e.message); }

    // 5. CoinMarketCap data-api
    try {
      const cmcRes = await fetch('https://api.coinmarketcap.com/data-api/v3/cryptocurrency/quote/latest?id=20396&convert=USD', opts);
      if (cmcRes.ok) {
        const cmcData = await cmcRes.json();
        const cmcItem = Array.isArray(cmcData?.data) ? cmcData.data[0] : cmcData?.data;
        const cmcQuote = Array.isArray(cmcItem?.quotes) ? cmcItem.quotes[0] : cmcItem?.quotes;
        if (cmcQuote?.price) {
          const price = parseFloat(cmcQuote.price);
          const change24h = parseFloat(cmcQuote.percentChange24h ?? cmcQuote.percentChange1h ?? 0);
          console.log(`✅ CoinMarketCap KAS Price: $${price}`);
          return Response.json({ success: true, price, priceUSD: price, change24h, source: 'coinmarketcap' });
        }
      }
    } catch (e) { console.log('CoinMarketCap failed:', e.message); }

    throw new Error('All price sources failed');

  } catch (error) {
    console.error('❌ Price fetch error:', error.message);
    return Response.json({ success: false, error: 'Unable to fetch live price', price: null }, { status: 503 });
  }
});