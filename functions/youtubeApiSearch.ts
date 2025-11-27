import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { query, maxResults = 12 } = await req.json();

        if (!query) {
            return Response.json({ error: 'Search query is required' }, { status: 400 });
        }

        const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
        
        if (!YOUTUBE_API_KEY) {
            console.error('❌ YOUTUBE_API_KEY not set');
            return Response.json({ 
                error: 'YouTube API key not configured. Please set YOUTUBE_API_KEY in environment variables.',
                success: false 
            }, { status: 500 });
        }

        console.log('🔍 YouTube API Search:', query);
        console.log('🔑 API Key present:', YOUTUBE_API_KEY ? 'Yes' : 'No');

        // Call YouTube Data API v3 - Search endpoint
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`;

        console.log('📤 Calling YouTube API...');
        const response = await fetch(searchUrl);
        
        const responseText = await response.text();
        console.log('📥 YouTube API Response Status:', response.status);
        console.log('📥 YouTube API Response:', responseText);

        if (!response.ok) {
            console.error('❌ YouTube API Error:', response.status);
            
            let errorMessage = 'YouTube API request failed';
            let errorDetails = responseText;
            
            try {
                const errorJson = JSON.parse(responseText);
                if (errorJson.error) {
                    errorMessage = errorJson.error.message || errorMessage;
                    errorDetails = JSON.stringify(errorJson.error, null, 2);
                    
                    // Check for common issues
                    if (errorJson.error.code === 400) {
                        if (errorJson.error.message.includes('API key not valid')) {
                            errorMessage = 'Invalid YouTube API key. Please check your API key in settings.';
                        } else if (errorJson.error.message.includes('has not been used')) {
                            errorMessage = 'YouTube Data API v3 is not enabled. Please enable it in Google Cloud Console.';
                        }
                    } else if (errorJson.error.code === 403) {
                        if (errorJson.error.message.includes('quota')) {
                            errorMessage = 'YouTube API quota exceeded. Please try again later.';
                        }
                    }
                }
            } catch (e) {
                console.error('Could not parse error response:', e);
            }
            
            return Response.json({ 
                error: errorMessage,
                details: errorDetails,
                success: false,
                statusCode: response.status
            }, { status: response.status });
        }

        const data = JSON.parse(responseText);

        if (!data.items || data.items.length === 0) {
            console.log('⚠️ No videos found for query:', query);
            return Response.json({
                success: true,
                videos: [],
                query: query,
                message: 'No videos found for this search'
            });
        }

        // Transform YouTube API response to our format
        const videos = data.items.map(item => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            channelName: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.medium.url,
            publishedAt: item.snippet.publishedAt,
            description: item.snippet.description
        }));

        console.log('✅ Found', videos.length, 'videos');

        return Response.json({
            success: true,
            videos: videos,
            query: query
        });

    } catch (error) {
        console.error('❌ YouTube API search failed:', error);
        return Response.json({ 
            error: error.message || 'Failed to search YouTube',
            details: error.toString(),
            success: false 
        }, { status: 500 });
    }
});