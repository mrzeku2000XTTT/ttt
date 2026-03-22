import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Syncs user's completed BridgeTransactions to ChallengeTx for global counting
 * This helps track all transactions toward the 1 billion goal
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('🔄 Syncing transactions for user:', user.email);

        // Get user's completed bridge transactions
        const userTxs = await base44.entities.BridgeTransaction.filter({
            created_by: user.email,
            status: 'completed'
        });

        console.log('📊 Found', userTxs.length, 'completed transactions');

        let syncedCount = 0;
        let skippedCount = 0;

        for (const tx of userTxs) {
            if (!tx.tx_hash) {
                console.log('⚠️ Skipping tx without hash:', tx.id);
                skippedCount++;
                continue;
            }

            // Check if already synced to ChallengeTx
            const existing = await base44.asServiceRole.entities.ChallengeTx.filter({
                tx_hash: tx.tx_hash
            });

            if (existing.length > 0) {
                console.log('✓ Already synced:', tx.tx_hash.substring(0, 10) + '...');
                skippedCount++;
                continue;
            }

            // Get user's wallet address from their profile
            let walletAddress = '';
            if (tx.from_network === 'L1') {
                walletAddress = user.kasware_address || tx.from_address;
            } else {
                walletAddress = user.metamask_address || tx.from_address;
            }

            // Check if user is registered for challenge
            const participants = await base44.asServiceRole.entities.ChallengeParticipant.filter({
                created_by: user.email
            });

            let participantId = null;
            if (participants.length > 0) {
                participantId = participants[0].id;
            }

            // Add to ChallengeTx
            try {
                await base44.asServiceRole.entities.ChallengeTx.create({
                    tx_hash: tx.tx_hash,
                    participant_id: participantId || 'unregistered',
                    wallet_address: walletAddress,
                    amount: tx.amount,
                    confirmations: 1,
                    is_verified: true
                });

                console.log('✅ Synced:', tx.tx_hash.substring(0, 10) + '...');
                syncedCount++;

                // Update participant count if registered
                if (participantId && participants.length > 0) {
                    const participant = participants[0];
                    await base44.asServiceRole.entities.ChallengeParticipant.update(participantId, {
                        transaction_count: (participant.transaction_count || 0) + 1
                    });
                }
            } catch (err) {
                console.error('❌ Failed to sync:', tx.tx_hash, err.message);
            }
        }

        console.log('✅ Sync complete:', syncedCount, 'synced,', skippedCount, 'skipped');

        return Response.json({
            success: true,
            synced: syncedCount,
            skipped: skippedCount,
            total: userTxs.length
        });

    } catch (error) {
        console.error('❌ Sync error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});