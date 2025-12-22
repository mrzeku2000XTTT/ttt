import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { PrivateKey, Address, Transaction } from 'npm:@kaspa/wallet@0.1.6';

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
      iterations = 20,
      encryptedKey,
      pin
    } = await req.json();

    // Decrypt private key if needed
    let privateKey = fromPrivateKey;
    if (encryptedKey && pin) {
      privateKey = await base44.functions.invoke('kurncyWallet', {
        action: 'decrypt',
        privateKey: encryptedKey,
        pin
      }).then(r => r.data.privateKey);
    }

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
  
  const privKey = new PrivateKey(fromPrivateKey);
  const fromAddress = Address.fromPublicKey(privKey.toPublicKey(), network);
  
  const apiUrl = network === 'mainnet' 
    ? 'https://api.kaspa.org' 
    : 'https://api-testnet.kaspa.org';

  // Get UTXOs
  const utxosResponse = await fetch(`${apiUrl}/addresses/${fromAddress}/utxos`);
  const utxosData = await utxosResponse.json();
  const utxos = utxosData.utxos || [];

  if (utxos.length === 0) {
    throw new Error('No UTXOs available');
  }

  // Build KRC-20 transfer transaction with OP_RETURN
  const krc20Data = `krc20:transfer:${ticker}:${amount}`;
  
  const tx = {
    version: 0,
    inputs: utxos.slice(0, 5).map(utxo => ({
      previousOutpoint: {
        transactionId: utxo.transactionId,
        index: utxo.index
      },
      signatureScript: '',
      sequence: 0
    })),
    outputs: [
      {
        value: 0,
        scriptPublicKey: {
          version: 0,
          script: `OP_RETURN ${Buffer.from(krc20Data).toString('hex')}`
        }
      },
      {
        value: utxos[0].value - 1000, // Change output (minus fee)
        scriptPublicKey: {
          version: 0,
          script: fromAddress.scriptPublicKey
        }
      }
    ],
    lockTime: 0
  };

  // Sign transaction
  const signedTx = await signTransaction(tx, privKey);

  // Submit transaction
  const submitResponse = await fetch(`${apiUrl}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transaction: signedTx })
  });

  if (!submitResponse.ok) {
    throw new Error(`Transaction submission failed: ${await submitResponse.text()}`);
  }

  const result = await submitResponse.json();
  
  return {
    transactionId: result.transactionId,
    fromAddress: fromAddress.toString(),
    toAddress,
    amount,
    ticker,
    network
  };
}

async function mintKRC20(params) {
  const { fromPrivateKey, ticker, network, priorityFee, iterations } = params;
  
  const privKey = new PrivateKey(fromPrivateKey);
  const fromAddress = Address.fromPublicKey(privKey.toPublicKey(), network);
  
  const apiUrl = network === 'mainnet' 
    ? 'https://api.kaspa.org' 
    : 'https://api-testnet.kaspa.org';

  const results = [];
  const failed = [];
  
  for (let i = 0; i < iterations; i++) {
    try {
      // Get fresh UTXOs for each mint
      const utxosResponse = await fetch(`${apiUrl}/addresses/${fromAddress}/utxos`);
      const utxosData = await utxosResponse.json();
      const utxos = utxosData.utxos || [];

      if (utxos.length === 0) {
        failed.push({ iteration: i + 1, error: 'No UTXOs available' });
        continue;
      }

      const krc20Data = `krc20:mint:${ticker}`;
      
      const tx = {
        version: 0,
        inputs: [utxos[0]].map(utxo => ({
          previousOutpoint: {
            transactionId: utxo.transactionId,
            index: utxo.index
          },
          signatureScript: '',
          sequence: 0
        })),
        outputs: [
          {
            value: 0,
            scriptPublicKey: {
              version: 0,
              script: `OP_RETURN ${Buffer.from(krc20Data).toString('hex')}`
            }
          },
          {
            value: utxos[0].value - 1000,
            scriptPublicKey: {
              version: 0,
              script: fromAddress.scriptPublicKey
            }
          }
        ],
        lockTime: 0
      };

      const signedTx = await signTransaction(tx, privKey);

      const submitResponse = await fetch(`${apiUrl}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction: signedTx })
      });

      if (submitResponse.ok) {
        const result = await submitResponse.json();
        results.push({
          iteration: i + 1,
          transactionId: result.transactionId,
          ticker
        });
      } else {
        failed.push({
          iteration: i + 1,
          error: await submitResponse.text()
        });
      }

      // Small delay between mints
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      failed.push({
        iteration: i + 1,
        error: error.message
      });
    }
  }

  return {
    totalMinted: results.length,
    totalFailed: failed.length,
    successfulMints: results,
    failedMints: failed,
    ticker,
    network
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

async function signTransaction(tx, privateKey) {
  // Sign each input with the private key
  const signedInputs = await Promise.all(
    tx.inputs.map(async (input) => {
      const signature = await privateKey.sign(JSON.stringify(tx));
      return {
        ...input,
        signatureScript: signature.toString('hex')
      };
    })
  );

  return {
    ...tx,
    inputs: signedInputs
  };
}