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
      prompt: `Search the web and find the EXACT movie page URL on 0123movie.net for: "${query}"
      
      IMPORTANT: 
      1. Search for the movie on https://ww22.0123movie.net
      2. Find the actual movie page URL (example: https://ww22.0123movie.net/movie/last-days-1630860241.html)
      3. Return the EXACT URL you find - do NOT construct or guess it
      4. The URL must include the full path with the unique movie ID number
      
      Return ONLY a JSON object:
      {
        "embed_url": "EXACT URL from 0123movie.net including .html",
        "title": "Movie Title (Year)",
        "source": "0123Movie"
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