import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        console.log('🚀 [createAgentConnection] Starting...');
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ 
                success: false,
                error: 'Not authenticated' 
            }, { status: 401 });
        }
        
        console.log('✅ User:', user.email);

        const body = await req.json();
        const { target_address, message } = body;

        if (!target_address) {
            return Response.json({
                success: false,
                error: 'Target address required'
            }, { status: 400 });
        }

        if (!user.created_wallet_address) {
            return Response.json({
                success: false,
                error: 'TTT Wallet required'
            }, { status: 400 });
        }

        console.log('📍 Target:', target_address);

        // Find target profile by wallet_address or ttt_wallet_address
        let targetProfile = null;
        try {
            const profilesByKasware = await base44.entities.AgentZKProfile.filter({
                wallet_address: target_address
            });
            
            if (profilesByKasware.length > 0) {
                targetProfile = profilesByKasware[0];
                console.log('✅ Target profile exists (Kasware):', targetProfile.username);
            } else {
                // Try TTT wallet address
                const profilesByTTT = await base44.entities.AgentZKProfile.filter({
                    ttt_wallet_address: target_address
                });
                
                if (profilesByTTT.length > 0) {
                    targetProfile = profilesByTTT[0];
                    console.log('✅ Target profile exists (TTT):', targetProfile.username);
                } else {
                    console.log('⚠️ No profile yet - will create message-to-address');
                }
            }
        } catch (e) {
            console.log('⚠️ Profile lookup failed:', e.message);
        }

        // Get my profile
        let myProfile = null;
        try {
            const myProfiles = await base44.entities.AgentZKProfile.filter({
                user_email: user.email
            });
            myProfile = myProfiles.length > 0 ? myProfiles[0] : null;
        } catch (e) {
            console.log('⚠️ My profile lookup failed:', e.message);
        }

        // Check existing
        try {
            const existing = await base44.entities.AgentZKConnection.filter({
                requester_email: user.email,
                target_address: target_address
            });

            if (existing.length > 0) {
                console.log('✅ Connection exists');
                return Response.json({
                    success: true,
                    connection: existing[0],
                    message: 'Connection already exists'
                });
            }
        } catch (e) {
            console.log('⚠️ Existing check failed:', e.message);
        }

        // Create conversation ID based on addresses (deterministic)
        const addresses = [user.created_wallet_address, target_address].sort();
        const conversationId = `conv_${addresses[0]}_${addresses[1]}`;
        console.log('🆔 Conversation ID:', conversationId);

        // Create connection (works even if target has no profile)
        console.log('💾 Creating connection...');
        const newConnection = await base44.entities.AgentZKConnection.create({
            requester_email: user.email,
            requester_address: user.created_wallet_address,
            target_address: target_address,
            target_email: targetProfile?.user_email || '',
            status: 'accepted',
            conversation_id: conversationId,
            is_active: true
        });
        
        console.log('✅ Connection created:', newConnection.id);

        // Create message-to-address (recipient can be unknown)
        if (message?.trim()) {
            try {
                console.log('💬 Creating message-to-address...');
                await base44.entities.AgentMessage.create({
                    conversation_id: conversationId,
                    sender_email: user.email,
                    sender_address: user.created_wallet_address,
                    sender_username: myProfile?.username || user.username || 'Agent',
                    sender_agent_id: myProfile?.agent_zk_id || '',
                    recipient_email: targetProfile?.user_email || '',
                    recipient_address: target_address,
                    recipient_username: targetProfile?.username || 'Unclaimed Address',
                    recipient_agent_id: targetProfile?.agent_zk_id || '',
                    message: message.trim(),
                    is_read: false
                });
                console.log('✅ Message sent to address (claimed or unclaimed)');
            } catch (e) {
                console.log('⚠️ Message failed:', e.message);
            }
        }

        return Response.json({
            success: true,
            connection: newConnection,
            message: targetProfile 
                ? 'Connected! Start chatting.' 
                : 'Message sent to address! They\'ll see it when they claim this identity.'
        });

    } catch (error) {
        console.error('❌ Error:', error);
        console.error('Stack:', error.stack);
        
        return Response.json({ 
            success: false,
            error: error.message || 'Unknown error'
        }, { status: 500 });
    }
});