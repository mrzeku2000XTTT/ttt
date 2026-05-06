import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Loader2, X, Sparkles, Check, AlertCircle, ExternalLink, Image as ImageIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * UrlResearchModal
 * ----------------
 * User drops a URL → backend deep-researches it → returns 10 themed images
 * (hero, lifestyle, detail, texture, environment, abstract, product, mood,
 * palette, statement). User picks which ones to insert; each picked image
 * becomes an overlay item with its own [appearAt, disappearAt] timeline
 * window so they appear sequentially during playback.
 *
 * onInsertImages(images, mode) — called when user confirms. Mode is:
 *   - "timeline" → spread images sequentially across the duration
 *   - "stack"    → drop them all at the same time (no windows)
 */
export default function UrlResearchModal({ open, onClose, onInsertImages, currentDuration = 12 }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [research, setResearch] = useState(null);
  const [images, setImages] = useState([]);
  const [picked, setPicked] = useState({}); // { [index]: true }
  const [mode, setMode] = useState("timeline"); // "timeline" | "stack"

  const reset = () => {
    setUrl("");
    setLoading(false);
    setError(null);
    setResearch(null);
    setImages([]);
    setPicked({});
  };

  const close = () => {
    reset();
    onClose();
  };

  const handleResearch = async (e) => {
    e?.preventDefault();
    if (!url.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResearch(null);
    setImages([]);
    setPicked({});
    try {
      const res = await base44.functions.invoke("urlDeepResearchImages", { url: url.trim() });
      const data = res?.data;
      if (!data?.success) throw new Error(data?.error || "Research failed");
      setResearch(data.research || {});
      setImages(data.images || []);
      // Pre-select all by default — user can deselect ones they don't want
      const all = {};
      (data.images || []).forEach((_, i) => { all[i] = true; });
      setPicked(all);
    } catch (err) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const togglePick = (idx) => {
    setPicked((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const pickedCount = Object.values(picked).filter(Boolean).length;

  const handleInsert = () => {
    const selected = images.filter((_, i) => picked[i]);
    if (selected.length === 0) return;
    onInsertImages(selected, mode);
    close();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed inset-x-2 bottom-2 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[201] sm:w-[min(880px,92vw)] max-h-[92vh] sm:max-h-[88vh] bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-fuchsia-500/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 via-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <Globe className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-white font-black text-sm tracking-tight">URL → 10 Slide Images</div>
                  <div className="text-[10px] text-white/50">Deep research · AI-generated · drop into timeline</div>
                </div>
              </div>
              <button
                onClick={close}
                className="w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* URL input */}
              <form onSubmit={handleResearch} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://stripe.com  ·  apple.com/airpods  ·  any URL"
                    disabled={loading}
                    style={{ fontSize: "16px" }}
                    className="w-full h-11 pl-10 pr-3 bg-white/5 border border-white/10 focus:border-cyan-400/60 rounded-lg text-white outline-none disabled:opacity-50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!url.trim() || loading}
                  className="flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-violet-500/30 whitespace-nowrap"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Researching…</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Research & Generate</>
                  )}
                </button>
              </form>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 text-xs">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>{error}</div>
                </div>
              )}

              {/* Loading state */}
              {loading && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="aspect-square rounded-lg bg-white/5 border border-white/10 animate-pulse flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-white/20" />
                    </div>
                  ))}
                </div>
              )}

              {/* Research summary */}
              {research && !loading && (
                <div className="rounded-lg bg-white/5 border border-white/10 p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="text-white font-bold text-sm">{research.title}</div>
                    {research.brand_voice && (
                      <span className="text-[10px] uppercase tracking-widest text-cyan-300/80 font-bold">
                        {research.brand_voice}
                      </span>
                    )}
                  </div>
                  {research.summary && (
                    <p className="text-white/70 text-xs leading-relaxed mb-3">{research.summary}</p>
                  )}
                  <div className="flex items-center gap-3 flex-wrap">
                    {Array.isArray(research.palette) && research.palette.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider">Palette</span>
                        {research.palette.slice(0, 6).map((c, i) => (
                          <div
                            key={i}
                            className="w-5 h-5 rounded-md ring-1 ring-white/20"
                            style={{ background: c }}
                            title={c}
                          />
                        ))}
                      </div>
                    )}
                    {Array.isArray(research.keywords) && research.keywords.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {research.keywords.slice(0, 5).map((k, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/60">
                            {k}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Images grid */}
              {images.length > 0 && !loading && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] font-black uppercase tracking-widest text-white/50">
                      {pickedCount} / {images.length} picked
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          const all = {};
                          images.forEach((_, i) => { all[i] = true; });
                          setPicked(all);
                        }}
                        className="text-[10px] font-bold text-cyan-300 hover:text-cyan-200 px-2 py-1 rounded hover:bg-white/5"
                      >
                        All
                      </button>
                      <button
                        onClick={() => setPicked({})}
                        className="text-[10px] font-bold text-white/50 hover:text-white px-2 py-1 rounded hover:bg-white/5"
                      >
                        None
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
                    {images.map((img, i) => {
                      const isPicked = !!picked[i];
                      return (
                        <button
                          key={i}
                          onClick={() => togglePick(i)}
                          className={`relative group aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                            isPicked
                              ? "border-cyan-400 ring-2 ring-cyan-400/30 shadow-lg shadow-cyan-500/20"
                              : "border-white/10 hover:border-white/30"
                          }`}
                        >
                          <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                            <div className="text-white text-[10px] font-black uppercase tracking-wider truncate">
                              {img.label}
                            </div>
                            <div className="text-white/50 text-[9px] truncate">{img.role}</div>
                          </div>
                          {isPicked && (
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center shadow-lg">
                              <Check className="w-3 h-3 text-black" strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {images.length > 0 && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 px-4 sm:px-5 py-3 border-t border-white/10 bg-black/40">
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/5 border border-white/10">
                  <button
                    onClick={() => setMode("timeline")}
                    className={`flex-1 sm:flex-initial px-3 h-8 rounded-md text-[11px] font-bold transition-colors ${
                      mode === "timeline"
                        ? "bg-cyan-400 text-black shadow"
                        : "text-white/60 hover:text-white"
                    }`}
                    title="Spread images sequentially across the timeline duration"
                  >
                    🎞 Spread on timeline
                  </button>
                  <button
                    onClick={() => setMode("stack")}
                    className={`flex-1 sm:flex-initial px-3 h-8 rounded-md text-[11px] font-bold transition-colors ${
                      mode === "stack"
                        ? "bg-cyan-400 text-black shadow"
                        : "text-white/60 hover:text-white"
                    }`}
                    title="Drop all images on canvas at once (no windows)"
                  >
                    ▦ Stack on canvas
                  </button>
                </div>
                <button
                  onClick={handleInsert}
                  disabled={pickedCount === 0}
                  className="flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black text-sm shadow-lg shadow-violet-500/30"
                >
                  <Sparkles className="w-4 h-4" />
                  Insert {pickedCount} into editor
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}