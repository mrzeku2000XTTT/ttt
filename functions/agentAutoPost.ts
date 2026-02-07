import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all active agents (using service role)
    const agents = await base44.asServiceRole.entities.AgentConfig.filter({ is_active: true });
    
    const results = [];
    
    for (const agent of agents) {
      try {
        // Skip if auto-posting not enabled
        if (!agent.auto_post_enabled) continue;
        
        // Scrape real Kaspa news
        const response = await fetch('https://kaspa.news/api/posts?limit=10');
        let articles = [];
        
        try {
          const newsData = await response.json();
          articles = newsData.posts || [];
        } catch {
          // Fallback to HTML scraping
          const htmlResponse = await fetch('https://kaspa.news');
          const html = await htmlResponse.text();
          const articleMatches = html.matchAll(/<article[^>]*>(.*?)<\/article>/gs);
          
          for (const match of articleMatches) {
            const article = match[1];
            const titleMatch = article.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/s);
            const linkMatch = article.match(/href="([^"]+)"/);
            const descMatch = article.match(/<p[^>]*>(.*?)<\/p>/s);
            
            if (titleMatch && linkMatch) {
              articles.push({
                title: titleMatch[1].replace(/<[^>]+>/g, '').trim(),
                url: linkMatch[1].startsWith('http') ? linkMatch[1] : `https://kaspa.news${linkMatch[1]}`,
                description: descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : ''
              });
            }
          }
        }
        
        if (!articles || articles.length === 0) {
          console.log(`No articles found for ${agent.agent_name}, skipping`);
          continue;
        }
      
      // Pick random article
      const article = articles[Math.floor(Math.random() * articles.length)];
      
      // Generate AI post
      const prompt = `You are ${agent.agent_name}. ${agent.persona}

Create an engaging social media post about: ${article.title}
${article.description ? `Context: ${article.description}` : ''}

Voice: ${agent.voice_tone}
Requirements:
- Keep it under 280 characters
- Be authentic and creative
- Make it shareable
- Include relevant hashtags`;
      
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