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

    // Detect if user is asking @zk to generate or ITERATE on an image
    const isImageRequest = /\b(create|generate|make|draw|design|paint)\b.{0,20}\b(image|picture|photo|art|illustration|logo|icon)\b/i.test(userQuestion) ||
                           /\b(image|picture|art)\s+of\b/i.test(userQuestion) ||
                           /\b(draw|paint|design|sketch)\b.{0,30}(me|a|an|the)\b/i.test(userQuestion);

    // Detect iteration/edit requests ("make it red", "turn the owl into a tiger", "change the background", "make the owl a black tiger")
    const isIterationRequest = /\b(make|turn|change|transform|convert|edit|modify|replace|add|remove|swap|give)\b.{0,40}\b(it|the|this|into|to|a|an)\b/i.test(userQuestion) ||
                               /\b(make|turn)\s+(it|the|this|him|her)\b/i.test(userQuestion) ||
                               /\b(can\s*u|canu|could you|can you|please)\s+(make|turn|change|edit|modify|give)\b/i.test(userQuestion);
    const isImageOrIteration = isImageRequest || isIterationRequest;

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

    // --- IMAGE GENERATION / ITERATION MODE ---
    if (isImageOrIteration) {
      console.log('[@zk Bot] Image generation/iteration request detected, isIteration:', isIterationRequest);
      try {
        // Look for previous @zk images in this post's comments to use as reference
        let referenceImageUrls = [];
        if (isIterationRequest) {
          try {
            const postComments = await base44.asServiceRole.entities.PostComment.filter(
              { post_id: post_id, author_name: '@zk' }, '-created_date', 20
            );
            for (const c of postComments) {
              if (c.id === botComment.id) continue; // skip our placeholder
              const imgMatch = c.comment_text?.match(/!\[.*?\]\((https?:\/\/.+?)\)/);
              if (imgMatch) {
                referenceImageUrls.push(imgMatch[1]);
                break; // use the most recent @zk image
              }
            }
            console.log('[@zk Bot] Found reference images:', referenceImageUrls.length);
          } catch (refErr) {
            console.log('[@zk Bot] Could not load reference images:', refErr.message);
          }
        }

        // For iteration: use the full user question as the prompt (it describes what to change)
        // For new images: strip action words
        let imagePrompt;
        if (isIterationRequest && referenceImageUrls.length > 0) {
          imagePrompt = userQuestion.trim();
        } else {
          imagePrompt = userQuestion
            .replace(/\b(create|generate|make|draw|design|paint|sketch)\b/gi, '')
            .replace(/\b(an?|the)\s+(image|picture|photo|art|illustration|logo|icon)\b/gi, '')
            .replace(/\b(image|picture|photo|art|illustration|logo|icon)\b/gi, '')
            .replace(/\b(of|for|with|showing|depicting|me)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim() || 'creative abstract digital art with vibrant colors';
        }

        console.log('[@zk Bot] Image prompt:', imagePrompt, '| refs:', referenceImageUrls.length);

        const genParams = {
          prompt: referenceImageUrls.length > 0
            ? `Based on the reference image, apply this edit: ${imagePrompt}. High quality, detailed.`
            : `High quality, detailed: ${imagePrompt}`,
        };
        if (referenceImageUrls.length > 0) {
          genParams.existing_image_urls = referenceImageUrls;
        }

        const result = await base44.asServiceRole.integrations.Core.GenerateImage(genParams);

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
    
    const prompt = `You are @zk, an elite AI agent in the TTT community (Kaspa blockchain). You have real-time internet access.

RULES:
- Answer the user's ACTUAL QUESTION directly. Do NOT describe images or analyze the post unless explicitly asked.
- Use real-time web data for prices, news, facts. SEARCH THE WEB for any question you're unsure about.
- If you can cross-reference with community posts below, mention it briefly.
- NEVER hallucinate or make up data. Say "not sure" if uncertain.
- Be concise: max 80 words. Use 1-2 emojis.
${anchorContext}${yingKnowledge}${communityContext}

User "${author_name}" asks:
"${userQuestion || post_content}"

Answer their question directly:`;

    console.log('[@zk Bot] Invoking LLM, hasImages:', hasImages);

    let analysis = '';
    
    // Try with web search first (gemini_3_flash supports add_context_from_internet)
    try {
      if (hasImages) {
        analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: prompt,
          file_urls: image_urls,
          model: 'gemini_3_flash',
        });
      } else {
        analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: prompt,
          add_context_from_internet: true,
          model: 'gemini_3_flash',
        });
      }
    } catch (llmErr1) {
      console.error('[@zk Bot] Primary LLM failed:', llmErr1.message);
      // Fallback: try without web search
      try {
        analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: prompt,
          model: 'gemini_3_flash',
        });
      } catch (llmErr2) {
        console.error('[@zk Bot] Fallback LLM also failed:', llmErr2.message);
        // Last resort: default model
        try {
          analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `Answer concisely: ${userQuestion || post_content}`,
          });
        } catch (llmErr3) {
          console.error('[@zk Bot] All LLM attempts failed:', llmErr3.message);
          analysis = `\u{1F916} Couldn't process right now. Error: ${llmErr1.message}. Try again!`;
        }
      }
    }

    if (!analysis) analysis = '\u{1F916} Could not generate a response. Try again!';
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