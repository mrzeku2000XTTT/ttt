import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Brain, TrendingUp, AlertTriangle, Users, Clock, Target, Shield, Loader2, Share2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function NewsAnalysisModal({ news, onClose }) {
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [views, setViews] = useState([]);
  const [error, setError] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isGeneratingPost, setIsGeneratingPost] = useState(false);

  useEffect(() => {
    loadAnalysis();
    loadViewers();
    trackView();
  }, [news.id]);

  useEffect(() => {
    // Simulate loading progress for better UX
    if (isLoading && !analysis && !error) { // Only simulate if loading, no analysis yet, and no error
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) return prev; // Stop at 90% to indicate it's almost done but waiting for actual data
          return prev + 10;
        });
      }, 500);

      return () => clearInterval(interval);
    } else if (analysis && !isLoading) { // If analysis is loaded and not loading anymore
      setLoadingProgress(100);
    } else if (error && !isLoading) { // If there's an error and not loading
      setLoadingProgress(0); // Reset progress if an error occurs
    }
  }, [isLoading, analysis, error]);


  const trackView = async () => {
    try {
      await base44.functions.invoke('trackNewsView', {
        news_id: news.id,
        device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
      });
    } catch (err) {
      console.error('Failed to track view:', err);
    }
  };

  const loadAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    setLoadingProgress(0); // Reset progress when starting a new analysis

    // Create abort controller for 30 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 30000);

    try {
      console.log('🧠 Starting AI analysis for news ID:', news.id);

      const { data } = await base44.functions.invoke('analyzeNews', { news_id: news.id }, { signal: controller.signal });

      clearTimeout(timeoutId); // Clear timeout if request completes before timeout

      console.log('✅ Analysis received:', data);

      if (data.analysis) {
        setAnalysis(data.analysis);
        if (data.cached) {
          console.log('📦 Loaded from cache');
        }
      } else {
        throw new Error('No analysis data received');
      }
    } catch (err) {
      clearTimeout(timeoutId); // Clear timeout on error as well
      console.error('❌ Failed to load analysis:', err);

      if (err.name === 'AbortError') {
        setError('Analysis timed out. The AI is taking too long to respond. Please try again.');
      } else {
        setError('Failed to generate analysis. Please try again in a moment.');
      }
      setAnalysis(null); // Clear previous analysis on error
    } finally {
      setIsLoading(false);
    }
  };

  const loadViewers = async () => {
    try {
      const viewData = await base44.entities.NewsView.filter({ news_id: news.id });
      setViews(viewData);
    } catch (err) {
      console.error('Failed to load viewers:', err);
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'very_positive': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'positive': return 'text-green-300 bg-green-500/10 border-green-500/20';
      case 'neutral': return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
      case 'negative': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'very_negative': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low': return 'text-green-400 bg-green-500/20 border-green-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const handleShareToFeed = async () => {
    setIsGeneratingPost(true);
    setError(null);

    try {
      console.log('🤖 Generating AI post for feed...');

      // Generate post content with AI
      const postContent = await base44.integrations.Core.InvokeLLM({
        prompt: `Create an engaging social media post about this news story:

Title: ${news.news_title || news.title}
Summary: ${analysis?.ai_summary || news.news_summary || news.summary}
Location: ${news.news_location || news.location}
Sentiment: ${analysis?.sentiment || 'neutral'}

Create a compelling post (max 280 characters) that:
- Grabs attention with a strong hook
- Summarizes the key information
- Includes relevant emojis
- Maintains a news reporting tone
- Ends with a call-to-action or thought-provoking question

Return ONLY the post text, no quotes or extra formatting.`,
      });

      console.log('🎨 Generating matching image...');

      // Generate image with AI
      const imagePrompt = `Breaking news illustration: ${news.news_title || news.title}. ${news.news_location || news.location}. Photorealistic news photography style, dramatic lighting, professional journalism aesthetic.`;
      
      const { url: imageUrl } = await base44.integrations.Core.GenerateImage({
        prompt: imagePrompt
      });

      console.log('✅ Post and image generated successfully');

      // Store in localStorage to be accessed by Feed page
      const feedDraft = {
        content: postContent.trim(),
        mediaFiles: [{
          url: imageUrl,
          type: 'image',
          name: 'ai-generated-news.png'
        }],
        newsSource: {
          title: news.news_title || news.title,
          url: news.url || `https://ttt.xyz`,
          timestamp: new Date().toISOString()
        }
      };

      localStorage.setItem('feed_draft', JSON.stringify(feedDraft));
      
      // Navigate to Feed
      navigate(createPageUrl('Feed'));
      onClose();

    } catch (err) {
      console.error('❌ Failed to generate feed post:', err);
      setError('Failed to generate post. Please try again.');
    } finally {
      setIsGeneratingPost(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-900 border border-cyan-500/30 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(6,182,212,0.3)]"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-cyan-500/30 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500/20 border border-cyan-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Brain className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">AI Analysis</h2>
              <p className="text-xs text-gray-500">{news.news_title || news.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {analysis && !isLoading && (
              <Button
                onClick={handleShareToFeed}
                disabled={isGeneratingPost}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm"
              >
                {isGeneratingPost ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share to Feed
                  </>
                )}
              </Button>
            )}
            <Button onClick={onClose} variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isLoading && !error ? ( // Only show loading if isLoading is true and there's no error
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
              <p className="text-white font-semibold mb-2">Analyzing with AI...</p>

              {/* Progress Bar */}
              <div className="max-w-xs mx-auto mb-4">
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${loadingProgress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">{loadingProgress}% complete</p>
              </div>

              <p className="text-gray-500 text-sm">This usually takes 5-10 seconds</p>

              {loadingProgress > 70 && (
                <p className="text-yellow-400 text-xs mt-2">Almost done...</p>
              )}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-white font-semibold mb-2">Analysis Failed</p>
              <p className="text-gray-400 text-sm mb-4">{error}</p>
              <Button
                onClick={() => {
                  setError(null);
                  setLoadingProgress(0);
                  setAnalysis(null); // Clear analysis state before retrying
                  loadAnalysis();
                }}
                className="bg-cyan-500/20 border border-cyan-500 hover:bg-cyan-500/30 text-cyan-400"
              >
                Try Again
              </Button>
            </div>
          ) : analysis ? (
            <>
              {/* AI Summary */}
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                <h3 className="text-sm font-bold text-cyan-400 mb-2">AI Summary</h3>
                <p className="text-white text-sm leading-relaxed">{analysis.ai_summary}</p>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs text-gray-400">Severity</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{analysis.severity_score}/10</div>
                </div>

                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs text-gray-400">Credibility</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{analysis.credibility_score}/10</div>
                </div>

                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-gray-400">Views</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{views.length}</div>
                </div>

                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-gray-400">Impact</span>
                  </div>
                  <Badge className={`${getRiskColor(analysis.civilian_impact)} border text-xs`}>
                    {analysis.civilian_impact}
                  </Badge>
                </div>
              </div>

              {/* Sentiment & Risk */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-white mb-3">Sentiment Analysis</h3>
                  <Badge className={`${getSentimentColor(analysis.sentiment)} border`}>
                    {analysis.sentiment.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>

                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-white mb-3">Escalation Risk</h3>
                  <Badge className={`${getRiskColor(analysis.escalation_risk)} border`}>
                    {analysis.escalation_risk.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* Key Topics */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                <h3 className="text-sm font-bold text-white mb-3">Key Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.key_topics.map((topic, i) => (
                    <Badge key={i} className="bg-cyan-500/10 border-cyan-500/30 text-cyan-400">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Entities Mentioned */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                <h3 className="text-sm font-bold text-white mb-3">Entities Mentioned</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.entities_mentioned.map((entity, i) => (
                    <Badge key={i} className="bg-purple-500/10 border-purple-500/30 text-purple-400">
                      {entity}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Predicted Impact */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                <h3 className="text-sm font-bold text-white mb-3">Predicted Impact</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{analysis.predicted_impact}</p>
              </div>

              {/* Similar Events */}
              {analysis.similar_events && analysis.similar_events.length > 0 && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-white mb-3">Similar Historical Events</h3>
                  <ul className="space-y-2">
                    {analysis.similar_events.map((event, i) => (
                      <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                        <Clock className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <span>{event}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Viewer Log */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                <h3 className="text-sm font-bold text-white mb-3">Recent Viewers ({views.length})</h3>
                {views.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {views.slice(-10).reverse().map((view, i) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-gray-900/50 p-2 rounded border border-gray-700">
                        <span className="text-cyan-400 font-mono">
                          {view.viewer_address ? view.viewer_address.substring(0, 8) + '...' : 'Anonymous'}
                        </span>
                        <div className="flex items-center gap-2 text-gray-500">
                          <span>{view.device_type}</span>
                          <span>•</span>
                          <span>{new Date(view.viewed_at).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No viewers yet</p>
                )}
              </div>
            </>
          ) : null} {/* Render nothing if not loading, no error, and no analysis (shouldn't happen with current logic) */}
        </div>
      </motion.div>
    </motion.div>
  );
}