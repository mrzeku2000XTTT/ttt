import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Anthropic from 'npm:@anthropic-ai/sdk@0.32.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, file_url } = await req.json();

    if (!message) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 });
    }

    const anthropic = new Anthropic({ apiKey });

    const content = file_url 
      ? [{
          type: "image",
          source: {
            type: "url",
            url: file_url
          }
        },
        {
          type: "text",
          text: `Analyze this content for Kaspa-related cryptocurrency content. 

Message: "${message}"

Determine if this is:
1. Appropriate (no NSFW, violence, hate speech)
2. Related to Kaspa cryptocurrency (KAS), blockchain, crypto trading, or general bullish crypto sentiment
3. Not spam or completely unrelated content

Respond with JSON only:
{
  "approved": true/false,
  "reason": "brief explanation",
  "kaspa_related": true/false,
  "content_type": "bullish/educational/promotional/spam/inappropriate"
}`
        }]
      : [{
          type: "text",
          text: `Analyze this message for Kaspa-related cryptocurrency content.

Message: "${message}"

Determine if this is:
1. Appropriate (no NSFW, violence, hate speech)
2. Related to Kaspa cryptocurrency (KAS), blockchain, crypto trading, or general bullish crypto sentiment
3. Not spam or completely unrelated content

Respond with JSON only:
{
  "approved": true/false,
  "reason": "brief explanation",
  "kaspa_related": true/false,
  "content_type": "bullish/educational/promotional/spam/inappropriate"
}`
        }];

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content
      }]
    });

    const text = response.content.find(b => b.type === 'text')?.text || '{}';
    
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      // Try to extract JSON from markdown
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*?\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[1] || jsonMatch[0]) : {
        approved: true,
        reason: "Could not parse AI response, defaulting to approved",
        kaspa_related: true,
        content_type: "bullish"
      };
    }

    return Response.json(result);

  } catch (error) {
    console.error('Moderation error:', error);
    return Response.json({ 
      error: error.message,
      approved: false,
      reason: "Moderation failed"
    }, { status: 500 });
  }
});