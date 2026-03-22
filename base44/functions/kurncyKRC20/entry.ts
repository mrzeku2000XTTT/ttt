import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import * as secp256k1 from 'npm:@noble/secp256k1@2.0.0';

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
        
        if (!privateKey) {
          return Response.json({ error: 'Failed to decrypt private key' }, { status: 400 });
        }
      } catch (error) {
        return Response.json({ error: 'Invalid PIN or decryption failed' }, { status: 400 });
      }
    }

    if (action === 'transfer') {
      if (!fromAddress || !toAddress || !amount || !ticker) {
        return Response.json({ 
          error: 'Missing required fields: fromAddress, toAddress, amount, ticker' 
        }, { status: 400 });
      }

      if (!privateKey) {
        return Response.json({ error: 'Private key required for transfer' }, { status: 400 });
      }

      const result = await transferKRC20({
        privateKey,
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

      if (!privateKey) {
        return Response.json({ error: 'Private key required for minting' }, { status: 400 });
      }

      const result = await mintKRC20({
        privateKey,
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
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function transferKRC20(params) {
  const { privateKey, fromAddress, toAddress, amount, ticker, network } = params;
  
  const apiUrl = network === 'mainnet' 
    ? 'https://api.kaspa.org' 
    : 'https://api-testnet.kaspa.org';

  try {
    // Fetch UTXOs
    const utxosResponse = await fetch(`${apiUrl}/addresses/${fromAddress}/utxos`);
    if (!utxosResponse.ok) {
      throw new Error('Failed to fetch UTXOs');
    }
    
    const utxosData = await utxosResponse.json();
    const utxos = utxosData.utxos || [];

    if (utxos.length === 0) {
      throw new Error('No UTXOs available. Fund your wallet first.');
    }

    // Build KRC-20 transfer transaction
    const krc20OpReturn = buildKRC20OpReturn('transfer', ticker, amount);
    const tx = await buildTransaction(utxos, fromAddress, krc20OpReturn, 1000);
    
    // Sign transaction
    const signedTx = await signTransaction(tx, privateKey);
    
    // Submit transaction
    const submitResponse = await fetch(`${apiUrl}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signedTx)
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      throw new Error(`Transaction failed: ${errorText}`);
    }

    const result = await submitResponse.json();
    
    return {
      transactionId: result.transactionId || result.txId || 'pending',
      fromAddress,
      toAddress,
      amount,
      ticker,
      network,
      status: 'submitted'
    };
  } catch (error) {
    throw new Error(`Transfer failed: ${error.message}`);
  }
}

async function mintKRC20(params) {
  const { privateKey, fromAddress, ticker, network, iterations } = params;
  
  const apiUrl = network === 'mainnet' 
    ? 'https://api.kaspa.org' 
    : 'https://api-testnet.kaspa.org';

  const results = [];
  const failed = [];
  
  for (let i = 0; i < Math.min(iterations, 50); i++) {
    try {
      // Fetch fresh UTXOs
      const utxosResponse = await fetch(`${apiUrl}/addresses/${fromAddress}/utxos`);
      if (!utxosResponse.ok) {
        failed.push({ iteration: i + 1, error: 'Failed to fetch UTXOs' });
        continue;
      }
      
      const utxosData = await utxosResponse.json();
      const utxos = utxosData.utxos || [];

      if (utxos.length === 0) {
        failed.push({ iteration: i + 1, error: 'No UTXOs available' });
        break;
      }

      // Build mint transaction
      const krc20OpReturn = buildKRC20OpReturn('mint', ticker);
      const tx = await buildTransaction(utxos.slice(0, 1), fromAddress, krc20OpReturn, 1000);
      
      // Sign and submit
      const signedTx = await signTransaction(tx, privateKey);
      
      const submitResponse = await fetch(`${apiUrl}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signedTx)
      });

      if (submitResponse.ok) {
        const result = await submitResponse.json();
        results.push({
          iteration: i + 1,
          transactionId: result.transactionId || result.txId || `mint_${i + 1}`,
          ticker
        });
      } else {
        const errorText = await submitResponse.text();
        failed.push({ iteration: i + 1, error: errorText });
      }

      // Delay between mints
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      failed.push({ iteration: i + 1, error: error.message });
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

function buildKRC20OpReturn(operation, ticker, amount = null) {
  let data = `krc20:${operation}:${ticker}`;
  if (amount) {
    data += `:${amount}`;
  }
  return stringToHex(data);
}

async function buildTransaction(utxos, changeAddress, opReturnHex, fee) {
  const totalInput = utxos.reduce((sum, utxo) => sum + BigInt(utxo.amount || 0), 0n);
  const changeAmount = totalInput - BigInt(fee);

  return {
    version: 0,
    inputs: utxos.map(utxo => ({
      previousOutpoint: {
        transactionId: utxo.outpoint?.transactionId || utxo.transactionId,
        index: utxo.outpoint?.index || utxo.index || 0
      },
      signatureScript: '',
      sequence: 0
    })),
    outputs: [
      {
        value: 0,
        scriptPublicKey: {
          version: 0,
          scriptPublicKey: `6a${opReturnHex}` // OP_RETURN
        }
      },
      {
        value: changeAmount.toString(),
        scriptPublicKey: {
          version: 0,
          scriptPublicKey: changeAddress
        }
      }
    ],
    lockTime: 0
  };
}

async function signTransaction(tx, privateKeyHex) {
  const privKeyBytes = hexToBytes(privateKeyHex);
  const txHash = await hashTransaction(tx);
  const signature = await secp256k1.sign(txHash, privKeyBytes);
  
  const signedInputs = tx.inputs.map(input => ({
    ...input,
    signatureScript: bytesToHex(signature)
  }));

  return {
    ...tx,
    inputs: signedInputs
  };
}

async function hashTransaction(tx) {
  const encoder = new TextEncoder();
  const txString = JSON.stringify(tx);
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(txString));
  return new Uint8Array(hash);
}

function stringToHex(str) {
  return Array.from(str).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
}

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}