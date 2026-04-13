import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, Paintbrush, Loader2, Download, Image as ImageIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { downloadImage } from "@/components/hikaru/hikaruDownload";

const QUICK_EDITS = [
  "Remove background",
  "Add cinematic color grading",
  "Convert to pencil sketch",
  "Add bokeh blur to background",
  "Make it look like a vintage photo",
  "Add snow/rain effect",
  "Convert to pop art style",
  "Add dramatic vignette",
];

export default function HikaruEditImage() {
  const [originalUrl, setOriginalUrl] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [editPrompt, setEditPrompt] = useState("");
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

  const applyEdit = async () => {
    if (!originalUrl || !editPrompt.trim()) return;
    setLoading(true);
    try {
      const res = await base44.integrations.Core.GenerateImage({
        prompt: `Edit this image: ${editPrompt}. Maintain the original composition and subject.`,
        existing_image_urls: [originalUrl],
      });
      setResultUrl(res.url);
      toast.success("Edit applied!");
    } catch (err) {
      toast.error("Edit failed: " + (err.message || "Try again"));
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-white font-bold text-lg mb-1">Edit Image</h2>
        <p className="text-white/30 text-xs">Transform images with AI-powered editing</p>
      </motion.div>

      {!originalUrl ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => fileRef.current?.click()}
          className="relative border-2 border-dashed border-white/[0.1] hover:border-emerald-500/30 rounded-2xl p-16 flex flex-col items-center justify-center cursor-pointer transition-all group"
        >
          <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          {uploading ? (
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
              <Upload className="w-7 h-7 text-emerald-400" />
            </div>
          )}
          <p className="text-white/50 text-sm font-medium mb-1">Upload an image to edit</p>
          <p className="text-white/20 text-xs">PNG, JPG, WebP supported</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/[0.08] overflow-hidden bg-white/[0.02]">
              <div className="px-3 py-2 border-b border-white/[0.06]">
                <span className="text-white/40 text-[10px] uppercase tracking-widest font-semibold">Original</span>
              </div>
              <img src={originalUrl} alt="Original" className="w-full" />
            </div>
            <div className="rounded-2xl border border-white/[0.08] overflow-hidden bg-white/[0.02]">
              <div className="px-3 py-2 border-b border-white/[0.06]">
                <span className="text-emerald-400/60 text-[10px] uppercase tracking-widest font-semibold">Edited</span>
              </div>
              {resultUrl ? (
                <img src={resultUrl} alt="Edited" className="w-full" />
              ) : (
                <div className="aspect-square flex items-center justify-center bg-white/[0.01]">
                  <ImageIcon className="w-10 h-10 text-white/10" />
                </div>
              )}
            </div>
          </div>

          {/* Quick edits */}
          <div>
            <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold mb-2">Quick Edits</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_EDITS.map(q => (
                <button
                  key={q}
                  onClick={() => setEditPrompt(q)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    editPrompt === q
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                      : "bg-white/[0.03] border-white/[0.06] text-white/40 hover:border-white/15"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Custom edit */}
          <div>
            <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold mb-2">Or describe your edit</p>
            <input
              value={editPrompt}
              onChange={e => setEditPrompt(e.target.value)}
              placeholder="e.g., Replace the sky with a starry night..."
              className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={applyEdit}
              disabled={loading || !editPrompt.trim()}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-30 shadow-lg shadow-emerald-500/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paintbrush className="w-4 h-4" />}
              {loading ? "Editing..." : "Apply Edit"}
            </button>
            {resultUrl && (
              <button
                onClick={() => downloadImage(resultUrl, "hikaru-edited.png")}
                className="px-4 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/60 hover:text-white font-bold text-sm flex items-center gap-2 transition-colors">
                <Download className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => { setOriginalUrl(null); setResultUrl(null); setEditPrompt(""); }}
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