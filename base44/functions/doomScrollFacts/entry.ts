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

    // 1) Try to fetch Grokipedia article (best source). If blocked / 404, fall back to web search.
    let sourceContent = '';
    let title = query;
    let sourceUrl = '';
    let usedFallback = false;

    try {
      const grokResp = await base44.functions.invoke('grokipediaSearch', { query });
      const grokData = grokResp?.data || {};
      if (grokData.found) {
        sourceContent = grokData.content || '';
        title = grokData.title || query;
        sourceUrl = grokData.url || '';
      } else {
        usedFallback = true;
      }
    } catch (_) {
      usedFallback = true;
    }

    // 2) Generate facts. If we have Grokipedia content, ground in it. Otherwise use web search.
    const basePrompt = `You are creating content for a "doom scroll" app — an endless feed of dark, fascinating, mind-bending truths about a topic.

TOPIC: "${title}"
${sourceContent ? `\nSOURCE CONTENT:\n${sourceContent}\n` : ''}
Generate ${count} distinct facts about this topic. Each fact must be:
- ONE punchy sentence (max 25 words)
- Genuinely dark, surprising, unsettling, or mind-blowing
- Real and factually accurate
- No "Did you know" prefixes — just the raw fact

For each fact, also write a short cinematic image prompt (12-20 words) describing a haunting, atmospheric, photorealistic image. Dark mood, cinematic lighting, no text in image.

Return JSON.`;

    const llmRes = await base44.integrations.Core.InvokeLLM({
      prompt: basePrompt,
      add_context_from_internet: usedFallback || !sourceContent,
      model: usedFallback ? 'gemini_3_flash' : undefined,
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

    if (facts.length === 0) {
      return Response.json({ found: false, message: `Couldn't pull anything on "${query}". Try another topic.` });
    }

    return Response.json({
      found: true,
      title,
      source_url: sourceUrl,
      fallback: usedFallback,
      facts,
    });
  } catch (error) {
    console.error('[doomScrollFacts] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});