import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, model, apiKey } = await req.json();

    if (!apiKey) {
      return Response.json({ error: 'No API key provided' }, { status: 400 });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ttt.base44.app',
        'X-Title': 'TTT Chain Portal'
      },
      body: JSON.stringify({
        model: model || 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a deep research assistant. Search across multiple philosophical, spiritual, scientific, and cultural sources. Analyze different perspectives and filter truth from various viewpoints.'
          },
          {
            role: 'user',
            content: message
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json({ error: data.error?.message || 'OpenRouter API error' }, { status: response.status });
    }

    return Response.json({ 
      content: data.choices[0].message.content,
      model: data.model
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});