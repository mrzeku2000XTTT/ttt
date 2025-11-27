// UPDATED: Now uses Replit iframe communication for UTXO history
// This function is now a thin wrapper that communicates with the iframe

Deno.serve(async (req) => {
  try {
    let address;
    
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      address = body.address;
    } else {
      const url = new URL(req.url);
      address = url.searchParams.get('address');
    }

    if (!address || !address.trim()) {
      return Response.json({ 
        success: false, 
        error: 'Address is required' 
      }, { status: 400 });
    }

    console.log('💰 Fetching UTXOs via Replit backend for:', address);

    // Call Replit backend directly
    const response = await fetch(
      'https://tttxxx.live/api/utxo-history',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ address }),
        signal: AbortSignal.timeout(30000)
      }
    );

    if (!response.ok) {
      throw new Error(`Replit backend error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Received ${data.utxoCount} UTXOs, ${data.history?.length || 0} history items`);
      
      // Transform history into UTXO format for compatibility
      const utxos = data.history ? data.history.map(tx => ({
        transactionId: tx.txId,
        amount: Number(tx.amount),
        blockTime: tx.timestamp ? Math.floor(tx.timestamp / 1000) : null,
        blockDaaScore: tx.blockDaaScore,
        outputIndex: tx.index || 0,
        isCoinbase: tx.isCoinbase || false,
        isSpent: false
      })) : [];

      return Response.json({
        success: true,
        address: address,
        balance: data.balance,
        balanceKAS: data.balance ? Number(data.balance.kas) : 0,
        utxoCount: data.utxoCount || 0,
        utxos: utxos,
        history: data.history || []
      });
    } else {
      return Response.json({
        success: false,
        error: data.error || 'Unknown error from Replit backend'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ UTXO fetch error:', error.message);
    return Response.json({ 
      success: false,
      error: error.message,
      utxos: [],
      history: []
    }, { status: 500 });
  }
});