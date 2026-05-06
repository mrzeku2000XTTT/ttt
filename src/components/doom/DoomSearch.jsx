import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Loader2, CornerDownLeft } from "lucide-react";

const SUGGESTIONS = ["sugar", "loneliness", "the ocean", "AI", "sleep", "money", "the moon", "extinction"];

export default function DoomSearch({ onSearch, loading }) {
  const [value, setValue] = useState("");

  const submit = (q) => {
    const trimmed = (q ?? value).trim();
    if (!trimmed) return;
    onSearch(trimmed);
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Pulsing red glow */}
      <motion.div
        className="absolute inset-0 bg-gradient-radial from-red-950/40 via-black to-black pointer-events-none"
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md text-center"
      >
        <div className="text-red-500/80 text-[10px] font-bold tracking-[0.5em] uppercase mb-4">
          ▼ Doom Scroll ▼
        </div>
        <h1 className="text-white text-5xl sm:text-6xl font-serif tracking-tight mb-3">
          fall in.
        </h1>
        <p className="text-white/40 text-sm mb-10 font-light">
          Search anything. Spiral into it.
        </p>

        <form
          onSubmit={(e) => { e.preventDefault(); submit(); }}
          className="relative"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="enter a topic…"
            disabled={loading}
            autoFocus
            className="w-full h-14 pl-12 pr-28 bg-white/5 border border-white/10 rounded-full text-white text-base placeholder:text-white/20 focus:border-red-500/50 focus:bg-white/10 outline-none transition-all"
          />
          <button
            type="submit"
            disabled={loading || !value.trim()}
            className="group absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 h-10 px-3 rounded-lg bg-gradient-to-b from-zinc-700 to-zinc-900 hover:from-red-600 hover:to-red-900 border border-white/20 border-b-2 border-b-black/60 active:border-b active:translate-y-[calc(-50%+1px)] shadow-[0_2px_0_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.15)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Enter"
          >
            <span className="text-white text-[10px] font-bold tracking-wider uppercase">Enter</span>
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 text-red-400 animate-spin" />
            ) : (
              <CornerDownLeft className="w-3.5 h-3.5 text-white/80 group-hover:text-white" />
            )}
          </button>
        </form>

        <div className="flex flex-wrap justify-center gap-2 mt-8">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => { setValue(s); submit(s); }}
              disabled={loading}
              className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-white/60 hover:text-white text-xs transition-colors disabled:opacity-30"
            >
              {s}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}