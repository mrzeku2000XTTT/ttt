import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { post_id, post_content, author_name, image_urls, parent_comment_id, zk_ref_comment_id } = await req.json();

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
                           /\b(draw|paint|design|sketch)\b.{0,30}(me|a|an|the)\b/i.test(userQuestion) ||
                           /\b(create|generate|draw|paint|sketch|design)\s+(a|an|the|me)\s+/i.test(userQuestion);

    // Detect iteration/edit requests ("make it red", "turn the owl into a tiger", "change the background")
    // Note: only treat as iteration if there IS a reference @zk image to iterate on, or explicit "make it X" style
    const isIterationRequest = /\b(make|turn)\s+(it|the|this|him|her)\b/i.test(userQuestion) ||
                               /\b(can\s*u|canu|could you|can you|please)\s+(make|turn|change|edit|modify|give|create|draw)\b/i.test(userQuestion);

    // If user replied to an @zk image comment, always treat as image iteration
    const hasZkRef = !!zk_ref_comment_id;
    const isImageOrIteration = isImageRequest || (isIterationRequest && hasZkRef);

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
        // Always try to find reference images — from the specific @zk comment being replied to, or any recent @zk image in thread
        try {
          // First: check if we have a direct reference to the @zk comment (user clicked Reply on an @zk image)
          if (zk_ref_comment_id) {
            const refComments = await base44.asServiceRole.entities.PostComment.filter({ id: zk_ref_comment_id });
            if (refComments.length > 0) {
              const imgMatch = refComments[0].comment_text?.match(/!\[.*?\]\((https?:\/\/.+?)\)/);
              if (imgMatch) {
                referenceImageUrls.push(imgMatch[1]);
                console.log('[@zk Bot] Found reference image from replied-to comment:', imgMatch[1].substring(0, 60));
              }
            }
          }
          // Fallback: search recent @zk images in the post
          if (referenceImageUrls.length === 0) {
            const postComments = await base44.asServiceRole.entities.PostComment.filter(
              { post_id: post_id, author_name: '@zk' }, '-created_date', 20
            );
            for (const c of postComments) {
              if (c.id === botComment.id) continue;
              const imgMatch = c.comment_text?.match(/!\[.*?\]\((https?:\/\/.+?)\)/);
              if (imgMatch) {
                referenceImageUrls.push(imgMatch[1]);
                break;
              }
            }
          }
          console.log('[@zk Bot] Total reference images found:', referenceImageUrls.length);
        } catch (refErr) {
          console.log('[@zk Bot] Could not load reference images:', refErr.message);
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

    // 0. Grokipedia lookup — if user asks to look up a topic or mentions "grokipedia"
    let grokipediaContext = '';
    const grokMatch = userQuestion.match(/(?:grokipedia|grok(?:i)?pedia|look\s*up|wiki|encyclopedia|what\s+is|who\s+is|tell\s+me\s+about)\s+["']?(.+?)["']?$/i);
    const wantsGrokipedia = /grokipedia|grokpedia/i.test(userQuestion) || grokMatch;
    if (wantsGrokipedia) {
      try {
        // Extract the topic to search
        let searchTopic = grokMatch ? grokMatch[1].trim() : userQuestion.replace(/@zk\s*/gi, '').replace(/grokipedia|grokpedia/gi, '').trim();
        if (searchTopic.length > 2) {
          console.log('[@zk Bot] Grokipedia lookup:', searchTopic);
          const slug = searchTopic.replace(/\s+/g, '_');
          const grokUrl = `https://grokipedia.com/page/${encodeURIComponent(slug)}`;
          const grokResp = await fetch(grokUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TTT-Bot/1.0)', 'Accept': 'text/html' }
          });
          if (grokResp.ok) {
            const html = await grokResp.text();
            const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
            const grokTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : searchTopic;
            let grokText = html
              .replace(/<script[\s\S]*?<\/script>/gi, '')
              .replace(/<style[\s\S]*?<\/style>/gi, '')
              .replace(/<nav[\s\S]*?<\/nav>/gi, '')
              .replace(/<br\s*\/?>/gi, '\n')
              .replace(/<\/p>/gi, '\n\n')
              .replace(/<[^>]+>/g, ' ')
              .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
              .replace(/\s+/g, ' ').trim()
              .substring(0, 3000);
            grokipediaContext = `\n\nGROKIPEDIA ARTICLE ("${grokTitle}"):\n${grokText}\nSource: ${grokUrl}`;
            console.log('[@zk Bot] Grokipedia found:', grokTitle);
          } else {
            console.log('[@zk Bot] Grokipedia not found:', grokResp.status);
          }
        }
      } catch (grokErr) {
        console.log('[@zk Bot] Grokipedia lookup failed:', grokErr.message);
      }
    }

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
    
    // Detect if the question is asking for image manipulation on an attached post image
    const hasPostImage = image_urls && image_urls.length > 0;
    const wantsImageEditOnPost = hasPostImage && (
      /\b(remove|delete|erase|take out|cut out)\b/i.test(userQuestion) ||
      /\b(edit|change|modify|alter|make|add|replace|put|swap)\b.{0,40}\b(photo|image|picture|this|the)\b/i.test(userQuestion) ||
      /\b(who is|identify|name|which one)\b/i.test(userQuestion) ||
      /\b(photo|image|picture|this)\b/i.test(userQuestion)
    );

    // If user wants to edit/manipulate the post image — use the post image as reference and generate a new AI image
    let generatedImageUrl = null;
    if (wantsImageEditOnPost) {
      try {
        console.log('[@zk Bot] Post image manipulation request detected, generating AI image using post image as reference');
        
        // First, use LLM to understand the image and craft a smart generation prompt
        let imageDesc = '';
        try {
          imageDesc = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `Describe this image in detail: who is in it, what they are doing, the setting, colors, and composition. Be specific and factual. Max 150 words.`,
            file_urls: image_urls,
            model: 'gemini_3_flash'
          });
          console.log('[@zk Bot] Image described:', imageDesc.substring(0, 100));
        } catch (descErr) {
          console.log('[@zk Bot] Could not describe image:', descErr.message);
          imageDesc = 'a group of people standing together outdoors';
        }

        // Build the generation prompt: recreate the scene + apply the user's request
        const manipulationPrompt = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `You are crafting an AI image generation prompt. 
Original image description: "${imageDesc}"
User's request: "${userQuestion}"

Create a detailed image generation prompt that:
1. Recreates the original scene/composition closely
2. Applies the user's requested change (e.g. remove a person, change something)
3. Keeps photorealistic style, same lighting, same setting
4. Max 120 words. Output ONLY the prompt, nothing else.`
        });

        console.log('[@zk Bot] Generation prompt:', manipulationPrompt.substring(0, 100));

        // Generate image using the post image as style reference + the manipulation prompt
        const imgResult = await base44.asServiceRole.integrations.Core.GenerateImage({
          prompt: manipulationPrompt,
          existing_image_urls: image_urls  // use original post image as visual reference
        });

        if (imgResult?.url) {
          generatedImageUrl = imgResult.url;
          console.log('[@zk Bot] Manipulation image generated successfully');
        } else {
          throw new Error('No image URL returned');
        }
      } catch (imgErr) {
        console.log('[@zk Bot] Image generation failed, continuing with text only:', imgErr.message);
        // Try a simpler fallback generation without reference image
        try {
          const fallbackPrompt = `Creative digital art: ${userQuestion.slice(0, 100)}. High quality, detailed, vibrant.`;
          const fallbackResult = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt: fallbackPrompt });
          if (fallbackResult?.url) {
            generatedImageUrl = fallbackResult.url;
          }
        } catch (fbErr) {
          console.log('[@zk Bot] Fallback image also failed:', fbErr.message);
        }
      }
    }

    const prompt = `You are @zk, an elite AI agent in the TTT community (Kaspa blockchain). You have real-time internet access and Grokipedia (xAI's knowledge base).

RULES:
- Answer the user's ACTUAL QUESTION directly and wittily.
- Use real-time web data for prices, news, facts. SEARCH THE WEB for any question you're unsure about.
- If Grokipedia data is provided below, USE IT as your primary source and cite it.
- Be concise: max 80 words. Use 1-2 emojis. Be clever and community-aware.
- NEVER hallucinate or make up data. Say "not sure" if uncertain.
${generatedImageUrl ? '- You have generated an image in response to this request. Reference it briefly with something like "Here\'s my take 👇" or "I got you 🎨".' : ''}
${hasPostImage && !generatedImageUrl ? '- There is an image attached to the post. Acknowledge it in your response.' : ''}
${grokipediaContext}${anchorContext}${yingKnowledge}${communityContext}

User "${author_name}" asks:
"${userQuestion || post_content}"

Respond directly and cleverly:`;

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

    // Build final comment text — include generated image if we made one
    let finalCommentText = analysis;
    if (generatedImageUrl) {
      finalCommentText = `${analysis}\n\n![AI Generated](${generatedImageUrl})`;
    }

    // Update placeholder comment
    await base44.asServiceRole.entities.PostComment.update(botComment.id, {
      comment_text: finalCommentText
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