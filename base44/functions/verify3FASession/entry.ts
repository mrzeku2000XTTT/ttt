import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify user is authenticated
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ 
                success: false,
                error: 'Unauthorized' 
            }, { status: 401 });
        }

        const { sessionId, kaswareAddress, metamaskAddress, message, signature } = await req.json();
        
        // Validation
        if (!sessionId || !kaswareAddress || !metamaskAddress || !message || !signature) {
            return Response.json({
                success: false,
                error: 'Missing required fields'
            }, { status: 400 });
        }
        
        console.log('🔐 Verifying 3FA session...');
        console.log('  Session ID:', sessionId);
        console.log('  Kasware:', kaswareAddress.substring(0, 20) + '...');
        console.log('  MetaMask:', metamaskAddress.substring(0, 10) + '...');

        // Verify message contains correct addresses
        if (!message.includes(kaswareAddress) || !message.includes(metamaskAddress)) {
            return Response.json({
                success: false,
                error: 'Message does not contain the correct addresses'
            }, { status: 400 });
        }

        // Verify the Kaspa signature
        const verifyResult = await base44.functions.invoke('verifyKaspaSignature', {
            message,
            signature,
            address: kaswareAddress
        });

        if (!verifyResult.data.success) {
            return Response.json({
                success: false,
                error: 'Invalid signature'
            }, { status: 401 });
        }

        // Create authenticated session (expires in 1 hour)
        const expiresAt = new Date(Date.now() + 3600000).toISOString();

        // Store session in user's data
        const currentSessions = user.active_3fa_sessions || [];
        const newSession = {
            sessionId,
            createdAt: new Date().toISOString(),
            expiresAt,
            kaswareAddress,
            metamaskAddress,
            authenticated: true
        };

        await base44.auth.updateMe({
            active_3fa_sessions: [...currentSessions.filter(s => new Date(s.expiresAt) > new Date()), newSession]
        });

        console.log('✅ 3FA Authentication successful');

        return Response.json({
            success: true,
            session: {
                sessionId,
                authenticated: true,
                createdAt: newSession.createdAt,
                expiresAt
            }
        });

    } catch (error) {
        console.error('❌ 3FA Verification error:', error.message);
        return Response.json({ 
            success: false,
            error: error.message
        }, { status: 500 });
    }
});