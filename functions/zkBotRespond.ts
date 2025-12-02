import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { post_id, post_content, author_name, image_urls } = await req.json();

    console.log('[@zk Bot] Starting analysis for post:', post_id);
    console.log('[@zk Bot] Content:', post_content);
    console.log('[@zk Bot] Author:', author_name);
    console.log('[@zk Bot] Image URLs:', image_urls);

    if (!post_id || !post_content) {
      console.error('[@zk Bot] Missing required fields');
      return Response.json({ error: 'Missing post_id or post_content' }, { status: 400 });
    }

    // Create placeholder comment FIRST (using service role to bypass RLS)
    console.log('[@zk Bot] Creating placeholder comment...');
    let botComment;
    try {
      botComment = await base44.asServiceRole.entities.PostComment.create({
        post_id: post_id,
        author_name: '@zk',
        author_wallet_address: 'zk_bot_system',
        comment_text: '🤖 Agent ZK scanning with Ying capabilities...',
        likes: 0
      });
      console.log('[@zk Bot] Placeholder comment created:', botComment.id);
    } catch (createErr) {
      console.error('[@zk Bot] Failed to create comment:', createErr.message, createErr);
      return Response.json({ 
        success: false,
        error: `Failed to create comment: ${createErr.message}`
      }, { status: 200 });
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
      console.log('[@zk Bot] Loaded knowledge context, patterns:', patterns.length, 'visions:', visions.length);
    } catch (err) {
      console.error('[@zk Bot] Could not load Ying knowledge:', err.message, err);
    }

    // Use InvokeLLM with internet context AND vision (Agent Ying's power)
    console.log('[@zk Bot] Invoking LLM with internet context...');
    
    const hasImages = image_urls && image_urls.length > 0;
    const analysisPrompt = hasImages 
      ? `You are @zk, an advanced AI agent in TTT Feed with deep analytical capabilities, vision, and real-time internet access.

    Analyze the IMAGE(S) in this post by ${author_name}${post_content ? `:\n"${post_content}"` : ''}

    ${yingKnowledge}

    If there's a question, search the web for the answer. Give ONE sharp, accurate sentence. Be ultra-concise. Use 1-2 emojis max. No more than 25 words.`
      : `You are @zk, an advanced AI agent in TTT Feed with deep analytical capabilities and real-time internet access.

    Question from ${author_name}:
    "${post_content}"

    ${yingKnowledge}

    Search the web if needed for accurate, up-to-date answers. Give ONE sharp, factual sentence. Be ultra-concise. Use 1-2 emojis max. No more than 25 words.`;

    console.log('[@zk Bot] Sending prompt to InvokeLLM:', analysisPrompt.substring(0, 100) + '...');
    if (hasImages) console.log('[@zk Bot] Including', image_urls.length, 'image(s) for vision analysis');
    console.log('[@zk Bot] Internet search: ENABLED');

    let llmResponse;
    try {
      llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        add_context_from_internet: true, // ALWAYS use internet for real-time answers
        file_urls: hasImages ? image_urls : null,
        response_json_schema: null
      });
      console.log('[@zk Bot] LLM Response received, type:', typeof llmResponse);
      console.log('[@zk Bot] LLM Response preview:', JSON.stringify(llmResponse).substring(0, 200));
    } catch (llmErr) {
      console.error('[@zk Bot] InvokeLLM failed:', llmErr.message, llmErr);
      throw new Error(`InvokeLLM failed: ${llmErr.message}`);
    }

    const analysis = llmResponse || '🤖 Analysis complete but no response generated.';
    console.log('[@zk Bot] Final analysis length:', analysis.length, 'chars');

    // Update the placeholder comment with the analysis
    console.log('[@zk Bot] Updating comment', botComment.id, 'with analysis...');
    try {
      await base44.asServiceRole.entities.PostComment.update(botComment.id, {
        comment_text: analysis
      });
      console.log('[@zk Bot] Comment updated successfully with:', analysis.substring(0, 50) + '...');
    } catch (updateErr) {
      console.error('[@zk Bot] Failed to update comment:', updateErr.message, updateErr);
      throw new Error(`Comment update failed: ${updateErr.message}`);
    }

    // Save pattern if valuable
    try {
      await base44.asServiceRole.entities.AgentYingPattern.create({
        pattern_text: `@zk analyzed: "${post_content.substring(0, 100)}..." → Insights generated`,
        pattern_type: 'feed_analysis',
        confidence_score: 0.85
      });
      console.log('[@zk Bot] Pattern saved to Agent Ying knowledge base');
    } catch (err) {
      console.log('[@zk Bot] Could not save pattern:', err.message);
    }

    console.log('[@zk Bot] ✅ Analysis complete successfully');
    return Response.json({ 
      success: true, 
      analysis: analysis
    });
  } catch (error) {
    console.error('[@zk Bot] Critical error:', error);
    console.error('[@zk Bot] Error stack:', error.stack);

    // Try to create an error comment if one doesn't exist yet
    try {
      const base44 = createClientFromRequest(req);
      const { post_id } = await req.json();
      
      if (post_id) {
        console.log('[@zk Bot] Attempting to create error comment...');
        await base44.asServiceRole.entities.PostComment.create({
          post_id: post_id,
          author_name: '@zk',
          author_wallet_address: 'zk_bot_system',
          comment_text: `🤖 Agent ZK encountered an error: ${error.message}\n\nTrying again should work!`,
          likes: 0
        });
        console.log('[@zk Bot] Error comment created');
      }
    } catch (fallbackErr) {
      console.error('[@zk Bot] Could not create error comment:', fallbackErr);
    }

    return Response.json({ 
      success: false,
      analysis: `🤖 Agent ZK encountered an error: ${error.message}`,
      error: error.message
    }, { status: 200 });
  }
});