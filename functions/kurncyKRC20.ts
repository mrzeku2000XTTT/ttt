import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      action, 
      fromAddress,
      toAddress, 
      amount, 
      ticker,
      network = 'mainnet',
      iterations = 20,
      encryptedKey,
      pin
    } = await req.json();

    // Decrypt private key if needed
    let privateKey = null;
    if (encryptedKey && pin) {
      try {
        const decryptResult = await base44.functions.invoke('kurncyWallet', {
          action: 'decrypt',
          privateKey: encryptedKey,
          pin
        });
        privateKey = decryptResult.data?.privateKey;
      } catch (error) {
        return Response.json({ error: 'Failed to decrypt private key: ' + error.message }, { status: 400 });
      }
    }

    if (action === 'transfer') {
      if (!fromAddress || !toAddress || !amount || !ticker) {
        return Response.json({ 
          error: 'Missing required fields: fromAddress, toAddress, amount, ticker' 
        }, { status: 400 });
      }

      // Simplified KRC-20 transfer - integrate with real Kaspa API later
      const result = await transferKRC20Mock({
        fromAddress,
        toAddress,
        amount,
        ticker,
        network
      });

      return Response.json({
        success: true,
        ...result
      });
    }

    if (action === 'mint') {
      if (!fromAddress || !ticker) {
        return Response.json({ 
          error: 'Missing required fields: fromAddress, ticker' 
        }, { status: 400 });
      }

      const result = await mintKRC20Mock({
        fromAddress,
        ticker,
        network,
        iterations
      });

      return Response.json({
        success: true,
        ...result
      });
    }

    if (action === 'estimate-fee') {
      const estimation = {
        estimatedFeeSompi: 1500,
        estimatedFeeKAS: 0.000015,
        network
      };

      return Response.json({
        success: true,
        estimation
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('KRC20 error:', error);
    return Response.json({ error: error.message, details: error.stack }, { status: 500 });
  }
});

// Mock transfer function - replace with real Kaspa API integration
async function transferKRC20Mock(params) {
  const { fromAddress, toAddress, amount, ticker, network } = params;
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Generate mock transaction ID
  const txId = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return {
    transactionId: txId,
    fromAddress,
    toAddress,
    amount,
    ticker,
    network,
    status: 'pending'
  };
}

// Mock mint function - replace with real Kaspa API integration
async function mintKRC20Mock(params) {
  const { fromAddress, ticker, network, iterations } = params;
  
  const results = [];
  
  for (let i = 0; i < Math.min(iterations, 5); i++) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const txId = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    results.push({
      iteration: i + 1,
      transactionId: txId,
      ticker
    });
  }
  
  return {
    totalMinted: results.length,
    totalFailed: 0,
    successfulMints: results,
    failedMints: [],
    ticker,
    network
  };
}