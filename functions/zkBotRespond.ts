import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { post_id, post_content, author_name } = await req.json();

    if (!post_id || !post_content) {
      return Response.json({ error: 'Missing post_id or post_content' }, { status: 400 });
    }

    // Use Agent Ying's backend for analysis
    const chatPrompt = `Analyze this TTT Feed post deeply and provide insights:

Post by ${author_name}: "${post_content}"

Provide a thoughtful analysis considering:
- Sentiment and key topics
- Crypto/Kaspa/TTT ecosystem implications
- Market insights if relevant
- Actionable takeaways

Be concise, insightful, and use emojis strategically.`;

    const agentYingResponse = await base44.asServiceRole.functions.invoke('chatWithAgentYing', {
      message: chatPrompt,
      conversation_history: []
    });

    const analysis = agentYingResponse.data?.response || '🤖 Unable to analyze at the moment.';

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