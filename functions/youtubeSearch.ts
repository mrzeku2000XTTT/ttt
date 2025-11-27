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

        console.log('🔍 YouTube Search Query:', query);

        // Use LLM with web search to find YouTube videos
        const response = await base44.integrations.Core.InvokeLLM({
            prompt: `Search YouTube for "${query}" and find the top 12 most relevant videos. 
            
Return a JSON array with:
- videoId (11 character YouTube video ID)
- title (video title)
- channelName (channel that uploaded it)
- thumbnail (use format: https://img.youtube.com/vi/VIDEO_ID/mqdefault.jpg)
- duration (estimated duration like "5:30")
- views (estimated view count like "1.2M")

Make sure the videoIds are REAL and VALID YouTube video IDs that exist.`,
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
        console.error('❌ YouTube search failed:', error);
        return Response.json({ 
            error: error.message || 'Failed to search YouTube',
            success: false
        }, { status: 500 });
    }
});