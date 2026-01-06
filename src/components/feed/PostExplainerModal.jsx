import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function PostExplainerModal({ post, onClose, currentUser }) {
  const [explanation, setExplanation] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [rateLimitError, setRateLimitError] = useState(null);
  const [queriesUsed, setQueriesUsed] = useState(0);

  useEffect(() => {
    if (post) {
      explainPost();
    }
  }, [post?.id]);

  const explainPost = async () => {
    setIsLoading(true);
    setRateLimitError(null);
    try {
      // Check rate limit for non-admins
      const isAdmin = currentUser?.role === 'admin';
      
      if (!isAdmin && currentUser) {
        const today = new Date().toISOString().split('T')[0];
        const todayQueries = await base44.entities.PostExplanationQuery.filter({
          user_email: currentUser.email,
          query_date: today
        });
        
        setQueriesUsed(todayQueries.length);
        
        if (todayQueries.length >= 3) {
          setRateLimitError(`Daily limit reached (3/3). Resets tomorrow.`);
          setIsLoading(false);
          return;
        }
      }

      // Record query for non-admins
      if (!isAdmin && currentUser) {
        const today = new Date().toISOString().split('T')[0];
        await base44.entities.PostExplanationQuery.create({
          user_email: currentUser.email,
          post_id: post.id,
          query_date: today
        });
        setQueriesUsed(prev => prev + 1);
      }
      // Gather post context and media
      const postContent = post.content || "";
      const mediaUrls = [];
      
      if (post.image_url) {
        mediaUrls.push(post.image_url);
      }
      if (post.media_files?.length > 0) {
        post.media_files.forEach(file => {
          if (file.url && file.type?.startsWith('image/')) {
            mediaUrls.push(file.url);
          }
        });
      }
      
      const prompt = postContent 
        ? `You are an expert post analyzer on TTT Feed. Explain this post in TWO detailed, specific sentences.

Post by ${post.author_name}:
"${postContent}"

${mediaUrls.length > 0 ? 'The post includes images - analyze the visual content in detail.' : ''}

Provide TWO informative sentences that give context, meaning, and key insights. Be specific and detailed. Use 1-2 emojis.`
        : `You are an expert post analyzer on TTT Feed. This post contains only images with no text.

Post by ${post.author_name} - IMAGE ONLY

Analyze the images in detail and provide TWO informative sentences explaining what is shown, the context, and key insights. Be specific about what you see. Use 1-2 emojis.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: true,
        response_json_schema: null,
        ...(mediaUrls.length > 0 && { file_urls: mediaUrls })
      });

      setExplanation(response || "Unable to generate explanation.");
    } catch (err) {
      console.error("Failed to explain post:", err);
      setExplanation("Failed to analyze this post. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!post) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-black border border-white/20 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Explain this post</h3>
                <p className="text-white/60 text-xs">AI-powered post analysis</p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Original Post */}
          <div className="p-4 bg-white/5 border-b border-white/10">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {post.author_name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white/80 text-sm font-semibold mb-1">
                  {post.author_name}
                </div>
                <p className="text-white/70 text-sm line-clamp-3">
                  {post.content}
                </p>
              </div>
            </div>
          </div>

          {/* Explanation Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {rateLimitError ? (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-red-400 font-semibold text-sm mb-1">Rate Limit Reached</div>
                    <p className="text-white/80 text-sm">{rateLimitError}</p>
                  </div>
                </div>
              </div>
            ) : isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="relative">
                  <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                  <div className="absolute inset-0 w-8 h-8 border-2 border-cyan-400/20 rounded-full animate-ping" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-white/60 text-sm font-medium">Analyzing post...</p>
                  <p className="text-white/40 text-xs">Searching web + processing context</p>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500/30 to-blue-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm mb-1">AI Analysis</div>
                    <div className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                      {explanation}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 bg-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Sparkles className="w-3 h-3" />
                <span>Powered by AI with real-time internet context</span>
              </div>
              {currentUser?.role !== 'admin' && !rateLimitError && (
                <div className="text-xs text-white/40">
                  {queriesUsed}/3 used today
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}