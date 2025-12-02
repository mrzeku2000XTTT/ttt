import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { post_id, post_content, author_name, comment_id } = await req.json();

    console.log('[@zk Bot] Starting analysis for post:', post_id);
    console.log('[@zk Bot] Content:', post_content);
    console.log('[@zk Bot] Comment ID:', comment_id);

    if (!post_id || !post_content) {
      console.error('[@zk Bot] Missing required fields');
      return Response.json({ error: 'Missing post_id or post_content' }, { status: 400 });
    }

    // Get Agent Ying's knowledge for context
    let yingKnowledge = '';
    try {
      console.log('[@zk Bot] Loading Agent Ying knowledge...');
      const patterns = await base44.asServiceRole.entities.AgentYingPattern.list('-created_date', 20);
      const visions = await base44.asServiceRole.entities.AgentYingVision.list('-created_date', 10);
      
      if (patterns.length > 0) {
        yingKnowledge += `\n\nRecent Patterns: ${patterns.slice(0, 3).map(p => p.pattern_text).join('; ')}`;
      }
      if (visions.length > 0) {
        yingKnowledge += `\n\nRecent Visions: ${visions.slice(0, 2).map(v => v.vision_text).join('; ')}`;
      }
      console.log('[@zk Bot] Loaded knowledge context');
    } catch (err) {
      console.log('[@zk Bot] Could not load Ying knowledge:', err.message);
    }

    // Use InvokeLLM with internet context (Agent Ying's power)
    console.log('[@zk Bot] Invoking LLM with internet context...');
    const analysisPrompt = `You are @zk, an advanced AI agent in TTT Feed with deep analytical capabilities.

Analyze this post by ${author_name}:
"${post_content}"

Provide insights considering:
- Sentiment and key topics
- Crypto/Kaspa/TTT ecosystem implications if mentioned
- Market insights if relevant
- Any patterns or trends you detect
- Actionable takeaways

${yingKnowledge}

Be sharp, insightful, and concise. Use emojis strategically. Keep response under 200 words.`;

    const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      add_context_from_internet: true,
      response_json_schema: null
    });

    console.log('[@zk Bot] LLM Response received');
    const analysis = llmResponse || '🤖 Analysis complete but no response generated.';

    // Update the comment with the analysis
    if (comment_id) {
      console.log('[@zk Bot] Updating comment with analysis...');
      await base44.asServiceRole.entities.PostComment.update(comment_id, {
        comment_text: analysis
      });
      console.log('[@zk Bot] Comment updated successfully');
    }

    // Save pattern if valuable
    try {
      await base44.asServiceRole.entities.AgentYingPattern.create({
        pattern_text: `@zk analyzed: "${post_content.substring(0, 100)}..." → Key insight detected`,
        pattern_type: 'feed_analysis',
        confidence_score: 0.8
      });
      console.log('[@zk Bot] Pattern saved');
    } catch (err) {
      console.log('[@zk Bot] Could not save pattern:', err.message);
    }

    console.log('[@zk Bot] Analysis complete');
    return Response.json({ 
      success: true, 
      analysis: analysis
    });
  } catch (error) {
    console.error('[@zk Bot] Critical error:', error);
    console.error('[@zk Bot] Error stack:', error.stack);
    
    // Try to update comment with error
    try {
      const { comment_id } = await req.json();
      if (comment_id) {
        await base44.asServiceRole.entities.PostComment.update(comment_id, {
          comment_text: `🤖 Analysis failed: ${error.message || 'Unknown error'}. Please try again.`
        });
      }
    } catch (updateErr) {
      console.error('[@zk Bot] Could not update error comment:', updateErr);
    }

    return Response.json({ 
      success: false,
      analysis: `🤖 Agent ZK encountered an error: ${error.message}`,
      error: error.message
    }, { status: 200 });
  }
});