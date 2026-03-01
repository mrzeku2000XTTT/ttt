import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { address } = await req.json();

    if (!address) {
      return Response.json({ error: 'Address required' }, { status: 400 });
    }

    const cleanAddress = address.replace('kaspa:', '');
    const kaspaApi = Deno.env.get('KASPA_API_KEY');
    
    // Fetch transactions from Kaspa API
    const txRes = await fetch(
      `https://api.kaspa.org/addresses/${cleanAddress}/full-transactions?limit=50`,
      { headers: { 'X-API-KEY': kaspaApi || '' } }
    );

    if (!txRes.ok) {
      console.error('Kaspa API error:', txRes.status);
      return Response.json({ transactions: [] });
    }

    const txData = await txRes.json();
    const transactions = Array.isArray(txData) ? txData : txData.transactions || [];

    // Parse transactions
    const parsed = transactions.map(tx => {
      const isSent = tx.inputs?.some(inp => inp.previous_outpoint?.address === cleanAddress);
      const isReceived = tx.outputs?.some(out => out.script_public_key?.address === cleanAddress);
      
      let amount = 0;
      if (isReceived) {
        amount = tx.outputs
          .filter(out => out.script_public_key?.address === cleanAddress)
          .reduce((sum, out) => sum + (out.amount || 0), 0) / 1e8;
      } else if (isSent) {
        amount = tx.inputs
          .filter(inp => inp.previous_outpoint?.address === cleanAddress)
          .reduce((sum, inp) => sum + (inp.previous_outpoint?.amount || 0), 0) / 1e8;
      }

      return {
        id: tx.hash,
        type: isReceived ? 'receive' : isSent ? 'send' : 'other',
        amount: amount,
        timestamp: tx.block_time || new Date().toISOString(),
      };
    });

    return Response.json({ transactions: parsed });
  } catch (error) {
    console.error('Transaction history error:', error);
    return Response.json({ transactions: [] });
  }
});