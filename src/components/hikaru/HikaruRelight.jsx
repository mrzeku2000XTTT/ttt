import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, Sun, Loader2, Download, Image as ImageIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const LIGHTING_PRESETS = [
  { label: "Warm Sunset", prompt: "warm golden sunset lighting from the left, soft amber glow, golden hour" },
  { label: "Cool Blue", prompt: "cool blue studio lighting, crisp shadows, professional cool tone" },
  { label: "Dramatic", prompt: "dramatic high contrast lighting, deep shadows, cinematic Rembrandt lighting" },
  { label: "Soft Natural", prompt: "soft natural diffused daylight, even illumination, gentle shadows" },
  { label: "Neon Glow", prompt: "neon purple and cyan rim lighting, cyberpunk aesthetic, vibrant glow" },
  { label: "Studio Ring", prompt: "professional ring light, even face illumination, bright catchlights in eyes" },
];

export default function HikaruRelight() {
  const [originalUrl, setOriginalUrl] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setResultUrl(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setOriginalUrl(file_url);
      toast.success("Image uploaded!");
    } catch {
      toast.error("Upload failed");
    }
    setUploading(false);
  };

  const applyRelight = async () => {
    if (!originalUrl) return;
    const lightingDesc = selectedPreset ? LIGHTING_PRESETS[selectedPreset].prompt : customPrompt;
    if (!lightingDesc) { toast.error("Select a lighting preset or describe custom lighting"); return; }
    setLoading(true);
    try {
      const res = await base44.integrations.Core.GenerateImage({
        prompt: `Relight this image with ${lightingDesc}. Keep the subject, pose, and composition exactly the same. Only change the lighting.`,
        existing_image_urls: [originalUrl],
      });
      setResultUrl(res.url);
      toast.success("Relighting applied!");
    } catch (err) {
      toast.error("Relight failed: " + (err.message || "Try again"));
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-white font-bold text-lg mb-1">Relight</h2>
        <p className="text-white/30 text-xs">Control lighting angle, warmth, and intensity</p>
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
        <div className="space-y-4">
          {/* Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/[0.08] overflow-hidden bg-white/[0.02]">
              <div className="px-3 py-2 border-b border-white/[0.06]">
                <span className="text-white/40 text-[10px] uppercase tracking-widest font-semibold">Original</span>
              </div>
              <img src={originalUrl} alt="Original" className="w-full" />
            </div>
            <div className="rounded-2xl border border-white/[0.08] overflow-hidden bg-white/[0.02]">
              <div className="px-3 py-2 border-b border-white/[0.06]">
                <span className="text-amber-400/60 text-[10px] uppercase tracking-widest font-semibold">Relit</span>
              </div>
              {resultUrl ? (
                <img src={resultUrl} alt="Relit" className="w-full" />
              ) : (
                <div className="aspect-square flex items-center justify-center bg-white/[0.01]">
                  <Sun className="w-10 h-10 text-white/10" />
                </div>
              )}
            </div>
          </div>

          {/* Presets */}
          <div>
            <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold mb-2">Lighting Presets</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {LIGHTING_PRESETS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => { setSelectedPreset(i); setCustomPrompt(""); }}
                  className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition-all text-left ${
                    selectedPreset === i
                      ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                      : "bg-white/[0.03] border-white/[0.06] text-white/40 hover:border-white/15"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom prompt */}
          <div>
            <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold mb-2">Or describe custom lighting</p>
            <input
              value={customPrompt}
              onChange={e => { setCustomPrompt(e.target.value); setSelectedPreset(null); }}
              placeholder="e.g., soft pink backlight from the right..."
              className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-amber-500/40 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={applyRelight}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-30 shadow-lg shadow-amber-500/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sun className="w-4 h-4" />}
              {loading ? "Applying..." : "Apply Relight"}
            </button>
            {resultUrl && (
              <a href={resultUrl} download target="_blank" rel="noopener noreferrer"
                className="px-4 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/60 hover:text-white font-bold text-sm flex items-center gap-2 transition-colors">
                <Download className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={() => { setOriginalUrl(null); setResultUrl(null); setSelectedPreset(null); }}
              className="px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white/60 text-sm font-medium transition-colors"
            >
              New
            </button>
          </div>
        </div>
      )}
    </div>
  );
}