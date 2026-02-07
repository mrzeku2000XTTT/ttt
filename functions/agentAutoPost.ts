import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all active agents (using service role)
    const agents = await base44.asServiceRole.entities.AgentConfig.filter({ is_active: true });
    
    const results = [];
    
    // Get current Kaspa price
    let kasPrice = null;
    try {
      const priceRes = await base44.asServiceRole.functions.invoke('getKaspaPrice', {});
      kasPrice = priceRes.data?.price;
    } catch (e) {
      console.log('Could not fetch Kaspa price:', e.message);
    }

    // Get real Kaspa news
    let newsArticles = [];
    try {
      const newsRes = await base44.asServiceRole.functions.invoke('scrapeKaspaNews', {});
      newsArticles = newsRes.data?.articles || [];
    } catch (e) {
      console.log('Could not scrape news:', e.message);
    }

    for (const agent of agents) {
      try {
        // Skip if auto-posting not enabled
        if (!agent.auto_post_enabled) continue;

        // Use real scraped news or fallback
        const articles = newsArticles.length > 0 ? newsArticles : [
          { title: "Kaspa Price Update", url: "https://kaspa.news", description: `Current KAS price: $${kasPrice || 'N/A'}` }
        ];
      
      // Pick random article
      const article = articles[Math.floor(Math.random() * articles.length)];
      
      // Generate AI post
      const prompt = `You are ${agent.agent_name}. ${agent.persona}

      Create an engaging social media post about: ${article.title}
      ${article.description ? `Context: ${article.description}` : ''}
      ${kasPrice ? `Current Kaspa Price: $${kasPrice}` : ''}

      Voice: ${agent.voice_tone}
      Requirements:
      - Keep it under 280 characters
      - Be authentic and creative
      - Make it shareable
      - Include relevant hashtags
      ${kasPrice ? '- Mention the price if relevant' : ''}`;
      
      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false
      });
      
      // Generate image if enabled
      let imageUrl = agent.avatar_url;
      if (agent.image_generation_enabled) {
        try {
          const imagePrompt = `${agent.image_style || 'modern digital art'}. Visual for: ${article.title}. ${agent.voice_tone} style, eye-catching, professional.`;
          
          const imgResponse = await base44.integrations.Core.GenerateImage({
            prompt: imagePrompt
          });
          
          imageUrl = imgResponse.url;
          console.log(`Generated image for ${agent.agent_name}`);
        } catch (imgError) {
          console.log(`Image generation failed for ${agent.agent_name}:`, imgError.message);
        }
      }
      
      // Get agent wallet from created_by user
      const agentUsers = await base44.asServiceRole.entities.User.filter({ 
        full_name: agent.agent_name 
      });
      const walletAddress = agentUsers.length > 0 ? agentUsers[0].created_wallet_address : '';
      
      // Create post with wallet and image
      const post = await base44.asServiceRole.entities.Post.create({
        content: `${aiResponse}\n\nSource: ${article.url}`,
        author_name: agent.agent_name,
        author_wallet_address: walletAddress,
        author_role: 'admin',
        image_url: imageUrl
      });
      
      console.log(`Post created for ${agent.agent_name} with image: ${imageUrl !== agent.avatar_url}`);
      
      // Update analytics
      const analytics = agent.analytics || {};
      analytics.total_posts = (analytics.total_posts || 0) + 1;
      analytics.last_post_at = new Date().toISOString();
      
      await base44.asServiceRole.entities.AgentConfig.update(agent.id, { analytics });
      
      results.push({
        agent: agent.agent_name,
        post_id: post.id,
        has_image: imageUrl !== agent.avatar_url,
        article: article.title
      });
      
      } catch (agentError) {
        console.error(`Error posting for ${agent.agent_name}:`, agentError.message);
        results.push({
          agent: agent.agent_name,
          error: agentError.message
        });
      }
    }
    
    return Response.json({ 
      success: true, 
      posts_created: results.length,
      results 
    });
    
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});