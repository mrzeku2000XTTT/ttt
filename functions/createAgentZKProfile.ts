import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Create Agent ZK Profile with AI-Generated Space Background
 * Analyzes user's career/skills and creates personalized profile
 * Handles both Kasware L1 and TTT Wallet addresses
 * ALSO updates any existing "unclaimed" messages to link to new profile
 */

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        console.log('🚀 [Agent ZK Profile] Creating profile...');
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ 
                success: false,
                error: 'Unauthorized' 
            }, { status: 401 });
        }

        const body = await req.json();
        const { username, kaspaAddress, tttWalletAddress, career, notes } = body;

        console.log('👤 Creating profile for:', username);
        console.log('💼 Career:', career);
        console.log('🔑 Kasware L1:', kaspaAddress);
        console.log('💰 TTT Wallet:', tttWalletAddress || 'Not connected');

        // Check if profile already exists for this user
        const existingProfiles = await base44.entities.AgentZKProfile.filter({
            user_email: user.email
        });

        if (existingProfiles.length > 0) {
            console.log('⚠️ Profile already exists, returning existing profile...');
            
            return Response.json({
                success: true,
                profile: existingProfiles[0],
                message: 'Profile already exists!'
            });
        }

        // Generate AI analysis of user's career
        console.log('🧠 Analyzing career with AI...');
        let careerAnalysis;
        
        try {
            careerAnalysis = await base44.integrations.Core.InvokeLLM({
                prompt: `Analyze this career/background and extract key information:

Career Input: "${career}"

Extract:
1. Primary role/title (e.g., "Full-Stack Developer", "Marketing Specialist")
2. Key skills (list 3-5 most important)
3. Experience level (Junior, Mid, Senior, Expert)
4. Best matching category from: Backend Developer, Frontend Developer, Full Stack Developer, Smart Contract Developer, UI/UX Designer, Product Manager, Marketing Specialist, Content Creator, Community Manager, Data Scientist, DevOps Engineer, Security Researcher, Blockchain Analyst, Business Strategist, Other
5. Brief bio (2-3 sentences, professional tone)

Return JSON only.`,
                response_json_schema: {
                    type: 'object',
                    properties: {
                        role: { type: 'string' },
                        skills: { type: 'array', items: { type: 'string' } },
                        experience_level: { type: 'string' },
                        category: { type: 'string' },
                        bio: { type: 'string' }
                    }
                }
            });
            console.log('✅ Career analysis:', careerAnalysis);
        } catch (err) {
            console.error('⚠️ AI analysis failed, using defaults:', err);
            careerAnalysis = {
                role: 'Developer',
                skills: ['Blockchain', 'Web3', 'Kaspa'],
                experience_level: 'Mid',
                category: 'Other',
                bio: career.substring(0, 200)
            };
        }

        // Generate unique Agent ZK ID
        const agentZKId = `ZK-${kaspaAddress.substring(6, 14).toUpperCase()}`;
        console.log('🆔 Agent ZK ID:', agentZKId);

        // Generate profile photo placeholder
        const photoPlaceholder = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&size=400&background=0ea5e9&color=fff&bold=true`;

        // Skip AI image generation for faster profile creation
        const backgroundUrl = "https://evalstate-flux1-schnell.hf.space/gradio_api/file=/tmp/gradio/15fcff41331fffd0b38a3a4f68e2fd0bc0e3ea2f9b76c65804e6f5272a92c/image.webp";

        // Create AgentZKProfile entity using regular entities API (RLS allows it)
        console.log('💾 Creating AgentZKProfile entity...');
        const profile = await base44.entities.AgentZKProfile.create({
            user_email: user.email,
            username: username,
            agent_zk_id: agentZKId,
            wallet_address: kaspaAddress,
            ttt_wallet_address: tttWalletAddress || null,
            role: careerAnalysis.category || 'Other',
            bio: careerAnalysis.bio || career.substring(0, 200),
            skills: careerAnalysis.skills || [],
            is_public: true,
            is_hireable: true,
            availability: 'available',
            verification_count: 0,
            last_active: new Date().toISOString(),
            agent_zk_photo: photoPlaceholder,
            social_links: {},
            portfolio: [],
            work_type: ['worker']
        });

        console.log('✅ Profile created:', profile.id);

        // Update unclaimed messages in background (don't fail if this errors)
        try {
            const unclaimedKasware = await base44.entities.AgentMessage.filter({
                recipient_address: kaspaAddress,
                recipient_email: ''
            });
            
            console.log(`📬 Found ${unclaimedKasware.length} unclaimed messages for Kasware address`);
            
            for (const msg of unclaimedKasware) {
                await base44.entities.AgentMessage.update(msg.id, {
                    recipient_email: user.email,
                    recipient_username: username,
                    recipient_agent_id: agentZKId
                });
            }
            
            if (tttWalletAddress) {
                const unclaimedTTT = await base44.entities.AgentMessage.filter({
                    recipient_address: tttWalletAddress,
                    recipient_email: ''
                });
                
                console.log(`📬 Found ${unclaimedTTT.length} unclaimed messages for TTT address`);
                
                for (const msg of unclaimedTTT) {
                    await base44.entities.AgentMessage.update(msg.id, {
                        recipient_email: user.email,
                        recipient_username: username,
                        recipient_agent_id: agentZKId
                    });
                }
            }
            
            console.log('✅ All unclaimed messages updated!');
        } catch (err) {
            console.error('⚠️ Failed to update unclaimed messages:', err);
        }

        // Save to user data
        try {
            await base44.auth.updateMe({
                agent_profile_background: backgroundUrl,
                agent_career_analysis: careerAnalysis,
                agent_zk_id: agentZKId
            });
        } catch (err) {
            console.error('⚠️ Failed to update user data:', err);
        }

        return Response.json({
            success: true,
            profile: {
                id: profile.id,
                agent_zk_id: agentZKId,
                username: username,
                wallet_address: kaspaAddress,
                ttt_wallet_address: tttWalletAddress,
                role: careerAnalysis.category,
                bio: careerAnalysis.bio,
                skills: careerAnalysis.skills,
                background_url: backgroundUrl,
                photo_url: photoPlaceholder
            },
            message: 'Agent ZK profile created successfully!'
        });

    } catch (error) {
        console.error('❌ [Agent ZK Profile] Error:', error);
        console.error('Error stack:', error.stack);
        
        return Response.json({ 
            success: false,
            error: error.message || 'Failed to create profile',
            details: error.stack
        }, { status: 500 });
    }
});