import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { post_id, post_content, author_name, image_urls, parent_comment_id } = await req.json();

    console.log('[@zk Bot] Starting analysis for post:', post_id);
    console.log('[@zk Bot] Content:', post_content);

    if (!post_id || !post_content) {
      return Response.json({ error: 'Missing post_id or post_content' }, { status: 400 });
    }

    // Detect if user is asking @zk to generate an image
    const lowerContent = post_content.toLowerCase();
    const isImageRequest = /(@zk\s+)?(create|generate|make|draw|design|paint)\s+(an?\s+)?(image|picture|photo|art|illustration|logo|icon)/i.test(lowerContent) ||
                           /(@zk\s+)?(image|picture|art)\s+of/i.test(lowerContent);

    // Create placeholder comment as a REPLY under the caller's comment
    let botComment;
    try {
      const commentData = {
        post_id: post_id,
        author_name: '@zk',
        author_wallet_address: 'zk_bot_system',
        comment_text: isImageRequest 
          ? '🎨 Agent ZK generating image...' 
          : '🤖 Agent ZK analyzing with real-time intelligence...',
        likes: 0
      };
      if (parent_comment_id) {
        commentData.parent_comment_id = parent_comment_id;
      }
      botComment = await base44.asServiceRole.entities.PostComment.create(commentData);
      // Update parent comment replies count
      if (parent_comment_id) {
        try {
          const parentComments = await base44.asServiceRole.entities.PostComment.filter({ id: parent_comment_id });
          if (parentComments.length > 0) {
            await base44.asServiceRole.entities.PostComment.update(parent_comment_id, {
              replies_count: (parentComments[0].replies_count || 0) + 1
            });
          }
        } catch (e) { console.log('[@zk Bot] Could not update parent replies_count:', e.message); }
      }
    } catch (createErr) {
      console.error('[@zk Bot] Failed to create comment:', createErr.message);
      return Response.json({ success: false, error: `Failed to create comment: ${createErr.message}` }, { status: 200 });
    }

    // --- IMAGE GENERATION MODE ---
    if (isImageRequest) {
      console.log('[@zk Bot] Image generation request detected');
      try {
        // Extract the prompt (remove @zk and trigger words)
        const imagePrompt = post_content
          .replace(/@zk/gi, '')
          .replace(/\b(create|generate|make|draw|design|paint)\s+(an?\s+)?(image|picture|photo|art|illustration|logo|icon)\s*(of|for|with|showing|depicting)?/gi, '')
          .trim() || 'creative abstract digital art';

        const result = await base44.asServiceRole.integrations.Core.GenerateImage({
          prompt: imagePrompt,
        });

        if (result?.url) {
          await base44.asServiceRole.entities.PostComment.update(botComment.id, {
            comment_text: `🎨 Here's what I created: "${imagePrompt.slice(0, 80)}"\n\n![Generated Image](${result.url})\n\n${result.url}`
          });
          return Response.json({ success: true, analysis: 'Image generated', image_url: result.url });
        } else {
          throw new Error('No image URL returned');
        }
      } catch (imgErr) {
        console.error('[@zk Bot] Image generation failed:', imgErr.message);
        await base44.asServiceRole.entities.PostComment.update(botComment.id, {
          comment_text: `🤖 Sorry, image generation failed: ${imgErr.message}. Try again!`
        });
        return Response.json({ success: false, error: imgErr.message }, { status: 200 });
      }
    }

    // --- KNOWLEDGE GATHERING ---

    // 1. Agent Ying patterns + visions
    let yingKnowledge = '';
    try {
      const [patterns, visions] = await Promise.all([
        base44.asServiceRole.entities.AgentYingPattern.list('-created_date', 20),
        base44.asServiceRole.entities.AgentYingVision.list('-created_date', 10),
      ]);
      if (patterns.length > 0) {
        yingKnowledge += `\nRecent Patterns: ${patterns.slice(0, 5).map(p => p.pattern_text).join('; ')}`;
      }
      if (visions.length > 0) {
        yingKnowledge += `\nRecent Visions: ${visions.slice(0, 3).map(v => v.vision_text).join('; ')}`;
      }
    } catch (err) {
      console.log('[@zk Bot] Could not load Ying knowledge:', err.message);
    }

    // 2. Recent community posts + comments for cross-referencing (Kai-level awareness)
    let communityContext = '';
    try {
      const [recentPosts, recentComments] = await Promise.all([
        base44.asServiceRole.entities.Post.list('-created_date', 30),
        base44.asServiceRole.entities.PostComment.list('-created_date', 40),
      ]);
      if (recentPosts.length > 0) {
        communityContext += `\n\nRECENT TTT FEED POSTS (use to cross-reference and fact-check claims):\n`;
        communityContext += recentPosts.map(p => 
          `[${p.author_name}] ${p.content?.slice(0, 120)}${p.likes > 0 ? ` (${p.likes} likes)` : ''}`
        ).join('\n');
      }
      if (recentComments.length > 0) {
        communityContext += `\n\nRECENT COMMENTS:\n`;
        communityContext += recentComments.map(c => 
          `[${c.author_name}] ${c.comment_text?.slice(0, 80)}`
        ).join('\n');
      }
    } catch (err) {
      console.log('[@zk Bot] Could not load community context:', err.message);
    }

    // 3. Continuity anchors from Arh'tuun (anti-hallucination grounding)
    let anchorContext = '';
    try {
      const anchors = await base44.asServiceRole.entities.ContinuityAnchor.list('-created_date', 10);
      if (anchors.length > 0) {
        anchorContext = `\n\nGROUNDED FACTS (Arh'tuun anchors — these are verified truths, never contradict them):\n`;
        anchorContext += anchors.map(a => `• ${a.anchor_text || a.content || ''}`).slice(0, 5).join('\n');
      }
    } catch (err) {
      console.log('[@zk Bot] Could not load anchors:', err.message);
    }

    // --- LLM INVOCATION ---
    const hasImages = image_urls && image_urls.length > 0;
    
    const systemInstructions = `You are @zk, an elite AI agent embedded in the TTT Feed — a Kaspa blockchain community platform.

CORE RULES (Arh'tuun Protocol — NO HALLUCINATION):
- NEVER fabricate data, prices, dates, or statistics. If unsure, say "I'm not certain" or "based on available data."
- Cross-reference claims against the community posts and comments provided below.
- If someone claims something that contradicts community data or verified anchors, flag it.
- Use real-time internet search results as your primary source of truth.
- When citing information, be specific about the source.
${anchorContext}
${yingKnowledge}
${communityContext}`;

    const userPrompt = hasImages
      ? `Analyze the IMAGE(S) in this post by ${author_name}${post_content ? `:\n"${post_content}"` : ''}

Describe what you see accurately. Cross-reference with community context if relevant. Be concise, factual, max 40 words. Use 1-2 emojis.`
      : `Question/post from ${author_name}:
"${post_content}"

Instructions:
1. Search the web for the most current, accurate answer.
2. Cross-reference with community posts/comments above if relevant.
3. If the claim can be verified or debunked by community data, mention it.
4. Be factual, concise, and authoritative. Max 50 words. Use 1-2 emojis.
5. If discussing prices or stats, cite real data from web search.`;

    console.log('[@zk Bot] Invoking LLM, hasImages:', hasImages);

    let llmResponse;
    try {
      if (hasImages) {
        // Vision mode — no internet, but use gemini for image analysis
        llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `${systemInstructions}\n\n${userPrompt}`,
          file_urls: image_urls,
          model: 'gemini_3_flash',
        });
      } else {
        // Text mode — full internet + gemini for real-time intelligence
        llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `${systemInstructions}\n\n${userPrompt}`,
          add_context_from_internet: true,
          model: 'gemini_3_flash',
        });
      }
    } catch (llmErr) {
      console.error('[@zk Bot] InvokeLLM failed:', llmErr.message);
      throw new Error(`InvokeLLM failed: ${llmErr.message}`);
    }

    const analysis = llmResponse || '🤖 Analysis complete but no response generated.';
    console.log('[@zk Bot] Final analysis:', analysis.substring(0, 100));

    // Update placeholder comment with the analysis
    await base44.asServiceRole.entities.PostComment.update(botComment.id, {
      comment_text: analysis
    });

    // Save pattern for learning
    try {
      await base44.asServiceRole.entities.AgentYingPattern.create({
        pattern_text: `@zk analyzed: "${post_content.substring(0, 100)}..." → ${analysis.substring(0, 80)}`,
        pattern_type: 'feed_analysis',
        confidence_score: 0.85
      });
    } catch (err) {
      console.log('[@zk Bot] Could not save pattern:', err.message);
    }

    return Response.json({ success: true, analysis });
  } catch (error) {
    console.error('[@zk Bot] Critical error:', error.message);

    try {
      const base44 = createClientFromRequest(req);
      const body = await req.clone().json().catch(() => ({}));
      if (body.post_id) {
        await base44.asServiceRole.entities.PostComment.create({
          post_id: body.post_id,
          author_name: '@zk',
          author_wallet_address: 'zk_bot_system',
          comment_text: `🤖 Agent ZK encountered an error: ${error.message}\n\nTrying again should work!`,
          likes: 0
        });
      }
    } catch (fallbackErr) {
      console.error('[@zk Bot] Could not create error comment:', fallbackErr.message);
    }

    return Response.json({ 
      success: false,
      analysis: `🤖 Agent ZK encountered an error: ${error.message}`,
      error: error.message
    }, { status: 200 });
  }
});