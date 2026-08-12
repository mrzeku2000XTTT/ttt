// Public smart web search — no auth required (guests use it from the landing
// page). Uses Exa for real, ranked results and returns a clean, compact shape
// for the TTT web browser results list.

Deno.serve(async (req) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  try {
    const { query } = await req.json();
    if (!query || !query.trim()) {
      return Response.json({ success: false, error: 'Query required' }, { headers: cors });
    }

    const key = Deno.env.get('EXA_API_KEY');
    if (!key) {
      return Response.json({ success: false, error: 'Search is not configured' }, { headers: cors });
    }

    const res = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key },
      body: JSON.stringify({
        query: query.trim(),
        numResults: 15,
        type: 'auto',
        contents: { text: { maxCharacters: 400 }, highlights: { numSentences: 2, highlightsPerUrl: 1 } },
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error('[openWebSearch] exa error', res.status, detail);
      return Response.json({ success: false, error: 'Search provider error' }, { headers: cors });
    }

    const data = await res.json();
    const results = (data.results || []).map((r: any) => {
      let host = '';
      try { host = new URL(r.url).host.replace(/^www\./, ''); } catch { /* ignore */ }
      const snippet = (r.highlights?.[0] || r.text || '').replace(/\s+/g, ' ').trim().slice(0, 260);
      return {
        title: r.title || host || r.url,
        url: r.url,
        host,
        snippet,
        image: r.image || null,
        favicon: r.favicon || (host ? `https://www.google.com/s2/favicons?domain=${host}&sz=64` : null),
        published: r.publishedDate || null,
      };
    });

    return Response.json({ success: true, query, results }, { headers: cors });
  } catch (error) {
    console.error('[openWebSearch] error', error);
    return Response.json({ success: false, error: error.message || 'Search failed' }, { headers: cors });
  }
});