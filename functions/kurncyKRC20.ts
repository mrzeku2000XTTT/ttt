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
      fromPrivateKey, 
      toAddress, 
      amount, 
      ticker,
      network = 'mainnet',
      priorityFee = '0',
      iterations = 20 
    } = await req.json();

    if (action === 'transfer') {
      // Validate required fields
      if (!fromPrivateKey || !toAddress || !amount || !ticker) {
        return Response.json({ 
          error: 'Missing required fields: fromPrivateKey, toAddress, amount, ticker' 
        }, { status: 400 });
      }

      // KRC-20 Transfer Logic
      // This would connect to Kaspa node and perform the KRC-20 token transfer
      const result = await transferKRC20({
        fromPrivateKey,
        toAddress,
        amount,
        ticker,
        network,
        priorityFee
      });

      return Response.json({
        success: true,
        ...result,
        transferDetails: {
          amount,
          ticker,
          toAddress,
          network
        }
      });
    }

    if (action === 'mint') {
      if (!fromPrivateKey || !ticker) {
        return Response.json({ 
          error: 'Missing required fields: fromPrivateKey, ticker' 
        }, { status: 400 });
      }

      // KRC-20 Minting Logic
      const result = await mintKRC20({
        fromPrivateKey,
        ticker,
        network,
        priorityFee,
        iterations
      });

      return Response.json({
        success: true,
        ...result,
        mintDetails: {
          ticker,
          iterations,
          network
        }
      });
    }

    if (action === 'estimate-fee') {
      if (!fromPrivateKey || !toAddress || !amount || !ticker) {
        return Response.json({ 
          error: 'Missing required fields for fee estimation' 
        }, { status: 400 });
      }

      // Fee Estimation Logic
      const estimation = await estimateKRC20Fee({
        fromPrivateKey,
        toAddress,
        amount,
        ticker,
        network
      });

      return Response.json({
        success: true,
        estimation
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('KRC20 error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function transferKRC20(params) {
  const { fromPrivateKey, toAddress, amount, ticker, network, priorityFee } = params;
  
  // Connect to Kaspa node
  const nodeUrl = network === 'mainnet' 
    ? 'https://api.kaspa.org' 
    : 'https://api-testnet.kaspa.org';

  // Build KRC-20 transfer transaction
  // This is a simplified version - actual implementation would use Kaspa SDK
  const response = await fetch(`${nodeUrl}/v1/transactions/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      privateKey: fromPrivateKey,
      outputs: [{
        address: toAddress,
        amount: '0', // KRC-20 uses OP_RETURN, KAS amount is 0
        scriptPublicKey: {
          version: 0,
          script: buildKRC20TransferScript(ticker, amount)
        }
      }],
      priorityFee
    })
  });

  if (!response.ok) {
    throw new Error(`Transfer failed: ${await response.text()}`);
  }

  return await response.json();
}

async function mintKRC20(params) {
  const { fromPrivateKey, ticker, network, priorityFee, iterations } = params;
  
  const nodeUrl = network === 'mainnet' 
    ? 'https://api.kaspa.org' 
    : 'https://api-testnet.kaspa.org';

  const results = [];
  
  for (let i = 0; i < iterations; i++) {
    const response = await fetch(`${nodeUrl}/v1/transactions/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        privateKey: fromPrivateKey,
        outputs: [{
          amount: '0',
          scriptPublicKey: {
            version: 0,
            script: buildKRC20MintScript(ticker)
          }
        }],
        priorityFee
      })
    });

    if (response.ok) {
      results.push(await response.json());
    }
  }

  return {
    totalMinted: results.length,
    transactions: results
  };
}

async function estimateKRC20Fee(params) {
  const { network } = params;
  
  // Estimate based on network conditions
  const baseFeeSompi = 1000; // Base fee in sompi
  const krc20OpReturnFee = 500; // Additional fee for OP_RETURN
  
  return {
    estimatedFeeSompi: baseFeeSompi + krc20OpReturnFee,
    estimatedFeeKAS: (baseFeeSompi + krc20OpReturnFee) / 100000000,
    network
  };
}

function buildKRC20TransferScript(ticker, amount) {
  // Build OP_RETURN script for KRC-20 transfer
  // Format: OP_RETURN "krc20:transfer" <ticker> <amount>
  return `OP_RETURN krc20:transfer ${ticker} ${amount}`;
}

function buildKRC20MintScript(ticker) {
  // Build OP_RETURN script for KRC-20 mint
  // Format: OP_RETURN "krc20:mint" <ticker>
  return `OP_RETURN krc20:mint ${ticker}`;
}