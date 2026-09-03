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

        // Source: InvokeLLM with live web search
        {
            console.log('Fetching news via LLM web search...');
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