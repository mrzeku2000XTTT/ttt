import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, ZoomIn, Loader2, Download, Image as ImageIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function HikaruUpscaler() {
  const [originalUrl, setOriginalUrl] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
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
    } catch (err) {
      toast.error("Upload failed");
    }
    setUploading(false);
  };

  const upscale = async () => {
    if (!originalUrl) return;
    setLoading(true);
    try {
      const res = await base44.integrations.Core.GenerateImage({
        prompt: "Enhance this image to higher resolution, sharper details, better quality, upscale 4x, preserve original content exactly",
        existing_image_urls: [originalUrl],
      });
      setResultUrl(res.url);
      toast.success("Image upscaled!");
    } catch (err) {
      toast.error("Upscale failed: " + (err.message || "Try again"));
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-white font-bold text-lg mb-1">Upscaler</h2>
        <p className="text-white/30 text-xs">Enhance resolution and quality of any image</p>
      </motion.div>

      {!originalUrl ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => fileRef.current?.click()}
          className="relative border-2 border-dashed border-white/[0.1] hover:border-cyan-500/30 rounded-2xl p-16 flex flex-col items-center justify-center cursor-pointer transition-all group"
        >
          <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          {uploading ? (
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors">
              <Upload className="w-7 h-7 text-cyan-400" />
            </div>
          )}
          <p className="text-white/50 text-sm font-medium mb-1">Upload an image to upscale</p>
          <p className="text-white/20 text-xs">PNG, JPG, WebP supported</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Original */}
            <div className="rounded-2xl border border-white/[0.08] overflow-hidden bg-white/[0.02]">
              <div className="px-3 py-2 border-b border-white/[0.06]">
                <span className="text-white/40 text-[10px] uppercase tracking-widest font-semibold">Original</span>
              </div>
              <img src={originalUrl} alt="Original" className="w-full" />
            </div>

            {/* Result */}
            <div className="rounded-2xl border border-white/[0.08] overflow-hidden bg-white/[0.02]">
              <div className="px-3 py-2 border-b border-white/[0.06]">
                <span className="text-cyan-400/60 text-[10px] uppercase tracking-widest font-semibold">Enhanced</span>
              </div>
              {resultUrl ? (
                <img src={resultUrl} alt="Upscaled" className="w-full" />
              ) : (
                <div className="aspect-square flex items-center justify-center bg-white/[0.01]">
                  <ImageIcon className="w-10 h-10 text-white/10" />
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={upscale}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-30 shadow-lg shadow-cyan-500/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ZoomIn className="w-4 h-4" />}
              {loading ? "Enhancing..." : "Upscale Image"}
            </button>
            {resultUrl && (
              <a
                href={resultUrl}
                download="hikaru-upscaled.png"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/60 hover:text-white font-bold text-sm flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={() => { setOriginalUrl(null); setResultUrl(null); }}
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