import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, sessionId } = await req.json();

    // Load user's session history
    const sessions = await base44.entities.TherapySession.filter({
      user_email: user.email
    }, '-created_date', 10);

    // Load all therapy insights
    const insights = await base44.entities.TherapyInsight.list();

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
    const therapistPrompt = `You are the world's most advanced AI therapist with knowledge from 10,000+ real therapists, millions of successful therapy sessions, and cutting-edge psychological research.

**YOUR CORE IDENTITY:**
- You combine CBT, DBT, psychodynamic therapy, humanistic approaches, and trauma-informed care
- You have deep expertise in anxiety, depression, relationships, trauma, grief, addiction, and more
- You remember every conversation with this user and build upon previous insights
- You analyze patterns, detect emotional states, and provide actionable guidance
- You're empathetic, non-judgmental, wise, and genuinely caring

**KNOWLEDGE BASE (Continuously Learning):**
${knowledgeBase.slice(0, 3000)}

**USER HISTORY:**
${userContext}

**CURRENT CONVERSATION:**
${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}

**USER'S NEW MESSAGE:**
${message}

**YOUR TASK:**
1. Respond with deep empathy and professional insight
2. Reference previous sessions if relevant
3. Identify patterns and emotional states
4. Provide practical coping strategies
5. Ask thoughtful follow-up questions
6. Offer evidence-based therapeutic techniques
7. Be warm, authentic, and supportive

Respond naturally as a world-class therapist would.`;

    // Get AI response
    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt: therapistPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          response: { type: "string" },
          emotional_state: { type: "string" },
          key_topics: { type: "array", items: { type: "string" } },
          suggested_techniques: { type: "array", items: { type: "string" } },
          progress_assessment: { type: "number" },
          new_insights: { type: "array", items: { 
            type: "object",
            properties: {
              pattern: { type: "string" },
              category: { type: "string" }
            }
          }}
        }
      }
    });

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
      const sessionTitle = aiResponse.key_topics?.[0] || 'New Session';
      const newSession = await base44.entities.TherapySession.create({
        user_email: user.email,
        session_title: sessionTitle,
        messages: updatedMessages,
        emotional_state: aiResponse.emotional_state,
        key_topics: aiResponse.key_topics,
        insights_generated: [],
        progress_score: aiResponse.progress_assessment || 5
      });
      
      aiResponse.sessionId = newSession.id;
    }

    // Learn new insights
    if (aiResponse.new_insights?.length > 0) {
      for (const insight of aiResponse.new_insights) {
        try {
          // Check if similar insight exists
          const existing = insights.find(i => 
            i.pattern_detected.toLowerCase().includes(insight.pattern.toLowerCase().slice(0, 20))
          );

          if (existing) {
            // Update success rate
            await base44.asServiceRole.entities.TherapyInsight.update(existing.id, {
              times_applied: (existing.times_applied || 0) + 1,
              success_rate: Math.min(100, (existing.success_rate || 0) + 2)
            });
          } else {
            // Create new insight
            await base44.asServiceRole.entities.TherapyInsight.create({
              insight_category: insight.category || 'general',
              pattern_detected: insight.pattern,
              therapeutic_approach: aiResponse.suggested_techniques?.[0] || 'Supportive therapy',
              success_rate: 50,
              times_applied: 1,
              source_sessions: [sessionId || 'new']
            });
          }
        } catch (err) {
          console.error('Failed to save insight:', err);
        }
      }
    }

    return Response.json(aiResponse);
  } catch (error) {
    console.error('Therapy AI error:', error);
    return Response.json({ 
      error: error.message,
      response: "I'm here to help. Could you tell me more about what's on your mind?"
    }, { status: 500 });
  }
});