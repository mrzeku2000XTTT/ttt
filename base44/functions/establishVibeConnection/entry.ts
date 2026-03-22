import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, target_wallet, connection_id } = await req.json();

    if (action === 'create') {
      // Create new connection request
      const userWallet = user.created_wallet_address;
      
      if (!userWallet) {
        return Response.json({ 
          error: 'No wallet found',
          message: 'Please create a TTT wallet first'
        }, { status: 400 });
      }

      // Generate unique connection ID
      const timestamp = Date.now();
      const randomBytes = crypto.getRandomValues(new Uint8Array(16));
      const randomHex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      
      const connId = `vibe_${timestamp}_${randomHex.substring(0, 8)}`;
      
      // Generate encryption keys for E2E
      const encKey = crypto.getRandomValues(new Uint8Array(32));
      const encKeyHex = Array.from(encKey).map(b => b.toString(16).padStart(2, '0')).join('');

      const connectionData = {
        connection_id: connId,
        initiator_wallet: userWallet,
        initiator_email: user.email,
        target_wallet: target_wallet,
        encryption_key: encKeyHex,
        status: 'pending',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 min expiry
      };

      // Store in database as AgentZKConnection
      await base44.asServiceRole.entities.AgentZKConnection.create({
        connection_id: connId,
        initiator_address: userWallet,
        target_address: target_wallet || userWallet,
        status: 'pending',
        encryption_key: encKeyHex,
        metadata: JSON.stringify(connectionData)
      });

      return Response.json({
        success: true,
        connection_id: connId,
        qr_data: userWallet
      });
    }

    if (action === 'accept') {
      // Accept connection from scanner side
      const userWallet = user.created_wallet_address;
      
      const connection = await base44.asServiceRole.entities.AgentZKConnection.filter({
        target_address: userWallet,
        connection_id: connection_id
      });

      if (connection.length === 0) {
        return Response.json({ 
          error: 'Connection not found' 
        }, { status: 404 });
      }

      // Update connection status
      await base44.asServiceRole.entities.AgentZKConnection.update(connection[0].id, {
        status: 'connected',
        connected_at: new Date().toISOString()
      });

      return Response.json({
        success: true,
        connection: connection[0]
      });
    }

    if (action === 'check') {
      // Check connection status
      const connections = await base44.asServiceRole.entities.AgentZKConnection.filter({
        connection_id: connection_id
      });

      if (connections.length === 0) {
        return Response.json({ 
          status: 'not_found' 
        });
      }

      return Response.json({
        status: connections[0].status,
        connection: connections[0]
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Connection error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});