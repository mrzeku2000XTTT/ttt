import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { senderAddress, recipientAddress, expectedAmount } = await req.json();

        if (!senderAddress || !recipientAddress || !expectedAmount) {
            return Response.json({ 
                error: 'Missing required parameters' 
            }, { status: 400 });
        }

        console.log('🔍 Verifying payment:', {
            from: senderAddress,
            to: recipientAddress,
            amount: expectedAmount
        });

        // Check sender's transactions for payment to recipient
        const apiUrl = `https://api.kaspa.org/addresses/${senderAddress}/full-transactions?limit=20&resolve_previous_outpoints=light`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            return Response.json({ 
                verified: false, 
                error: 'Failed to fetch transactions' 
            });
        }

        const transactions = await response.json();
        
        if (!Array.isArray(transactions)) {
            return Response.json({ verified: false });
        }

        // Check last 10 minutes of transactions
        const tenMinutesAgo = Date.now() - (10 * 60 * 1000);

        for (const tx of transactions) {
            const txTime = parseInt(tx.block_time);
            const isRecent = txTime >= tenMinutesAgo;
            
            // Check if this transaction sends to recipient
            const sentToRecipient = (tx.outputs || []).some(out => 
                out.script_public_key_address === recipientAddress
            );

            if (isRecent && sentToRecipient) {
                // Found payment!
                console.log('✅ Payment found:', tx.transaction_id);
                
                return Response.json({
                    verified: true,
                    txId: tx.transaction_id,
                    amount: expectedAmount
                });
            }
        }

        console.log('❌ No payment found yet');
        return Response.json({ verified: false });

    } catch (error) {
        console.error('Verification error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});