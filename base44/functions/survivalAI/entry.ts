import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, conversationId } = await req.json();

    if (!message || message.trim().length === 0) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get or create conversation
    let conversation;
    try {
      if (conversationId) {
        const existing = await base44.entities.SurvivalConversation.filter({ id: conversationId }, '', 1);
        conversation = existing[0];
        if (!conversation) {
          throw new Error('Conversation not found');
        }
      } else {
        conversation = await base44.entities.SurvivalConversation.create({
          user_email: user.email,
          messages: [],
          readiness_score: 0,
          threat_profile: {
            nuclear: 45,
            economic: 78,
            natural: 30,
            prophetic: 62
          }
        });
      }
    } catch (err) {
      console.error('Conversation error:', err);
      conversation = {
        id: 'temp_' + Date.now(),
        user_email: user.email,
        messages: [],
        readiness_score: 0,
        threat_profile: { nuclear: 45, economic: 78, natural: 30, prophetic: 62 }
      };
    }

    // Search YouTube for survival videos if relevant
    let videoContext = '';
    const videoKeywords = ['survival', 'prepper', 'emergency', 'shtf', 'bugout', 'water purification', 'shelter'];
    const needsVideo = videoKeywords.some(keyword => message.toLowerCase().includes(keyword));
    
    if (needsVideo) {
      try {
        const youtubeKey = Deno.env.get('YOUTUBE_API_KEY');
        if (youtubeKey) {
          const searchQuery = encodeURIComponent(message.substring(0, 50) + ' survival');
          const ytResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${searchQuery}&type=video&maxResults=3&key=${youtubeKey}`
          );
          
          if (ytResponse.ok) {
            const ytData = await ytResponse.json();
            if (ytData.items && ytData.items.length > 0) {
              videoContext = '\n\nRELEVANT SURVIVAL VIDEOS:\n' + ytData.items.map(item => 
                `- "${item.snippet.title}" https://youtube.com/watch?v=${item.id.videoId}`
              ).join('\n');
            }
          }
        }
      } catch (err) {
        console.error('YouTube search error:', err);
      }
    }

    // Build context
    let knowledgeContext = '';
    let threatContext = '';
    
    try {
      const knowledge = await base44.entities.SurvivalKnowledge.list('', 20);
      knowledgeContext = knowledge.map(k => `${k.category}: ${k.title}`).join(', ');
    } catch (err) {
      console.error('Knowledge fetch error:', err);
    }

    try {
      const threats = await base44.entities.ThreatIntel.filter({ 
        severity: { $in: ['high', 'critical'] }
      }, '-created_date', 5);
      threatContext = threats.map(t => `${t.threat_type} (${t.severity}): ${t.title}`).join(', ');
    } catch (err) {
      console.error('Threat fetch error:', err);
    }

    // Build system prompt
    const systemPrompt = `You are MACHINE - EndTimes Survival AI. Help people prepare and survive catastrophic events with practical advice and biblical wisdom.

Current threats: ${threatContext || 'No critical threats'}
Knowledge: ${knowledgeContext || 'Building knowledge base'}
${videoContext}

Provide:
- PRACTICAL survival steps
- Biblical prophecy when relevant
- Direct actionable advice
- Specific next steps

Be concise. Lives depend on it.`;

    // Add user message to history
    const messages = [
      ...(conversation.messages || []).slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message, timestamp: new Date().toISOString() }
    ];

    // Call AI with better error handling
    let response;
    try {
      response = await base44.integrations.Core.InvokeLLM({
        prompt: `${systemPrompt}

Recent conversation:
${messages.map(m => `${m.role}: ${m.content}`).join('\n')}

Respond concisely with actionable advice:`,
        add_context_from_internet: true
      });
    } catch (aiError) {
      console.error('LLM error:', aiError);
      response = `I'm analyzing your question about survival. Here's immediate guidance:

For "${message}":
- Assess your current situation and resources
- Check local threat levels
- Prepare water (1 gallon per person per day)
- Secure shelter and basic supplies
- Stay informed through multiple sources

${videoContext}

Ask me specific questions for detailed guidance.`;
    }

    const aiMessage = {
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString()
    };

    messages.push(aiMessage);

    // Update conversation
    try {
      if (conversation.id && !conversation.id.startsWith('temp_')) {
        await base44.entities.SurvivalConversation.update(conversation.id, {
          messages: messages
        });
      }
    } catch (err) {
      console.error('Conversation update error:', err);
    }

    return Response.json({
      conversationId: conversation.id,
      message: response,
      threatProfile: conversation.threat_profile,
      readinessScore: conversation.readiness_score
    });

  } catch (error) {
    console.error('Survival AI critical error:', error);
    return Response.json({ 
      message: "I'm MACHINE - your survival AI. I'm experiencing technical issues but I'm here to help. Ask me about water, food, shelter, defense, or current threats and I'll guide you.",
      conversationId: null,
      threatProfile: { nuclear: 45, economic: 78, natural: 30, prophetic: 62 },
      readinessScore: 50
    });
  }
});