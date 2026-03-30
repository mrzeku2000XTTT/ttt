import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wand2, Copy, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";

function AnimatedLoadingLogo() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const G = '#00f5a0', B = '#00b4ff', W = 'rgba(255,255,255,0.9)';
    let animId;

    function draw(t) {
      ctx.clearRect(0, 0, 200, 200);
      const cx = 100, cy = 100, R = 38;
      for (let i = 0; i < 3; i++) {
        const phase = (t * 0.8 + i / 3) * Math.PI * 2;
        const ox = Math.cos(phase) * 15, oy = Math.sin(phase) * 15;
        const a0 = i * Math.PI * 2 / 3 + t * 0.4;
        ctx.beginPath();
        for (let k = 0; k < 3; k++) {
          const a = a0 + k * Math.PI * 2 / 3;
          const px = cx + ox + Math.cos(a) * R, py = cy + oy + Math.sin(a) * R;
          k === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        const alpha = 0.6 + 0.25 * Math.sin(t * 1.5 + i);
        ctx.strokeStyle = i === 0 ? G : i === 1 ? B : W;
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = alpha;
        ctx.stroke();
        ctx.globalAlpha = alpha * 0.13;
        ctx.fillStyle = i === 0 ? G : i === 1 ? B : W;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    function loop(ts) {
      draw((ts || 0) / 1000);
      animId = requestAnimationFrame(loop);
    }
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return <canvas ref={canvasRef} width={200} height={200} style={{ width: 160, height: 160 }} />;
}

function ShimmerPlaceholder() {
  return (
    <div className="w-full aspect-square rounded-3xl overflow-hidden relative flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(0,45,100,0.2), rgba(100,0,150,0.1))" }}>
      <AnimatedLoadingLogo />
    </div>
  );
}

export default function SpeedImageGen() {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setError(null);
    setImageUrl(null);
    try {
      const result = await base44.integrations.Core.GenerateImage({ prompt });
      if (result?.url) {
        setImageUrl(result.url);
      } else {
        setError("No image returned. Please try again.");
      }
    } catch (err) {
      console.error("Generation failed:", err);
      setError("Generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe the image you want to generate..."
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
      </div>

      {error && (
        <div className="px-4 py-3 rounded-2xl text-red-400 text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
          {error}
        </div>
      )}

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
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-sm transition-colors flex items-center justify-center gap-2"
            >
              {copied ? (
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