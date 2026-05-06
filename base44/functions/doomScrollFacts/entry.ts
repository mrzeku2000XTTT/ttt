import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Pulls a Grokipedia article and splits it into discrete "doom facts"
// using an LLM, returning an array of { fact, image_prompt } objects.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { query, count = 10 } = await req.json();
    if (!query || !query.trim()) {
      return Response.json({ error: 'Missing query' }, { status: 400 });
    }

    // 1) Fetch Grokipedia article
    const grokResp = await base44.functions.invoke('grokipediaSearch', { query });
    const grokData = grokResp?.data || {};
    if (!grokData.found) {
      return Response.json({ found: false, message: grokData.message || `No article for "${query}"` });
    }

    const sourceContent = grokData.content || '';
    const title = grokData.title || query;
    const sourceUrl = grokData.url;

    // 2) Ask LLM to extract dark/fascinating facts from the content
    const llmRes = await base44.integrations.Core.InvokeLLM({
      prompt: `You are extracting facts for a "doom scroll" app — endless feed of dark, fascinating, mind-bending truths about a topic.

TOPIC: "${title}"

SOURCE CONTENT (from Grokipedia):
${sourceContent}

Generate ${count} distinct facts from this content. Each fact must be:
- ONE punchy sentence (max 25 words)
- Genuinely dark, surprising, unsettling, or mind-blowing
- Real and grounded in the source content (not made up)
- No "Did you know" prefixes — just the raw fact

For each fact, also write a short cinematic image prompt (12-20 words) describing a haunting, atmospheric, photorealistic image that visualizes that fact. Dark mood, cinematic lighting, no text in image.

Return JSON.`,
      response_json_schema: {
        type: 'object',
        properties: {
          facts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                fact: { type: 'string' },
                image_prompt: { type: 'string' },
              },
              required: ['fact', 'image_prompt'],
            },
          },
        },
        required: ['facts'],
      },
    });

    const facts = (llmRes?.facts || []).filter((f) => f.fact && f.image_prompt);

    return Response.json({
      found: true,
      title,
      source_url: sourceUrl,
      facts,
    });
  } catch (error) {
    console.error('[doomScrollFacts] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});