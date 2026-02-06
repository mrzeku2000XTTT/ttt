import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all active agents
    const agents = await base44.asServiceRole.entities.AgentConfig.filter({ is_active: true });
    
    const results = [];
    
    for (const agent of agents) {
      // Get latest news
      const newsResponse = await base44.asServiceRole.functions.invoke('scrapeKaspaNews', {});
      const { articles } = newsResponse.data;
      
      if (!articles || articles.length === 0) continue;
      
      // Pick random article
      const randomArticle = articles[Math.floor(Math.random() * articles.length)];
      
      // Generate AI post based on agent persona
      const prompt = `You are ${agent.agent_name}. ${agent.persona}
      
      Based on this news: "${randomArticle.title}" - ${randomArticle.description}
      Source: ${randomArticle.url}
      Category: ${randomArticle.category}
      
      Create a ${agent.voice_tone} social media post about this. Include insights, analysis, and hashtags. Keep it under 280 characters.`;
      
      const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true
      });
      
      // Create post
      const post = await base44.asServiceRole.entities.Post.create({
        content: `${aiResponse}\n\n📰 Source: ${randomArticle.url}\n\n#StCreative #${agent.agent_name}`,
        author_name: agent.agent_name,
        author_role: 'admin'
      });
      
      // Update analytics
      const analytics = agent.analytics || {};
      analytics.total_posts = (analytics.total_posts || 0) + 1;
      analytics.last_post_at = new Date().toISOString();
      
      await base44.asServiceRole.entities.AgentConfig.update(agent.id, { analytics });
      
      results.push({
        agent: agent.agent_name,
        post_id: post.id,
        article: randomArticle.title
      });
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