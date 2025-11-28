import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { genre } = await req.json();

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Search for top movies in the ${genre} genre on 0123movie.net.
      
      Return a list of popular ${genre} movies with their details.
      Return ONLY a JSON object with this exact structure:
      {
        "genre": "${genre}",
        "movies": [
          {
            "title": "Movie Title (Year)",
            "embed_url": "https://ww22.0123movie.net/movie/movie-slug",
            "description": "Brief description",
            "rating": "Rating if available"
          }
        ]
      }
      
      Include 6-8 popular movies. Format movie slugs properly (lowercase, hyphens).`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          genre: { type: "string" },
          movies: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                embed_url: { type: "string" },
                description: { type: "string" },
                rating: { type: "string" }
              }
            }
          }
        }
      }
    });

    return Response.json(result);
  } catch (error) {
    console.error('Genre scrape error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});