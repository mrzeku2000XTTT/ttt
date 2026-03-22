import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query } = await req.json();

    // Multiple fallback sites in priority order
    const sites = [
      { url: `https://fmovies-co.net/search?q=${encodeURIComponent(query)}`, name: "FMovies" },
      { url: `https://ww2.m4ufree.tv/search/${encodeURIComponent(query)}.html`, name: "M4uFree" },
      { url: `https://www2.movies7.to/search/${encodeURIComponent(query)}`, name: "Movies7" },
      { url: `https://fbox.to/search?keyword=${encodeURIComponent(query)}`, name: "FBox" }
    ];

    // Try each site until one works
    for (const site of sites) {
      try {
        const testResponse = await fetch(site.url, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(3000)
        });
        
        if (testResponse.ok) {
          return Response.json({
            embed_url: site.url,
            title: query,
            source: site.name
          });
        }
      } catch (e) {
        continue;
      }
    }

    // Fallback to first site if all tests fail
    return Response.json({
      embed_url: sites[0].url,
      title: query,
      source: sites[0].name
    });
  } catch (error) {
    console.error('Movie search error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});