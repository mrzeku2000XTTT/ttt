import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Loader2, RotateCcw } from "lucide-react";

export default function ImaginePortalPrompt({ open, onClose, onGenerate, loading, hasCustom, onRestore, remaining }) {
  const [prompt, setPrompt] = useState("");

  const submit = () => {
    if (!prompt.trim() || loading || remaining <= 0) return;
    onGenerate(prompt.trim());
    setPrompt("");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-[90%] max-w-md"
        >
          <div
            className="rounded-3xl bg-black/85 backdrop-blur-2xl ring-2 ring-purple-400/60 p-6 shadow-2xl"
            style={{ boxShadow: "0 0 60px rgba(168,85,247,0.4)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-purple-300">
                  Imagine Portal
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-white text-2xl font-[900] tracking-tight mb-1">Reshape this room</h3>
            <p className="text-white/60 text-sm mb-4">
              Describe a world. The room will rewrite itself frame by frame.
            </p>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
              placeholder="e.g. neon Tokyo at night, cyberpunk rain"
              rows={3}
              disabled={loading}
              className="w-full bg-white/5 ring-1 ring-white/10 focus:ring-purple-400/60 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/30 outline-none resize-none transition-all"
            />

            <div className="flex items-center justify-between mt-2 mb-4">
              <span className="text-[10px] text-white/40 tracking-wider uppercase">
                {remaining > 0 ? `${remaining} portal${remaining === 1 ? "" : "s"} left` : "limit reached this session"}
              </span>
              {hasCustom && (
                <button
                  onClick={onRestore}
                  disabled={loading}
                  className="flex items-center gap-1 text-[10px] text-cyan-300 hover:text-cyan-200 tracking-wider uppercase"
                >
                  <RotateCcw className="w-3 h-3" />
                  Restore Original
                </button>
              )}
            </div>

            <button
              onClick={submit}
              disabled={loading || !prompt.trim() || remaining <= 0}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Summoning world...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate 360°
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}