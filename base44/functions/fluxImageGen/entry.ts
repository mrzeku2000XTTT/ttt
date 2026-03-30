import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { prompt } = await req.json();

    if (!prompt || !prompt.trim()) {
      return Response.json({ error: 'Prompt required' }, { status: 400 });
    }

    const apiUrl = Deno.env.get('FLUXKMAIL_API_URL');
    const apiKey = Deno.env.get('FLUXKMAIL_API_KEY');

    if (!apiUrl || !apiKey) {
      return Response.json({ error: 'API not configured' }, { status: 500 });
    }

    const requestBody = {
      prompt: prompt,
      model: 'flux-pro',
      width: 1024,
      height: 1024,
      num_inference_steps: 20,
    };

    const response = await fetch(`${apiUrl}/api/v1/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Flux API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url || data.url;

    if (!imageUrl) {
      throw new Error('No image URL in response');
    }

    return Response.json({ url: imageUrl });
  } catch (error) {
    console.error('Image gen error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});