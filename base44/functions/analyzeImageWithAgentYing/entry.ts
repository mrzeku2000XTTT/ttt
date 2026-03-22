import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageUrl, question } = await req.json();

    console.log('🔍 Agent Ying analyzing image:', imageUrl);

    // Get Agent Ying's knowledge
    const patterns = await base44.asServiceRole.entities.AgentYingPattern.filter({});
    const verifications = await base44.asServiceRole.entities.AgentYingVerification.filter({});
    
    // Build context
    const knowledgeContext = `I am Agent Ying, a verification AI that has learned from ${verifications.length} proof submissions.

I can recognize patterns in:
${[...new Set(patterns.map(p => p.task_type))].map(type => `- ${type} tasks`).join('\n')}

I've successfully verified proofs with an average confidence of ${verifications.length > 0 ? Math.round(verifications.reduce((sum, v) => sum + v.verification_score, 0) / verifications.length) : 0}%.`;

    // Analyze image with AI vision
    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `${knowledgeContext}

User is showing me an image and asking: "${question || 'What do you see in this image?'}"

Analyze this image like Google Lens - identify what's in it, read any text, detect patterns, and provide a detailed analysis. If this looks like a proof-of-work submission, evaluate its validity based on what I've learned.

Provide:
1. What I see in the image (detailed description)
2. Any text detected
3. Task type detection (if applicable)
4. Verification confidence (if it's a proof)
5. Key elements that make this proof valid/invalid

Be thorough and conversational.`,
      file_urls: [imageUrl],
      add_context_from_internet: false
    });

    console.log('✅ Agent Ying analyzed image');

    return Response.json({
      success: true,
      analysis: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Image analysis failed:', error);
    return Response.json({
      error: error.message,
      success: false
    }, { status: 500 });
  }
});