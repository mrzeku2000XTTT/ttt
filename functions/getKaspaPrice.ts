Deno.serve(async (req) => {
  try {
    console.log('💰 Fetching live KAS price...');

    // Try CoinGecko first (most reliable)
    try {
      const cgResponse = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=kaspa&vs_currencies=usd',
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
          console.log(`✅ CoinGecko KAS Price: $${price}`);
          return Response.json({
            success: true,
            price: price,
            priceUSD: price,
            source: 'coingecko'
          });
        }
      }
    } catch (cgError) {
      console.log('CoinGecko failed, trying backup...');
    }

    // Try Replit backup
    const replitResponse = await fetch(
      'https://tttxxx.live/kas-price',
      {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      }
    );

    if (replitResponse.ok) {
      const data = await replitResponse.json();
      if (data?.price) {
        console.log(`✅ Replit KAS Price: $${data.price}`);
        return Response.json({
          success: true,
          price: data.price,
          priceUSD: data.price,
          source: 'replit'
        });
      }
    }

    throw new Error('All price sources failed');

  } catch (error) {
    console.error('❌ Price fetch error:', error.message);
    
    // Return error instead of fallback
    return Response.json({ 
      success: false, 
      error: 'Unable to fetch live price',
      price: null
    }, { status: 503 });
  }
});