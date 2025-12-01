import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query } = await req.json();

    // Construct search URL
    const searchUrl = `https://fmovies-co.net/search?q=${encodeURIComponent(query)}`;

    return Response.json({
      embed_url: searchUrl,
      title: query,
      source: "FMovies"
    });
  } catch (error) {
    console.error('Movie search error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});