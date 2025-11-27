import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { question, imageUrl } = await req.json();

    console.log('💬 User asking Agent Ying:', question);
    console.log('📸 Image provided:', !!imageUrl);

    // 🔥 LOAD COMPLETE KNOWLEDGE BASE
    const patterns = await base44.asServiceRole.entities.AgentYingPattern.filter({}, '-usage_count', 500);
    const verifications = await base44.asServiceRole.entities.AgentYingVerification.filter({}, '-verified_at', 500);
    const visionData = await base44.asServiceRole.entities.AgentYingVision.filter({}, '-analyzed_at', 500);
    
    console.log('📊 Knowledge loaded:', {
      patterns: patterns.length,
      verifications: verifications.length,
      visionAnalyses: visionData.length
    });
    
    // 🔍 Search through ALL extracted text for relevant information
    const searchTerm = question.toLowerCase();
    const relevantVisions = visionData.filter(v => 
      v.extracted_text?.toLowerCase().includes(searchTerm) ||
      v.visual_summary?.toLowerCase().includes(searchTerm) ||
      v.detected_usernames?.some(u => u.toLowerCase().includes(searchTerm)) ||
      v.detected_urls?.some(url => url.toLowerCase().includes(searchTerm))
    );
    
    console.log('🔎 Found', relevantVisions.length, 'relevant images in memory');
    
    // Build comprehensive context with ALL data
    const allExtractedText = visionData.map(v => v.extracted_text).join('\n\n');
    const allUsernames = [...new Set(visionData.flatMap(v => v.detected_usernames || []))];
    const allUrls = [...new Set(visionData.flatMap(v => v.detected_urls || []))];
    const allObjects = [...new Set(visionData.flatMap(v => v.detected_objects || []))];
    
    const knowledgeContext = `I am Agent Ying, an AI with Google Lens vision and permanent memory.

📊 MY COMPLETE KNOWLEDGE BASE:
- Learned Patterns: ${patterns.length}
- Total Verifications: ${verifications.length}
- Images Analyzed: ${visionData.length}
- Success Rate: ${verifications.length > 0 ? Math.round(verifications.reduce((sum, v) => sum + v.verification_score, 0) / verifications.length) : 0}%

🔍 PATTERNS I'VE LEARNED:
${patterns.slice(0, 20).map((p, i) => `${i + 1}. Task: ${p.task_type}, Rules: ${p.verification_rules?.join(', ')}, Usage: ${p.usage_count || 0}x, Success: ${Math.round((p.success_rate || 0) * 100)}%`).join('\n')}

👁️ ALL TEXT I'VE EXTRACTED FROM IMAGES:
${allExtractedText.substring(0, 2000)}
${allExtractedText.length > 2000 ? '...(more text in my memory)' : ''}

📱 USERNAMES I'VE SEEN: ${allUsernames.slice(0, 30).join(', ')}
🔗 URLS I'VE SEEN: ${allUrls.slice(0, 20).join(', ')}
👀 OBJECTS I'VE DETECTED: ${allObjects.slice(0, 30).join(', ')}

🎯 RELEVANT TO THIS QUESTION:
${relevantVisions.length > 0 ? relevantVisions.map((v, i) => `
Image ${i + 1} (${new Date(v.analyzed_at).toLocaleDateString()}):
- Text: "${v.extracted_text?.substring(0, 200)}..."
- Summary: ${v.visual_summary?.substring(0, 150)}
- Usernames: ${v.detected_usernames?.join(', ') || 'None'}
- URLs: ${v.detected_urls?.join(', ') || 'None'}
`).join('\n') : 'No directly matching images, but I have access to all my vision memory above.'}

📋 RECENT VERIFICATIONS:
${verifications.slice(-10).map((v, i) => `${i + 1}. ${v.task_type}: ${v.verification_score}% - "${v.user_explanation?.substring(0, 80)}"`).join('\n')}`;

    let aiResponse;
    let savedVisionData = null;
    
    // If user uploaded an image, analyze it with vision AND SAVE TO HIVE MIND
    if (imageUrl) {
      console.log('📸 Analyzing new image with Google Lens + SAVING to hive mind...');
      
      // Extract structured data from image
      const visionExtraction = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Agent Ying's vision system. Extract ALL data from this image like Google Lens.

User Question/Context: "${question}"

EXTRACT EVERYTHING VISIBLE:
1. Read ALL text exactly as written (OCR - every single word, number, letter)
2. Detect UI elements, buttons, icons, interface elements
3. Find ALL usernames, handles, @mentions, profile names
4. Extract ALL URLs, links, web addresses
5. Find ALL numbers, dates, timestamps, IDs, chain IDs, addresses
6. Describe what's happening in detail
7. Identify task type
8. List proof indicators

READ EVERYTHING. Be extremely thorough and detailed.`,
        file_urls: [imageUrl],
        add_context_from_internet: false,
        response_json_schema: {
          type: 'object',
          properties: {
            extractedText: { type: 'string' },
            detectedObjects: { type: 'array', items: { type: 'string' } },
            detectedUsernames: { type: 'array', items: { type: 'string' } },
            detectedUrls: { type: 'array', items: { type: 'string' } },
            detectedNumbers: { type: 'array', items: { type: 'string' } },
            visualSummary: { type: 'string' },
            proofIndicators: { type: 'array', items: { type: 'string' } },
            confidence: { type: 'number' },
            taskType: { type: 'string' }
          }
        }
      });
      
      console.log('👁️ Vision extracted:', visionExtraction);
      
      // Generate unique vision ID
      const visionId = await generateHash(imageUrl + Date.now());
      
      // 🔥 SAVE TO HIVE MIND - AgentYingVision
      savedVisionData = await base44.asServiceRole.entities.AgentYingVision.create({
        vision_id: visionId,
        verification_id: 'chat-' + visionId,
        image_url: imageUrl,
        extracted_text: visionExtraction.extractedText || '',
        detected_objects: visionExtraction.detectedObjects || [],
        detected_usernames: visionExtraction.detectedUsernames || [],
        detected_urls: visionExtraction.detectedUrls || [],
        detected_numbers: visionExtraction.detectedNumbers || [],
        visual_summary: visionExtraction.visualSummary || '',
        proof_indicators: visionExtraction.proofIndicators || [],
        confidence: visionExtraction.confidence || 0,
        task_type: visionExtraction.taskType || 'general',
        analyzed_at: new Date().toISOString()
      });
      
      console.log('💾 Vision data SAVED to hive mind:', savedVisionData.id);
      
      // 🧠 Learn pattern from this image if it has high confidence
      if (visionExtraction.confidence > 0.5 && visionExtraction.taskType) {
        const patternId = visionId.substring(0, 16);
        
        const rules = [];
        if (visionExtraction.detectedUsernames?.length > 0) rules.push('has_usernames');
        if (visionExtraction.detectedUrls?.length > 0) rules.push('has_urls');
        if (visionExtraction.detectedObjects?.length > 0) rules.push('has_visual_elements');
        if (visionExtraction.proofIndicators?.length > 0) rules.push('has_proof_indicators');
        if (visionExtraction.extractedText?.length > 50) rules.push('has_text_content');
        if (visionExtraction.detectedNumbers?.length > 0) rules.push('has_numbers');
        
        await base44.asServiceRole.entities.AgentYingPattern.create({
          pattern_id: patternId,
          task_type: visionExtraction.taskType,
          verification_rules: rules,
          confidence: visionExtraction.confidence,
          examples: [visionExtraction.visualSummary, visionExtraction.extractedText?.substring(0, 200) || ''],
          usage_count: 1,
          success_rate: visionExtraction.confidence,
          learned_from: user.email
        });
        
        console.log('🧠 Created new pattern from chat image:', patternId);
      }
      
      // Generate conversational response with extracted data
      aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `${knowledgeContext}

User uploaded an image and asked: "${question}"

🔍 I JUST EXTRACTED FROM THIS IMAGE:
- Full Text (OCR): "${visionExtraction.extractedText}"
- Detected Objects: ${visionExtraction.detectedObjects?.join(', ') || 'None'}
- Usernames Found: ${visionExtraction.detectedUsernames?.join(', ') || 'None'}
- URLs Found: ${visionExtraction.detectedUrls?.join(', ') || 'None'}
- Numbers/IDs/Chain IDs: ${visionExtraction.detectedNumbers?.join(', ') || 'None'}
- Visual Summary: ${visionExtraction.visualSummary}
- Proof Indicators: ${visionExtraction.proofIndicators?.join(', ') || 'None'}
- Task Type Detected: ${visionExtraction.taskType}
- My Confidence: ${(visionExtraction.confidence * 100).toFixed(1)}%

✅ I have SAVED this to my permanent memory (hive mind).

Now provide a detailed, conversational answer to the user's question using the extracted data. Show them exactly what you found. If they asked about something specific (like "what is Kasplex chain ID"), search through the extracted text and numbers to find it. Reference specific data you extracted.`,
        add_context_from_internet: false
      });
      
    } else {
      // Regular text question - use FULL knowledge base
      aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `${knowledgeContext}

User Question: "${question}"

IMPORTANT: Search through ALL my knowledge above (patterns, verifications, vision data, extracted text, usernames, URLs, numbers) to answer this question. 

If the question is about:
- Specific terms/IDs → Search through "ALL TEXT I'VE EXTRACTED"
- Usernames → Check "USERNAMES I'VE SEEN"
- URLs/Links → Check "URLS I'VE SEEN"  
- What I learned → Reference "PATTERNS I'VE LEARNED"
- Past verifications → Check "RECENT VERIFICATIONS"

Provide a detailed answer showing EXACTLY what data I have. Don't say "I don't have" unless you've truly searched all my memory. Reference specific extracted text, usernames, or data when relevant.`,
        add_context_from_internet: false
      });
    }

    console.log('✅ Agent Ying responded');

    return Response.json({
      success: true,
      response: aiResponse,
      visionDataSaved: !!savedVisionData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Chat failed:', error);
    return Response.json({
      error: error.message,
      success: false
    }, { status: 500 });
  }
});

async function generateHash(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}