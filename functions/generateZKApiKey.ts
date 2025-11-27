import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

/**
 * Generate a secure API key for Agent ZK to access wallet seeds
 * Can optionally link to a specific wallet address
 */

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        // Authenticate user
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ 
                success: false,
                error: 'Unauthorized - Please log in' 
            }, { status: 401 });
        }

        // Get optional wallet address from request
        let walletAddress = null;
        try {
            const body = await req.json().catch(() => ({}));
            walletAddress = body.walletAddress;
        } catch (e) {
            // No body, that's okay
        }

        console.log('🔑 Generating Agent ZK API key for:', user.email);
        if (walletAddress) {
            console.log('🔗 Linking to wallet:', walletAddress);
        }

        // Generate a secure random API key
        const randomBytes = new Uint8Array(32);
        crypto.getRandomValues(randomBytes);
        const apiKey = Array.from(randomBytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        // Prefix with user identifier and optional wallet marker
        const prefix = walletAddress ? 'zkw' : 'zk';
        const agentZKApiKey = `${prefix}_${user.email.split('@')[0]}_${apiKey}`;

        console.log('✅ Agent ZK API key generated successfully');

        return Response.json({
            success: true,
            api_key: agentZKApiKey,
            wallet_address: walletAddress || null,
            message: 'API key generated successfully',
            usage: walletAddress 
                ? `Use this key with Agent ZK to access wallet ${walletAddress}`
                : 'Use this key to authenticate Agent ZK requests',
            warning: '⚠️ Store this key securely. It provides access to your wallet seeds.'
        });

    } catch (error) {
        console.error('❌ Failed to generate API key:', error.message);
        return Response.json({ 
            success: false,
            error: error.message
        }, { status: 500 });
    }
});