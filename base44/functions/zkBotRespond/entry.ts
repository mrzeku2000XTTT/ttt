import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { post_id, post_content, author_name, image_urls, parent_comment_id, zk_ref_comment_id } = await req.json();

    if (!post_id || !post_content) {
      return Response.json({ error: 'Missing post_id or post_content' }, { status: 400 });
    }

    const userQuestion = post_content.replace(/@zk\s*/gi, '').trim();
    console.log('[@zk Bot] Question:', userQuestion);

    // Always fetch post images — combine with any passed image_urls
    let postImages = image_urls && image_urls.length > 0 ? [...image_urls] : [];
    try {
      const posts = await base44.asServiceRole.entities.Post.filter({ id: post_id });
      if (posts.length > 0) {
        const post = posts[0];
        const fromPost = post.media_files
          ? post.media_files.filter(f => f.type === 'image').map(f => f.url)
          : (post.image_url ? [post.image_url] : []);
        // Merge without duplicates
        for (const url of fromPost) {
          if (!postImages.includes(url)) postImages.push(url);
        }
      }
    } catch (e) { console.log('[@zk Bot] Could not fetch post images:', e.message); }

    const hasPostImages = postImages.length > 0;

    // --- DETECT REQUEST TYPE ---
    const isNewImageRequest = /\b(create|generate|make|draw|design|paint)\b.{0,20}\b(image|picture|photo|art|illustration|logo|icon)\b/i.test(userQuestion) ||
                              /\b(image|picture|art)\s+of\b/i.test(userQuestion) ||
                              /\b(draw|paint|design|sketch)\b.{0,30}(me|a|an|the)\b/i.test(userQuestion);

    const isImageEdit = hasPostImages && (
      /\b(remove|delete|erase|take out|cut out|eliminate|get rid of)\b/i.test(userQuestion) ||
      /\b(edit|change|modify|alter|add|replace|put|swap|make|turn)\b.{0,40}\b(photo|image|picture|this|the|him|her|it|them)\b/i.test(userQuestion) ||
      /\b(who is|identify|name|which one|what is in|describe)\b/i.test(userQuestion)
    );

    const hasZkRef = !!zk_ref_comment_id;
    const isIterationRequest = hasZkRef && /\b(make|turn|change|now|instead|different)\b/i.test(userQuestion);

    const needsImageGen = isNewImageRequest || isImageEdit || isIterationRequest;

    // --- CREATE PLACEHOLDER COMMENT ---
    let botComment;
    const commentData = {
      post_id,
      author_name: '@zk',
      author_wallet_address: 'zk_bot_system',
      comment_text: needsImageGen ? '🎨 Generating...' : '⚡ On it...',
      likes: 0
    };
    if (parent_comment_id) commentData.parent_comment_id = parent_comment_id;
    botComment = await base44.asServiceRole.entities.PostComment.create(commentData);

    if (parent_comment_id) {
      try {
        const parents = await base44.asServiceRole.entities.PostComment.filter({ id: parent_comment_id });
        if (parents.length > 0) {
          await base44.asServiceRole.entities.PostComment.update(parent_comment_id, {
            replies_count: (parents[0].replies_count || 0) + 1
          });
        }
      } catch (e) {}
    }

    // --- PURE IMAGE GENERATION (no post image needed) ---
    if (isNewImageRequest && !isImageEdit) {
      try {
        const imagePrompt = userQuestion
          .replace(/\b(create|generate|make|draw|design|paint|sketch)\b/gi, '')
          .replace(/\b(an?|the)\s+(image|picture|photo|art|illustration|logo|icon)\b/gi, '')
          .replace(/\b(image|picture|photo|art|illustration|logo|icon|of|for|me)\b/gi, '')
          .replace(/\s+/g, ' ').trim() || 'abstract digital art';

        // Find reference from a prior @zk image if iterating
        let refUrls = [];
        if (hasZkRef) {
          const refs = await base44.asServiceRole.entities.PostComment.filter({ id: zk_ref_comment_id });
          if (refs.length > 0) {
            const m = refs[0].comment_text?.match(/!\[.*?\]\((https?:\/\/.+?)\)/);
            if (m) refUrls.push(m[1]);
          }
        }

        const genParams = { prompt: `High quality, detailed: ${imagePrompt}` };
        if (refUrls.length > 0) {
          genParams.prompt = `Based on the reference image, apply this change: ${imagePrompt}. Keep same style.`;
          genParams.existing_image_urls = refUrls;
        }

        const result = await base44.asServiceRole.integrations.Core.GenerateImage(genParams);
        if (result?.url) {
          await base44.asServiceRole.entities.PostComment.update(botComment.id, {
            comment_text: `🎨 "${imagePrompt.slice(0, 50)}"\n\n![Generated Image](${result.url})`
          });
          return Response.json({ success: true, image_url: result.url });
        }
        throw new Error('No image URL');
      } catch (err) {
        await base44.asServiceRole.entities.PostComment.update(botComment.id, {
          comment_text: `🎨 Couldn't generate that — try a different prompt!`
        });
        return Response.json({ success: false, error: err.message });
      }
    }

    // --- IMAGE EDIT / MANIPULATION (uses post image as reference) ---
    if (isImageEdit) {
      try {
        // Describe the original image
        let imageDesc = 'a scene with people';
        try {
          imageDesc = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `Describe this image in detail: who/what is in it, the setting, colors, composition. Be specific. Max 100 words.`,
            file_urls: postImages,
            model: 'gemini_3_flash'
          });
        } catch (e) { console.log('[@zk Bot] Describe failed:', e.message); }

        // Build generation prompt
        const manipulationPrompt = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Create an image generation prompt.
Original scene: "${imageDesc}"
User wants: "${userQuestion}"
Output ONLY a short generation prompt (max 80 words) that recreates the scene with the requested change. Be specific.`
        });

        const imgResult = await base44.asServiceRole.integrations.Core.GenerateImage({
          prompt: manipulationPrompt,
          existing_image_urls: postImages
        });

        if (!imgResult?.url) throw new Error('No image URL');

        // Now generate a short witty text response too
        let wittyText = '';
        try {
          wittyText = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `You are @zk, a witty AI agent. The user "${author_name}" asked: "${userQuestion}". You just manipulated their image as requested. Give a SHORT, clever 1-2 sentence response (max 30 words). No fluff. End with 1 emoji.`,
            model: 'gemini_3_flash'
          });
        } catch (e) { wittyText = 'Done. ⚡'; }

        await base44.asServiceRole.entities.PostComment.update(botComment.id, {
          comment_text: `${wittyText}\n\n![AI Generated](${imgResult.url})`
        });

        return Response.json({ success: true, image_url: imgResult.url });
      } catch (err) {
        console.log('[@zk Bot] Image edit failed:', err.message);
        // Fall through to text response
        await base44.asServiceRole.entities.PostComment.update(botComment.id, {
          comment_text: `🤖 Couldn't manipulate the image — ${err.message}. Try again!`
        });
        return Response.json({ success: false, error: err.message });
      }
    }

    // --- ITERATION on prior @zk image ---
    if (isIterationRequest) {
      try {
        const refs = await base44.asServiceRole.entities.PostComment.filter({ id: zk_ref_comment_id });
        let refUrls = [];
        if (refs.length > 0) {
          const m = refs[0].comment_text?.match(/!\[.*?\]\((https?:\/\/.+?)\)/);
          if (m) refUrls.push(m[1]);
        }

        const result = await base44.asServiceRole.integrations.Core.GenerateImage({
          prompt: `Based on the reference image, apply: ${userQuestion}. Keep same style and composition.`,
          existing_image_urls: refUrls
        });

        if (!result?.url) throw new Error('No image URL');

        await base44.asServiceRole.entities.PostComment.update(botComment.id, {
          comment_text: `Updated ⚡\n\n![AI Generated](${result.url})`
        });
        return Response.json({ success: true, image_url: result.url });
      } catch (err) {
        // fall through to text
      }
    }

    // --- TEXT RESPONSE ---
    let analysis = '';
    const textPrompt = `You are @zk, a sharp witty AI agent in the TTT community (Kaspa blockchain).
User "${author_name}" asks: "${userQuestion}"
${hasPostImages ? 'There is an image attached to the post.' : ''}

Rules:
- Answer DIRECTLY in max 30 words
- 1-2 emojis max
- Be clever and concise
- NO long explanations
- If you don't know, say so briefly`;

    try {
      if (hasPostImages) {
        analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: textPrompt,
          file_urls: postImages,
          model: 'gemini_3_flash'
        });
      } else {
        analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: textPrompt,
          add_context_from_internet: true,
          model: 'gemini_3_flash'
        });
      }
    } catch (e) {
      try {
        analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: textPrompt });
      } catch (e2) {
        analysis = '🤖 Try again!';
      }
    }

    if (!analysis) analysis = '🤖 Try again!';

    await base44.asServiceRole.entities.PostComment.update(botComment.id, {
      comment_text: analysis
    });

    return Response.json({ success: true, analysis });

  } catch (error) {
    console.error('[@zk Bot] Critical error:', error.message);
    return Response.json({ success: false, error: error.message }, { status: 200 });
  }
});