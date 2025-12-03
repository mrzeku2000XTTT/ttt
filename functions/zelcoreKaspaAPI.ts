import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const ZELCORE_BASE = 'https://api.kas.zelcore.io';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, address, txHash, amount } = await req.json();

    console.log('Zelcore API Request:', { action, address, txHash, amount });

    // Get address balance
    if (action === 'getBalance') {
      const response = await fetch(`${ZELCORE_BASE}/address/${address}/balance`);
      const data = await response.json();
      
      console.log('Zelcore Balance Response:', data);
      
      return Response.json({
        success: true,
        balance: data.balance || 0,
        raw: data
      });
    }

    // Get address transactions
    if (action === 'getTransactions') {
      const response = await fetch(`${ZELCORE_BASE}/address/${address}/full-transactions?limit=50&offset=0&resolve_previous_outpoints=light`);
      const data = await response.json();
      
      console.log('Zelcore Transactions Response:', data);
      
      return Response.json({
        success: true,
        transactions: data || [],
        raw: data
      });
    }

    // Verify payment (check if address received amount)
    if (action === 'verifyPayment') {
      const response = await fetch(`${ZELCORE_BASE}/address/${address}/full-transactions?limit=50&offset=0&resolve_previous_outpoints=light`);
      const data = await response.json();
      
      console.log('Verifying payment for:', { address, amount });
      
      // Check recent transactions
      const recentTxs = data || [];
      const targetAmount = parseFloat(amount);
      
      for (const tx of recentTxs) {
        // Check outputs to this address
        if (tx.outputs) {
          for (const output of tx.outputs) {
            if (output.script_public_key_address === address) {
              const receivedAmount = output.amount / 100000000; // Convert sompi to KAS
              
              if (Math.abs(receivedAmount - targetAmount) < 0.00000001) {
                console.log('✅ Payment verified!', tx.transaction_id);
                
                // Store in database
                await base44.asServiceRole.entities.ZelcoreTransaction.create({
                  tx_hash: tx.transaction_id,
                  from_address: tx.inputs?.[0]?.previous_outpoint_address || 'unknown',
                  to_address: address,
                  amount: receivedAmount,
                  block_time: tx.block_time,
                  confirmations: tx.confirmations || 0,
                  is_accepted: tx.is_accepted || false,
                  raw_data: tx
                });
                
                return Response.json({
                  success: true,
                  verified: true,
                  transaction: tx.transaction_id,
                  amount: receivedAmount,
                  confirmations: tx.confirmations
                });
              }
            }
          }
        }
      }
      
      return Response.json({
        success: true,
        verified: false,
        message: 'Payment not found yet'
      });
    }

    // Get transaction details
    if (action === 'getTransaction') {
      const response = await fetch(`${ZELCORE_BASE}/transaction/${txHash}`);
      const data = await response.json();
      
      console.log('Zelcore TX Details:', data);
      
      return Response.json({
        success: true,
        transaction: data,
        raw: data
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Zelcore API Error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});