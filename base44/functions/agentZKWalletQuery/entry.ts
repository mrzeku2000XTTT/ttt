import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Agent ZK Wallet Query - Allows Agent ZK to check balance/UTXOs of linked wallet
 * Uses API key authentication
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

        console.log('[AgentZK Query] 🔍 Request from:', user.email);

        // Check if user has linked wallet
        if (!user.agent_linked_wallet_address) {
            return Response.json({
                success: false,
                error: 'No wallet linked to Agent ZK. Please link a wallet in the API tab first.'
            }, { status: 400 });
        }

        const linkedAddress = user.agent_linked_wallet_address;
        console.log('[AgentZK Query] 📍 Linked wallet:', linkedAddress);

        // Get wallet data including encrypted seed
        const agentWallets = user.agent_zk_wallets || [];
        const linkedWallet = agentWallets.find(w => w.address === linkedAddress);

        if (!linkedWallet) {
            return Response.json({
                success: false,
                error: 'Linked wallet not found in agent_zk_wallets'
            }, { status: 404 });
        }

        console.log('[AgentZK Query] ✅ Found wallet in database');

        // Fetch balance from Kaspa API
        console.log('[AgentZK Query] 💰 Fetching balance...');
        const cleanAddress = linkedAddress.replace('kaspa:', '');
        
        const balanceResponse = await fetch(
            `https://api.kaspa.org/addresses/${cleanAddress}/balance`,
            {
                headers: { 'Accept': 'application/json' },
                signal: AbortSignal.timeout(5000)
            }
        );

        let balanceKAS = 0;
        let balanceSompi = 0;

        if (balanceResponse.ok) {
            const balanceData = await balanceResponse.json();
            balanceSompi = parseInt(balanceData.balance || '0');
            balanceKAS = balanceSompi / 100000000;
            console.log('[AgentZK Query] ✅ Balance:', balanceKAS, 'KAS');
        } else {
            console.warn('[AgentZK Query] ⚠️ Balance API failed, using 0');
        }

        // Try to fetch UTXOs/history via Replit backend
        let history = [];
        try {
            console.log('[AgentZK Query] 📊 Fetching transaction history...');
            const utxoResponse = await fetch(
                'https://tttxxx.live/api/utxo-history',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ address: linkedAddress }),
                    signal: AbortSignal.timeout(10000)
                }
            );

            if (utxoResponse.ok) {
                const utxoData = await utxoResponse.json();
                if (utxoData.success && utxoData.history) {
                    history = utxoData.history.slice(0, 5); // Last 5 transactions
                    console.log('[AgentZK Query] ✅ Found', history.length, 'transactions');
                }
            }
        } catch (utxoErr) {
            console.warn('[AgentZK Query] ⚠️ UTXO fetch failed:', utxoErr.message);
        }

        // Return structured data
        return Response.json({
            success: true,
            wallet: {
                address: linkedAddress,
                truncated: `${linkedAddress.substring(0, 15)}...${linkedAddress.substring(linkedAddress.length - 6)}`,
                wordCount: linkedWallet.wordCount,
                type: linkedWallet.type,
                createdAt: linkedWallet.createdAt
            },
            balance: {
                kas: balanceKAS,
                sompi: balanceSompi,
                formatted: `${balanceKAS.toFixed(8)} KAS`
            },
            transactions: {
                count: history.length,
                recent: history.map(tx => ({
                    amount: tx.amount / 100000000,
                    amountFormatted: `${(tx.amount / 100000000).toFixed(8)} KAS`,
                    txId: tx.txId ? `${tx.txId.substring(0, 10)}...` : 'unknown',
                    timestamp: tx.timestamp ? new Date(tx.timestamp).toLocaleString() : 'unknown',
                    date: tx.timestamp ? new Date(tx.timestamp).toLocaleDateString() : 'unknown'
                }))
            },
            metadata: {
                queriedAt: new Date().toISOString(),
                apiVersion: '1.0'
            }
        });

    } catch (error) {
        console.error('[AgentZK Query] ❌ Error:', error.message);
        return Response.json({ 
            success: false,
            error: error.message
        }, { status: 500 });
    }
});