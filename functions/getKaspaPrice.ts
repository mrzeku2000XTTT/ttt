Deno.serve(async (req) => {
  try {
    console.log('💰 Fetching KAS price from Replit...');

    // DIRECTLY call Replit - NO processing
    const response = await fetch(
      'https://tttxxx.live/kas-price',
      {
        method: 'GET',
        signal: AbortSignal.timeout(30000)
      }
    );

    if (!response.ok) {
      throw new Error(`Replit backend error: ${response.status}`);
    }

    const data = await response.json();
    const price = data.price !== undefined ? data.price : 0;

    console.log(`✅ KAS Price: $${price}`);

    return Response.json({
      success: true,
      price: price,
      priceUSD: price
    });

  } catch (error) {
    console.error('❌ Price error:', error.message);
    return Response.json({ 
      success: true, 
      price: 0.059,
      priceUSD: 0.059
    });
  }
});