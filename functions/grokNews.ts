import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const GROK_API_KEY = Deno.env.get("GROK_API_KEY");
        if (!GROK_API_KEY) {
            console.error('❌ GROK_API_KEY not set');
            return Response.json({ 
                error: 'Grok API key not configured' 
            }, { status: 500 });
        }

        console.log('🔍 Fetching Kaspa news from Grok...');

        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROK_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: "system",
                        content: "You are a crypto news aggregator. Provide the latest Kaspa (KAS) cryptocurrency news, market updates, and important global events affecting crypto. Format as JSON array with: title, summary, category (news/market/tech), timestamp, source."
                    },
                    {
                        role: "user",
                        content: "Give me the top 10 latest Kaspa news, market updates, and relevant global crypto events from the past 24 hours. Include price movements, technology updates, partnerships, and world events affecting crypto markets."
                    }
                ],
                model: "grok-beta",
                stream: false,
                temperature: 0.3
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Grok API Error:', response.status, errorText);
            return Response.json({ 
                error: `Grok API error: ${response.status}`,
                details: errorText 
            }, { status: response.status });
        }

        const data = await response.json();
        console.log('✅ Grok Response:', data);

        const content = data.choices[0].message.content;
        
        // Try to parse JSON from the response
        let newsItems = [];
        try {
            // Grok might return markdown with JSON, so we need to extract it
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                newsItems = JSON.parse(jsonMatch[0]);
            } else {
                // If no JSON found, create a simple news item from the text
                newsItems = [{
                    title: "Latest Kaspa Updates",
                    summary: content,
                    category: "news",
                    timestamp: new Date().toISOString(),
                    source: "Grok AI"
                }];
            }
        } catch (parseError) {
            console.error('Failed to parse JSON, using raw content:', parseError);
            newsItems = [{
                title: "Latest Kaspa Updates",
                summary: content,
                category: "news",
                timestamp: new Date().toISOString(),
                source: "Grok AI"
            }];
        }

        console.log('✅ Processed news items:', newsItems.length);

        return Response.json({ 
            news: newsItems,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Failed to fetch Grok news:', error);
        return Response.json({ 
            error: error.message || 'Failed to fetch news',
            details: error.toString()
        }, { status: 500 });
    }
});