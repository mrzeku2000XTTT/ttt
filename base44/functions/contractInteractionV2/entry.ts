import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

console.log('🚀 [Backend V2] Contract Interaction Function Loaded');

// HARDCODED - NO ENV VARIABLES
const CORRECT_CONTRACT = "0x43FC9BE0B569B23e878eeC17dA0AAAbe5D12e5F6";

Deno.serve(async (req) => {
    console.log('🔧 [Backend V2] ========== NEW REQUEST ==========');
    console.log('🏠 [Backend V2] Using Contract:', CORRECT_CONTRACT);
    
    const encodeUint256 = (value) => {
        const num = BigInt(value);
        return num.toString(16).padStart(64, '0');
    };

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
        console.log('✅ [Backend V2] User authenticated:', user.email);

        const body = await req.json();
        const { action, tradeId, userAddress, kasAmount, fiatAmount, paymentMethod, paymentDetails } = body;

        console.log('🎯 [Backend V2] Action:', action);

        if (!userAddress) {
            return Response.json({ 
                success: false,
                error: 'User address required'
            }, { status: 400 });
        }

        const FUNCTION_SELECTORS = {
            createTrade: '0x2ba71295',
            acceptTrade: '0xecb9fec3',
            confirmPaymentSent: '0x8b7c1dbb',
            confirmPaymentReceived: '0xe3406ff6',
            cancelTrade: '0x09ec6cc7',
            raiseDispute: '0xa5c1674e'
        };

        let transaction;

        if (action === 'createTrade') {
            console.log('💰 [Backend V2] Creating trade...');
            console.log('💰 [Backend V2] KAS Amount:', kasAmount);
            console.log('💰 [Backend V2] Fiat Amount (cents):', fiatAmount);
            
            const kasAmountWei = BigInt(Math.floor(kasAmount * 1e18));
            const fiatAmountCents = Math.floor(fiatAmount);
            
            // Calculate offsets for dynamic strings
            const offset1 = 96; // First string starts after 3 params (32*3)
            const paymentMethodBytes = new TextEncoder().encode(paymentMethod).length;
            const paymentMethodPadded = Math.ceil(paymentMethodBytes / 32) * 32;
            const offset2 = offset1 + 32 + paymentMethodPadded; // Second string offset
            
            const data = '0x' + FUNCTION_SELECTORS.createTrade + 
                encodeUint256(fiatAmountCents) +
                encodeUint256(offset1) +
                encodeUint256(offset2) +
                encodeString(paymentMethod) +
                encodeString(paymentDetails);
            
            console.log('📦 [Backend V2] Function selector:', FUNCTION_SELECTORS.createTrade);
            console.log('📦 [Backend V2] Fiat (encoded):', encodeUint256(fiatAmountCents));
            console.log('📦 [Backend V2] Full data length:', data.length);
            
            transaction = {
                from: userAddress,
                to: CORRECT_CONTRACT,
                value: '0x' + kasAmountWei.toString(16),
                data: data
            };
            
            console.log('✅ [Backend V2] Transaction prepared for:', CORRECT_CONTRACT);
            console.log('✅ [Backend V2] Value:', transaction.value);
            
        } else if (action === 'confirmPaymentReceived') {
            console.log('💸 [Backend V2] Confirming payment received, trade:', tradeId);
            const data = '0x' + FUNCTION_SELECTORS.confirmPaymentReceived + encodeUint256(tradeId);
            transaction = {
                from: userAddress,
                to: CORRECT_CONTRACT,
                value: '0x0',
                data: data
            };
        } else if (action === 'cancelTrade') {
            console.log('❌ [Backend V2] Cancelling trade:', tradeId);
            const data = '0x' + FUNCTION_SELECTORS.cancelTrade + encodeUint256(tradeId);
            transaction = {
                from: userAddress,
                to: CORRECT_CONTRACT,
                value: '0x0',
                data: data
            };
        } else if (action === 'acceptTrade') {
            console.log('🤝 [Backend V2] Accepting trade:', tradeId);
            const data = '0x' + FUNCTION_SELECTORS.acceptTrade + encodeUint256(tradeId);
            transaction = {
                from: userAddress,
                to: CORRECT_CONTRACT,
                value: '0x0',
                data: data
            };
        } else if (action === 'confirmPaymentSent') {
            console.log('📤 [Backend V2] Confirming payment sent:', tradeId);
            const data = '0x' + FUNCTION_SELECTORS.confirmPaymentSent + encodeUint256(tradeId);
            transaction = {
                from: userAddress,
                to: CORRECT_CONTRACT,
                value: '0x0',
                data: data
            };
        } else if (action === 'raiseDispute') {
            console.log('⚠️ [Backend V2] Raising dispute:', tradeId);
            const data = '0x' + FUNCTION_SELECTORS.raiseDispute + encodeUint256(tradeId);
            transaction = {
                from: userAddress,
                to: CORRECT_CONTRACT,
                value: '0x0',
                data: data
            };
        } else {
            return Response.json({ 
                success: false,
                error: 'Invalid action: ' + action
            }, { status: 400 });
        }

        console.log('✅ [Backend V2] Final transaction.to:', transaction.to);

        return Response.json({
            success: true,
            transaction: transaction,
            contractAddress: CORRECT_CONTRACT
        }, { status: 200 });

    } catch (error) {
        console.error('❌ [Backend V2] Error:', error.message);
        
        return Response.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
});