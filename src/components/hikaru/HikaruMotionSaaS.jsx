import React, { useState } from "react";
import { motion } from "framer-motion";
import { Film, Loader2, ExternalLink, Copy, Check, Sparkles, Download } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { downloadImage } from "@/components/hikaru/hikaruDownload";

const STYLE_PRESETS = [
  "Apple-style SaaS launch",
  "Dark fintech dashboard",
  "AI productivity app",
  "Neon cyber SaaS",
  "Clean B2B product demo",
  "Glassmorphism analytics"
];

const MOTION_CHAINS = {
  "Apple-style SaaS launch": "slide-in-left,zoomin,showcase,float",
  "Dark fintech dashboard": "reveal,zoomin,barrel,showcase",
  "AI productivity app": "pop,chat-zoom,typewriter-zoom,float",
  "Neon cyber SaaS": "drop-in,zigzag,swoop,shake",
  "Clean B2B product demo": "slide-up,reveal,zoomin,float",
  "Glassmorphism analytics": "pop,tilt-up,showcase,float"
};

export default function HikaruMotionSaaS() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState(STYLE_PRESETS[0]);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setPlan(null);
    setPreviewUrl(null);

    try {
      const animationPlan = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a concise motion SaaS animation plan for Hikaru AI. User idea: "${prompt}". Style: ${style}. Output should be suitable for a 6-second animated SaaS hero/product demo in a mockup editor. Include punchy headline text, product UI visual description, background prompt, and motion direction.`,
        response_json_schema: {
          type: "object",
          properties: {
            headline: { type: "string" },
            subheadline: { type: "string" },
            ui_prompt: { type: "string" },
            background_prompt: { type: "string" },
            motion_notes: { type: "string" },
            device: { type: "string", enum: ["browser", "macbook", "iphone"] }
          },
          required: ["headline", "ui_prompt", "background_prompt", "motion_notes", "device"]
        }
      });

      const imagePrompt = `Premium SaaS product UI hero frame, ${animationPlan.ui_prompt}. ${style}. Polished dashboard/app interface, cinematic lighting, clean composition, no text, no watermark, high-end product launch visual.`;
      const imageRes = await base44.integrations.Core.GenerateImage({ prompt: imagePrompt });
      const imageUrl = imageRes?.url || imageRes?.data?.url || imageRes?.image_url || null;

      setPlan(animationPlan);
      setPreviewUrl(imageUrl);
      toast.success("Motion SaaS animation plan ready");
    } catch (err) {
      console.error("[Hikaru Motion SaaS] error:", err);
      toast.error("Motion generation failed: " + (err.message || "Try again"));
    }

    setLoading(false);
  };

  const openInMotionEditor = () => {
    if (!plan) return;
    const params = new URLSearchParams({
      apply: "1",
      text: plan.headline,
      device: plan.device || "browser",
      background: "sunset",
      preset: "showcase",
      duration: "6",
      chain: MOTION_CHAINS[style] || "slide-in-left,zoomin,showcase,float",
      camera: "push-in",
      bg_prompt: plan.background_prompt || prompt
    });

    if (previewUrl) {
      params.set("media", previewUrl);
      params.set("media_type", "image");
    }

    window.open(`/UltraMock?${params.toString()}`, "_blank");
  };

  const copyPlan = () => {
    if (!plan) return;
    navigator.clipboard.writeText(`${plan.headline}\n${plan.subheadline || ""}\n\n${plan.motion_notes}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-2">
          <Film className="w-5 h-5 text-fuchsia-400" />
          <h2 className="text-white font-bold text-lg">Motion SaaS Animations</h2>
        </div>
        <p className="text-white/30 text-xs">Generate a SaaS motion concept, hero frame, and open it directly in the animation editor.</p>
      </motion.div>

      <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-4 sm:p-5 space-y-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the SaaS product animation: AI CRM dashboard, finance analytics launch, app onboarding flow..."
          rows={4}
          className="w-full bg-black/30 border border-white/[0.08] focus:border-fuchsia-500/40 rounded-2xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none resize-none transition-colors"
        />

        <div>
          <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold mb-2">Animation Style</p>
          <div className="flex flex-wrap gap-2">
            {STYLE_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => setStyle(preset)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  style === preset
                    ? "bg-fuchsia-500/20 border-fuchsia-500/40 text-fuchsia-200"
                    : "bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white/70 hover:border-white/15"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={generate}
          disabled={loading || !prompt.trim()}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-cyan-500 hover:from-fuchsia-500 hover:to-cyan-400 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-fuchsia-500/20"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "Generating Motion..." : "Generate Motion SaaS"}
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-14 gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center">
              <Loader2 className="w-7 h-7 text-fuchsia-300 animate-spin" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-fuchsia-500/20 animate-ping" />
          </div>
          <p className="text-white/30 text-xs">Designing SaaS motion frames...</p>
        </div>
      )}

      {plan && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-4"
        >
          <div className="rounded-3xl border border-white/[0.08] overflow-hidden bg-white/[0.02]">
            {previewUrl ? (
              <img src={previewUrl} alt="SaaS motion preview" className="w-full aspect-video object-cover" />
            ) : (
              <div className="aspect-video flex items-center justify-center text-white/25 text-xs">Preview image unavailable</div>
            )}
            <div className="p-4 flex flex-wrap gap-2 justify-between items-center">
              <p className="text-white/35 text-xs">Hero frame for the motion animation</p>
              {previewUrl && (
                <button
                  onClick={() => downloadImage(previewUrl, "hikaru-motion-saas.png")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/60 hover:text-white text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download Frame
                </button>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 space-y-4">
            <div>
              <p className="text-fuchsia-300 text-[10px] uppercase tracking-widest font-black mb-2">Animation Plan</p>
              <h3 className="text-white text-xl font-black leading-tight">{plan.headline}</h3>
              {plan.subheadline && <p className="text-white/45 text-sm mt-2">{plan.subheadline}</p>}
            </div>

            <div className="space-y-3 text-xs text-white/45 leading-relaxed">
              <div>
                <span className="text-white/70 font-bold">UI:</span> {plan.ui_prompt}
              </div>
              <div>
                <span className="text-white/70 font-bold">Motion:</span> {plan.motion_notes}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={openInMotionEditor}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white text-xs font-black hover:opacity-90 transition-opacity"
              >
                <ExternalLink className="w-4 h-4" /> Open Animation Editor
              </button>
              <button
                onClick={copyPlan}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/60 hover:text-white text-xs font-bold transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}