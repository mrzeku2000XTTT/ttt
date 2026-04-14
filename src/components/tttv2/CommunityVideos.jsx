import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Play, Plus, Trash2, X, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function extractYoutubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export default function CommunityVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [playingId, setPlayingId] = useState(null);

  useEffect(() => {
    loadVideos();
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
    } catch { /* not logged in */ }
  };

  const loadVideos = async () => {
    setLoading(true);
    try {
      const v = await base44.entities.CommunityVideo.list("-created_date", 50);
      setVideos(v);
    } catch { }
    setLoading(false);
  };

  const handleAdd = async () => {
    const videoId = extractYoutubeId(newUrl.trim());
    if (!videoId) return;
    if (!newTitle.trim()) return;

    setSaving(true);
    try {
      await base44.entities.CommunityVideo.create({
        youtube_url: newUrl.trim(),
        video_id: videoId,
        title: newTitle.trim(),
        added_by_name: user?.username || user?.full_name || "Community",
        added_by_wallet: user?.created_wallet_address || "",
        section: "community",
      });
      setNewUrl("");
      setNewTitle("");
      setShowAdd(false);
      await loadVideos();
    } catch (err) {
      console.error("Failed to add video:", err);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this video?")) return;
    try {
      await base44.entities.CommunityVideo.delete(id);
      setVideos(videos.filter(v => v.id !== id));
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const previewId = extractYoutubeId(newUrl);

  return (
    <section className="py-20 sm:py-28 px-5 bg-white">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="flex items-center justify-between mb-10">
          <div>
            <p className="text-[13px] font-semibold text-zinc-400 tracking-wide uppercase mb-2">Community</p>
            <h2 className="text-3xl sm:text-4xl font-[900] tracking-tight">Videos & Explainers</h2>
          </div>
          <Button
            onClick={() => setShowAdd(!showAdd)}
            className="bg-black text-white hover:bg-zinc-800 rounded-full text-[13px] font-semibold px-5 h-10"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Video
          </Button>
        </motion.div>

        {/* Add video form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="bg-zinc-50 rounded-2xl p-5 ring-1 ring-zinc-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-zinc-900">Add a YouTube Video</h3>
                  <button onClick={() => setShowAdd(false)} className="text-zinc-400 hover:text-zinc-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  <Input
                    value={newUrl}
                    onChange={e => setNewUrl(e.target.value)}
                    placeholder="Paste YouTube URL (e.g. https://youtube.com/watch?v=...)"
                    className="bg-white border-zinc-200 text-zinc-900 h-11"
                  />
                  <Input
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Video title"
                    className="bg-white border-zinc-200 text-zinc-900 h-11"
                  />

                  {/* Preview */}
                  {previewId && (
                    <div className="rounded-xl overflow-hidden ring-1 ring-zinc-200">
                      <img
                        src={`https://img.youtube.com/vi/${previewId}/mqdefault.jpg`}
                        alt="Preview"
                        className="w-full h-40 object-cover"
                      />
                    </div>
                  )}

                  <Button
                    onClick={handleAdd}
                    disabled={saving || !previewId || !newTitle.trim()}
                    className="w-full bg-black text-white hover:bg-zinc-800 h-11 rounded-xl"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Video
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video grid */}
        {loading ? (
          <div className="text-center py-12 text-zinc-400 text-sm">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            Loading videos…
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-16">
            <Play className="w-12 h-12 text-zinc-200 mx-auto mb-3" />
            <p className="text-zinc-400 text-sm">No videos yet. Be the first to add one!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((v, i) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl ring-1 ring-zinc-200/60 hover:ring-zinc-300 hover:shadow-xl hover:shadow-zinc-200/40 transition-all duration-300 overflow-hidden group"
              >
                {playingId === v.id ? (
                  <div className="aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${v.video_id}?autoplay=1`}
                      className="w-full h-full"
                      allowFullScreen
                      allow="autoplay; encrypted-media"
                    />
                  </div>
                ) : (
                  <div
                    className="relative aspect-video cursor-pointer"
                    onClick={() => setPlayingId(v.id)}
                  >
                    <img
                      src={`https://img.youtube.com/vi/${v.video_id}/mqdefault.jpg`}
                      alt={v.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <div className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 text-zinc-900 ml-0.5" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-4">
                  <h3 className="text-sm font-bold text-zinc-900 line-clamp-2 mb-1">{v.title}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400">
                      by {v.added_by_name || "Community"}
                    </span>
                    {user && (v.created_by === user.email || user.role === "admin") && (
                      <button
                        onClick={() => handleDelete(v.id)}
                        className="text-zinc-300 hover:text-red-500 transition-colors p-1"
                        title="Delete video"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}