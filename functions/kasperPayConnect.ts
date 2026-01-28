import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (req.method === 'POST') {
      const { walletAddress } = await req.json();

      if (!walletAddress || !walletAddress.startsWith('kaspa:')) {
        return Response.json({ error: 'Invalid Kaspa address' }, { status: 400 });
      }

      // Save wallet address to user profile
      await base44.auth.updateMe({
        kasperopay_wallet_address: walletAddress,
        kasperopay_connected_at: new Date().toISOString()
      });

      return Response.json({
        success: true,
        message: 'Wallet connected successfully',
        address: walletAddress
      });
    }

    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    console.error('KasperoPay connect error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});