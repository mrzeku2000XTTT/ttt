import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('🌍 Aggregating global war and conflict news...');

        const allNews = [];

        // Source 1: NewsAPI.org - War coverage
        try {
            const newsApiResponse = await fetch(
                `https://newsapi.org/v2/everything?q=war OR conflict OR military OR crisis OR ukraine OR gaza OR syria&language=en&sortBy=publishedAt&pageSize=30`,
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
                        summary: article.description || article.content?.substring(0, 250) || '',
                        category: 'conflict',
                        timestamp: article.publishedAt,
                        source: article.source.name,
                        url: article.url,
                        image: article.urlToImage,
                        location: extractLocation(article.title + ' ' + article.description)
                    })));
                }
            }
        } catch (e) {
            console.log('NewsAPI war news failed:', e.message);
        }

        // Source 2: GNews API - Conflict coverage
        try {
            const gnewsResponse = await fetch(
                `https://gnews.io/api/v4/search?q=war OR conflict OR military OR crisis&lang=en&max=30&apikey=${Deno.env.get("GNEWS_API_KEY") || ''}`
            );
            
            if (gnewsResponse.ok) {
                const data = await gnewsResponse.json();
                if (data.articles) {
                    allNews.push(...data.articles.map(article => ({
                        title: article.title,
                        summary: article.description || '',
                        category: 'humanitarian',
                        timestamp: article.publishedAt,
                        source: article.source.name,
                        url: article.url,
                        image: article.image,
                        location: extractLocation(article.title + ' ' + article.description)
                    })));
                }
            }
        } catch (e) {
            console.log('GNews war coverage failed:', e.message);
        }

        // Source 3: The News API - Global crisis
        try {
            const theNewsApiResponse = await fetch(
                `https://api.thenewsapi.com/v1/news/all?api_token=${Deno.env.get("THE_NEWS_API_KEY") || ''}&search=war OR conflict OR military&language=en&limit=30`
            );
            
            if (theNewsApiResponse.ok) {
                const data = await theNewsApiResponse.json();
                if (data.data) {
                    allNews.push(...data.data.map(article => ({
                        title: article.title,
                        summary: article.description || article.snippet || '',
                        category: 'military',
                        timestamp: article.published_at,
                        source: article.source,
                        url: article.url,
                        image: article.image_url,
                        location: extractLocation(article.title + ' ' + article.description)
                    })));
                }
            }
        } catch (e) {
            console.log('TheNewsAPI crisis news failed:', e.message);
        }

        // Fallback: Use InvokeLLM with web search for war news
        if (allNews.length < 10) {
            console.log('Using LLM fallback for war news...');
            try {
                const llmResponse = await base44.integrations.Core.InvokeLLM({
                    prompt: `Search for the LATEST global war, conflict, and humanitarian crisis news from the last 24 hours. Include:
- Ukraine-Russia war updates
- Middle East conflicts (Gaza, Syria, Yemen)
- Military operations and developments
- Humanitarian crises and casualties
- Peace negotiations and diplomatic efforts
- Refugee situations
- War crimes and investigations

Give me 20 UNIQUE, RECENT items. Format as JSON array with: title, summary, category (conflict/humanitarian/military/diplomatic), location, source, timestamp, url.`,
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
                                        location: { type: "string" },
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

        // Remove duplicates
        const uniqueNews = [];
        const seenTitles = new Set();

        for (const item of allNews) {
            const normalizedTitle = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 40);
            if (!seenTitles.has(normalizedTitle)) {
                seenTitles.add(normalizedTitle);
                uniqueNews.push({
                    ...item,
                    timestamp: item.timestamp || new Date().toISOString(),
                    location: item.location || 'Global'
                });
            }
        }

        // Sort by timestamp (newest first)
        uniqueNews.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        console.log(`✅ Aggregated ${uniqueNews.length} unique war news items`);

        return Response.json({ 
            news: uniqueNews.slice(0, 50),
            timestamp: new Date().toISOString(),
            sources_count: allNews.length
        });

    } catch (error) {
        console.error('❌ Failed to aggregate war news:', error);
        return Response.json({ 
            error: error.message || 'Failed to fetch war news',
            details: error.toString()
        }, { status: 500 });
    }
});

function extractLocation(text) {
    const locations = ['Ukraine', 'Russia', 'Gaza', 'Israel', 'Palestine', 'Syria', 'Yemen', 'Afghanistan', 'Iraq', 'Iran', 'Sudan', 'Ethiopia', 'Myanmar', 'Lebanon', 'Taiwan', 'China', 'North Korea'];
    
    for (const location of locations) {
        if (text.includes(location)) {
            return location;
        }
    }
    
    return 'Global';
}