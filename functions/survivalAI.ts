import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, conversationId } = await req.json();

    // Get or create conversation
    let conversation;
    if (conversationId) {
      const existing = await base44.entities.SurvivalConversation.filter({ id: conversationId }, '', 1);
      conversation = existing[0];
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

    // Build context from knowledge base
    const knowledge = await base44.entities.SurvivalKnowledge.list('', 20);
    const threats = await base44.entities.ThreatIntel.filter({ 
      severity: { $in: ['high', 'critical'] }
    }, '-created_date', 10);

    const knowledgeContext = knowledge.map(k => `${k.category.toUpperCase()}: ${k.title} - ${k.content}`).join('\n\n');
    const threatContext = threats.map(t => `${t.threat_type.toUpperCase()} THREAT (${t.severity}): ${t.title} - ${t.description}`).join('\n\n');

    // Build system prompt
    const systemPrompt = `You are MACHINE - an EndTimes Survival AI assistant. You help people prepare for and survive catastrophic events by providing practical survival advice combined with biblical prophecy insights.

CURRENT THREAT ENVIRONMENT:
${threatContext}

SURVIVAL KNOWLEDGE BASE:
${knowledgeContext}

Your role:
- Provide PRACTICAL survival advice
- Reference biblical prophecy when relevant (especially Revelation)
- Assess threat levels honestly
- Guide users to preparedness
- Be direct and actionable - lives depend on it
- Track user readiness and give specific next steps

When discussing threats:
- Nuclear: geopolitical tensions, DEFCON status
- Economic: bank failures, currency collapse, supply chains
- Natural: earthquakes, solar flares, weather events  
- Prophetic: match current events to biblical prophecy

Always end responses with a specific ACTION ITEM the user should take NOW.`;

    // Add user message to history
    const messages = [
      ...(conversation.messages || []),
      { role: 'user', content: message, timestamp: new Date().toISOString() }
    ];

    // Call AI
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `${systemPrompt}

CONVERSATION HISTORY:
${messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')}

Respond to the user's latest message. Be concise but thorough. Include scripture references when relevant.`,
      add_context_from_internet: false
    });

    const aiMessage = {
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString()
    };

    messages.push(aiMessage);

    // Update conversation
    await base44.entities.SurvivalConversation.update(conversation.id, {
      messages: messages
    });

    return Response.json({
      conversationId: conversation.id,
      message: response,
      threatProfile: conversation.threat_profile,
      readinessScore: conversation.readiness_score
    });

  } catch (error) {
    console.error('Survival AI error:', error);
    return Response.json({ 
      error: error.message || 'AI processing failed' 
    }, { status: 500 });
  }
});