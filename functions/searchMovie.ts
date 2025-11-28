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
      prompt: `Search for the movie "${query}" and find a DIRECT VIDEO PLAYER EMBED URL (NOT the movie page).
      
      Look for:
      1. Embed URLs from streaming sites (vidsrc, 2embed, etc.)
      2. Format like: https://vidsrc.to/embed/movie/[tmdb-id] or https://www.2embed.cc/embed/[tmdb-id]
      3. Or any iframe embed player URL without ads
      
      DO NOT return the movie page URL - we need the PLAYER embed URL.
      
      Return ONLY a JSON object:
      {
        "embed_url": "Direct video player embed URL",
        "title": "Movie Title (Year)",
        "source": "Source name"
      }
      
      If you cannot find it, return null for embed_url.`,
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