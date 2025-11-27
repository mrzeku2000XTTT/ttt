import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Webhook endpoint to receive Kasware transaction notifications
 * This gets called when user sends KAS to your bridge wallet
 */

const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET");
const BRIDGE_POOL_ADDRESS = "kaspa:qypr0qj7luv26laqlquan9n2zu7wyen87fkdw3kx3kd69ymyw3tj4tsh467xzf2";

Deno.serve(async (req) => {
    try {
        // Verify webhook authenticity
        const signature = req.headers.get('x-webhook-signature');
        if (signature !== WEBHOOK_SECRET) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const base44 = createClientFromRequest(req);
        const payload = await req.json();

        const {
            txid,
            from_address,
            to_address,
            amount_sompi,
            confirmations
        } = payload;

        // Convert sompi to KAS
        const amountKAS = amount_sompi / 100000000;

        console.log('Received deposit:', {
            txid,
            from: from_address,
            amount: amountKAS,
            confirmations
        });

        // Find matching pending deposit
        const deposits = await base44.asServiceRole.entities.BridgeTransaction.filter({
            status: 'pending',
            amount: amountKAS
        });

        if (deposits.length === 0) {
            console.log('No matching deposit found for amount:', amountKAS);
            return Response.json({ 
                success: true, 
                message: 'No matching deposit' 
            });
        }

        const deposit = deposits[0];

        // Update deposit with tx hash
        await base44.asServiceRole.entities.BridgeTransaction.update(deposit.id, {
            tx_hash: txid,
            status: 'processing'
        });

        // Forward to Kasplex pool with L2 address payload
        // This would normally call your Kaspa wallet to send with payload
        console.log('Forwarding to Kasplex:', {
            to: BRIDGE_POOL_ADDRESS,
            amount: deposit.amount - deposit.fee,
            payload: deposit.to_address.substring(2) // Remove 0x
        });

        // Mark as forwarded
        await base44.asServiceRole.entities.BridgeTransaction.update(deposit.id, {
            status: 'forwarded'
        });

        return Response.json({
            success: true,
            message: 'Deposit processed and forwarded'
        });

    } catch (error) {
        console.error('Webhook error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});