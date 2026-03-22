import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Scans a user's wallet for recent transactions and adds them to the challenge
 * This function should be called periodically (e.g., every 5 minutes) via cron
 */

const CHALLENGE_START = new Date('2025-10-21T00:00:00Z');
const CHALLENGE_END = new Date('2025-10-24T00:00:00Z');

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Get request body
        const { participant_id, wallet_address } = await req.json();

        if (!participant_id || !wallet_address) {
            return Response.json({ 
                error: 'Missing participant_id or wallet_address' 
            }, { status: 400 });
        }

        console.log('🔍 Scanning wallet:', wallet_address);

        // Get participant
        const participants = await base44.asServiceRole.entities.ChallengeParticipant.filter({
            id: participant_id
        });

        if (participants.length === 0) {
            return Response.json({ error: 'Participant not found' }, { status: 404 });
        }

        const participant = participants[0];
        const lastScanned = new Date(participant.last_tx_timestamp || CHALLENGE_START);

        console.log('📅 Last scanned:', lastScanned.toISOString());

        // Determine if it's L1 (Kaspa) or L2 (MetaMask) address
        const isL1 = wallet_address.startsWith('kaspa:');
        const isL2 = wallet_address.startsWith('0x');

        let newTransactions = [];

        if (isL1) {
            // Scan Kaspa L1 blockchain
            console.log('🔍 Scanning Kaspa L1 blockchain...');
            newTransactions = await scanKaspaL1(wallet_address, lastScanned);
        } else if (isL2) {
            // Scan Kasplex L2 blockchain
            console.log('🔍 Scanning Kasplex L2 blockchain...');
            newTransactions = await scanKasplexL2(wallet_address, lastScanned);
        } else {
            return Response.json({ 
                error: 'Invalid wallet address format' 
            }, { status: 400 });
        }

        console.log(`✅ Found ${newTransactions.length} new transactions`);

        // Add new transactions to database
        let addedCount = 0;
        let latestTimestamp = lastScanned;

        for (const tx of newTransactions) {
            try {
                // Check if transaction already exists
                const existing = await base44.asServiceRole.entities.ChallengeTx.filter({
                    tx_hash: tx.tx_hash
                });

                if (existing.length === 0) {
                    // Add transaction
                    await base44.asServiceRole.entities.ChallengeTx.create({
                        tx_hash: tx.tx_hash,
                        participant_id: participant_id,
                        wallet_address: wallet_address,
                        amount: tx.amount,
                        confirmations: tx.confirmations || 1,
                        is_verified: true
                    });

                    addedCount++;

                    // Track latest timestamp
                    const txTimestamp = new Date(tx.timestamp);
                    if (txTimestamp > latestTimestamp) {
                        latestTimestamp = txTimestamp;
                    }
                }
            } catch (err) {
                console.error('Failed to add transaction:', err);
            }
        }

        // Update participant's transaction count and last scanned timestamp
        const updatedCount = participant.transaction_count + addedCount;
        await base44.asServiceRole.entities.ChallengeParticipant.update(participant_id, {
            transaction_count: updatedCount,
            last_scanned_at: new Date().toISOString(),
            last_tx_timestamp: latestTimestamp.toISOString()
        });

        console.log(`✅ Added ${addedCount} new transactions. Total: ${updatedCount}`);

        return Response.json({
            success: true,
            new_transactions: addedCount,
            total_transactions: updatedCount,
            last_scanned: latestTimestamp.toISOString()
        });

    } catch (error) {
        console.error('❌ Scan error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});

/**
 * Scan Kaspa L1 blockchain for transactions
 */
async function scanKaspaL1(address, since) {
    try {
        // Use Kaspa REST API
        const apiUrl = `https://api.kaspa.org/addresses/${address}/transactions?limit=100`;
        
        console.log('📡 Fetching from Kaspa API:', apiUrl);
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
            console.error('Kaspa API error:', response.status);
            return [];
        }

        const data = await response.json();
        
        if (!data.transactions || !Array.isArray(data.transactions)) {
            console.log('No transactions found in response');
            return [];
        }

        // Filter transactions within challenge period
        const filtered = data.transactions.filter(tx => {
            const txTime = new Date(tx.block_time * 1000);
            return txTime >= since && 
                   txTime >= CHALLENGE_START && 
                   txTime <= CHALLENGE_END &&
                   tx.inputs.some(input => input.previous_outpoint_address === address);
        });

        return filtered.map(tx => ({
            tx_hash: tx.transaction_id,
            amount: tx.outputs.reduce((sum, out) => sum + (out.amount || 0), 0) / 100000000,
            timestamp: new Date(tx.block_time * 1000).toISOString(),
            confirmations: 1
        }));

    } catch (error) {
        console.error('Failed to scan Kaspa L1:', error);
        return [];
    }
}

/**
 * Scan Kasplex L2 (EVM) blockchain for transactions
 */
async function scanKasplexL2(address, since) {
    try {
        // Use Kasplex L2 RPC
        const rpcUrl = Deno.env.get('L2_RPC_URL') || 'https://rpc.kasplex.org';
        
        console.log('📡 Fetching from Kasplex L2 RPC');

        // Get latest block number
        const latestBlockResponse = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_blockNumber',
                params: [],
                id: 1
            })
        });

        const latestBlockData = await latestBlockResponse.json();
        const latestBlock = parseInt(latestBlockData.result, 16);

        // Calculate how many blocks to scan (approx 72 hours)
        const blocksToScan = Math.min(100000, latestBlock); // Limit to prevent timeout

        // Get transaction count for address
        const txCountResponse = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_getTransactionCount',
                params: [address, 'latest'],
                id: 2
            })
        });

        const txCountData = await txCountResponse.json();
        const txCount = parseInt(txCountData.result, 16);

        console.log(`📊 Address has ${txCount} total transactions`);

        // For now, return empty array - full implementation would require:
        // 1. Scanning blocks or using a graph indexer
        // 2. Filtering transactions from this address
        // 3. Parsing transaction data

        // TODO: Implement full L2 scanning
        return [];

    } catch (error) {
        console.error('Failed to scan Kasplex L2:', error);
        return [];
    }
}