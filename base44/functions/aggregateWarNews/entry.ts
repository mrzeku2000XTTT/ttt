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

        // Source: InvokeLLM with live web search
        {
            console.log('Fetching war news via LLM web search...');
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