import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, address, txHash } = await req.json();

    switch (action) {
      case 'save_connection':
        // Save connected wallet address
        await base44.auth.updateMe({
          zelcore_address: address,
          zelcore_connected: true,
          zelcore_connected_at: new Date().toISOString()
        });

        return Response.json({ 
          success: true, 
          message: 'Wallet connected successfully' 
        });

      case 'get_balance':
        // Fetch balance from Kaspa API
        try {
          const response = await fetch(`https://api.kas.fyi/addresses/${address}/balance`);
          const data = await response.json();
          
          return Response.json({
            success: true,
            balance: data.balance / 100000000, // Convert sompi to KAS
            address: address
          });
        } catch (err) {
          return Response.json({ 
            error: 'Failed to fetch balance',
            details: err.message 
          }, { status: 500 });
        }

      case 'verify_transaction':
        // Verify a transaction exists on the blockchain
        try {
          const response = await fetch(`https://api.kas.fyi/transactions/${txHash}`);
          const txData = await response.json();
          
          return Response.json({
            success: true,
            verified: true,
            transaction: txData
          });
        } catch (err) {
          return Response.json({ 
            success: false,
            verified: false,
            error: 'Transaction not found' 
          }, { status: 404 });
        }

      case 'disconnect':
        // Clear wallet connection
        await base44.auth.updateMe({
          zelcore_address: null,
          zelcore_connected: false
        });

        return Response.json({ 
          success: true, 
          message: 'Wallet disconnected' 
        });

      default:
        return Response.json({ 
          error: 'Invalid action' 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Zelcore function error:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});