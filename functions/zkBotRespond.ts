import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { post_id, post_content, author_name } = await req.json();

    if (!post_id || !post_content) {
      return Response.json({ error: 'Missing post_id or post_content' }, { status: 400 });
    }

    // Get Agent Ying's knowledge and patterns for enhanced analysis
    let agentContext = '';
    try {
      const yingPatterns = await base44.asServiceRole.entities.AgentYingPattern.list('-created_date', 50);
      const yingVisions = await base44.asServiceRole.entities.AgentYingVision.list('-created_date', 30);
      
      if (yingPatterns.length > 0 || yingVisions.length > 0) {
        agentContext = `\n\nAgent Knowledge Context:\n`;
        if (yingPatterns.length > 0) {
          agentContext += `Patterns: ${yingPatterns.slice(0, 5).map(p => p.pattern_text).join('; ')}\n`;
        }
        if (yingVisions.length > 0) {
          agentContext += `Visions: ${yingVisions.slice(0, 3).map(v => v.vision_text).join('; ')}`;
        }
      }
    } catch (err) {
      console.log('Could not load Agent context:', err);
    }

    // Use Grok via X API to analyze the post with Agent Ying-like capabilities
    const X_API_KEY = Deno.env.get('X_API_KEY');
    
    const grokResponse = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${X_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: `You are @zk, an advanced AI agent in TTT Feed with deep analytical capabilities similar to Agent Ying. You have access to real-time knowledge, market data, and blockchain insights. 

Your abilities:
- Analyze crypto market trends, Kaspa blockchain developments, and TTT ecosystem updates
- Interpret user intent and provide actionable insights
- Detect sentiment, patterns, and emerging trends
- Provide concise but highly valuable responses
- Use emojis strategically for clarity

Style: Sharp, insightful, helpful. Get to the point quickly but with depth.${agentContext}`
          },
          {
            role: 'user',
            content: `Post by ${author_name}: "${post_content}"\n\nAnalyze this post deeply. Consider: sentiment, key topics, crypto/market implications, actionable insights, and provide a thoughtful response.`
          }
        ],
        model: 'grok-beta',
        temperature: 0.8,
        max_tokens: 300
      })
    });

    const grokData = await grokResponse.json();
    const analysis = grokData.choices?.[0]?.message?.content || '🤖 Unable to analyze at the moment.';

    return Response.json({ 
      success: true, 
      analysis: analysis
    });
  } catch (error) {
    console.error('ZK Bot error:', error);
    return Response.json({ 
      success: false,
      analysis: '🤖 Agent ZK is currently offline. Please try again later.'
    }, { status: 200 });
  }
});