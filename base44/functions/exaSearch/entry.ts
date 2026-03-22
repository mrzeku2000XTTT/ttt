import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, type = 'web_search' } = await req.json();

    if (!query) {
      return Response.json({ error: 'Query is required' }, { status: 400 });
    }

    const exaApiKey = Deno.env.get('EXA_API_KEY');
    if (!exaApiKey) {
      return Response.json({ error: 'EXA_API_KEY not configured' }, { status: 500 });
    }

    // Call Exa API
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': exaApiKey,
      },
      body: JSON.stringify({
        query,
        numResults: 10,
        type: type === 'code' ? 'keyword' : 'neural',
        contents: {
          text: true,
          highlights: true,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return Response.json({ error: `EXA API error: ${error}` }, { status: response.status });
    }

    const data = await response.json();
    return Response.json(data);

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});