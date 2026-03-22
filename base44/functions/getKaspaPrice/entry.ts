Deno.serve(async (req) => {
  try {
    console.log('💰 Fetching live KAS price...');

    // Try CoinGecko Pro API
    try {
      const cgResponse = await fetch(
        'https://pro-api.coingecko.com/api/v3/simple/price?ids=kaspa&vs_currencies=usd&include_24hr_change=true',
        {
          method: 'GET',
          signal: AbortSignal.timeout(10000),
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (cgResponse.ok) {
        const cgData = await cgResponse.json();
        if (cgData?.kaspa?.usd) {
          const price = cgData.kaspa.usd;
          const change24h = cgData.kaspa.usd_24h_change || 0;
          console.log(`✅ CoinGecko Pro KAS Price: $${price} (${change24h > 0 ? '+' : ''}${change24h.toFixed(2)}%)`);
          return Response.json({
            success: true,
            price: price,
            priceUSD: price,
            change24h: change24h,
            source: 'coingecko_pro'
          });
        }
      }
    } catch (cgError) {
      console.log('CoinGecko Pro failed, trying free API...');
    }

    // Try CoinGecko Free API
    try {
      const cgFreeResponse = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=kaspa&vs_currencies=usd&include_24hr_change=true',
        {
          method: 'GET',
          signal: AbortSignal.timeout(10000),
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (cgFreeResponse.ok) {
        const cgData = await cgFreeResponse.json();
        if (cgData?.kaspa?.usd) {
          const price = cgData.kaspa.usd;
          const change24h = cgData.kaspa.usd_24h_change || 0;
          console.log(`✅ CoinGecko Free KAS Price: $${price}`);
          return Response.json({
            success: true,
            price: price,
            priceUSD: price,
            change24h: change24h,
            source: 'coingecko_free'
          });
        }
      }
    } catch (freeError) {
      console.log('CoinGecko Free API failed, trying backup...');
    }

    // Try CoinMarketCap
    try {
      const cmcResponse = await fetch(
        'https://api.coinmarketcap.com/data-api/v3/cryptocurrency/quote/latest?id=20396&convert=USD',
        {
          method: 'GET',
          signal: AbortSignal.timeout(10000),
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (cmcResponse.ok) {
        const cmcData = await cmcResponse.json();
        if (cmcData?.data?.quote?.USD?.price) {
          const price = cmcData.data.quote.USD.price;
          const change24h = cmcData.data.quote.USD.percent_change_24h || 0;
          console.log(`✅ CoinMarketCap KAS Price: $${price}`);
          return Response.json({
            success: true,
            price: price,
            priceUSD: price,
            change24h: change24h,
            source: 'coinmarketcap'
          });
        }
      }
    } catch (cmcError) {
      console.log('CoinMarketCap failed, trying next...');
    }

    // Try CoinCap
    try {
      const ccResponse = await fetch(
        'https://api.coincap.io/v2/assets/kaspa',
        {
          method: 'GET',
          signal: AbortSignal.timeout(10000),
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (ccResponse.ok) {
        const ccData = await ccResponse.json();
        if (ccData?.data?.priceUsd) {
          const price = parseFloat(ccData.data.priceUsd);
          const change24h = parseFloat(ccData.data.changePercent24Hr || 0);
          console.log(`✅ CoinCap KAS Price: $${price}`);
          return Response.json({
            success: true,
            price: price,
            priceUSD: price,
            change24h: change24h,
            source: 'coincap'
          });
        }
      }
    } catch (ccError) {
      console.log('CoinCap failed...');
    }

    throw new Error('All price sources failed');

  } catch (error) {
    console.error('❌ Price fetch error:', error.message);
    
    return Response.json({ 
      success: false, 
      error: 'Unable to fetch live price',
      price: null
    }, { status: 503 });
  }
});