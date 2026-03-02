import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const PAYMENT_ADDRESS = "kaspa:qqfk829q3wf6cyy9al4tzfc67x5spwatzc0g8fkexgrdve33sdh6s2nyh3car";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { amount_kas, since_timestamp, kaspa_address } = await req.json();
    
    if (!amount_kas || !since_timestamp) {
      return Response.json({ error: 'amount_kas and since_timestamp required' }, { status: 400 });
    }

    const expectedSompi = Math.round(amount_kas * 1e8);

    const response = await fetch(
      `https://api.kaspa.org/addresses/${PAYMENT_ADDRESS}/full-transactions?limit=20&resolve_previous_outpoints=light`,
      { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(10000) }
    );

    if (!response.ok) throw new Error(`Kaspa API error: ${response.status}`);

    const transactions = await response.json();

    for (const tx of (Array.isArray(transactions) ? transactions : [])) {
      const txTime = tx.block_time ? tx.block_time * 1000 : 0;
      if (txTime < since_timestamp) continue;

      for (const output of (tx.outputs || [])) {
        if (output.script_public_key_address === PAYMENT_ADDRESS) {
          const receivedSompi = parseInt(output.amount || 0);
          const diff = Math.abs(receivedSompi - expectedSompi);
          const tolerance = expectedSompi * 0.02; // 2% tolerance

          if (diff <= tolerance) {
            const creditMinutes = Math.floor(amount_kas); // 1 KAS = 1 minute
            
            // Update credits for user (works for logged-in and non-logged-in)
            if (kaspa_address) {
              const existing = await base44.asServiceRole.entities.RufzeitKUser.filter({ kaspa_address: kaspa_address });
              if (existing.length > 0) {
                const currentCredits = existing[0].call_credits || 0;
                await base44.asServiceRole.entities.RufzeitKUser.update(existing[0].id, {
                  call_credits: currentCredits + creditMinutes
                });
              }
            }

            return Response.json({
              success: true,
              tx_id: tx.transaction_id,
              credits_added: creditMinutes,
              amount_kas: receivedSompi / 1e8
            });
          }
        }
      }
    }

    return Response.json({ success: false, status: 'pending' });

  } catch (error) {
    console.error('checkRufzeitKPayment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});