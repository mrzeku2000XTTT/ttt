import React from "react";
import { Heart, Repeat2, Eye, ExternalLink } from "lucide-react";

export default function KAINewsCard({ post, onViewPost }) {
  const author = post.author_username || post.author || "Unknown";
  const text = (post.text || post.content || "").slice(0, 220);
  const date = post.published_at ? new Date(post.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
  const likes = post.likes || 0;
  const reposts = post.reposts || 0;
  const views = post.views || 0;
  const url = post.url || "";
  const initial = author[0]?.toUpperCase() || "?";

  return (
    <div
      className="rounded-xl overflow-hidden flex-shrink-0"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        width: "260px",
        minWidth: "260px",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-1.5">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, rgba(6,182,212,0.4), rgba(168,85,247,0.4))",
            color: "rgba(255,255,255,0.9)",
          }}
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-semibold text-white/90 truncate">@{author}</div>
          {date && <div className="text-[10px] text-white/35">{date}</div>}
        </div>
      </div>

      {/* Body */}
      <div className="px-3 py-1.5">
        <p className="text-[11px] leading-[1.5] text-white/70 line-clamp-4">{text}</p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 px-3 py-1.5 text-[10px] text-white/30">
        <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{likes}</span>
        <span className="flex items-center gap-1"><Repeat2 className="w-3 h-3" />{reposts}</span>
        {views > 0 && <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{views}</span>}
      </div>

      {/* View button */}
      {url && (
        <div className="px-3 pb-3 pt-1">
          <button
            onClick={() => onViewPost(url)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:scale-[1.02]"
            style={{
              background: "rgba(6,182,212,0.15)",
              border: "1px solid rgba(6,182,212,0.3)",
              color: "rgba(6,182,212,0.95)",
            }}
          >
            <ExternalLink className="w-3 h-3" />
            View Post
          </button>
        </div>
      )}
    </div>
  );
}