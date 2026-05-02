import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Loader2, Wand2, ImageIcon, Upload } from "lucide-react";
import { OVERLAY_PRESETS, OVERLAY_CATEGORIES } from "./overlayPresets";
import { base44 } from "@/api/base44Client";

/**
 * Mobile-first bottom sheet (desktop: centered modal) for picking an overlay.
 * Two tabs:
 *   1. "Library" — preset SVG shapes (arrows/buttons/badges/etc)
 *   2. "AI Image" — generate a transparent PNG via base44 GenerateImage
 * Calls onPickPreset(preset) or onPickImage({ url }).
 */
export default function OverlayPicker({ open, onClose, onPickPreset, onPickImage }) {
  const [tab, setTab] = useState("library");
  const [category, setCategory] = useState("all");
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const filtered = OVERLAY_PRESETS.filter(
    (p) => category === "all" || p.category === category
  );

  const generate = async () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    try {
      const fullPrompt = `${prompt.trim()}. Isolated subject on a fully transparent background, no scene, no shadow on the floor, sticker style, crisp edges, high contrast, suitable for layering on top of a screenshot.`;
      const res = await base44.integrations.Core.GenerateImage({ prompt: fullPrompt });
      if (res?.url) setPreviewUrl(res.url);
    } catch (e) {
      alert("Generate failed: " + e.message);
    }
    setGenerating(false);
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (file_url) setPreviewUrl(file_url);
    } catch (err) {
      alert("Upload failed: " + err.message);
    }
    setUploading(false);
  };

  const usePreview = () => {
    if (!previewUrl) return;
    onPickImage({ url: previewUrl });
    setPreviewUrl(null);
    setPrompt("");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            className="fixed inset-x-0 bottom-0 z-[71] sm:inset-x-auto sm:left-1/2 sm:bottom-auto sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[640px] sm:max-w-[92vw] bg-zinc-950 border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col"
            style={{
              maxHeight: "85vh",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            {/* Drag handle (mobile) */}
            <div className="flex justify-center pt-2 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h2 className="text-white font-black text-sm tracking-tight flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-fuchsia-400" /> Add Overlay
              </h2>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 px-3 pt-3">
              <button
                onClick={() => setTab("library")}
                className={`flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-bold transition-colors ${
                  tab === "library"
                    ? "bg-white text-black"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" /> Library
              </button>
              <button
                onClick={() => setTab("ai")}
                className={`flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-bold transition-colors ${
                  tab === "ai"
                    ? "bg-gradient-to-r from-fuchsia-500 to-orange-500 text-white"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" /> AI Image
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4">
              {tab === "library" ? (
                <>
                  {/* Categories */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 mb-3">
                    {OVERLAY_CATEGORIES.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setCategory(c.id)}
                        className={`flex-shrink-0 px-3 h-7 rounded-full text-[11px] font-bold transition-colors ${
                          category === c.id
                            ? "bg-cyan-400 text-black"
                            : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>

                  {/* Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {filtered.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { onPickPreset(p); onClose(); }}
                        className="group aspect-square rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/50 p-3 flex flex-col items-center justify-center gap-1 transition-all"
                        title={p.label}
                      >
                        <div
                          className="w-full flex-1 flex items-center justify-center pointer-events-none"
                          dangerouslySetInnerHTML={{ __html: p.svg(p.color) }}
                        />
                        <div className="text-[9px] font-bold text-white/60 truncate w-full text-center">
                          {p.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe an overlay…  e.g. 'gold trophy', 'pink heart', 'cute robot mascot'"
                    rows={3}
                    style={{ fontSize: "16px" }}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 focus:border-fuchsia-400 rounded-lg text-white outline-none resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={generate}
                      disabled={generating || !prompt.trim()}
                      className="flex-1 flex items-center justify-center gap-1.5 h-11 rounded-lg bg-gradient-to-r from-fuchsia-500 to-orange-500 hover:opacity-90 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-fuchsia-500/30"
                    >
                      {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {generating ? "Generating…" : "Generate"}
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      onChange={handleUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-1.5 h-11 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold disabled:opacity-40"
                      title="Upload your own"
                    >
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    </button>
                  </div>

                  {previewUrl ? (
                    <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-2">
                      <div className="aspect-square w-full bg-[linear-gradient(45deg,#222_25%,transparent_25%),linear-gradient(-45deg,#222_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#222_75%),linear-gradient(-45deg,transparent_75%,#222_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0] rounded-lg overflow-hidden flex items-center justify-center">
                        <img src={previewUrl} alt="preview" className="max-w-full max-h-full object-contain" />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPreviewUrl(null)}
                          className="flex-1 h-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-xs font-bold"
                        >
                          Discard
                        </button>
                        <button
                          onClick={usePreview}
                          className="flex-1 h-9 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-bold"
                        >
                          Add to Canvas
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-white/[0.02] border border-dashed border-white/10 p-6 text-center text-white/40 text-xs">
                      <ImageIcon className="w-6 h-6 mx-auto mb-2 opacity-50" />
                      Generate or upload to see a preview here.
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}