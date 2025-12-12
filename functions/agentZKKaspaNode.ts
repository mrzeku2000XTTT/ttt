import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const FLUX_NODE_WS = 'wss://kaspanode24gb1760549631906_18110.app.runonflux.io';
const FLUX_NODE_HTTP = 'https://kaspanode24gb1760549631906_18110.app.runonflux.io';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { method, params } = await req.json();

    // Make JSON-RPC call to Kaspa node
    const response = await fetch(FLUX_NODE_HTTP, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: method,
        params: params || []
      })
    });

    const data = await response.json();

    if (data.error) {
      return Response.json({ 
        success: false, 
        error: data.error 
      }, { status: 400 });
    }

    return Response.json({ 
      success: true, 
      result: data.result 
    });

  } catch (error) {
    console.error('Kaspa node error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});