import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { post_id, post_content, author_name } = await req.json();

    if (!post_id || !post_content) {
      return Response.json({ error: 'Missing post_id or post_content' }, { status: 400 });
    }

    // Use Grok via X API to analyze the post
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
            content: 'You are @zk, an advanced AI agent in TTT Feed. You analyze posts with deep insight about crypto, Kaspa blockchain, TTT ecosystem, and current events. Be concise, sharp, and helpful. Use emojis when appropriate.'
          },
          {
            role: 'user',
            content: `Post by ${author_name}: "${post_content}"\n\nAnalyze this post and provide a thoughtful response.`
          }
        ],
        model: 'grok-beta',
        temperature: 0.7
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
      analysis: '🤖 Agent ZK encountered an error analyzing this post.'
    }, { status: 200 });
  }
});