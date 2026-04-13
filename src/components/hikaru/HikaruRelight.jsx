import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, Sun, Loader2, Download, RotateCcw, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { downloadImage } from "@/components/hikaru/hikaruDownload";

const DEFAULT_FILTERS = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  warmth: 0,    // -100 to 100 (mapped to sepia + hue-rotate)
  exposure: 0,  // -50 to 50 (extra brightness boost)
  shadows: 0,   // 0 to 100 (invert partial for shadow lift)
};

const PRESETS = [
  { label: "Original", filters: { ...DEFAULT_FILTERS } },
  { label: "Warm Sunset", filters: { brightness: 105, contrast: 110, saturate: 120, warmth: 40, exposure: 5, shadows: 0 } },
  { label: "Cool Blue", filters: { brightness: 95, contrast: 115, saturate: 90, warmth: -50, exposure: 0, shadows: 10 } },
  { label: "Dramatic", filters: { brightness: 90, contrast: 140, saturate: 110, warmth: 10, exposure: -10, shadows: 0 } },
  { label: "Soft Glow", filters: { brightness: 115, contrast: 85, saturate: 95, warmth: 15, exposure: 10, shadows: 20 } },
  { label: "Neon Night", filters: { brightness: 85, contrast: 130, saturate: 150, warmth: -30, exposure: -5, shadows: 0 } },
  { label: "Vintage Film", filters: { brightness: 95, contrast: 90, saturate: 75, warmth: 35, exposure: 0, shadows: 15 } },
  { label: "High Key", filters: { brightness: 125, contrast: 80, saturate: 90, warmth: 5, exposure: 15, shadows: 30 } },
];

const SLIDERS = [
  { key: "brightness", label: "Brightness", min: 50, max: 150, unit: "%" },
  { key: "contrast", label: "Contrast", min: 50, max: 200, unit: "%" },
  { key: "saturate", label: "Saturation", min: 0, max: 200, unit: "%" },
  { key: "warmth", label: "Warmth", min: -100, max: 100, unit: "" },
  { key: "exposure", label: "Exposure", min: -50, max: 50, unit: "" },
  { key: "shadows", label: "Shadow Lift", min: 0, max: 100, unit: "" },
];

function buildCssFilter(f) {
  const parts = [];
  const totalBrightness = f.brightness + f.exposure;
  parts.push(`brightness(${totalBrightness}%)`);
  parts.push(`contrast(${f.contrast}%)`);
  parts.push(`saturate(${f.saturate}%)`);
  if (f.warmth > 0) {
    parts.push(`sepia(${Math.min(f.warmth, 60)}%)`);
    parts.push(`hue-rotate(-${Math.round(f.warmth * 0.1)}deg)`);
  } else if (f.warmth < 0) {
    parts.push(`hue-rotate(${Math.round(Math.abs(f.warmth) * 0.2)}deg)`);
    parts.push(`saturate(${Math.max(80, 100 + f.warmth * 0.3)}%)`);
  }
  if (f.shadows > 0) {
    parts.push(`brightness(${100 + f.shadows * 0.15}%)`);
  }
  return parts.join(" ");
}

export default function HikaruRelight() {
  const [originalUrl, setOriginalUrl] = useState(null);
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResultUrl, setAiResultUrl] = useState(null);
  const fileRef = useRef(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setAiResultUrl(null);
    setFilters({ ...DEFAULT_FILTERS });
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setOriginalUrl(file_url);
      toast.success("Image uploaded!");
    } catch {
      toast.error("Upload failed");
    }
    setUploading(false);
  };

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: Number(value) }));
  }, []);

  const applyPreset = useCallback((preset) => {
    setFilters({ ...preset.filters });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS });
  }, []);

  // Export with filters baked into canvas
  const exportImage = useCallback(() => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.filter = buildCssFilter(filters);
    ctx.drawImage(img, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "hikaru-relit.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Downloaded!");
    }, "image/png");
  }, [filters]);

  // AI Relight — uses the LLM image generation for dramatic relighting
  const aiRelight = async (description) => {
    if (!originalUrl) return;
    setAiLoading(true);
    try {
      const res = await base44.integrations.Core.GenerateImage({
        prompt: `Relight this photo with ${description}. Keep the subject, pose, and composition identical. Only change the lighting direction, color, and intensity.`,
        existing_image_urls: [originalUrl],
      });
      setAiResultUrl(res.url);
      toast.success("AI Relight applied!");
    } catch (err) {
      toast.error("AI Relight failed: " + (err.message || "Try again"));
    }
    setAiLoading(false);
  };

  const cssFilter = buildCssFilter(filters);
  const isModified = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-white font-bold text-lg mb-1">Relight</h2>
        <p className="text-white/30 text-xs">Real-time lighting controls + AI relighting</p>
      </motion.div>

      {!originalUrl ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => fileRef.current?.click()}
          className="relative border-2 border-dashed border-white/[0.1] hover:border-amber-500/30 rounded-2xl p-16 flex flex-col items-center justify-center cursor-pointer transition-all group"
        >
          <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          {uploading ? (
            <Loader2 className="w-10 h-10 text-amber-400 animate-spin mb-4" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
              <Upload className="w-7 h-7 text-amber-400" />
            </div>
          )}
          <p className="text-white/50 text-sm font-medium mb-1">Upload an image to relight</p>
          <p className="text-white/20 text-xs">PNG, JPG, WebP supported</p>
        </motion.div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Image preview */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="rounded-2xl border border-white/[0.08] overflow-hidden bg-black">
              <div className="px-3 py-2 border-b border-white/[0.06] flex items-center justify-between">
                <span className="text-amber-400/60 text-[10px] uppercase tracking-widest font-semibold">
                  {aiResultUrl ? "AI Relit" : "Live Preview"}
                </span>
                {isModified && !aiResultUrl && (
                  <span className="text-amber-400/40 text-[9px]">Modified</span>
                )}
              </div>
              {aiResultUrl ? (
                <img src={aiResultUrl} alt="AI Relit" className="w-full" />
              ) : (
                <img
                  ref={imgRef}
                  src={originalUrl}
                  alt="Preview"
                  className="w-full transition-all duration-150"
                  style={{ filter: cssFilter }}
                  crossOrigin="anonymous"
                />
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={aiResultUrl ? () => downloadImage(aiResultUrl, "hikaru-ai-relit.png") : exportImage}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </button>
              {aiResultUrl && (
                <button
                  onClick={() => setAiResultUrl(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white/60 text-xs font-medium transition-colors"
                >
                  Back to Sliders
                </button>
              )}
              <button
                onClick={() => { setOriginalUrl(null); setAiResultUrl(null); resetFilters(); }}
                className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white/60 text-xs font-medium transition-colors"
              >
                New Image
              </button>
            </div>
          </div>

          {/* Controls panel */}
          <div className="w-full lg:w-72 flex-shrink-0 space-y-5">
            {/* Real-time sliders */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white/70 text-xs font-bold uppercase tracking-widest">Lighting Controls</h3>
                <button onClick={resetFilters} className="text-white/20 hover:text-white/50 transition-colors" title="Reset">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {SLIDERS.map(s => (
                <div key={s.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/40 text-[10px] font-medium">{s.label}</span>
                    <span className="text-white/50 text-[10px] font-mono">{filters[s.key]}{s.unit}</span>
                  </div>
                  <input
                    type="range"
                    min={s.min}
                    max={s.max}
                    value={filters[s.key]}
                    onChange={e => updateFilter(s.key, e.target.value)}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/10 accent-amber-500"
                  />
                </div>
              ))}
            </div>

            {/* Presets */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
              <h3 className="text-white/70 text-xs font-bold uppercase tracking-widest">Presets</h3>
              <div className="grid grid-cols-2 gap-1.5">
                {PRESETS.map((p, i) => {
                  const isActive = JSON.stringify(filters) === JSON.stringify(p.filters);
                  return (
                    <button
                      key={i}
                      onClick={() => applyPreset(p)}
                      className={`px-2.5 py-2 rounded-lg text-[10px] font-medium border transition-all ${
                        isActive
                          ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                          : "bg-white/[0.03] border-white/[0.06] text-white/40 hover:border-white/15 hover:text-white/60"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Relight */}
            <div className="rounded-2xl border border-purple-500/15 bg-purple-500/[0.04] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="text-purple-300 text-xs font-bold uppercase tracking-widest">AI Relight</h3>
              </div>
              <p className="text-white/25 text-[10px] leading-relaxed">Use AI to dramatically change the lighting source, direction, and mood.</p>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { label: "🌅 Golden Hour", desc: "warm golden sunset light from the left" },
                  { label: "🌙 Moonlit", desc: "cool silvery moonlight with deep blue shadows" },
                  { label: "💜 Neon Rim", desc: "neon purple and cyan rim lighting, cyberpunk" },
                  { label: "🔥 Firelight", desc: "warm flickering firelight from below, cozy amber glow" },
                  { label: "⚡ Studio Flash", desc: "professional studio strobe, crisp even lighting, white background" },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => aiRelight(item.desc)}
                    disabled={aiLoading}
                    className="px-3 py-2 rounded-lg text-[10px] font-medium text-left bg-white/[0.03] border border-white/[0.06] text-white/50 hover:border-purple-500/30 hover:text-purple-300 transition-all disabled:opacity-30"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {aiLoading && (
                <div className="flex items-center justify-center gap-2 py-2">
                  <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                  <span className="text-purple-300/60 text-[10px]">AI processing...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}