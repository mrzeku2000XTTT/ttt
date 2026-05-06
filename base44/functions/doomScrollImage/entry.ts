import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Generates one cinematic doom-aesthetic image for a fact card.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { prompt } = await req.json();
    if (!prompt) return Response.json({ error: 'Missing prompt' }, { status: 400 });

    const fullPrompt = `${prompt}. Cinematic, photorealistic, dark moody atmosphere, high contrast, dramatic lighting, film grain, 35mm photography, no text, no watermarks.`;
    const res = await base44.integrations.Core.GenerateImage({ prompt: fullPrompt });

    return Response.json({ url: res?.url || null });
  } catch (error) {
    console.error('[doomScrollImage] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});