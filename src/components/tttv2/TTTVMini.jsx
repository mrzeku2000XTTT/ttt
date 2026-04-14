import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Play, Search, Youtube, ChevronRight, Upload, X, Loader2, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function TTTVMini() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState("");

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

  const handleUpload = async () => {
    const q = uploadUrl.trim();
    if (!q) { setUploadError("Paste a YouTube URL"); return; }
    const vid = extractVideoId(q);
    if (!vid) { setUploadError("Invalid YouTube URL"); return; }
    if (!uploadTitle.trim()) { setUploadError("Enter a title"); return; }
    setUploading(true);
    setUploadError("");
    try {
      await base44.entities.CommunityVideo.create({
        youtube_url: q,
        video_id: vid,
        title: uploadTitle.trim(),
        section: "community",
      });
      setUploadSuccess(true);
      setTimeout(() => {
        setShowUpload(false);
        setUploadUrl("");
        setUploadTitle("");
        setUploadSuccess(false);
      }, 1500);
    } catch (err) {
      setUploadError(err.message || "Failed to upload");
    }
    setUploading(false);
  };

  return (
    <section id="tttv" className="py-20 sm:py-28 px-5 bg-gradient-to-b from-zinc-900 to-black text-white">
      <div className="max-w-5xl mx-auto text-center">
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

          {/* Actions */}
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            <Link to="/Browser">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 bg-cyan-500/10 px-6 py-2.5 rounded-full ring-1 ring-cyan-500/20 hover:ring-cyan-500/40 transition-all">
                <Search className="w-4 h-4" />
                Browse TTTV Library
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </Link>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-violet-400 bg-violet-500/10 px-6 py-2.5 rounded-full ring-1 ring-violet-500/20 hover:ring-violet-500/40 transition-all">
              <Upload className="w-4 h-4" />
              Upload Video
            </motion.button>
          </div>

          {/* KaSshi.io Embedded */}
          <div className="mt-10 max-w-5xl mx-auto">
            <div className="rounded-2xl overflow-hidden ring-1 ring-white/10 bg-black" style={{ aspectRatio: "16/9" }}>
              <iframe
                src="https://kasshi.io"
                title="KaSshi.io"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-2">Powered by KaSshi.io</p>
          </div>

          {/* Upload Modal */}
          <AnimatePresence>
            {showUpload && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
                onClick={() => { setShowUpload(false); setUploadError(""); }}
              >
                <motion.div
                  initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                  onClick={e => e.stopPropagation()}
                  className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md p-6"
                >
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-white">Upload a Video</h3>
                    <button onClick={() => { setShowUpload(false); setUploadError(""); }} className="text-white/40 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {uploadSuccess ? (
                    <div className="text-center py-8">
                      <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Check className="w-7 h-7 text-emerald-400" />
                      </div>
                      <p className="text-white font-semibold">Video uploaded!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-zinc-400 mb-1.5 block">YouTube URL</label>
                        <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2.5 ring-1 ring-white/10">
                          <Youtube className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <input
                            value={uploadUrl}
                            onChange={e => { setUploadUrl(e.target.value); setUploadError(""); }}
                            placeholder="https://youtube.com/watch?v=..."
                            className="flex-1 bg-transparent text-white text-sm outline-none placeholder-zinc-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-zinc-400 mb-1.5 block">Title</label>
                        <input
                          value={uploadTitle}
                          onChange={e => { setUploadTitle(e.target.value); setUploadError(""); }}
                          placeholder="Give this video a title…"
                          className="w-full bg-white/5 rounded-xl px-3 py-2.5 ring-1 ring-white/10 text-white text-sm outline-none placeholder-zinc-500"
                        />
                      </div>

                      {/* Preview */}
                      {uploadUrl && extractVideoId(uploadUrl.trim()) && (
                        <div className="rounded-xl overflow-hidden aspect-video bg-black">
                          <iframe
                            src={`https://www.youtube.com/embed/${extractVideoId(uploadUrl.trim())}`}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      )}

                      {uploadError && (
                        <p className="text-xs text-red-400">{uploadError}</p>
                      )}

                      <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="w-full h-11 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors"
                      >
                        {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> Upload Video</>}
                      </button>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}