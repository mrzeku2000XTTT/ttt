import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

console.log('🚀 [Backend] Contract Interaction Function Loaded');

// CONTRACT ADDRESSES FOR BOTH NETWORKS
const CONTRACT_ADDRESSES = {
    mainnet: "0x7A4f6C9B2128F10d3B7Aa01bf288825d4e1b5194",
    testnet: "0x7A4f6C9B2128F10d3B7Aa01bf288825d4e1b5194" // TESTNET CONTRACT - SAME AS MAINNET FOR NOW
};

Deno.serve(async (req) => {
    console.log('🔧 [Backend] ========== NEW REQUEST ==========');
    
    // Helper function to encode uint256 parameter (32 bytes)
    const encodeUint256 = (value) => {
        const num = BigInt(value);
        return num.toString(16).padStart(64, '0');
    };

    // Helper function to encode string parameter
    const encodeString = (str) => {
        const bytes = new TextEncoder().encode(str);
        const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
        const length = encodeUint256(bytes.length);
        const padded = hex.padEnd(Math.ceil(hex.length / 64) * 64, '0');
        return length + padded;
    };
    
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        console.log('✅ [Backend] User authenticated:', user.email);

        const body = await req.json();
        const { action, tradeId, userAddress, kasAmount, fiatAmount, paymentMethod, paymentDetails, network } = body;

        // Select contract based on network parameter
        const currentNetwork = network === 'testnet' ? 'testnet' : 'mainnet';
        const CORRECT_CONTRACT = CONTRACT_ADDRESSES[currentNetwork];
            
        console.log('🏠 [Backend] Using Contract:', CORRECT_CONTRACT, `(${currentNetwork})`);
        console.log('🎯 [Backend] Action:', action);
        console.log('🎯 [Backend] Trade ID:', tradeId);
        console.log('🎯 [Backend] User Address:', userAddress);

        if (!userAddress) {
            return Response.json({ 
                success: false,
                error: 'User address required'
            }, { status: 400 });
        }

        // ALL REAL function selectors from compiled contract
        const FUNCTION_SELECTORS = {
            createTrade: '0x2ba71295',
            acceptTrade: '0xecb9fec3',
            confirmPaymentSent: '0x8b7c1dbb',
            confirmPaymentReceived: '0xe3406ff6',
            cancelTrade: '0x09ec6cc7',
            raiseDispute: '0xa5c1674e'
        };

        let transaction;

        switch (action) {
            case 'createTrade': {
                console.log('💰 [Backend] Creating trade...');
                console.log('💰 [Backend] KAS Amount:', kasAmount);
                console.log('💰 [Backend] Fiat Amount:', fiatAmount);
                
                if (!kasAmount || kasAmount <= 0) {
                    throw new Error('Invalid KAS amount: ' + kasAmount);
                }
                
                const kasAmountWei = BigInt(Math.floor(kasAmount * 1e18));
                const fiatAmountCents = Math.floor(fiatAmount * 100);
                
                // Calculate offsets for dynamic strings
                const offset1 = 96;
                const paymentMethodBytes = new TextEncoder().encode(paymentMethod).length;
                const paymentMethodPadded = Math.ceil(paymentMethodBytes / 32) * 32;
                const offset2 = offset1 + 32 + paymentMethodPadded;
                
                const data = FUNCTION_SELECTORS.createTrade + 
                    encodeUint256(fiatAmountCents) +
                    encodeUint256(offset1) +
                    encodeUint256(offset2) +
                    encodeString(paymentMethod) +
                    encodeString(paymentDetails);
                
                console.log('📦 [Backend] Encoded data:', data);
                
                transaction = {
                    from: userAddress,
                    to: CORRECT_CONTRACT,
                    value: '0x' + kasAmountWei.toString(16),
                    data: data
                };
                break;
            }

            case 'acceptTrade': {
                console.log('🤝 [Backend] Accepting trade:', tradeId);
                
                if (tradeId === undefined || tradeId === null) {
                    throw new Error('Trade ID required');
                }
                
                const data = FUNCTION_SELECTORS.acceptTrade + encodeUint256(tradeId);
                console.log('📦 [Backend] Encoded data:', data);
                
                transaction = {
                    from: userAddress,
                    to: CORRECT_CONTRACT,
                    value: '0x0',
                    data: data
                };
                break;
            }

            case 'confirmPaymentSent': {
                console.log('📤 [Backend] Confirming payment sent for trade:', tradeId);
                
                if (tradeId === undefined || tradeId === null) {
                    throw new Error('Trade ID required');
                }
                
                const data = FUNCTION_SELECTORS.confirmPaymentSent + encodeUint256(tradeId);
                console.log('📦 [Backend] Encoded data:', data);
                
                transaction = {
                    from: userAddress,
                    to: CORRECT_CONTRACT,
                    value: '0x0',
                    data: data
                };
                break;
            }

            case 'confirmPaymentReceived': {
                console.log('💸 [Backend] Confirming payment received for trade:', tradeId);
                
                if (tradeId === undefined || tradeId === null) {
                    throw new Error('Trade ID required');
                }
                
                const data = FUNCTION_SELECTORS.confirmPaymentReceived + encodeUint256(tradeId);
                console.log('📦 [Backend] Encoded data:', data);
                
                transaction = {
                    from: userAddress,
                    to: CORRECT_CONTRACT,
                    value: '0x0',
                    data: data
                };
                break;
            }

            case 'cancelTrade': {
                console.log('❌ [Backend] Cancelling trade:', tradeId);
                
                if (tradeId === undefined || tradeId === null) {
                    throw new Error('Trade ID required');
                }
                
                const data = FUNCTION_SELECTORS.cancelTrade + encodeUint256(tradeId);
                console.log('📦 [Backend] Encoded data:', data);
                
                transaction = {
                    from: userAddress,
                    to: CORRECT_CONTRACT,
                    value: '0x0',
                    data: data
                };
                break;
            }

            case 'raiseDispute': {
                console.log('⚠️ [Backend] Raising dispute for trade:', tradeId);
                
                if (tradeId === undefined || tradeId === null) {
                    throw new Error('Trade ID required');
                }
                
                const data = FUNCTION_SELECTORS.raiseDispute + encodeUint256(tradeId);
                console.log('📦 [Backend] Encoded data:', data);
                
                transaction = {
                    from: userAddress,
                    to: CORRECT_CONTRACT,
                    value: '0x0',
                    data: data
                };
                break;
            }

            default: {
                return Response.json({ 
                    success: false,
                    error: 'Invalid action: ' + action
                }, { status: 400 });
            }
        }

        console.log('✅ [Backend] Transaction prepared:', JSON.stringify(transaction, null, 2));

        return Response.json({
            success: true,
            transaction: transaction,
            contractAddress: CORRECT_CONTRACT,
            network: currentNetwork
        }, { status: 200 });

    } catch (error) {
        console.error('❌ [Backend] Error:', error.message);
        
        return Response.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
});