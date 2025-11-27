import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { address, expectedAmount, timestamp } = await req.json();

    if (!address || !expectedAmount || !timestamp) {
      return Response.json({ 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }

    const targetAmount = parseFloat(expectedAmount);
    const targetTimestamp = parseInt(timestamp);
    const KASPA_API_KEY = Deno.env.get('KASPA_API_KEY');

    console.log('🔍 ZK Verification:', { address, targetAmount, targetTimestamp: new Date(targetTimestamp) });

    // Using AgentZK's proven transaction verification logic
    try {
      // Fetch transactions using Kaspa API
      const response = await fetch(
        `https://api.kaspa.org/addresses/${address}/full-transactions?limit=100`,
        {
          headers: {
            'Authorization': `Bearer ${KASPA_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const transactions = await response.json();
      console.log(`Found ${transactions.length} total transactions`);

      // Check each transaction
      for (const tx of transactions) {
        if (!tx.block_time) continue;

        // Normalize timestamp - Kaspa API returns microseconds
        let txTimestamp = tx.block_time;
        if (txTimestamp > 10000000000000) {
          // If it's in microseconds, convert to milliseconds
          txTimestamp = Math.floor(txTimestamp / 1000);
        } else if (txTimestamp < 10000000000) {
          // If it's in seconds, convert to milliseconds
          txTimestamp = txTimestamp * 1000;
        }
        
        // Allow 2 minute window before click (for mobile delays)
        const timeWindow = 120000; // 2 minutes
        const isInTimeWindow = txTimestamp >= (targetTimestamp - timeWindow);

        console.log('Checking TX:', {
          id: tx.transaction_id.substring(0, 8),
          txTime: new Date(txTimestamp),
          targetTime: new Date(targetTimestamp),
          inWindow: isInTimeWindow
        });

        if (!isInTimeWindow) {
          continue;
        }

        // Check all outputs for matching amount to user's address
        if (tx.outputs) {
          for (const output of tx.outputs) {
            if (output.script_public_key_address === address) {
              const amount = output.amount / 100000000;
              const diff = Math.abs(amount - targetAmount);
              
              console.log('Found output to user:', {
                amount,
                targetAmount,
                diff
              });
              
              // Allow 1 KAS variance for fees
              if (diff <= 1.0) {
                console.log('✅ Match found:', {
                  txId: tx.transaction_id,
                  amount,
                  targetAmount,
                  txTime: new Date(txTimestamp)
                });

                return Response.json({
                  verified: true,
                  transaction: {
                    id: tx.transaction_id,
                    amount: amount,
                    timestamp: txTimestamp,
                    block_time: tx.block_time
                  }
                });
              }
            }
          }
        }
      }

      console.log('❌ No matching transaction found');
      return Response.json({
        verified: false,
        message: 'No matching transaction yet'
      });

    } catch (apiError) {
      console.error('Kaspa API error:', apiError);
      return Response.json({
        verified: false,
        error: 'API connection failed'
      });
    }

  } catch (error) {
    console.error('Verification error:', error);
    return Response.json({ 
      verified: false,
      error: error.message
    }, { status: 500 });
  }
});