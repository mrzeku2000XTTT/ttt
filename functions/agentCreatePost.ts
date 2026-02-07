import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { agent_name, generate_image = false } = body;
    
    // Get agent config (using service role for all operations)
    const agents = await base44.asServiceRole.entities.AgentConfig.filter({
      agent_name,
      is_active: true
    });
    
    if (agents.length === 0) {
      return Response.json({ error: 'Agent not found or not active' }, { status: 404 });
    }
    
    const agent = agents[0];
    
    // Get latest news for content inspiration
    const newsResponse = await base44.asServiceRole.functions.invoke('scrapeKaspaNews', {});
    const { articles } = newsResponse.data;
    
    let topic = 'crypto trends and innovation';
    let sourceUrl = '';
    
    if (articles && articles.length > 0) {
      const randomArticle = articles[Math.floor(Math.random() * articles.length)];
      topic = `${randomArticle.title} - ${randomArticle.description}`;
      sourceUrl = randomArticle.url;
    }
    
    // Generate AI post based on agent persona
    const prompt = `You are ${agent.agent_name}. ${agent.persona}

Voice tone: ${agent.voice_tone}

Create an engaging social media post about: ${topic}

Requirements:
- Keep it under 280 characters
- Be authentic to your persona
- Include relevant hashtags
- Make it shareable and engaging
${sourceUrl ? `- Reference this source: ${sourceUrl}` : ''}`;
    
    const postContent = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true
    });
    
    let imageUrl = agent.avatar_url;
    
    // Generate image if requested and enabled
    if (generate_image && agent.image_generation_enabled) {
      try {
        const imagePrompt = `${agent.image_style}. Create a visual representation for: ${topic}. Style: ${agent.voice_tone}, professional, eye-catching.`;
        
        const imageResponse = await base44.integrations.Core.GenerateImage({
          prompt: imagePrompt
        });
        
        imageUrl = imageResponse.url;
      } catch (imgError) {
        console.log('Image generation failed, using avatar:', imgError.message);
      }
    }
    
    // Create the post
    const post = await base44.asServiceRole.entities.Post.create({
      content: postContent,
      author_name: agent.agent_name,
      author_wallet_address: agent.wallet_address || '',
      author_role: 'admin',
      image_url: imageUrl,
      is_stamped: false
    });
    
    // Update agent analytics
    const analytics = agent.analytics || {};
    analytics.total_posts = (analytics.total_posts || 0) + 1;
    analytics.last_post_at = new Date().toISOString();
    analytics.last_post_content = postContent.substring(0, 100);
    
    await base44.asServiceRole.entities.AgentConfig.update(agent.id, { analytics });
    
    return Response.json({
      success: true,
      post_id: post.id,
      agent: agent.agent_name,
      content: postContent,
      image_generated: generate_image && imageUrl !== agent.avatar_url
    });
    
  } catch (error) {
    console.error('Agent post creation failed:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});