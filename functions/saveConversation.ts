import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { conversation_id, messages } = await req.json();

        console.log('💾 Saving conversation:', conversation_id);
        console.log('👤 User:', user.email);
        console.log('💬 Messages count:', messages.length);

        // Analyze conversation with AI to extract topics
        const conversationText = messages.map(m => `${m.role}: ${m.content}`).join('\n');
        
        const analysis = await base44.integrations.Core.InvokeLLM({
            prompt: `Analyze this conversation and extract:
1. Main topics discussed (3-5 keywords)
2. Conversation type (market_analysis, technical_help, general_question, whale_tracking, or news)
3. Overall sentiment (positive, neutral, or negative)

Conversation:
${conversationText}

Return as JSON with: topics (array), conversation_type (string), sentiment (string)`,
            response_json_schema: {
                type: "object",
                properties: {
                    topics: {
                        type: "array",
                        items: { type: "string" }
                    },
                    conversation_type: { type: "string" },
                    sentiment: { type: "string" }
                }
            }
        });

        console.log('🔍 Analysis:', analysis);

        // Save conversation to database
        const saved = await base44.asServiceRole.entities.AIConversation.create({
            conversation_id: conversation_id,
            user_email: user.email,
            messages: messages.map(m => ({
                role: m.role,
                content: m.content,
                timestamp: m.timestamp || new Date().toISOString()
            })),
            topics: analysis.topics || [],
            conversation_type: analysis.conversation_type || 'general_question',
            sentiment: analysis.sentiment || 'neutral'
        });

        console.log('✅ Conversation saved:', saved.id);

        // Update user preferences based on topics
        const existingPrefs = await base44.asServiceRole.entities.UserPreference.filter({
            user_email: user.email
        });

        if (existingPrefs.length > 0) {
            const pref = existingPrefs[0];
            const updatedInterests = [...new Set([...(pref.interests || []), ...analysis.topics])];
            
            await base44.asServiceRole.entities.UserPreference.update(pref.id, {
                interests: updatedInterests,
                preferred_topics: analysis.topics
            });
        } else {
            await base44.asServiceRole.entities.UserPreference.create({
                user_email: user.email,
                interests: analysis.topics,
                preferred_topics: analysis.topics
            });
        }

        return Response.json({ 
            success: true,
            conversation_saved: saved.id,
            topics_extracted: analysis.topics
        });

    } catch (error) {
        console.error('❌ Failed to save conversation:', error);
        return Response.json({ 
            error: error.message || 'Failed to save conversation' 
        }, { status: 500 });
    }
});