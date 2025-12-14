import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { query } = await req.json();

        if (!query) {
            return Response.json({ error: 'Search query is required' }, { status: 400 });
        }

        console.log('🔍 Smart YouTube Search:', query);

        // Use LLM with web search to find YouTube videos
        // This is more robust than direct API for "scalping" channels from URLs
        const response = await base44.integrations.Core.InvokeLLM({
            prompt: `Search YouTube for "${query}".
            
CRITICAL INSTRUCTION:
If the query looks like a specific Channel (URL, @handle, or Name), you MUST find the most recent and popular videos UPLOADED BY THAT SPECIFIC CHANNEL.
Do not return random videos about the topic, return videos FROM the channel.

If the query is just a topic, find the best videos for it.

Return a JSON object with a "videos" array containing:
- videoId (11 character YouTube video ID)
- title (video title)
- channelName (channel that uploaded it)
- thumbnail (use format: https://img.youtube.com/vi/VIDEO_ID/mqdefault.jpg)
- duration (estimated duration like "5:30")
- views (estimated view count like "1.2M")

Ensure videoIds are valid.`,
            add_context_from_internet: true,
            response_json_schema: {
                type: "object",
                properties: {
                    videos: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                videoId: { type: "string" },
                                title: { type: "string" },
                                channelName: { type: "string" },
                                thumbnail: { type: "string" },
                                duration: { type: "string" },
                                views: { type: "string" }
                            }
                        }
                    }
                }
            }
        });

        console.log('✅ Found', response.videos?.length || 0, 'videos');

        return Response.json({
            success: true,
            videos: response.videos || [],
            query: query
        });

    } catch (error) {
        console.error('❌ Search failed:', error);
        return Response.json({ 
            error: error.message || 'Failed to search',
            success: false
        }, { status: 500 });
    }
});