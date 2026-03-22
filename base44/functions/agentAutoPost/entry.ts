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

    // Get detailed Kaspa news with real quotes and authors
    let newsArticles = [];
    try {
      const newsRes = await base44.asServiceRole.functions.invoke('getKaspaNewsDetails', {});
      newsArticles = newsRes.data?.articles || [];
    } catch (e) {
      console.log('Could not get news details:', e.message);
    }

    // Kaspa knowledge base facts
    const kaspaFacts = [
      { 
        title: "BlockDAG Technology",
        description: "Kaspa uses GHOSTDAG protocol - the first blockDAG that allows parallel block creation without orphaning. It processes all blocks in parallel, creating a DAG structure instead of a linear chain.",
        fact: "First blockDAG cryptocurrency"
      },
      { 
        title: "10 Blocks Per Second",
        description: "Kaspa's Crescendo upgrade enabled 10 blocks per second, with a vision for 32 BPS and eventual 100 BPS. Block time is just 0.1 seconds.",
        fact: "10 blocks per second processing power"
      },
      { 
        title: "Instant Confirmation",
        description: "Kaspa transactions are visible to the network in 1 second and fully confirmed in 10 seconds on average - hundreds of times faster than Bitcoin.",
        fact: "10-second confirmation time"
      },
      { 
        title: "Fair Launch",
        description: "Kaspa launched on November 7, 2021 with ZERO premine and zero pre-allocation. Completely community-driven, open-source, no central governance.",
        fact: "No premine, fair-launched like Bitcoin"
      },
      { 
        title: "Scalability Without Compromise",
        description: "Kaspa solves blockchain scalability with multiple blocks per second while maintaining full security and decentralization - no proof-of-stake tradeoffs.",
        fact: "Scalable Proof-of-Work Layer 1"
      },
      { 
        title: "kHeavyHash Algorithm",
        description: "Kaspa uses the optical-mining ready kHeavyHash algorithm for efficient proof-of-work. More energy-efficient than other PoW networks with no wasted blocks.",
        fact: "Energy-efficient mining algorithm"
      },
      { 
        title: "Circulating Supply",
        description: "Currently 27.18B KAS in circulation with a max supply of ~28.7B. Ticker: KAS. Market cap: $847.7M and growing.",
        fact: "27.18B KAS circulating, 28.7B max"
      },
      { 
        title: "Network Supported Platforms",
        description: "Kaspa runs on Windows, macOS, Linux, and even Raspberry Pi - making it truly decentralized and accessible for anyone to run a full node.",
        fact: "Works on Raspberry Pi to enterprise servers"
      },
      { 
        title: "Proof-of-Work Security",
        description: "Pure stake-less proof-of-work with revolutionary GhostDAG consensus. Ultra-secure network architecture with no compromise to decentralization.",
        fact: "Secure PoW without proof-of-stake"
      },
      { 
        title: "Real-Time Decentralization",
        description: "Built for real-world settlement. Kaspa is the fastest, open-source, decentralized, fully scalable Layer 1 in the world - designed for everyday transactions.",
        fact: "Built for real-world settlement"
      }
    ];

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

        // Vary the prompt approach randomly to avoid repetitive content
        const postStyles = [
          'insightful technical breakdown',
          'passionate enthusiasm',
          'educational explanation',
          'market insight',
          'community highlight',
          'feature spotlight',
          'visionary perspective',
          'casual observation'
        ];
        const style = postStyles[Math.floor(Math.random() * postStyles.length)];

        // Randomly choose between posting about Kaspa facts OR news
        const useFactPost = Math.random() > 0.5;
        let prompt;

        if (useFactPost) {
          // Post about Kaspa facts from kaspa.org
          const kaspaFact = kaspaFacts[Math.floor(Math.random() * kaspaFacts.length)];
          
          const factPrompts = [
            `You are ${agent.agent_name}. ${agent.persona}

Create a ${style} social media post about Kaspa's ${kaspaFact.title}:
Key fact: ${kaspaFact.fact}
Details: ${kaspaFact.description}
${kasPrice ? `Current KAS price: $${kasPrice}` : ''}

Voice: ${agent.voice_tone}
- Under 280 chars, authentic, shareable, with #kaspa hashtag
- Make it unique and factual, not generic`,

            `As ${agent.agent_name}, here's why this matters: "${kaspaFact.title}"
${kaspaFact.description}

Write a ${agent.voice_tone} social post that explains this in a ${style} way.
Keep it under 280 chars, punchy, with #kaspa #blockdag hashtags.`,

            `${agent.agent_name} breaking down Kaspa tech: ${kaspaFact.fact}

What's wild about "${kaspaFact.title}"? ${kaspaFact.description}

Drop a post about why this is groundbreaking for crypto.
${agent.voice_tone} tone, ${style}, under 280 chars.`
          ];
          
          prompt = factPrompts[Math.floor(Math.random() * factPrompts.length)];
        } else {
          // Post about Kaspa news with REAL quotes and authors
          const articles = newsArticles.length > 0 ? newsArticles : [
            { title: "Kaspa Updates", author: "Community", quotes: ["Latest developments in the ecosystem"], topic: "General", details: "Check kaspa.news for updates", url: "https://kaspa.news" }
          ];
          const article = articles[Math.floor(Math.random() * articles.length)];

          const newsPrompts = [
            `You are ${agent.agent_name}. ${agent.persona}

        Create a HUMAN-SOUNDING ${style} post about this REAL kaspa.news article:

        Title: "${article.title}"
        Author: ${article.author}
        ${article.quotes?.length > 0 ? `Real quote: "${article.quotes[0]}"` : ''}
        Topic: ${article.topic}
        Details: ${article.details}
        ${kasPrice ? `\nCurrent KAS: $${kasPrice}` : ''}

        REQUIREMENTS:
        - Quote the author directly: "${article.author} said [quote]"
        - Use SIMPLE everyday language, not technical jargon
        - Sound like a regular person talking, not a robot
        - Under 280 chars
        - ${agent.voice_tone} tone but NATURAL
        - Add 1-2 relevant hashtags max
        - NO generic phrases like "exciting news" or "breaking"`,

            `${agent.agent_name} here. I just read this on kaspa.news:

        "${article.title}" by ${article.author}
        ${article.quotes?.length > 0 ? `\nThey said: "${article.quotes[0]}"` : ''}

        Main point: ${article.details}

        Write a SHORT reaction (under 280 chars) in ${agent.voice_tone} voice.
        Use NORMAL human words. Quote ${article.author} if relevant.
        Explain it like you're texting a friend, not writing a press release.`,

            `Real talk from ${agent.agent_name}:

        Article: "${article.title}"
        Posted by: ${article.author}
        ${article.quotes?.length > 1 ? `Key quote: "${article.quotes[1]}"` : article.quotes?.length > 0 ? `Quote: "${article.quotes[0]}"` : ''}

        What it means: ${article.details}
        ${kasPrice ? `KAS price rn: $${kasPrice}` : ''}

        Give a ${style} take in under 280 chars.
        - Sound like a REAL person
        - Use simple words anyone can understand
        - Reference ${article.author}'s quote
        - ${agent.voice_tone} but CASUAL`
          ];

          prompt = newsPrompts[Math.floor(Math.random() * newsPrompts.length)];
        }
      
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
        content: `${aiResponse}\n\n#Kaspa #BlockDAG`,
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