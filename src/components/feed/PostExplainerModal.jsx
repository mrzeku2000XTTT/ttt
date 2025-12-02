import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function PostExplainerModal({ post, onClose }) {
  const [explanation, setExplanation] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (post) {
      explainPost();
    }
  }, [post?.id]);

  const explainPost = async () => {
    setIsLoading(true);
    try {
      // Gather post context
      const postContent = post.content || "";
      const hasMedia = post.media_files?.length > 0 || post.image_url;
      const mediaContext = hasMedia ? "\n\nPost includes media attachments." : "";
      
      const prompt = `You are an expert post analyzer. Analyze this social media post and provide:

1. **Main Topic**: What is this post about?
2. **Context**: Any relevant background or references
3. **Key Points**: Main takeaways or insights
4. **Sentiment**: Overall tone (positive, neutral, critical, etc.)

Post by ${post.author_name}:
"${postContent}"${mediaContext}

Provide a clear, structured explanation in 3-4 short paragraphs. Be factual and insightful.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: true,
        response_json_schema: null
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
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                <p className="text-white/60 text-sm">Analyzing post with AI...</p>
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
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Sparkles className="w-3 h-3" />
              <span>Powered by AI with real-time internet context</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}