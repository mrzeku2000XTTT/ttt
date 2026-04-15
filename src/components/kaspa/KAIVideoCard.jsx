import React from "react";
import { Play, Eye, Heart, ExternalLink, Clock } from "lucide-react";

export default function KAIVideoCard({ video, onPlay }) {
  const title = video.text || "Untitled Video";
  const author = video.author || video.author_username || "Unknown";
  const thumbnail = video.thumbnail || "";
  const views = video.views || 0;
  const likes = video.likes || 0;
  const url = video.url || "";
  const date = video.published_at
    ? new Date(video.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "";

  return (
    <div
      onClick={() => onPlay(video)}
      className="rounded-xl overflow-hidden flex-shrink-0 cursor-pointer transition-all hover:border-cyan-500/30"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        width: "260px",
        minWidth: "260px",
      }}
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-video bg-black/50">
        {thumbnail ? (
          <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-900/30 to-purple-900/30">
            <Play className="w-8 h-8 text-white/30" />
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/10 transition-colors">
          <div className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(6,182,212,0.8)", backdropFilter: "blur(4px)" }}>
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="px-3 py-2">
        <p className="text-[12px] font-semibold text-white/90 line-clamp-2 leading-tight mb-1">{title}</p>
        <div className="flex items-center gap-1.5 text-[10px] text-white/40">
          <span className="font-medium">{author}</span>
          {date && (
            <>
              <span>·</span>
              <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{date}</span>
            </>
          )}
        </div>
      </div>

      {/* Stats + actions */}
      <div className="px-3 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-[10px] text-white/30">
          {views > 0 && <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{views.toLocaleString()}</span>}
          {likes > 0 && <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{likes.toLocaleString()}</span>}
        </div>
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-[9px] font-bold text-white/35 hover:text-white/60 transition-colors">
            <ExternalLink className="w-2.5 h-2.5" /> YouTube
          </a>
        )}
      </div>
    </div>
  );
}