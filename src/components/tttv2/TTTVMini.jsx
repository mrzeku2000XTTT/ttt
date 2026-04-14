import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Play, Search, Youtube, ChevronRight, Upload, X, Loader2, Check, Settings, Volume2, VolumeX } from "lucide-react";
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
  const [sideVideos, setSideVideos] = useState([null, null]); // [left, right]
  const [isAdmin, setIsAdmin] = useState(false);
  const [showSideEdit, setShowSideEdit] = useState(false);
  const [leftUrl, setLeftUrl] = useState("");
  const [rightUrl, setRightUrl] = useState("");
  const [savingSides, setSavingSides] = useState(false);
  const [leftMuted, setLeftMuted] = useState(true);
  const [rightMuted, setRightMuted] = useState(true);
  const [sectionVisible, setSectionVisible] = useState(false);
  const sectionRef = React.useRef(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      setSectionVisible(entry.isIntersecting);
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    loadSideVideos();
    base44.auth.me().then(u => setIsAdmin(u?.role === "admin")).catch(() => {});
  }, []);

  const loadSideVideos = async () => {
    try {
      const configs = await base44.entities.KAIConfig.filter({ config_key: "tttv_side_videos" });
      if (configs.length > 0 && configs[0].config_value) {
        const parsed = JSON.parse(configs[0].config_value);
        setSideVideos([
          parsed.left ? { video_id: extractVideoId(parsed.left), title: parsed.leftTitle || "Featured", url: parsed.left } : null,
          parsed.right ? { video_id: extractVideoId(parsed.right), title: parsed.rightTitle || "Featured", url: parsed.right } : null,
        ]);
        setLeftUrl(parsed.left || "");
        setRightUrl(parsed.right || "");
      } else {
        // Fallback to latest community videos
        const v = await base44.entities.CommunityVideo.list("-created_date", 2);
        setSideVideos([v[0] || null, v[1] || null]);
      }
    } catch {
      base44.entities.CommunityVideo.list("-created_date", 2).then(v => setSideVideos([v[0] || null, v[1] || null])).catch(() => {});
    }
  };

  const saveSideVideos = async () => {
    setSavingSides(true);
    try {
      const leftVid = extractVideoId(leftUrl.trim());
      const rightVid = extractVideoId(rightUrl.trim());
      const value = JSON.stringify({
        left: leftUrl.trim(),
        right: rightUrl.trim(),
        leftTitle: "Featured",
        rightTitle: "Featured",
      });
      const existing = await base44.entities.KAIConfig.filter({ config_key: "tttv_side_videos" });
      if (existing.length > 0) {
        await base44.entities.KAIConfig.update(existing[0].id, { config_value: value });
      } else {
        await base44.entities.KAIConfig.create({ config_key: "tttv_side_videos", config_value: value });
      }
      setSideVideos([
        leftVid ? { video_id: leftVid, title: "Featured", url: leftUrl.trim() } : null,
        rightVid ? { video_id: rightVid, title: "Featured", url: rightUrl.trim() } : null,
      ]);
      setShowSideEdit(false);
    } catch {}
    setSavingSides(false);
  };

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
    <section ref={sectionRef} id="tttv" className="py-20 sm:py-28 px-5 bg-gradient-to-b from-zinc-900 to-black text-white">
      <div className="max-w-6xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>

          {/* Header with flanking videos */}
          <div className="flex items-center justify-center gap-6 mb-8 relative">
            {/* Admin edit button */}
            {isAdmin && (
              <button onClick={() => setShowSideEdit(true)}
                className="absolute -top-2 right-0 z-10 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                title="Edit featured videos">
                <Settings className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Left video */}
            {sideVideos[0] && sideVideos[0].video_id && (
              <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
                className="hidden md:block w-56 flex-shrink-0">
                <div className="relative aspect-video rounded-xl overflow-hidden ring-1 ring-white/10 shadow-lg shadow-black/40">
                  {sectionVisible && (
                    <iframe
                      key={`left-${sideVideos[0].video_id}`}
                      src={`https://www.youtube.com/embed/${sideVideos[0].video_id}?autoplay=1&mute=1&loop=1&playlist=${sideVideos[0].video_id}&controls=0&showinfo=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1`}
                      title={sideVideos[0].title}
                      className="absolute inset-0 w-full h-full border-0 pointer-events-none"
                      allow="autoplay; encrypted-media"
                    />
                  )}
                  {!sectionVisible && (
                    <img src={`https://img.youtube.com/vi/${sideVideos[0].video_id}/mqdefault.jpg`} alt={sideVideos[0].title} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                    <p className="text-[10px] text-white font-semibold truncate">{sideVideos[0].title}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Center content */}
            <div className="flex-1 max-w-xl">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="bg-cyan-500 rounded-lg px-3 py-1.5 shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                  <span className="text-black font-[900] text-lg tracking-tight">TTTV</span>
                </div>
              </div>
              <h2 className="text-3xl sm:text-4xl font-[900] tracking-tight mb-3">Watch anything.</h2>
              <p className="text-zinc-400 text-sm max-w-md mx-auto">
                Paste a YouTube link and watch directly inside TTT — no ads, no distractions.
              </p>
            </div>

            {/* Right video */}
            {sideVideos[1] && sideVideos[1].video_id && (
              <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
                className="hidden md:block w-56 flex-shrink-0">
                <div className="relative aspect-video rounded-xl overflow-hidden ring-1 ring-white/10 shadow-lg shadow-black/40">
                  {sectionVisible && (
                    <iframe
                      key={`right-${sideVideos[1].video_id}`}
                      src={`https://www.youtube.com/embed/${sideVideos[1].video_id}?autoplay=1&mute=1&loop=1&playlist=${sideVideos[1].video_id}&controls=0&showinfo=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1`}
                      title={sideVideos[1].title}
                      className="absolute inset-0 w-full h-full border-0 pointer-events-none"
                      allow="autoplay; encrypted-media"
                    />
                  )}
                  {!sectionVisible && (
                    <img src={`https://img.youtube.com/vi/${sideVideos[1].video_id}/mqdefault.jpg`} alt={sideVideos[1].title} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                    <p className="text-[10px] text-white font-semibold truncate">{sideVideos[1].title}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Search / URL input */}
          <div className="flex items-center gap-2 max-w-xl mx-auto mt-8 bg-white/5 backdrop-blur-sm rounded-2xl px-4 py-3 ring-1 ring-white/15 hover:ring-white/25 transition-all">
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
          <div className="mt-10 w-full">
            <div className="rounded-2xl overflow-hidden ring-1 ring-white/10 bg-black" style={{ height: "clamp(500px, 70vh, 800px)" }}>
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

          {/* Side Videos Edit Modal */}
          <AnimatePresence>
            {showSideEdit && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
                onClick={() => setShowSideEdit(false)}>
                <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                  onClick={e => e.stopPropagation()}
                  className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md p-6 text-left">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-white">Edit Featured Videos</h3>
                    <button onClick={() => setShowSideEdit(false)} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-zinc-400 mb-1.5 block">Left Video — YouTube URL</label>
                      <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2.5 ring-1 ring-white/10">
                        <Youtube className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <input value={leftUrl} onChange={e => setLeftUrl(e.target.value)}
                          placeholder="https://youtube.com/watch?v=..."
                          className="flex-1 bg-transparent text-white text-sm outline-none placeholder-zinc-500" />
                      </div>
                      {leftUrl && extractVideoId(leftUrl.trim()) && (
                        <div className="mt-2 rounded-lg overflow-hidden aspect-video bg-black">
                          <img src={`https://img.youtube.com/vi/${extractVideoId(leftUrl.trim())}/mqdefault.jpg`} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 mb-1.5 block">Right Video — YouTube URL</label>
                      <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2.5 ring-1 ring-white/10">
                        <Youtube className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <input value={rightUrl} onChange={e => setRightUrl(e.target.value)}
                          placeholder="https://youtube.com/watch?v=..."
                          className="flex-1 bg-transparent text-white text-sm outline-none placeholder-zinc-500" />
                      </div>
                      {rightUrl && extractVideoId(rightUrl.trim()) && (
                        <div className="mt-2 rounded-lg overflow-hidden aspect-video bg-black">
                          <img src={`https://img.youtube.com/vi/${extractVideoId(rightUrl.trim())}/mqdefault.jpg`} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                    <button onClick={saveSideVideos} disabled={savingSides}
                      className="w-full h-11 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors">
                      {savingSides ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Check className="w-4 h-4" /> Save for All Users</>}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

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