import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Use Gemini with web context to get detailed kaspa.news articles
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Go to kaspa.news and extract the latest 5 articles with ALL details:
      - Article title
      - Author name (who posted it)
      - Direct quotes from the article (at least 2-3 sentences)
      - Main topic/subject
      - Any technical details mentioned
      - Community reactions if shown
      - Article URL
      
      Return as JSON array with this exact structure:
      [
        {
          "title": "article title",
          "author": "person who posted/wrote it",
          "quotes": ["quote 1", "quote 2"],
          "topic": "main subject",
          "details": "technical details or key points",
          "url": "article url",
          "reactions": "community reactions if any"
        }
      ]`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          articles: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                author: { type: "string" },
                quotes: { type: "array", items: { type: "string" } },
                topic: { type: "string" },
                details: { type: "string" },
                url: { type: "string" },
                reactions: { type: "string" }
              }
            }
          }
        }
      }
    });
    
    return Response.json({ 
      success: true, 
      articles: response.articles || []
    });
    
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});