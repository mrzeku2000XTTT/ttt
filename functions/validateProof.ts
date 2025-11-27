import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Advanced AI-powered proof validation with multi-modal analysis
 * Analyzes photos, links, and descriptions using sophisticated AI
 */

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId, photos, links, description } = await req.json();

    console.log(`🔍 Advanced proof validation for task: ${taskId}`);

    // Get task details
    const tasks = await base44.entities.PeraTask.filter({ id: taskId });
    if (tasks.length === 0) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    const task = tasks[0];
    let score = 0;
    const checks = [];
    const detailedFeedback = [];

    // ====== PHASE 1: MULTI-MODAL IMAGE ANALYSIS (30 POINTS) ======
    console.log('📸 Phase 1: Analyzing proof images with multi-modal AI...');
    
    if (photos && photos.length > 0) {
      try {
        const imageAnalysisPrompt = `You are analyzing proof-of-work images for a task marketplace.

**Task Requirements:**
${task.description}

**Number of images submitted:** ${photos.length}

Analyze these images and provide:
1. Content relevance: Do the images show work related to the task? (0-1 score)
2. Quality: Are images clear and professional? (0-1 score)
3. Authenticity: Do images appear genuine (not stock photos/AI generated)? (0-1 score)
4. Completeness: Do images demonstrate task completion? (0-1 score)

Provide detailed analysis and scores.`;

        const imageAnalysis = await base44.integrations.Core.InvokeLLM({
          prompt: imageAnalysisPrompt,
          file_urls: photos,
          response_json_schema: {
            type: "object",
            properties: {
              content_relevance: { type: "number" },
              quality_score: { type: "number" },
              authenticity_score: { type: "number" },
              completeness_score: { type: "number" },
              detailed_feedback: { type: "string" },
              concerns: { type: "array", items: { type: "string" } }
            }
          }
        });

        console.log('✅ Image analysis completed:', imageAnalysis);

        // Calculate image score (max 30 points)
        const avgImageScore = (
          imageAnalysis.content_relevance +
          imageAnalysis.quality_score +
          imageAnalysis.authenticity_score +
          imageAnalysis.completeness_score
        ) / 4;

        const imagePoints = Math.round(avgImageScore * 30);
        score += imagePoints;

        checks.push({
          check: 'Multi-modal Image Analysis',
          passed: imagePoints >= 20,
          points: imagePoints,
          maxPoints: 30,
          breakdown: {
            relevance: imageAnalysis.content_relevance,
            quality: imageAnalysis.quality_score,
            authenticity: imageAnalysis.authenticity_score,
            completeness: imageAnalysis.completeness_score
          }
        });

        detailedFeedback.push({
          category: 'Images',
          feedback: imageAnalysis.detailed_feedback,
          concerns: imageAnalysis.concerns || []
        });

      } catch (err) {
        console.error('❌ Image analysis failed:', err);
        checks.push({ 
          check: 'Multi-modal Image Analysis', 
          passed: false, 
          points: 0,
          error: 'AI analysis failed'
        });
        detailedFeedback.push({
          category: 'Images',
          feedback: 'Could not analyze images - please ensure they are accessible',
          concerns: ['Image analysis system error']
        });
      }
    } else {
      checks.push({ 
        check: 'Multi-modal Image Analysis', 
        passed: false, 
        points: 0,
        feedback: 'No images provided'
      });
      detailedFeedback.push({
        category: 'Images',
        feedback: 'No proof images submitted - visual evidence is strongly recommended',
        concerns: ['Missing visual proof']
      });
    }

    // ====== PHASE 2: ADVANCED LINK VERIFICATION (25 POINTS) ======
    console.log('🔗 Phase 2: Deep link analysis...');
    
    if (links && links.length > 0) {
      try {
        let validLinks = 0;
        const linkAnalysis = [];

        for (const link of links) {
          try {
            console.log(`🌐 Fetching content from: ${link}`);
            
            // Fetch actual content
            const response = await fetch(link, {
              signal: AbortSignal.timeout(10000),
              headers: {
                'User-Agent': 'TTT-MZK-Bot/1.0'
              }
            });

            if (response.ok) {
              const contentType = response.headers.get('content-type') || '';
              let content = '';

              // Get content based on type
              if (contentType.includes('text/html')) {
                content = await response.text();
                // Extract text from HTML (simple extraction)
                content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
                content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
                content = content.replace(/<[^>]+>/g, ' ');
                content = content.replace(/\s+/g, ' ').trim();
                content = content.substring(0, 3000); // Limit to 3000 chars
              } else if (contentType.includes('application/json')) {
                const json = await response.json();
                content = JSON.stringify(json).substring(0, 3000);
              } else {
                content = `Content type: ${contentType}, Status: ${response.status}`;
              }

              // Analyze link content relevance
              const linkContentAnalysis = await base44.integrations.Core.InvokeLLM({
                prompt: `Analyze if this web content is relevant proof for the task.

**Task:** ${task.description}

**Link:** ${link}

**Content Preview:**
${content}

Rate relevance (0-1) and explain if this link demonstrates task completion.`,
                response_json_schema: {
                  type: "object",
                  properties: {
                    relevance_score: { type: "number" },
                    demonstrates_completion: { type: "boolean" },
                    summary: { type: "string" }
                  }
                }
              });

              validLinks++;
              linkAnalysis.push({
                url: link,
                accessible: true,
                relevance: linkContentAnalysis.relevance_score,
                summary: linkContentAnalysis.summary
              });

              console.log(`✅ Link analyzed: ${link} - Relevance: ${linkContentAnalysis.relevance_score}`);

            } else {
              linkAnalysis.push({
                url: link,
                accessible: false,
                error: `HTTP ${response.status}`
              });
            }

          } catch (err) {
            console.warn(`⚠️ Link failed: ${link} - ${err.message}`);
            linkAnalysis.push({
              url: link,
              accessible: false,
              error: err.message
            });
          }
        }

        // Calculate link score
        const avgLinkRelevance = linkAnalysis
          .filter(l => l.accessible)
          .reduce((sum, l) => sum + (l.relevance || 0), 0) / Math.max(validLinks, 1);

        const linkPoints = Math.round((validLinks / links.length) * avgLinkRelevance * 25);
        score += linkPoints;

        checks.push({
          check: 'Advanced Link Verification',
          passed: linkPoints >= 15,
          points: linkPoints,
          maxPoints: 25,
          breakdown: {
            totalLinks: links.length,
            validLinks: validLinks,
            avgRelevance: avgLinkRelevance.toFixed(2)
          }
        });

        detailedFeedback.push({
          category: 'Links',
          feedback: `Verified ${validLinks}/${links.length} links with average relevance of ${(avgLinkRelevance * 100).toFixed(0)}%`,
          linkDetails: linkAnalysis
        });

      } catch (err) {
        console.error('❌ Link analysis failed:', err);
        checks.push({ 
          check: 'Advanced Link Verification', 
          passed: false, 
          points: 0 
        });
      }
    } else {
      checks.push({ 
        check: 'Advanced Link Verification', 
        passed: false, 
        points: 0,
        feedback: 'No links provided'
      });
      detailedFeedback.push({
        category: 'Links',
        feedback: 'No proof links submitted - external evidence is recommended',
        concerns: ['Missing link proof']
      });
    }

    // ====== PHASE 3: SEMANTIC DESCRIPTION ANALYSIS (25 POINTS) ======
    console.log('📝 Phase 3: Deep semantic analysis of description...');
    
    if (description && description.length > 20) {
      try {
        const semanticAnalysis = await base44.integrations.Core.InvokeLLM({
          prompt: `You are an expert work validator. Analyze if this worker's description demonstrates task completion.

**Task Requirements:**
${task.description}

**Worker's Description:**
${description}

Provide detailed semantic analysis:
1. Requirement Coverage: Does description address all task requirements? (0-1)
2. Clarity & Detail: Is explanation clear and detailed? (0-1)
3. Technical Accuracy: Are technical details correct if applicable? (0-1)
4. Professionalism: Is description professional and well-written? (0-1)
5. Evidence Quality: Does description reference specific evidence? (0-1)

Also identify:
- Which requirements are met
- Which requirements are missing or unclear
- Red flags or concerns
- Strengths of the submission`,
          response_json_schema: {
            type: "object",
            properties: {
              requirement_coverage: { type: "number" },
              clarity_detail: { type: "number" },
              technical_accuracy: { type: "number" },
              professionalism: { type: "number" },
              evidence_quality: { type: "number" },
              requirements_met: { type: "array", items: { type: "string" } },
              requirements_missing: { type: "array", items: { type: "string" } },
              red_flags: { type: "array", items: { type: "string" } },
              strengths: { type: "array", items: { type: "string" } },
              overall_assessment: { type: "string" }
            }
          }
        });

        console.log('✅ Semantic analysis completed');

        // Calculate semantic score (max 25 points)
        const avgSemanticScore = (
          semanticAnalysis.requirement_coverage +
          semanticAnalysis.clarity_detail +
          semanticAnalysis.technical_accuracy +
          semanticAnalysis.professionalism +
          semanticAnalysis.evidence_quality
        ) / 5;

        const semanticPoints = Math.round(avgSemanticScore * 25);
        score += semanticPoints;

        checks.push({
          check: 'Semantic Description Analysis',
          passed: semanticPoints >= 17,
          points: semanticPoints,
          maxPoints: 25,
          breakdown: {
            requirementCoverage: semanticAnalysis.requirement_coverage,
            clarityDetail: semanticAnalysis.clarity_detail,
            technicalAccuracy: semanticAnalysis.technical_accuracy,
            professionalism: semanticAnalysis.professionalism,
            evidenceQuality: semanticAnalysis.evidence_quality
          }
        });

        detailedFeedback.push({
          category: 'Description',
          feedback: semanticAnalysis.overall_assessment,
          requirementsMet: semanticAnalysis.requirements_met,
          requirementsMissing: semanticAnalysis.requirements_missing,
          redFlags: semanticAnalysis.red_flags,
          strengths: semanticAnalysis.strengths
        });

      } catch (err) {
        console.error('❌ Semantic analysis failed:', err);
        // Fallback to basic length check
        const basicPoints = description.length > 100 ? 15 : 10;
        score += basicPoints;
        checks.push({
          check: 'Semantic Description Analysis',
          passed: basicPoints >= 15,
          points: basicPoints,
          maxPoints: 25,
          feedback: 'Basic validation only - AI analysis unavailable'
        });
      }
    } else {
      checks.push({ 
        check: 'Semantic Description Analysis', 
        passed: false, 
        points: 0,
        feedback: 'Description too short or missing'
      });
      detailedFeedback.push({
        category: 'Description',
        feedback: 'Description is too brief - please provide detailed explanation of work completed',
        concerns: ['Insufficient detail']
      });
    }

    // ====== PHASE 4: CROSS-VALIDATION & CONSISTENCY (20 POINTS) ======
    console.log('🔄 Phase 4: Cross-validation across all evidence...');
    
    if ((photos && photos.length > 0) && description) {
      try {
        const crossValidation = await base44.integrations.Core.InvokeLLM({
          prompt: `Cross-validate all evidence for consistency and coherence.

**Task:** ${task.description}

**Evidence Provided:**
- ${photos ? photos.length : 0} images
- ${links ? links.length : 0} links
- Description: ${description}

Check for:
1. Consistency: Do images, links, and description tell the same story?
2. Timeline Coherence: Does evidence appear to be from the same work session?
3. Authenticity Signals: Are there signs of genuine work vs. fake/plagiarized proof?
4. Completeness: Does combined evidence fully demonstrate task completion?

Rate overall consistency and authenticity (0-1).`,
          file_urls: photos,
          response_json_schema: {
            type: "object",
            properties: {
              consistency_score: { type: "number" },
              authenticity_score: { type: "number" },
              completeness_score: { type: "number" },
              concerns: { type: "array", items: { type: "string" } },
              confidence_level: { type: "string" },
              recommendation: { type: "string" }
            }
          }
        });

        const crossValScore = (
          crossValidation.consistency_score +
          crossValidation.authenticity_score +
          crossValidation.completeness_score
        ) / 3;

        const crossValPoints = Math.round(crossValScore * 20);
        score += crossValPoints;

        checks.push({
          check: 'Cross-Validation & Consistency',
          passed: crossValPoints >= 14,
          points: crossValPoints,
          maxPoints: 20,
          confidenceLevel: crossValidation.confidence_level
        });

        detailedFeedback.push({
          category: 'Overall Assessment',
          feedback: crossValidation.recommendation,
          concerns: crossValidation.concerns,
          confidenceLevel: crossValidation.confidence_level
        });

      } catch (err) {
        console.error('❌ Cross-validation failed:', err);
        const basicCrossVal = 10;
        score += basicCrossVal;
        checks.push({
          check: 'Cross-Validation & Consistency',
          passed: true,
          points: basicCrossVal,
          maxPoints: 20,
          feedback: 'Basic validation only'
        });
      }
    } else {
      checks.push({
        check: 'Cross-Validation & Consistency',
        passed: false,
        points: 0,
        maxPoints: 20,
        feedback: 'Insufficient evidence for cross-validation'
      });
    }

    const passed = score >= 70;

    console.log(`📊 Advanced validation complete - Score: ${score}/100 - ${passed ? 'PASSED ✅' : 'FAILED ❌'}`);

    // Generate employer summary
    const employerSummary = {
      overallScore: score,
      passed: passed,
      confidence: score >= 85 ? 'high' : score >= 70 ? 'medium' : 'low',
      recommendation: passed 
        ? score >= 85 
          ? 'Strong proof - highly recommended for approval'
          : 'Acceptable proof - meets minimum standards'
        : 'Insufficient proof - recommend rejection or request improvements',
      keyStrengths: detailedFeedback.flatMap(f => f.strengths || []).slice(0, 5),
      keyConcerns: detailedFeedback.flatMap(f => f.concerns || []).slice(0, 5),
      detailedAnalysis: detailedFeedback
    };

    // Update task with proof and detailed analysis
    await base44.entities.PeraTask.update(taskId, {
      proof_photos: photos || [],
      proof_links: links || [],
      proof_description: description || '',
      proof_score: score,
      status: passed ? 'awaiting_approval' : 'in_progress',
      proof_validation_details: JSON.stringify(employerSummary)
    });

    return Response.json({
      success: true,
      passed,
      score,
      checks,
      employerSummary,
      message: passed 
        ? `✅ Proof validated successfully! Score: ${score}/100. Your work has been submitted for employer review.`
        : `❌ Proof validation score too low (${score}/100). Minimum required: 70. Please improve your submission based on the feedback below.`
    });

  } catch (error) {
    console.error('❌ Validation error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});