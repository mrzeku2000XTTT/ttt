import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Authenticate user
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ 
                success: false,
                error: 'Unauthorized' 
            }, { status: 401 });
        }

        const { transaction } = await req.json();
        
        if (!transaction) {
            return Response.json({ 
                success: false,
                error: 'Transaction data required' 
            }, { status: 400 });
        }

        const KASPA_API_URL = 'https://nodejs-TTT.replit.app';
        const API_KEY = Deno.env.get('KASPA_API_KEY');

        if (!API_KEY) {
            console.error('❌ KASPA_API_KEY not found in environment variables');
            return Response.json({ 
                success: false,
                error: 'API key not configured' 
            }, { status: 500 });
        }

        console.log('📤 Broadcasting transaction...');

        const response = await fetch(`${KASPA_API_URL}/api/broadcast`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY,
                'Accept': 'application/json',
            },
            body: JSON.stringify({ transaction })
        });

        console.log('📊 Broadcast API Response Status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Broadcast API error:', response.status, errorText);
            return Response.json({ 
                success: false,
                error: `API error: ${response.statusText}`,
                details: errorText 
            }, { status: response.status });
        }

        const data = await response.json();
        
        console.log('✅ Transaction broadcast successfully');

        return Response.json({
            success: true,
            transactionId: data.transactionId
        });

    } catch (error) {
        console.error('❌ Failed to broadcast transaction:', error.message);
        console.error('Error stack:', error.stack);
        return Response.json({ 
            success: false,
            error: error.message
        }, { status: 500 });
    }
});