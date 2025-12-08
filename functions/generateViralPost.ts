import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message } = await req.json();

    if (!message) {
      return Response.json({ error: 'Message required' }, { status: 400 });
    }

    // Generate viral post caption
    const captionResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a viral social media expert. Create a catchy, shareable post based on this conspiracy theory from Agent X at Area 51:

"${message}"

Make it:
- Engaging and mysterious
- 2-3 sentences max
- Include relevant emojis
- Make people want to discuss it
- Start with 🛸 AREA 51 INTEL:

Just return the post text, nothing else.`,
      add_context_from_internet: false
    });

    // Generate image prompt
    const imagePromptResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `Create a detailed image generation prompt for this conspiracy theory post:

"${message}"

Make it:
- Sci-fi/conspiracy themed
- Dark, mysterious atmosphere
- Visually striking
- Area 51 / alien / government secret theme

Return ONLY the image prompt, no extra text.`,
      add_context_from_internet: false
    });

    // Generate the image
    const imageResponse = await base44.integrations.Core.GenerateImage({
      prompt: imagePromptResponse
    });

    return Response.json({
      caption: captionResponse,
      image_url: imageResponse.url,
      original_message: message
    });

  } catch (error) {
    console.error('Error generating viral post:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});