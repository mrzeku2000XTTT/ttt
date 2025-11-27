import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

/**
 * ⚠️ CRITICAL SECURITY WARNING ⚠️
 * This endpoint provides access to encrypted wallet seed phrases.
 * Only use with proper authentication and encryption.
 * Never expose this endpoint publicly without strong security measures.
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

        const { walletAddress, apiKey } = await req.json();

        if (!walletAddress || !apiKey) {
            return Response.json({
                success: false,
                error: 'walletAddress and apiKey are required'
            }, { status: 400 });
        }

        console.log('🔐 ZK Wallet Seed Request:', { walletAddress, user: user.email });

        // Verify API key matches user's Agent ZK API key
        if (apiKey !== user.agent_zk_api_key) {
            console.error('❌ Invalid API key');
            return Response.json({
                success: false,
                error: 'Invalid API key'
            }, { status: 403 });
        }

        // Find the ZK wallet
        const zkWallets = user.agent_zk_wallets || [];
        const wallet = zkWallets.find(w => w.address === walletAddress);

        if (!wallet) {
            return Response.json({
                success: false,
                error: 'Wallet not found'
            }, { status: 404 });
        }

        if (!wallet.encryptedSeed) {
            return Response.json({
                success: false,
                error: 'Seed phrase not stored for this wallet'
            }, { status: 404 });
        }

        // Decrypt the seed phrase
        // Using base64 decoding (simple encryption - in production use stronger encryption)
        const decryptedSeed = atob(wallet.encryptedSeed);

        console.log('✅ Seed phrase retrieved successfully');

        return Response.json({
            success: true,
            walletAddress: walletAddress,
            seedPhrase: decryptedSeed,
            wordCount: wallet.wordCount,
            createdAt: wallet.createdAt,
            warning: '⚠️ Keep this seed phrase secure. Never share it with anyone.'
        });

    } catch (error) {
        console.error('❌ Failed to retrieve seed:', error.message);
        return Response.json({ 
            success: false,
            error: error.message
        }, { status: 500 });
    }
});