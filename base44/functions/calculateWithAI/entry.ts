import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Anthropic from 'npm:@anthropic-ai/sdk@0.32.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, kas_price } = await req.json();
    
    if (!query) {
      return Response.json({ error: 'query required' }, { status: 400 });
    }

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY')
    });

    const systemPrompt = kas_price 
      ? `You are a mathematical calculator. Current KAS price: $${kas_price} USD.

RULES:
- When user mentions "kas", "KAS", or kaspa, use the price $${kas_price}
- For "X in kas" or "X to kas", calculate: X ÷ ${kas_price}
- For "X kas in usd" or "X kas to usd", calculate: X × ${kas_price}
- For currency symbols ($, ₦, €, £), assume USD for $, NGN for ₦
- Handle typos like "NARA" or "naira" as NGN (Nigerian Naira)
- For NGN conversions, use approximate rate: 1 USD = 1650 NGN
- Return ONLY the numerical result, no text or symbols

Examples:
"20$ in kas" → ${(20 / kas_price).toFixed(4)}
"5000 naira to kas" → ${(5000 / 1650 / kas_price).toFixed(4)}
"50 kas in usd" → ${(50 * kas_price).toFixed(2)}`
      : `You are a mathematical calculator. Solve the query and return ONLY the numerical result.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: query
      }],
      system: systemPrompt
    });

    const result = message.content[0].text.trim();
    
    // Clean the result to extract just the number
    const cleaned = result.replace(/[^\d.\-]/g, '');
    const finalResult = cleaned || result;

    return Response.json({ 
      result: finalResult,
      raw_response: result
    });

  } catch (error) {
    console.error('AI calculation error:', error);
    return Response.json({ 
      error: error.message,
      details: 'Failed to calculate'
    }, { status: 500 });
  }
});