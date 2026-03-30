import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wand2, Copy, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";

function ShimmerPlaceholder() {
  return (
    <div className="w-full aspect-square rounded-3xl overflow-hidden relative" style={{ background: "rgba(255,255,255,0.02)" }}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" style={{ animation: "shimmer 2s infinite" }} />
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

export default function SpeedImageGen() {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [copiedIdx, setCopiedIdx] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    setGenerating(true);
    try {
      const result = await base44.integrations.Core.GenerateImage({
        prompt: prompt,
      });
      setImageUrl(result.url);
    } catch (err) {
      console.error("Generation failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleGenerate} className="space-y-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image you want to generate... ultra-fast AI generation"
          className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 resize-none"
          rows="3"
        />
        <motion.button
          onClick={handleGenerate}
          disabled={generating || !prompt.trim()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl font-bold text-lg text-white relative overflow-hidden disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, rgba(0,180,255,0.3), rgba(124,58,237,0.3))",
            border: "1px solid rgba(0,180,255,0.4)",
            boxShadow: "0 0 40px rgba(0,180,255,0.15), inset 0 1px 0 rgba(255,255,255,0.1)"
          }}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <Wand2 className="w-5 h-5" />
            {generating ? "Generating..." : "Generate Image"}
          </span>
        </motion.button>
      </form>

      <AnimatePresence mode="wait">
        {generating ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ShimmerPlaceholder />
          </motion.div>
        ) : imageUrl ? (
          <motion.div key="image" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3">
            <img src={imageUrl} alt="Generated" className="w-full rounded-3xl object-cover border border-white/10" />
            <button
              onClick={() => {
                navigator.clipboard.writeText(imageUrl);
                setCopiedIdx(0);
                setTimeout(() => setCopiedIdx(null), 2000);
              }}
              className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-sm transition-colors flex items-center justify-center gap-2"
            >
              {copiedIdx === 0 ? (
                <><Check className="w-4 h-4" /> Copied</>
              ) : (
                <><Copy className="w-4 h-4" /> Copy URL</>
              )}
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}