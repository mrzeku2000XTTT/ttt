import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query } = await req.json();

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Search the web and find the EXACT movie page URL for: "${query}"
      
      IMPORTANT: 
      1. Try these sites in order: fmovies24.to, fbox.to, movies7.to
      2. Find the actual movie page URL that can be embedded in iframe
      3. Return the EXACT URL you find - do NOT construct or guess it
      4. Make sure the site allows iframe embedding
      
      Return ONLY a JSON object:
      {
        "embed_url": "EXACT URL that supports iframe",
        "title": "Movie Title (Year)",
        "source": "Site Name"
      }
      
      If you cannot find the exact URL, return null for embed_url.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          embed_url: { type: "string" },
          title: { type: "string" },
          source: { type: "string" }
        }
      }
    });

    return Response.json(result);
  } catch (error) {
    console.error('Movie search error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});