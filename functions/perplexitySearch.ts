import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { query, mode = "concise" } = await req.json();

        if (!query) {
            return Response.json({ error: 'Query is required' }, { status: 400 });
        }

        const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
        if (!PERPLEXITY_API_KEY) {
            console.error('❌ PERPLEXITY_API_KEY not set');
            return Response.json({ 
                error: 'Perplexity API key not configured. Please set PERPLEXITY_API_KEY in environment variables.' 
            }, { status: 500 });
        }

        console.log('🔍 Perplexity Search Query:', query);
        console.log('📊 Mode:', mode);

        // Use correct Perplexity models - updated to latest available models
        const model = mode === "detailed" ? "llama-3.1-sonar-large-128k-online" : "llama-3.1-sonar-small-128k-online";

        const requestBody = {
            model: model,
            messages: [
                {
                    role: "system",
                    content: "You are a helpful AI assistant. Provide accurate, concise answers based on current web information. Include relevant sources when possible."
                },
                {
                    role: "user",
                    content: query
                }
            ],
            temperature: 0.2,
            top_p: 0.9,
            return_images: false,
            return_related_questions: false,
            search_recency_filter: "month",
            stream: false
        };

        console.log('📤 Sending to Perplexity API...');

        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        const responseText = await response.text();
        console.log('📥 Perplexity Response Status:', response.status);

        if (!response.ok) {
            console.error('❌ Perplexity API Error:', response.status, responseText);
            
            // Parse error details if available
            let errorDetails = responseText;
            try {
                const errorJson = JSON.parse(responseText);
                errorDetails = errorJson.error?.message || errorJson.message || responseText;
            } catch (e) {
                // Keep original text if not JSON
            }
            
            return Response.json({ 
                error: `Perplexity API error (${response.status})`,
                details: errorDetails 
            }, { status: response.status });
        }

        const data = JSON.parse(responseText);
        console.log('✅ Successfully parsed response');
        
        // Extract citations from the response
        const citations = data.citations || [];
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            console.error('❌ No content in response:', data);
            return Response.json({ 
                error: 'No content received from Perplexity API',
                details: JSON.stringify(data)
            }, { status: 500 });
        }

        const result = {
            response: content,
            citations: citations,
            model: model,
            usage: data.usage
        };

        console.log('✅ Search completed successfully');

        return Response.json(result);

    } catch (error) {
        console.error('❌ Failed to process Perplexity search:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        
        return Response.json({ 
            error: error.message || 'Internal server error',
            details: error.toString(),
            stack: error.stack
        }, { status: 500 });
    }
});