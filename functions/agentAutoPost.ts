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

    for (let index = 0; index < agents.length; index++) {
      const agent = agents[index];
      try {
        // Skip if auto-posting not enabled
        if (!agent.auto_post_enabled) continue;

        // Stagger posts with random delay (2-8 seconds between each agent)
        if (index > 0) {
          const delayMs = 2000 + Math.random() * 6000;
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }

        // Use real scraped news or fallback
        const articles = newsArticles.length > 0 ? newsArticles : [
          { title: "Kaspa Price Update", url: "https://kaspa.news", description: `Current KAS price: $${kasPrice || 'N/A'}` }
        ];
      
      // Pick random article
      const article = articles[Math.floor(Math.random() * articles.length)];
      
      // Vary the prompt approach randomly to avoid repetitive content
      const postStyles = [
        'insightful analysis',
        'hype and excitement',
        'technical explanation',
        'market commentary',
        'community engagement',
        'news breakdown',
        'perspective and vision',
        'fun observation'
      ];
      const style = postStyles[Math.floor(Math.random() * postStyles.length)];
      
      // Generate AI post with varied prompts
      const prompts = [
        `You are ${agent.agent_name}. ${agent.persona}
        
Create a ${style} social media post about: ${article.title}
${article.description ? `Details: ${article.description}` : ''}
${kasPrice ? `Market context: KAS at $${kasPrice}` : ''}

Voice: ${agent.voice_tone}
Style: ${style}
- Under 280 chars, authentic, shareable, with hashtags
${kasPrice ? '- Weave in the price naturally if it fits' : ''}`,

        `As ${agent.agent_name}, what's your hot take on this? ${article.title}
${article.description ? `\n${article.description}` : ''}

Write a social post that's ${agent.voice_tone} and ${style}.
Make it punchy, under 280 chars, with #kaspa hashtag.`,

        `${agent.agent_name} here. Someone just sent me this: ${article.title}
${article.description ? `TL;DR: ${article.description}` : ''}

Drop a ${agent.voice_tone}} post about what this means for Kaspa.
${kasPrice ? `Price is at $${kasPrice} btw.` : ''}
Keep it fresh, under 280 chars.`
      ];
      
      const prompt = prompts[Math.floor(Math.random() * prompts.length)];
      
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