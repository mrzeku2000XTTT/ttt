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
      prompt: `Find an embeddable music URL for: "${query}"
      
      Search for this song on YouTube and return a direct embed URL.
      Return ONLY a JSON object with this exact structure:
      {
        "embed_url": "https://www.youtube.com/embed/VIDEO_ID",
        "title": "Song Title - Artist",
        "source": "YouTube"
      }
      
      Make sure the embed_url uses the /embed/ format for YouTube.
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
    console.error('Music search error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});