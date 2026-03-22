import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { news_id } = await req.json();

        if (!news_id) {
            return Response.json({ error: 'News ID required' }, { status: 400 });
        }

        console.log('🧠 Analyzing news:', news_id);

        // Get the stamped news
        const news = await base44.asServiceRole.entities.StampedNews.get(news_id);

        if (!news) {
            return Response.json({ error: 'News not found' }, { status: 404 });
        }

        // Check if analysis already exists
        const existingAnalysis = await base44.asServiceRole.entities.NewsAnalysis.filter({
            news_id: news_id
        });

        if (existingAnalysis.length > 0) {
            console.log('✅ Analysis already exists, returning cached version');
            return Response.json({
                success: true,
                analysis: existingAnalysis[0],
                cached: true
            });
        }

        console.log('🤖 Generating new AI analysis...');

        // SIMPLIFIED AND FASTER PROMPT - focuses on key metrics only
        const analysis = await base44.integrations.Core.InvokeLLM({
            prompt: `Analyze this conflict news quickly and provide structured insights:

Title: ${news.news_title}
Summary: ${news.news_summary}
Location: ${news.news_location || 'Unknown'}

Provide concise JSON analysis with:
- sentiment: (very_negative/negative/neutral/positive/very_positive)
- key_topics: 3-5 main topics
- entities_mentioned: 3-5 key entities (countries/leaders/orgs)
- severity_score: 0-10 (conflict severity)
- predicted_impact: 1 sentence
- similar_events: 2-3 historical parallels
- ai_summary: 2 sentences
- credibility_score: 0-10
- escalation_risk: (low/medium/high/critical)
- civilian_impact: (minimal/moderate/significant/catastrophic)

Keep it brief and focused.`,
            response_json_schema: {
                type: "object",
                properties: {
                    sentiment: { type: "string" },
                    key_topics: { type: "array", items: { type: "string" } },
                    entities_mentioned: { type: "array", items: { type: "string" } },
                    severity_score: { type: "number" },
                    predicted_impact: { type: "string" },
                    similar_events: { type: "array", items: { type: "string" } },
                    ai_summary: { type: "string" },
                    credibility_score: { type: "number" },
                    escalation_risk: { type: "string" },
                    civilian_impact: { type: "string" }
                }
            }
        });

        console.log('✅ Analysis completed:', analysis);

        // Save analysis to database
        const savedAnalysis = await base44.asServiceRole.entities.NewsAnalysis.create({
            news_id: news_id,
            sentiment: analysis.sentiment,
            key_topics: analysis.key_topics,
            entities_mentioned: analysis.entities_mentioned,
            severity_score: analysis.severity_score,
            predicted_impact: analysis.predicted_impact,
            similar_events: analysis.similar_events,
            ai_summary: analysis.ai_summary,
            credibility_score: analysis.credibility_score,
            escalation_risk: analysis.escalation_risk,
            civilian_impact: analysis.civilian_impact,
            analyzed_at: new Date().toISOString()
        });

        return Response.json({
            success: true,
            analysis: savedAnalysis,
            cached: false
        });

    } catch (error) {
        console.error('❌ Failed to analyze news:', error);
        return Response.json({ 
            error: error.message || 'Failed to analyze news',
            details: error.toString()
        }, { status: 500 });
    }
});