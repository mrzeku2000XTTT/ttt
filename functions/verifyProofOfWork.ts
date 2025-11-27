import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      fileUrl, 
      fileName, 
      fileType, 
      userEmail, 
      userExplanation, 
      enhancedExplanation 
    } = await req.json();

    console.log('🧠 Agent Ying: Starting verification for', user.email);
    console.log('📁 File:', fileName);

    // REAL GOOGLE LENS-STYLE VISION ANALYSIS
    let visionData = null;
    let proofAnalysis = enhancedExplanation;
    
    if (fileType.includes('image')) {
      console.log('📸 Using Google Lens-style vision AI...');
      
      try {
        // Use LLM with vision to extract structured data from image
        const visionResponse = await base44.integrations.Core.InvokeLLM({
          prompt: `You are Agent Ying's vision system with Google Lens capabilities.

ANALYZE THIS IMAGE LIKE GOOGLE LENS:

Extract ALL information from this image:
1. Read ALL visible text (OCR)
2. Detect objects, UI elements, buttons, icons
3. Find usernames (especially @mentions, profile names)
4. Extract URLs and links
5. Identify numbers, dates, timestamps, IDs
6. Describe what's happening in the image
7. Identify proof indicators (follows, likes, shares, completed tasks, etc.)

Task Context: ${enhancedExplanation}

Return structured JSON with:
- extractedText: all text you can read
- detectedObjects: list of objects/elements
- detectedUsernames: list of usernames/handles found
- detectedUrls: list of URLs
- detectedNumbers: list of numbers/IDs
- visualSummary: detailed description of the image
- proofIndicators: what proves task completion
- confidence: your confidence (0-1)
- taskType: what type of task this proves`,
          file_urls: [fileUrl],
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
        
        visionData = visionResponse;
        proofAnalysis = visionData.visualSummary + ' | ' + visionData.extractedText + ' | ' + enhancedExplanation;
        
        console.log('👁️ Vision extracted:', {
          text: visionData.extractedText?.substring(0, 100),
          objects: visionData.detectedObjects?.length,
          usernames: visionData.detectedUsernames,
          confidence: visionData.confidence
        });
        
      } catch (visionErr) {
        console.error('Vision analysis failed:', visionErr);
      }
    }
    
    // Calculate quality score based on AI analysis
    const qualityScore = calculateQualityScore(proofAnalysis, enhancedExplanation, visionData);
    
    // Calculate complexity score
    const complexityScore = calculateComplexityScore(enhancedExplanation);
    
    // Extract task type (use vision if available)
    const taskType = visionData?.taskType || extractTaskType(fileName, enhancedExplanation);
    
    // Find similar patterns from database
    const patternMatch = await findSimilarPattern(base44, enhancedExplanation, taskType, visionData);
    
    // Verify Proof of Work (Kaspa-style hash)
    const powResult = await verifyPoW(enhancedExplanation);
    
    // Calculate overall verification score
    const verificationScore = Math.round(
      (qualityScore * 0.3 + complexityScore * 0.2 + patternMatch.confidence * 0.3 + (visionData?.confidence || 0.5) * 0.2) * 100
    );

    // Save vision data to database
    if (visionData) {
      const visionRecord = await base44.asServiceRole.entities.AgentYingVision.create({
        vision_id: powResult.hash,
        verification_id: powResult.hash,
        image_url: fileUrl,
        extracted_text: visionData.extractedText || '',
        detected_objects: visionData.detectedObjects || [],
        detected_usernames: visionData.detectedUsernames || [],
        detected_urls: visionData.detectedUrls || [],
        detected_numbers: visionData.detectedNumbers || [],
        visual_summary: visionData.visualSummary || '',
        proof_indicators: visionData.proofIndicators || [],
        confidence: visionData.confidence || 0,
        task_type: visionData.taskType || taskType,
        analyzed_at: new Date().toISOString()
      });
      
      console.log('💾 Vision data saved to hive mind');
    }

    // Learn new pattern if not found or low confidence
    let learnedNewPattern = false;
    if (!patternMatch.found || patternMatch.confidence < 0.6) {
      await learnPattern(base44, enhancedExplanation, userExplanation, fileName, verificationScore, taskType, user.email, visionData);
      learnedNewPattern = true;
    } else {
      await updatePatternUsage(base44, patternMatch.patternId, verificationScore);
    }

    // Calculate rewards (NO ACTUAL PAYMENTS - just contribution points)
    const rewards = {
      kaspaTokens: 0, // No real payments
      trustScore: verificationScore / 100,
      hiveContribution: learnedNewPattern ? 5 : 1
    };

    // Save verification to database with vision data
    const verification = await base44.asServiceRole.entities.AgentYingVerification.create({
      verification_id: powResult.hash,
      user_email: user.email,
      file_url: fileUrl,
      file_name: fileName,
      file_type: fileType,
      user_explanation: userExplanation,
      enhanced_explanation: enhancedExplanation,
      task_type: taskType,
      verification_score: verificationScore,
      quality_score: qualityScore,
      complexity_score: complexityScore,
      pattern_match: {
        found: patternMatch.found,
        confidence: patternMatch.confidence,
        pattern_id: patternMatch.patternId
      },
      learned_new_pattern: learnedNewPattern,
      rewards: rewards,
      proof_of_work_hash: powResult.hash,
      verified_at: new Date().toISOString()
    });

    console.log('✅ Agent Ying: Verification + Vision data saved to hive mind');

    return Response.json({
      success: true,
      verificationScore,
      qualityScore,
      complexityScore,
      visionData: visionData ? {
        extractedText: visionData.extractedText?.substring(0, 200),
        detectedObjects: visionData.detectedObjects,
        detectedUsernames: visionData.detectedUsernames,
        visualSummary: visionData.visualSummary?.substring(0, 200)
      } : null,
      proofOfWork: powResult,
      patternMatch: {
        found: patternMatch.found,
        confidence: patternMatch.confidence,
        patternId: patternMatch.patternId
      },
      learnedNewPattern,
      rewards,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Agent Ying error:', error);
    return Response.json({
      error: error.message,
      success: false
    }, { status: 500 });
  }
});

function calculateQualityScore(proofAnalysis, explanation, visionData) {
  let score = 0;
  
  const combinedText = (proofAnalysis + ' ' + explanation).toLowerCase();
  
  // Length and detail check
  if (combinedText.length > 100) score += 0.15;
  if (combinedText.length > 300) score += 0.15;
  
  // Completion indicators
  if (combinedText.includes('completed') || 
      combinedText.includes('finished') || 
      combinedText.includes('done') ||
      combinedText.includes('followed') ||
      combinedText.includes('shared') ||
      combinedText.includes('posted')) {
    score += 0.2;
  }
  
  // Evidence of proof
  if (combinedText.includes('screenshot') || 
      combinedText.includes('photo') || 
      combinedText.includes('proof') ||
      combinedText.includes('evidence')) {
    score += 0.15;
  }
  
  // Specific details
  if (combinedText.match(/@\w+/) || 
      combinedText.match(/http/) ||  
      combinedText.match(/\d{2,}/)) {
    score += 0.1;
  }
  
  // Vision bonus
  if (visionData) {
    if (visionData.detectedUsernames && visionData.detectedUsernames.length > 0) score += 0.1;
    if (visionData.proofIndicators && visionData.proofIndicators.length > 0) score += 0.15;
  }
  
  return Math.min(score, 1);
}

function calculateComplexityScore(explanation) {
  const words = explanation.split(/\s+/);
  const wordCount = words.length;
  const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
  
  const diversity = uniqueWords / Math.max(wordCount, 1);
  
  const sentences = explanation.split(/[.!?]+/).filter(s => s.trim());
  const avgWordsPerSentence = wordCount / Math.max(sentences.length, 1);
  
  return Math.min(
    (wordCount / 100) * 0.4 + 
    diversity * 0.3 + 
    (avgWordsPerSentence / 20) * 0.3,
    1
  );
}

async function findSimilarPattern(base44, explanation, taskType, visionData) {
  try {
    const patterns = await base44.asServiceRole.entities.AgentYingPattern.filter({
      task_type: taskType
    });
    
    if (patterns.length === 0) {
      console.log('🔍 No patterns found for task type:', taskType);
      return {
        found: false,
        confidence: 0,
        patternId: null
      };
    }
    
    let bestMatch = { found: false, confidence: 0, patternId: null };
    
    for (const pattern of patterns) {
      let similarity = calculateSimilarity(explanation, pattern.examples);
      
      // Boost similarity if vision data matches pattern rules
      if (visionData && pattern.verification_rules) {
        const visionBoost = pattern.verification_rules.filter(rule => {
          if (rule === 'username_mentioned' && visionData.detectedUsernames?.length > 0) return true;
          if (rule === 'contains_link' && visionData.detectedUrls?.length > 0) return true;
          if (rule === 'visual_proof' && visionData.detectedObjects?.length > 0) return true;
          return false;
        }).length * 0.1;
        
        similarity = Math.min(similarity + visionBoost, 1);
      }
      
      if (similarity > bestMatch.confidence) {
        bestMatch = {
          found: true,
          confidence: similarity,
          patternId: pattern.pattern_id
        };
      }
    }
    
    console.log('📊 Best pattern match:', bestMatch.confidence);
    
    return bestMatch;
    
  } catch (err) {
    console.error('Pattern search failed:', err);
    return {
      found: false,
      confidence: 0,
      patternId: null
    };
  }
}

function extractTaskType(fileName, explanation) {
  const keywords = {
    'social': ['follow', 'twitter', 'x.com', 'social media', 'account', 'like', 'share', 'retweet'],
    'content': ['post', 'article', 'blog', 'content', 'write', 'publish'],
    'design': ['design', 'logo', 'graphic', 'visual', 'artwork', 'illustration'],
    'code': ['code', 'programming', 'development', 'function', 'script', 'commit'],
    'research': ['research', 'analysis', 'report', 'study', 'data', 'findings'],
    'photo': ['photo', 'image', 'picture', 'screenshot', 'capture']
  };
  
  const lowerExplanation = explanation.toLowerCase();
  
  for (const [type, words] of Object.entries(keywords)) {
    if (words.some(word => lowerExplanation.includes(word))) {
      return type;
    }
  }
  
  return 'general';
}

function calculateSimilarity(text1, examples) {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  let maxSimilarity = 0;
  
  for (const example of examples) {
    const words2 = new Set(example.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    const similarity = intersection.size / union.size;
    maxSimilarity = Math.max(maxSimilarity, similarity);
  }
  
  return maxSimilarity;
}

async function learnPattern(base44, enhancedExplanation, userExplanation, fileName, verificationScore, taskType, userEmail, visionData) {
  try {
    const patternId = await generateHash(taskType + Date.now());
    
    // Extract rules from both text and vision
    const rules = extractRules(enhancedExplanation);
    if (visionData) {
      if (visionData.detectedUsernames?.length > 0) rules.push('has_usernames');
      if (visionData.detectedUrls?.length > 0) rules.push('has_urls');
      if (visionData.detectedObjects?.length > 0) rules.push('has_visual_elements');
    }
    
    const newPattern = {
      pattern_id: patternId,
      task_type: taskType,
      verification_rules: [...new Set(rules)], // Remove duplicates
      confidence: verificationScore / 100,
      examples: [enhancedExplanation, userExplanation],
      usage_count: 1,
      success_rate: verificationScore / 100,
      learned_from: userEmail
    };
    
    await base44.asServiceRole.entities.AgentYingPattern.create(newPattern);
    
    console.log(`🧠 Agent Ying learned new pattern: ${taskType} (ID: ${patternId})`);
    
    return newPattern;
  } catch (err) {
    console.error('Failed to save pattern:', err);
  }
}

async function updatePatternUsage(base44, patternId, verificationScore) {
  try {
    const patterns = await base44.asServiceRole.entities.AgentYingPattern.filter({
      pattern_id: patternId
    });
    
    if (patterns.length > 0) {
      const pattern = patterns[0];
      const newUsageCount = (pattern.usage_count || 0) + 1;
      const newSuccessRate = ((pattern.success_rate || 0) * (pattern.usage_count || 0) + verificationScore / 100) / newUsageCount;
      
      await base44.asServiceRole.entities.AgentYingPattern.update(pattern.id, {
        usage_count: newUsageCount,
        success_rate: newSuccessRate
      });
      
      console.log(`📈 Updated pattern ${patternId} usage: ${newUsageCount}`);
    }
  } catch (err) {
    console.error('Failed to update pattern:', err);
  }
}

function extractRules(explanation) {
  const rules = [];
  
  const lowerExplanation = explanation.toLowerCase();
  
  if (lowerExplanation.includes('follow')) rules.push('social_follow');
  if (lowerExplanation.includes('screenshot') || lowerExplanation.includes('photo')) rules.push('visual_proof');
  if (lowerExplanation.includes('complete') || lowerExplanation.includes('done')) rules.push('completion_stated');
  if (lowerExplanation.match(/@\w+/)) rules.push('username_mentioned');
  if (lowerExplanation.includes('http')) rules.push('contains_link');
  if (lowerExplanation.match(/\d{2,}/)) rules.push('contains_id_or_number');
  if (explanation.length > 100) rules.push('detailed_explanation');
  
  return rules;
}

async function verifyPoW(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data + Date.now().toString());
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  const difficulty = 4;
  const leadingZeros = hash.match(/^0+/)?.[0]?.length || 0;
  const isValid = leadingZeros >= difficulty;
  
  return {
    isValid,
    hash: hash.substring(0, 16) + '...',
    difficulty,
    leadingZeros
  };
}

async function generateHash(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}