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
      prompt: `Find a movie streaming URL for: "${query}"
      
      Search for this movie on the web and construct a proper embed URL.
      For 0123movie.net, the format is typically: https://ww22.0123movie.net/movie/[movie-slug]
      
      Return ONLY a JSON object with this exact structure:
      {
        "embed_url": "https://ww22.0123movie.net/movie/movie-title-year",
        "title": "Movie Title (Year)",
        "source": "0123Movie"
      }
      
      Make sure to format the movie slug properly (lowercase, hyphens for spaces).
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