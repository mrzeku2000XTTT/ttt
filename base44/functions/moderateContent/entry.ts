import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Anthropic from 'npm:@anthropic-ai/sdk@0.32.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mediaUrl, mediaType } = await req.json();

    if (!mediaUrl) {
      return Response.json({ error: 'mediaUrl is required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 });
    }

    const anthropic = new Anthropic({ apiKey });

    // Check if it's an image or video
    const isImage = mediaType?.startsWith('image/');

    if (!isImage) {
      // For videos, we can't analyze frames directly, so just allow
      return Response.json({ 
        flagged: false,
        reason: "Video content - manual review recommended"
      });
    }

    // Analyze image for nudity
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: [
          {
            type: "image",
            source: {
              type: "url",
              url: mediaUrl
            }
          },
          {
            type: "text",
            text: `Analyze this image for inappropriate content.

Does this image contain:
1. Nudity or sexually explicit content?
2. Graphic violence or gore?
3. Hate symbols or extremely offensive content?

Respond with JSON only:
{
  "flagged": true/false,
  "reason": "brief explanation",
  "category": "nudity/violence/hate/safe"
}`
          }
        ]
      }]
    });

    const text = response.content.find(b => b.type === 'text')?.text || '{}';
    
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*?\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[1] || jsonMatch[0]) : {
        flagged: false,
        reason: "Could not parse AI response",
        category: "safe"
      };
    }

    return Response.json(result);

  } catch (error) {
    console.error('Content moderation error:', error);
    return Response.json({ 
      error: error.message,
      flagged: false,
      reason: "Moderation check failed"
    }, { status: 500 });
  }
});