import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('📰 Aggregating news from multiple sources...');

        const allNews = [];

        // Source 1: NewsAPI.org (Free tier - 100 requests/day)
        try {
            const newsApiResponse = await fetch(
                `https://newsapi.org/v2/everything?q=Kaspa OR KAS OR cryptocurrency OR blockchain&language=en&sortBy=publishedAt&pageSize=20`,
                {
                    headers: {
                        'X-Api-Key': Deno.env.get("NEWS_API_KEY") || ''
                    }
                }
            );
            
            if (newsApiResponse.ok) {
                const data = await newsApiResponse.json();
                if (data.articles) {
                    allNews.push(...data.articles.map(article => ({
                        title: article.title,
                        summary: article.description || article.content?.substring(0, 200) || '',
                        category: 'news',
                        timestamp: article.publishedAt,
                        source: article.source.name,
                        url: article.url,
                        image: article.urlToImage
                    })));
                }
            }
        } catch (e) {
            console.log('NewsAPI failed:', e.message);
        }

        // Source 2: GNews API (Free tier)
        try {
            const gnewsResponse = await fetch(
                `https://gnews.io/api/v4/search?q=Kaspa OR cryptocurrency&lang=en&max=20&apikey=${Deno.env.get("GNEWS_API_KEY") || ''}`
            );
            
            if (gnewsResponse.ok) {
                const data = await gnewsResponse.json();
                if (data.articles) {
                    allNews.push(...data.articles.map(article => ({
                        title: article.title,
                        summary: article.description || '',
                        category: 'market',
                        timestamp: article.publishedAt,
                        source: article.source.name,
                        url: article.url,
                        image: article.image
                    })));
                }
            }
        } catch (e) {
            console.log('GNews failed:', e.message);
        }

        // Source 3: The News API (Completely free)
        try {
            const theNewsApiResponse = await fetch(
                `https://api.thenewsapi.com/v1/news/all?api_token=${Deno.env.get("THE_NEWS_API_KEY") || ''}&search=Kaspa OR cryptocurrency&language=en&limit=20`
            );
            
            if (theNewsApiResponse.ok) {
                const data = await theNewsApiResponse.json();
                if (data.data) {
                    allNews.push(...data.data.map(article => ({
                        title: article.title,
                        summary: article.description || article.snippet || '',
                        category: 'tech',
                        timestamp: article.published_at,
                        source: article.source,
                        url: article.url,
                        image: article.image_url
                    })));
                }
            }
        } catch (e) {
            console.log('TheNewsAPI failed:', e.message);
        }

        // Fallback: Use InvokeLLM with web search
        if (allNews.length < 5) {
            console.log('Using LLM fallback for news...');
            try {
                const llmResponse = await base44.integrations.Core.InvokeLLM({
                    prompt: `Search X (Twitter), Reddit, and crypto news for the LATEST Kaspa (KAS) updates from the last 2 hours. Find:
- Breaking news and announcements
- Price movements and market analysis
- Technology updates
- Community sentiment
- Whale activity

Give me 15 UNIQUE, RECENT items. Format as JSON array with: title, summary, category (tweet/news/market/tech), source, timestamp, url (if available).`,
                    add_context_from_internet: true,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            news: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        title: { type: "string" },
                                        summary: { type: "string" },
                                        category: { type: "string" },
                                        timestamp: { type: "string" },
                                        source: { type: "string" },
                                        url: { type: "string" }
                                    }
                                }
                            }
                        }
                    }
                });

                if (llmResponse.news) {
                    allNews.push(...llmResponse.news);
                }
            } catch (e) {
                console.log('LLM fallback failed:', e.message);
            }
        }

        // Remove duplicates based on title similarity
        const uniqueNews = [];
        const seenTitles = new Set();

        for (const item of allNews) {
            const normalizedTitle = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 30);
            if (!seenTitles.has(normalizedTitle)) {
                seenTitles.add(normalizedTitle);
                uniqueNews.push({
                    ...item,
                    timestamp: item.timestamp || new Date().toISOString()
                });
            }
        }

        // Sort by timestamp (newest first)
        uniqueNews.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        console.log(`✅ Aggregated ${uniqueNews.length} unique news items from ${allNews.length} total`);

        return Response.json({ 
            news: uniqueNews.slice(0, 30),
            timestamp: new Date().toISOString(),
            sources_count: allNews.length
        });

    } catch (error) {
        console.error('❌ Failed to aggregate news:', error);
        return Response.json({ 
            error: error.message || 'Failed to fetch news',
            details: error.toString()
        }, { status: 500 });
    }
});