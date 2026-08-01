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
            prompt: `Search YouTube (and Google) for "${query}".

CRITICAL INSTRUCTIONS:
1. If the query looks like a specific Channel (URL, @handle, or Name), find the most recent AND most popular videos UPLOADED BY THAT SPECIFIC CHANNEL — not random videos about the topic.
2. If the query is a topic, find the most relevant AND most popular videos across many different channels — aim for variety, not just one channel.
3. Return as many videos as you can confidently verify — TARGET 20 videos, with a hard minimum of 15 if the topic/channel is rich enough. Only return fewer if you genuinely cannot find more real ones.

For EACH video in the JSON "videos" array, include:
- videoId (11-character YouTube video ID — must be a real, valid ID)
- title (the video's actual title)
- channelName (the channel that uploaded it)
- thumbnail (use format: https://img.youtube.com/vi/VIDEO_ID/mqdefault.jpg)
- duration (estimated duration like "5:30")
- views (estimated view count like "1.2M")

Ensure every videoId is a real, valid 11-character YouTube video ID. Do not invent or guess IDs.`,
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