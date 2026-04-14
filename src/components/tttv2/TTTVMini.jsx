import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Play, Search, Youtube, ChevronRight } from "lucide-react";

export default function TTTVMini() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");

  const extractVideoId = (input) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
      /(?:youtu\.be\/)([^&\n?#]+)/,
      /(?:youtube\.com\/embed\/)([^&\n?#]+)/,
      /(?:youtube\.com\/shorts\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];
    for (const p of patterns) {
      const m = input.match(p);
      if (m?.[1]) return m[1];
    }
    return null;
  };

  const handleGo = () => {
    const q = url.trim();
    if (!q) {
      navigate("/Browser");
      return;
    }
    const vid = extractVideoId(q);
    if (vid) {
      localStorage.setItem("tttv_mini_player", JSON.stringify({ videoId: vid, videoUrl: `https://www.youtube.com/embed/${vid}?autoplay=1`, url: q }));
    }
    navigate("/Browser");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleGo();
  };

  return (
    <section id="tttv" className="py-20 sm:py-28 px-5 bg-gradient-to-b from-zinc-900 to-black text-white">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-cyan-500 rounded-lg px-3 py-1.5 shadow-[0_0_20px_rgba(6,182,212,0.5)]">
              <span className="text-black font-[900] text-lg tracking-tight">TTTV</span>
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl font-[900] tracking-tight mb-3">Watch anything.</h2>
          <p className="text-zinc-400 text-sm max-w-md mx-auto mb-8">
            Paste a YouTube link and watch directly inside TTT — no ads, no distractions.
          </p>

          {/* Search / URL input */}
          <div className="flex items-center gap-2 max-w-xl mx-auto bg-white/5 backdrop-blur-sm rounded-2xl px-4 py-3 ring-1 ring-white/15 hover:ring-white/25 transition-all">
            <Youtube className="w-5 h-5 text-red-400 flex-shrink-0" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste YouTube URL or video ID…"
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder-zinc-500"
            />
            <button
              onClick={handleGo}
              className="flex-shrink-0 w-9 h-9 bg-cyan-500 hover:bg-cyan-400 rounded-xl flex items-center justify-center transition-colors"
            >
              <Play className="w-4 h-4 text-black ml-0.5" />
            </button>
          </div>

          {/* Browse link */}
          <div className="mt-6">
            <Link to="/Browser">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 bg-cyan-500/10 px-6 py-2.5 rounded-full ring-1 ring-cyan-500/20 hover:ring-cyan-500/40 transition-all">
                <Search className="w-4 h-4" />
                Browse TTTV Library
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}