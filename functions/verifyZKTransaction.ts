import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { wallet_address, user_email } = await req.json();

    if (!wallet_address || !user_email) {
      return Response.json({ 
        verified: false, 
        error: 'Missing wallet_address or user_email' 
      }, { status: 400 });
    }

    // Check for existing verification in last 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    const existingVerifications = await base44.asServiceRole.entities.WalletVerification.filter({
      user_email: user_email,
      wallet_address: wallet_address,
      is_verified: true
    }, '-created_date', 1);

    if (existingVerifications.length > 0) {
      const lastVerification = new Date(existingVerifications[0].created_date);
      const timeDiff = Date.now() - lastVerification.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      // Verification valid for 24 hours
      if (hoursDiff < 24) {
        return Response.json({ 
          verified: true,
          message: 'Already verified within 24 hours'
        });
      }
    }

    // Call Kaspa API to check for incoming 1 KAS transaction in last 10 minutes
    const kaspaApiKey = Deno.env.get('KASPA_API_KEY');
    const kaspaResponse = await fetch(
      `https://api.kaspa.org/addresses/${wallet_address}/full-transactions?limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${kaspaApiKey}`
        }
      }
    );

    if (!kaspaResponse.ok) {
      return Response.json({ 
        verified: false, 
        error: 'Failed to fetch transactions from Kaspa API' 
      });
    }

    const transactions = await kaspaResponse.json();

    // Look for a transaction of exactly 1 KAS in last 10 minutes
    const oneKASInSompi = 100000000; // 1 KAS = 100,000,000 sompi
    const tenMinutesAgoTimestamp = Date.now() - (10 * 60 * 1000);

    for (const tx of transactions) {
      const txTime = tx.block_time * 1000; // Convert to milliseconds
      
      if (txTime < tenMinutesAgoTimestamp) continue;

      // Check if this transaction has an output to our wallet of exactly 1 KAS
      for (const output of tx.outputs || []) {
        if (output.script_public_key_address === wallet_address) {
          const amount = parseInt(output.amount);
          
          // Check if exactly 1 KAS
          if (amount === oneKASInSompi) {
            console.log('Found matching 1 KAS transaction:', tx.transaction_id);
            
            return Response.json({ 
              verified: true,
              transaction_id: tx.transaction_id,
              amount: amount,
              timestamp: txTime
            });
          }
        }
      }
    }

    return Response.json({ 
      verified: false,
      message: 'No matching 1 KAS transaction found in last 10 minutes'
    });

  } catch (error) {
    console.error('ZK verification error:', error);
    return Response.json({ 
      verified: false, 
      error: error.message 
    }, { status: 500 });
  }
});