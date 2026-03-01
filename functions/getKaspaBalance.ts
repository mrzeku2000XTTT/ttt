import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    let address;
    
    if (req.method === 'POST') {
      const body = await req.json();
      address = body.address;
    } else {
      const url = new URL(req.url);
      address = url.searchParams.get('address');
    }

    if (!address) {
      return Response.json({ error: 'Address required' }, { status: 400 });
    }

    // Ensure kaspa: prefix is present for the API
    const cleanAddress = address.startsWith('kaspa:') ? address : `kaspa:${address}`;
    
    console.log('🔍 Fetching balance for:', cleanAddress);

    // Try multiple APIs in order
    const apis = [
      {
        name: 'Kaspa.org API',
        url: `https://api.kaspa.org/addresses/${cleanAddress}/balance`,
        // API returns { "address": "kaspa:...", "balance": 12345678 } in sompi
        parser: (data) => {
          const sompi = typeof data.balance === 'number' ? data.balance : parseInt(data.balance ?? '0');
          return { balanceSompi: sompi, balanceKAS: sompi / 100000000 };
        }
      },
      {
        name: 'Kaspa.org UTXOs',
        url: `https://api.kaspa.org/addresses/${cleanAddress}/utxos`,
        // Fallback: sum UTXOs if balance endpoint fails
        parser: (data) => {
          const utxos = Array.isArray(data) ? data : [];
          const sompi = utxos.reduce((acc, u) => acc + parseInt(u?.utxoEntry?.amount ?? 0), 0);
          return { balanceSompi: sompi, balanceKAS: sompi / 100000000 };
        }
      }
    ];

    let lastError = null;

    for (const api of apis) {
      try {
        console.log(`📡 Trying ${api.name}:`, api.url);
        
        const response = await fetch(api.url, {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          },
          signal: AbortSignal.timeout(5000) // 5 second timeout per API
        });

        if (!response.ok) {
          console.warn(`⚠️ ${api.name} returned ${response.status}`);
          lastError = `${api.name} error: ${response.status}`;
          continue;
        }

        const data = await response.json();
        console.log(`📦 ${api.name} response:`, JSON.stringify(data));

        const { balanceSompi, balanceKAS } = api.parser(data);

        console.log(`✅ Balance from ${api.name}:`, balanceKAS, 'KAS');

        return Response.json({
          success: true,
          balanceKAS: balanceKAS,
          balanceSompi: balanceSompi,
          address: cleanAddress,
          source: api.name
        });

      } catch (apiError) {
        console.warn(`⚠️ ${api.name} failed:`, apiError.message);
        lastError = `${api.name}: ${apiError.message}`;
        continue;
      }
    }

    // All APIs failed
    console.error('❌ All APIs failed. Last error:', lastError);
    
    // Return 0 balance instead of error to prevent app crash
    return Response.json({
      success: true,
      balanceKAS: 0,
      balanceSompi: 0,
      address: cleanAddress,
      warning: 'Could not fetch balance from any API',
      lastError: lastError
    });

  } catch (error) {
    console.error('❌ getKaspaBalance critical error:', error);
    
    // Return 0 balance instead of 500 error
    return Response.json({ 
      success: true,
      balanceKAS: 0,
      balanceSompi: 0,
      error: error.message || 'Failed to fetch balance',
      warning: 'Returned default balance due to error'
    });
  }
});