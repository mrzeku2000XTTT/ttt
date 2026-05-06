import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Katagami AI Auto-Edit
// Takes an uploaded image/video URL + optional user vibe hint, asks the LLM
// to design a cinematic motion plan (preset, tagline, background, duration),
// and returns a ready-to-open UltraMock auto-render URL that produces an MP4.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { media_url, media_type, vibe, email } = await req.json();
    if (!media_url) return Response.json({ error: 'Missing media_url' }, { status: 400 });

    // Ask the LLM to design the edit
    const plan = await base44.integrations.Core.InvokeLLM({
      prompt: `You are Katagami's AI motion editor. The user uploaded a ${media_type || 'media'} file and wants it auto-edited into a cinematic short MP4.

User vibe hint: "${vibe || 'surprise me — make it feel premium and alive'}"

Pick the best creative direction. Return JSON with:
- tagline: a punchy 2-6 word headline that will animate over the media (or empty string for no text)
- preset_id: ONE of: spin, tilt, pop, float, reveal, flip, wobble, zoomin, zoomout, tilt-up, showcase, shake, barrel, slide-in-left, slide-in-right, slide-up, drop-in, fly-across, orbit, bounce, pendulum, swoop, chat-zoom
- background: ONE of: sunset, ocean, forest, midnight, neon, cosmos, pastel, mono
- device: ONE of: iphone, android, macbook, ipad
- duration: integer between 3 and 8 (seconds)
- reasoning: one sentence on why this combo fits`,
      response_json_schema: {
        type: 'object',
        properties: {
          tagline: { type: 'string' },
          preset_id: { type: 'string' },
          background: { type: 'string' },
          device: { type: 'string' },
          duration: { type: 'number' },
          reasoning: { type: 'string' },
        },
        required: ['preset_id', 'background', 'device', 'duration'],
      },
    });

    // Build the UltraMock auto-render URL
    const params = new URLSearchParams({
      auto: '1',
      text: plan.tagline || '',
      device: plan.device || 'iphone',
      background: plan.background || 'sunset',
      preset: plan.preset_id || 'showcase',
      duration: String(Math.max(3, Math.min(8, plan.duration || 4))),
      media: media_url,
    });
    if (email) params.set('email', email);

    const renderUrl = `/UltraMock?${params.toString()}`;

    return Response.json({
      success: true,
      plan,
      render_url: renderUrl,
    });
  } catch (error) {
    console.error('[katagamiAutoEdit] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});