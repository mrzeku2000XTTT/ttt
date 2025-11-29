import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const message = body.message;
    const sessionId = body.sessionId;

    if (!message) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    // Load user's session history
    let sessions = [];
    try {
      sessions = await base44.entities.TherapySession.filter({
        user_email: user.email
      }, '-created_date', 10);
    } catch (err) {
      console.log('No sessions yet');
    }

    // Load all therapy insights
    let insights = [];
    try {
      insights = await base44.asServiceRole.entities.TherapyInsight.list('-success_rate', 50);
    } catch (err) {
      console.log('No insights yet');
    }

    // Build context from previous sessions
    let userContext = "";
    if (sessions.length > 0) {
      userContext = sessions.slice(0, 3).map(s => 
        `Previous session: ${s.session_title || 'Unnamed'}\nTopics: ${s.key_topics?.join(', ') || 'None'}\nEmotional state: ${s.emotional_state || 'Unknown'}`
      ).join('\n\n');
    }

    // Build knowledge base from insights
    const knowledgeBase = insights.map(i => 
      `Pattern: ${i.pattern_detected}\nApproach: ${i.therapeutic_approach}\nSuccess: ${i.success_rate}%\nCategory: ${i.insight_category}`
    ).join('\n\n');

    // Current session context
    let currentSession = null;
    if (sessionId) {
      currentSession = sessions.find(s => s.id === sessionId);
    }

    const conversationHistory = currentSession?.messages || [];

    // Construct the ultimate therapist prompt
    const therapistPrompt = `You are an expert AI therapist with deep knowledge from thousands of real therapy sessions, psychological research, and evidence-based therapeutic approaches.

**YOUR EXPERTISE:**
- CBT, DBT, psychodynamic therapy, humanistic approaches, trauma-informed care
- Deep expertise in anxiety, depression, relationships, trauma, grief, stress, self-esteem
- You remember this user's previous conversations and build upon insights
- You're empathetic, non-judgmental, wise, and genuinely caring
- You provide practical, actionable guidance

${knowledgeBase.length > 0 ? `**LEARNED PATTERNS:**\n${knowledgeBase.slice(0, 2000)}\n` : ''}

${userContext.length > 0 ? `**USER'S PREVIOUS SESSIONS:**\n${userContext}\n` : ''}

${conversationHistory.length > 0 ? `**CURRENT CONVERSATION:**\n${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}\n` : ''}

**USER'S MESSAGE:**
${message}

**RESPOND AS A THERAPIST:**
- Show deep empathy and understanding
- Reference their previous sessions if relevant
- Identify emotional patterns
- Provide practical coping strategies
- Ask thoughtful follow-up questions
- Offer evidence-based techniques
- Be warm, authentic, supportive, and professional

Give your response in a natural, conversational way as a world-class therapist would.`;

    // Get AI response
    const llmResult = await base44.integrations.Core.InvokeLLM({
      prompt: therapistPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          response: { type: "string" },
          emotional_state: { type: "string" },
          key_topics: { type: "array", items: { type: "string" } },
          suggested_techniques: { type: "array", items: { type: "string" } },
          progress_assessment: { type: "number" }
        },
        required: ["response"]
      }
    });

    // Ensure we have valid data
    const aiResponse = {
      response: llmResult?.response || "I'm here to listen and support you. Could you tell me more about what's on your mind?",
      emotional_state: llmResult?.emotional_state || "neutral",
      key_topics: Array.isArray(llmResult?.key_topics) ? llmResult.key_topics : ["General discussion"],
      suggested_techniques: Array.isArray(llmResult?.suggested_techniques) ? llmResult.suggested_techniques : [],
      progress_assessment: typeof llmResult?.progress_assessment === 'number' ? llmResult.progress_assessment : 5,
      new_insights: []
    };

    // Update or create session
    const newMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    const aiMessage = {
      role: 'therapist',
      content: aiResponse.response,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...conversationHistory, newMessage, aiMessage];

    let returnSessionId = sessionId;

    if (sessionId && currentSession) {
      // Update existing session
      await base44.entities.TherapySession.update(sessionId, {
        messages: updatedMessages,
        emotional_state: aiResponse.emotional_state,
        key_topics: aiResponse.key_topics,
        progress_score: aiResponse.progress_assessment
      });
    } else {
      // Create new session
      const sessionTitle = (aiResponse.key_topics && aiResponse.key_topics.length > 0) 
        ? aiResponse.key_topics[0].substring(0, 100) 
        : 'New Session';
      
      const newSession = await base44.entities.TherapySession.create({
        user_email: user.email,
        session_title: sessionTitle,
        messages: updatedMessages,
        emotional_state: aiResponse.emotional_state,
        key_topics: aiResponse.key_topics,
        insights_generated: [],
        progress_score: aiResponse.progress_assessment
      });
      
      returnSessionId = newSession.id;
    }

    return Response.json({
      response: aiResponse.response,
      emotional_state: aiResponse.emotional_state,
      key_topics: aiResponse.key_topics,
      progress_assessment: aiResponse.progress_assessment,
      sessionId: returnSessionId
    });
  } catch (error) {
    console.error('Therapy AI error:', error);
    return Response.json({ 
      error: error.message,
      response: "I'm here to help. Could you tell me more about what's on your mind?"
    }, { status: 500 });
  }
});