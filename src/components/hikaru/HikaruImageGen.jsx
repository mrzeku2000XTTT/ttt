import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Download, Copy, Check, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { downloadImage } from "@/components/hikaru/hikaruDownload";

const STYLES = ["Photorealistic", "Anime", "Oil Painting", "3D Render", "Watercolor", "Pixel Art", "Cinematic", "Concept Art"];

export default function HikaruImageGen() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const fullPrompt = style ? `${prompt}, ${style} style, high quality, detailed` : `${prompt}, high quality, detailed`;
      const res = await base44.integrations.Core.GenerateImage({ prompt: fullPrompt });
      console.log("[Hikaru] GenerateImage response:", res);
      const url = res?.url || res?.data?.url || res?.image_url || (typeof res === "string" ? res : null);
      if (!url) throw new Error("No image URL returned");
      setResult(url);
      toast.success("Image generated!");
    } catch (err) {
      console.error("[Hikaru] Generation error:", err);
      toast.error("Generation failed: " + (err.message || "Try again"));
    }
    setLoading(false);
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-white font-bold text-lg mb-1">Generate Image</h2>
        <p className="text-white/30 text-xs">Describe what you want to create</p>
      </motion.div>

      {/* Prompt area */}
      <div className="space-y-3">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="A majestic dragon flying over a cyberpunk city at sunset..."
            rows={4}
            className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-purple-500/40 rounded-2xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none resize-none transition-colors"
          />
          <button onClick={copyPrompt} className="absolute top-3 right-3 text-white/20 hover:text-white/50 transition-colors">
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Style selector */}
        <div>
          <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold mb-2">Style</p>
          <div className="flex flex-wrap gap-2">
            {STYLES.map(s => (
              <button
                key={s}
                onClick={() => setStyle(style === s ? "" : s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  style === s
                    ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                    : "bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white/60 hover:border-white/15"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={generate}
          disabled={loading || !prompt.trim()}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "Generating..." : "Generate"}
        </button>
      </div>

      {/* Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/[0.08] overflow-hidden bg-white/[0.02]"
        >
          <img src={result} alt="Generated" className="w-full" />
          <div className="p-4 flex items-center justify-between">
            <p className="text-white/40 text-xs truncate flex-1 mr-4">{prompt}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadImage(result, "hikaru-generated.png")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/60 hover:text-white text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </button>
              <button
                onClick={() => { setResult(null); generate(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/15 border border-purple-500/25 text-purple-300 text-xs font-medium hover:bg-purple-500/25 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Regenerate
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Loader2 className="w-7 h-7 text-purple-400 animate-spin" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-purple-500/20 animate-ping" />
          </div>
          <p className="text-white/30 text-xs">Creating your masterpiece...</p>
        </div>
      )}
    </div>
  );
}