import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { senderAddress, recipientAddress, expectedAmount, initialSenderBalance, initialRecipientBalance } = await req.json();

        if (!senderAddress || !recipientAddress || !expectedAmount) {
            return Response.json({ 
                error: 'Missing required parameters' 
            }, { status: 400 });
        }

        console.log('🔍 Verifying payment via balance check:', {
            from: senderAddress,
            to: recipientAddress,
            amount: expectedAmount,
            initialSenderBalance,
            initialRecipientBalance
        });

        // Get current balances
        const senderBalanceResponse = await base44.asServiceRole.functions.invoke('getKaspaBalance', { 
            address: senderAddress 
        });
        
        const recipientBalanceResponse = await base44.asServiceRole.functions.invoke('getKaspaBalance', { 
            address: recipientAddress 
        });

        const currentSenderBalance = senderBalanceResponse.data?.balance || 0;
        const currentRecipientBalance = recipientBalanceResponse.data?.balance || 0;

        console.log('💰 Balances:', {
            sender: { initial: initialSenderBalance, current: currentSenderBalance },
            recipient: { initial: initialRecipientBalance, current: currentRecipientBalance }
        });

        // Check if sender balance decreased by expected amount (with fee tolerance)
        const senderDecrease = initialSenderBalance - currentSenderBalance;
        const senderPaid = senderDecrease >= expectedAmount && senderDecrease <= (expectedAmount + 0.1);

        // Check if recipient balance increased by expected amount
        const recipientIncrease = currentRecipientBalance - initialRecipientBalance;
        const recipientReceived = recipientIncrease >= (expectedAmount - 0.01);

        console.log('✅ Verification:', {
            senderDecrease,
            senderPaid,
            recipientIncrease,
            recipientReceived
        });

        if (senderPaid && recipientReceived) {
            console.log('✅ Payment verified via balance check!');
            
            return Response.json({
                verified: true,
                senderBalance: currentSenderBalance,
                recipientBalance: currentRecipientBalance
            });
        }

        return Response.json({ 
            verified: false,
            senderBalance: currentSenderBalance,
            recipientBalance: currentRecipientBalance 
        });

    } catch (error) {
        console.error('Verification error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});