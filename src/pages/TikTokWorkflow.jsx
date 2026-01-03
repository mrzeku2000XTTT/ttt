import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Sparkles, Loader2, Lightbulb, TrendingUp, Music, Hash, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function TikTokWorkflowPage() {
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState(null);
  const [userInput, setUserInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [ideas, setIdeas] = useState(null);

  useEffect(() => {
    // Get image URL from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const img = urlParams.get('image');
    if (img) {
      setImageUrl(decodeURIComponent(img));
    }
  }, []);

  const generateIdeas = async () => {
    if (!userInput.trim()) {
      alert('Please describe what kind of TikTok post you want');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a TikTok content strategist. Analyze this image and create TikTok post ideas.

User wants: ${userInput}

${imageUrl ? "An image has been provided as reference." : "No image provided - create general ideas."}

Generate a comprehensive TikTok strategy with:
1. Hook (first 3 seconds) - attention-grabbing opening
2. Main Content - what to show/say
3. Call to Action - what you want viewers to do
4. Hashtag Strategy - trending and niche hashtags
5. Sound Suggestion - what music/audio to use
6. Best Posting Time - when to post for maximum reach
7. Caption - engaging caption text

Format as JSON.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            hook: { type: "string" },
            main_content: { type: "string" },
            call_to_action: { type: "string" },
            hashtags: { type: "array", items: { type: "string" } },
            sound_suggestion: { type: "string" },
            best_time: { type: "string" },
            caption: { type: "string" },
            viral_tips: { type: "array", items: { type: "string" } }
          }
        },
        ...(imageUrl && { file_urls: [imageUrl] })
      });

      setIdeas(response);
    } catch (err) {
      console.error('Failed to generate ideas:', err);
      alert('Failed to generate ideas: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* TikTok Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-[#25F4EE]/5 to-[#FE2C55]/5" />
      
      {/* Animated Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-gradient-to-r from-[#25F4EE] to-[#FE2C55] rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0
            }}
            animate={{
              y: [null, Math.random() * window.innerHeight],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>

      <div className="relative z-10 p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(createPageUrl('Feed'))}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Feed</span>
          </button>

          <div className="flex items-center gap-3">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <defs>
                <linearGradient id="tiktok-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#25F4EE" />
                  <stop offset="100%" stopColor="#FE2C55" />
                </linearGradient>
              </defs>
              <path 
                d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" 
                fill="url(#tiktok-grad)"
              />
            </svg>
            <div>
              <h1 className="text-2xl font-black text-white">TikTok Workflow</h1>
              <p className="text-sm text-white/60">AI-powered content strategy</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Image & Input */}
          <div className="space-y-6">
            {imageUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-3"
              >
                <h3 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                  <Video className="w-3 h-3 text-[#25F4EE]" />
                  Reference
                </h3>
                <img
                  src={imageUrl}
                  alt="Reference"
                  onClick={() => window.open(imageUrl, '_blank')}
                  className="w-full max-h-32 object-cover rounded-lg border border-white/10 cursor-pointer hover:opacity-80 transition-opacity"
                />
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-[#FE2C55]" />
                What kind of TikTok post do you want?
              </h3>
              
              <Textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="e.g., Viral dance trend, educational content, product showcase, comedy skit, transformation video..."
                className="bg-black/40 border-white/20 text-white placeholder:text-white/30 h-32 resize-none mb-4"
              />

              <Button
                onClick={generateIdeas}
                disabled={isGenerating || !userInput.trim()}
                className="w-full bg-gradient-to-r from-[#25F4EE] to-[#FE2C55] hover:from-[#25F4EE]/80 hover:to-[#FE2C55]/80 text-white font-bold h-12"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Strategy...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate TikTok Strategy
                  </>
                )}
              </Button>
            </motion.div>
          </div>

          {/* Right: Generated Ideas */}
          <div>
            {ideas ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                {/* Hook */}
                <div className="bg-white/5 backdrop-blur-xl border border-[#25F4EE]/30 rounded-2xl p-5">
                  <h4 className="text-[#25F4EE] font-bold mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Hook (First 3 Seconds)
                  </h4>
                  <p className="text-white/80 text-sm leading-relaxed">{ideas.hook}</p>
                </div>

                {/* Main Content */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                  <h4 className="text-white font-bold mb-2">Main Content</h4>
                  <p className="text-white/80 text-sm leading-relaxed">{ideas.main_content}</p>
                </div>

                {/* Call to Action */}
                <div className="bg-white/5 backdrop-blur-xl border border-[#FE2C55]/30 rounded-2xl p-5">
                  <h4 className="text-[#FE2C55] font-bold mb-2">Call to Action</h4>
                  <p className="text-white/80 text-sm leading-relaxed">{ideas.call_to_action}</p>
                </div>

                {/* Hashtags */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                  <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Hashtags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {ideas.hashtags?.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gradient-to-r from-[#25F4EE]/20 to-[#FE2C55]/20 border border-[#25F4EE]/30 rounded-full text-sm text-white/80"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Sound Suggestion */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                  <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    Sound Suggestion
                  </h4>
                  <p className="text-white/80 text-sm leading-relaxed">{ideas.sound_suggestion}</p>
                </div>

                {/* Best Time & Caption */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                    <h4 className="text-white font-bold mb-2 text-sm">Best Time</h4>
                    <p className="text-white/80 text-sm">{ideas.best_time}</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                    <h4 className="text-white font-bold mb-2 text-sm">Caption</h4>
                    <p className="text-white/80 text-sm line-clamp-3">{ideas.caption}</p>
                  </div>
                </div>

                {/* Viral Tips */}
                {ideas.viral_tips && ideas.viral_tips.length > 0 && (
                  <div className="bg-gradient-to-br from-[#25F4EE]/10 to-[#FE2C55]/10 border border-[#25F4EE]/30 rounded-2xl p-5">
                    <h4 className="text-[#25F4EE] font-bold mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Viral Tips
                    </h4>
                    <ul className="space-y-2">
                      {ideas.viral_tips.map((tip, idx) => (
                        <li key={idx} className="text-white/80 text-sm flex items-start gap-2">
                          <span className="text-[#FE2C55] font-bold">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-[#25F4EE]/20 to-[#FE2C55]/20 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
                    <defs>
                      <linearGradient id="tt-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#25F4EE" />
                        <stop offset="100%" stopColor="#FE2C55" />
                      </linearGradient>
                    </defs>
                    <path 
                      d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" 
                      fill="url(#tt-grad)"
                    />
                  </svg>
                </div>
                <h3 className="text-white/60 font-semibold mb-2">No ideas yet</h3>
                <p className="text-white/40 text-sm">Describe your TikTok concept and click Generate</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}