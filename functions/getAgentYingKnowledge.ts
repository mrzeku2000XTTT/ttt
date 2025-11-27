import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('📊 Loading Agent Ying knowledge base...');

    // Fetch all knowledge
    const patterns = await base44.asServiceRole.entities.AgentYingPattern.filter({}, '-usage_count', 500);
    const verifications = await base44.asServiceRole.entities.AgentYingVerification.filter({}, '-verified_at', 500);
    const visionData = await base44.asServiceRole.entities.AgentYingVision.filter({}, '-analyzed_at', 500);

    // Overall stats
    const totalPatterns = patterns.length;
    const totalVerifications = verifications.length;
    const totalVisionAnalyses = visionData.length;
    const averageScore = verifications.length > 0 
      ? Math.round(verifications.reduce((sum, v) => sum + v.verification_score, 0) / verifications.length)
      : 0;

    // Task type breakdown
    const taskTypes = [...new Set(patterns.map(p => p.task_type))];
    const taskTypeStats = taskTypes.map(type => {
      const typePatterns = patterns.filter(p => p.task_type === type);
      const typeVerifications = verifications.filter(v => v.task_type === type);
      const typeVisions = visionData.filter(v => v.task_type === type);
      
      return {
        taskType: type,
        patternCount: typePatterns.length,
        verificationCount: typeVerifications.length,
        visionCount: typeVisions.length,
        averageScore: typeVerifications.length > 0
          ? Math.round(typeVerifications.reduce((sum, v) => sum + v.verification_score, 0) / typeVerifications.length)
          : 0
      };
    });

    // Top patterns by usage
    const topPatterns = patterns
      .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
      .slice(0, 10)
      .map(p => ({
        patternId: p.pattern_id,
        taskType: p.task_type,
        usageCount: p.usage_count || 0,
        successRate: Math.round((p.success_rate || 0) * 100)
      }));

    // Recent verifications
    const recentVerifications = verifications
      .slice(-10)
      .reverse()
      .map(v => ({
        taskType: v.task_type,
        score: v.verification_score,
        learnedNew: v.learned_new_pattern,
        timestamp: v.verified_at
      }));

    // 🔥 VISION INSIGHTS - What Agent Ying has "seen"
    const allUsernames = [...new Set(visionData.flatMap(v => v.detected_usernames || []))];
    const allUrls = [...new Set(visionData.flatMap(v => v.detected_urls || []))];
    const allObjects = [...new Set(visionData.flatMap(v => v.detected_objects || []))];
    
    const visionInsights = {
      totalImagesAnalyzed: visionData.length,
      uniqueUsernames: allUsernames.length,
      topUsernames: allUsernames.slice(0, 20),
      uniqueUrls: allUrls.length,
      topUrls: allUrls.slice(0, 10),
      detectedObjects: allObjects.slice(0, 30),
      recentVisions: visionData.slice(-10).reverse().map(v => ({
        visualSummary: v.visual_summary?.substring(0, 150),
        taskType: v.task_type,
        confidence: v.confidence,
        timestamp: v.analyzed_at,
        hasUsernames: v.detected_usernames?.length > 0,
        hasUrls: v.detected_urls?.length > 0
      }))
    };

    console.log('✅ Knowledge loaded with vision insights');

    return Response.json({
      success: true,
      stats: {
        totalPatterns,
        totalVerifications,
        totalVisionAnalyses,
        averageScore
      },
      taskTypeStats,
      topPatterns,
      recentVerifications,
      visionInsights, // 🔥 NEW: Vision-based insights
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Knowledge fetch failed:', error);
    return Response.json({
      error: error.message,
      success: false
    }, { status: 500 });
  }
});