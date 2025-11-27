import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Authenticate user
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const KASPA_API_URL = 'https://nodejs-TTT.replit.app';
        const API_KEY = Deno.env.get('KASPA_API_KEY');

        if (!API_KEY) {
            return Response.json({ 
                error: 'API key not configured',
                success: false 
            }, { status: 500 });
        }

        console.log('🐋 Fetching blockchain info from Node.js backend...');

        // Get blockchain info
        const infoResponse = await fetch(`${KASPA_API_URL}/info`, {
            headers: {
                'X-API-Key': API_KEY
            }
        });

        if (!infoResponse.ok) {
            throw new Error(`Failed to fetch blockchain info: ${infoResponse.statusText}`);
        }

        const info = await infoResponse.json();
        console.log('✅ Blockchain info received');

        // Load tracked whale addresses from localStorage-like storage
        // For now, use a predefined list of known whale addresses
        const whaleAddresses = [
            'kaspa:qz7ulu4c25dh7fzec9zjyrmlhnkzrg4wmf89q7gzr3gfrsj3uz6xjceef60sd',
            'kaspa:qr4kh7z8qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e',
            'kaspa:qqkqkzjvjqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e',
        ];

        const whaleData = [];

        // Fetch balance for each whale address
        for (const address of whaleAddresses) {
            try {
                const balanceResponse = await fetch(`${KASPA_API_URL}/balance/${address}`, {
                    headers: {
                        'X-API-Key': API_KEY
                    }
                });

                if (balanceResponse.ok) {
                    const data = await balanceResponse.json();
                    const balance = typeof data === 'number' ? data : (data.balance || 0);

                    whaleData.push({
                        address: address,
                        balance: balance,
                        balanceKAS: balance / 100000000,
                        rank: whaleData.length + 1
                    });

                    console.log(`✅ Fetched balance for whale #${whaleData.length}`);
                }
            } catch (err) {
                console.warn(`⚠️ Failed to fetch balance for ${address}:`, err.message);
            }
        }

        // Sort by balance descending
        whaleData.sort((a, b) => b.balance - a.balance);

        // Update ranks
        whaleData.forEach((whale, index) => {
            whale.rank = index + 1;
        });

        console.log('✅ Loaded', whaleData.length, 'whale addresses from Node.js backend');

        return Response.json({
            success: true,
            whales: whaleData,
            networkInfo: {
                blockCount: info.blockCount || info.blockcount || 0,
                difficulty: info.difficulty || 0
            },
            timestamp: new Date().toISOString(),
            source: 'Node.js Backend (Kaspa Flux Node)'
        });

    } catch (error) {
        console.error('❌ Failed to get top addresses:', error);
        return Response.json({ 
            error: error.message,
            success: false
        }, { status: 500 });
    }
});