import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { creditAccessCheck } from '../../shared/creditAccessCheck.ts';
import { getRequestUser } from '../../shared/requestAuth.ts';

export default async function(req) {
    try {
        const base44 = createClientFromRequest(req);
        const user = await getRequestUser(base44);
        if (user && await creditAccessCheck(req)) return Response.json({ authorized: true });

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('🧠 Generating smart feed for:', user.email);

        // Get user preferences
        const prefs = await base44.asServiceRole.entities.UserPreference.filter({
            user_email: user.email
        });

        const userInterests = prefs.length > 0 ? prefs[0].interests || [] : [];
        const preferredTopics = prefs.length > 0 ? prefs[0].preferred_topics || [] : [];

        console.log('📊 User interests:', userInterests);
        console.log('🎯 Preferred topics:', preferredTopics);

        // If no preferences, return generic feed
        if (userInterests.length === 0) {
            console.log('ℹ️ No user preferences, returning generic feed');
            return Response.json({
                feed: [
                    {
                        title: "Welcome to TTT Smart Feed",
                        content: "Start using Zeku AI to get personalized content based on your interests!",
                        type: "welcome",
                        timestamp: new Date().toISOString()
                    }
                ]
            });
        }

        // Generate personalized content using AI
        const smartFeed = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `User is interested in: ${userInterests.join(', ')}
Their preferred topics: ${preferredTopics.join(', ')}

Generate 5 personalized crypto/blockchain content items for this user. Include:
- Breaking news related to their interests
- Market insights for their preferred topics
- Educational content about their interests
- Trending topics in their areas of interest

Return as JSON array with: title, content, type (news/insight/education/trending), source, timestamp`,
            add_context_from_internet: true,
            response_json_schema: {
                type: "object",
                properties: {
                    feed: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                title: { type: "string" },
                                content: { type: "string" },
                                type: { type: "string" },
                                source: { type: "string" },
                                timestamp: { type: "string" }
                            }
                        }
                    }
                }
            }
        });

        console.log('✅ Smart feed generated:', smartFeed.feed.length, 'items');

        return Response.json({
            feed: smartFeed.feed,
            user_interests: userInterests
        });

    } catch (error) {
        console.error('❌ Failed to generate smart feed:', error);
        return Response.json({ 
            error: error.message || 'Failed to generate feed' 
        }, { status: 500 });
    }
}