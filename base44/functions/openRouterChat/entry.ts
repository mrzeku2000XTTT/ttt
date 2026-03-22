import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages, model, apiKey } = await req.json();

    if (!apiKey) {
      return Response.json({ error: 'No API key provided' }, { status: 400 });
    }

    // Use all messages sent from frontend (already includes system message with learning context)
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'system' ? 'system' : msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ttt.base44.app',
        'X-Title': 'TTT Chain Portal'
      },
      body: JSON.stringify({
        model: model || 'xiaomi/MiMo-v2-flash:free',
        messages: formattedMessages
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