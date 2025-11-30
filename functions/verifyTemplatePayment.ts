import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { buyer_address, seller_address, expected_amount, template_id } = await req.json();

    if (!buyer_address || !seller_address || !expected_amount || !template_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get Kaspa transactions for the buyer address
    const kaspaApiKey = Deno.env.get('FORBOLE_KASPA_API_KEY');
    const response = await fetch(
      `https://api.kaspa.org/addresses/${buyer_address}/full-transactions?limit=50`,
      {
        headers: {
          'Authorization': `Bearer ${kaspaApiKey}`
        }
      }
    );

    if (!response.ok) {
      return Response.json({ 
        verified: false, 
        error: 'Failed to fetch transactions' 
      });
    }

    const data = await response.json();
    const transactions = data.transactions || [];

    // Look for a transaction from buyer to seller with the exact amount
    const paymentFound = transactions.some(tx => {
      const outputs = tx.outputs || [];
      const hasCorrectOutput = outputs.some(output => {
        const amountInKas = output.amount / 100000000; // Convert sompi to KAS
        return (
          output.script_public_key_address === seller_address &&
          Math.abs(amountInKas - expected_amount) < 0.01 // Allow small rounding difference
        );
      });

      const inputs = tx.inputs || [];
      const fromBuyer = inputs.some(input => 
        input.previous_outpoint_address === buyer_address
      );

      return hasCorrectOutput && fromBuyer;
    });

    if (paymentFound) {
      // Create a purchase record
      await base44.entities.Template.update(template_id, {
        purchases: (await base44.entities.Template.filter({ id: template_id }))[0].purchases + 1 || 1
      });

      return Response.json({ 
        verified: true,
        message: 'Payment verified successfully'
      });
    }

    return Response.json({ 
      verified: false,
      message: 'No matching payment found. Please ensure you sent the exact amount.'
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return Response.json({ 
      verified: false,
      error: error.message 
    }, { status: 500 });
  }
});