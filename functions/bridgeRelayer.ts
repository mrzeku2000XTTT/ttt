
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// Bridge configuration
const BRIDGE_POOL_ADDRESS = "kaspa:qypr0qj7luv26laqlquan9n2zu7wyen87fkdw3kx3kd69ymyw3tj4tsh467xzf2";
const YOUR_BRIDGE_WALLET = Deno.env.get("BRIDGE_WALLET_ADDRESS"); // Your intermediate wallet
const BRIDGE_FEE_PERCENT = 0.001; // 0.1% fee

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, ...params } = await req.json();

        switch (action) {
            case 'createDeposit':
                return await createDeposit(base44, user, params);
            
            case 'getDeposit':
                return await getDeposit(base44, params);
            
            case 'listUserDeposits':
                return await listUserDeposits(base44, user);
            
            default:
                return Response.json({ error: 'Invalid action' }, { status: 400 });
        }

    } catch (error) {
        console.error('Bridge relayer error:', error);
        return Response.json({ 
            error: error.message || 'Internal server error' 
        }, { status: 500 });
    }
});

/**
 * Create a new deposit record when user initiates bridge
 */
async function createDeposit(base44, user, params) {
    const { amount, l2_address, direction } = params;

    console.log('=== Creating Deposit ===');
    console.log('User:', user.email);
    console.log('Amount:', amount);
    console.log('L2 Address:', l2_address);
    console.log('Direction:', direction);

    if (!amount || amount <= 0) {
        return Response.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (!l2_address || !l2_address.startsWith('0x')) {
        return Response.json({ error: 'Invalid L2 address' }, { status: 400 });
    }

    if (!YOUR_BRIDGE_WALLET) {
        console.error('❌ BRIDGE_WALLET_ADDRESS not set in environment!');
        return Response.json({ 
            error: 'Bridge wallet not configured. Please contact support.' 
        }, { status: 500 });
    }

    // Calculate fee
    const fee = amount * BRIDGE_FEE_PERCENT;
    const netAmount = amount - fee;

    console.log('Fee:', fee);
    console.log('Net amount:', netAmount);
    console.log('Bridge wallet:', YOUR_BRIDGE_WALLET);

    // Create deposit record
    const deposit = await base44.asServiceRole.entities.BridgeTransaction.create({
        from_network: direction === 'l1tol2' ? 'L1' : 'L2',
        to_network: direction === 'l1tol2' ? 'L2' : 'L1',
        from_address: user.email, // Store user identifier
        to_address: l2_address,
        amount: amount,
        fee: fee,
        status: 'pending',
        token_type: 'KAS',
        token_symbol: 'KAS'
    });

    console.log('✅ Deposit created with ID:', deposit.id);

    return Response.json({
        success: true,
        deposit_id: deposit.id,
        bridge_wallet: YOUR_BRIDGE_WALLET,
        amount: amount,
        net_amount: netAmount,
        fee: fee,
        instructions: `Send ${amount} KAS to ${YOUR_BRIDGE_WALLET}`
    });
}

/**
 * Get deposit status
 */
async function getDeposit(base44, params) {
    const { deposit_id } = params;

    if (!deposit_id) {
        return Response.json({ error: 'Missing deposit_id' }, { status: 400 });
    }

    const deposits = await base44.asServiceRole.entities.BridgeTransaction.filter({
        id: deposit_id
    });

    if (deposits.length === 0) {
        return Response.json({ error: 'Deposit not found' }, { status: 404 });
    }

    return Response.json({
        success: true,
        deposit: deposits[0]
    });
}

/**
 * List all deposits for current user
 */
async function listUserDeposits(base44, user) {
    const deposits = await base44.asServiceRole.entities.BridgeTransaction.filter({
        from_address: user.email
    }, '-created_date', 50);

    return Response.json({
        success: true,
        deposits: deposits
    });
}
