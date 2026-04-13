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

    // Extract the actual user question (strip @zk prefix)
    const userQuestion = post_content.replace(/@zk\s*/gi, '').trim();
    console.log('[@zk Bot] User question:', userQuestion);

    // Detect if user is asking @zk to generate an image
    const isImageRequest = /\b(create|generate|make|draw|design|paint)\s+(an?\s+)?(image|picture|photo|art|illustration|logo|icon)/i.test(userQuestion) ||
                           /\b(image|picture|art)\s+of\b/i.test(userQuestion);

    // Create placeholder comment as a REPLY under the caller's comment
    let botComment;
    try {
      const commentData = {
        post_id: post_id,
        author_name: '@zk',
        author_wallet_address: 'zk_bot_system',
        comment_text: isImageRequest 
          ? '🎨 Generating image...' 
          : '🤖 Searching & analyzing...',
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
        // Extract the actual image description
        const imagePrompt = userQuestion
          .replace(/\b(create|generate|make|draw|design|paint)\s+(an?\s+)?(image|picture|photo|art|illustration|logo|icon)\s*(of|for|with|showing|depicting)?\s*/gi, '')
          .trim() || 'creative abstract digital art with vibrant colors';

        console.log('[@zk Bot] Image prompt:', imagePrompt);

        const result = await base44.asServiceRole.integrations.Core.GenerateImage({
          prompt: `High quality, detailed: ${imagePrompt}`,
        });

        console.log('[@zk Bot] Image result:', JSON.stringify(result));

        if (result?.url) {
          await base44.asServiceRole.entities.PostComment.update(botComment.id, {
            comment_text: `🎨 "${imagePrompt.slice(0, 60)}"\n\n![Generated Image](${result.url})`
          });
          return Response.json({ success: true, analysis: 'Image generated', image_url: result.url });
        } else {
          throw new Error('No image URL returned');
        }
      } catch (imgErr) {
        console.error('[@zk Bot] Image generation failed:', imgErr.message);
        await base44.asServiceRole.entities.PostComment.update(botComment.id, {
          comment_text: `🤖 Image generation failed — ${imgErr.message}. Try a different prompt!`
        });
        return Response.json({ success: false, error: imgErr.message }, { status: 200 });
      }
    }

    // --- KNOWLEDGE GATHERING ---

    // 1. Agent Ying patterns
    let yingKnowledge = '';
    try {
      const patterns = await base44.asServiceRole.entities.AgentYingPattern.list('-created_date', 10);
      if (patterns.length > 0) {
        yingKnowledge = `\nPast insights: ${patterns.slice(0, 3).map(p => p.verification_rules?.[0] || '').filter(Boolean).join('; ')}`;
      }
    } catch (err) {
      console.log('[@zk Bot] Could not load knowledge:', err.message);
    }

    // 2. Recent community posts + comments for cross-referencing
    let communityContext = '';
    try {
      const recentPosts = await base44.asServiceRole.entities.Post.list('-created_date', 25);
      if (recentPosts.length > 0) {
        communityContext += `\n\nRECENT TTT FEED POSTS:\n`;
        communityContext += recentPosts.map(p => 
          `[${p.author_name}] ${p.content?.slice(0, 100)}`
        ).join('\n');
      }
    } catch (err) {
      console.log('[@zk Bot] Could not load posts:', err.message);
    }

    // 3. Continuity anchors (anti-hallucination)
    let anchorContext = '';
    try {
      const anchors = await base44.asServiceRole.entities.ContinuityAnchor.list('-created_date', 5);
      if (anchors.length > 0) {
        anchorContext = `\n\nVERIFIED FACTS (never contradict):\n` +
          anchors.map(a => `• ${a.anchor_text || a.content || ''}`).filter(a => a.length > 2).join('\n');
      }
    } catch {}

    // --- LLM INVOCATION ---
    const hasImages = image_urls && image_urls.length > 0;
    
    // The key: treat user's message as a DIRECT QUESTION, not about the post
    const prompt = `You are @zk, an elite AI agent in the TTT community (Kaspa blockchain). You have real-time internet access.

RULES:
- Answer the user's ACTUAL QUESTION directly. Do NOT describe images or analyze the post unless explicitly asked.
- Use real-time web data for prices, news, facts.
- If you can cross-reference with community posts below, mention it briefly.
- NEVER hallucinate or make up data. Say "not sure" if uncertain.
- Be concise: max 50 words. Use 1-2 emojis.
${anchorContext}${yingKnowledge}${communityContext}

User "${author_name}" asks:
"${userQuestion || post_content}"

Answer their question directly:`;

    console.log('[@zk Bot] Invoking LLM, hasImages:', hasImages);

    let llmResponse;
    try {
      if (hasImages) {
        llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: prompt,
          file_urls: image_urls,
          model: 'gemini_3_flash',
        });
      } else {
        llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: prompt,
          add_context_from_internet: true,
          model: 'gemini_3_flash',
        });
      }
    } catch (llmErr) {
      console.error('[@zk Bot] InvokeLLM failed:', llmErr.message);
      throw new Error(`LLM failed: ${llmErr.message}`);
    }

    const analysis = llmResponse || '🤖 Could not generate a response. Try again!';
    console.log('[@zk Bot] Final:', analysis.substring(0, 100));

    // Update placeholder comment
    await base44.asServiceRole.entities.PostComment.update(botComment.id, {
      comment_text: analysis
    });

    // Save pattern
    try {
      await base44.asServiceRole.entities.AgentYingPattern.create({
        pattern_id: `zk_${Date.now()}`,
        task_type: 'research',
        confidence: 0.85,
        verification_rules: [`@zk: "${userQuestion?.substring(0, 80)}"`],
        examples: [analysis.substring(0, 200)],
        usage_count: 1,
        success_rate: 1,
      });
    } catch {}

    return Response.json({ success: true, analysis });
  } catch (error) {
    console.error('[@zk Bot] Critical error:', error.message);

    try {
      const base44Fallback = createClientFromRequest(req);
      const body = await req.clone().json().catch(() => ({}));
      if (body.post_id) {
        await base44Fallback.asServiceRole.entities.PostComment.create({
          post_id: body.post_id,
          author_name: '@zk',
          author_wallet_address: 'zk_bot_system',
          comment_text: `🤖 Error: ${error.message}. Try again!`,
          likes: 0
        });
      }
    } catch {}

    return Response.json({ 
      success: false,
      error: error.message
    }, { status: 200 });
  }
});