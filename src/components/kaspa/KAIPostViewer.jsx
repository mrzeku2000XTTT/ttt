import React from "react";
import { Heart, Repeat2, Eye, ExternalLink, Clock, MessageCircle } from "lucide-react";

export default function KAIPostViewer({ post }) {
  if (!post) return null;

  const author = post.author_username || post.author || "Unknown";
  const text = post.text || post.content || "";
  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : "";
  const likes = post.likes || 0;
  const reposts = post.reposts || 0;
  const views = post.views || 0;
  const url = post.url || "";
  const feed = post.feed || "";
  const initial = author[0]?.toUpperCase() || "?";

  // Extract any t.co links from text
  const urlRegex = /(https?:\/\/t\.co\/[^\s]+)/g;
  const linkedText = text.split(urlRegex).map((part, i) => {
    if (urlRegex.test(part)) {
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer"
          className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 break-all">
          {part}
        </a>
      );
    }
    // Reset regex lastIndex
    urlRegex.lastIndex = 0;
    return part;
  });

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto scrollbar-hide"
      style={{ background: "rgba(10,10,14,1)" }}>
      
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Post Preview</span>
        </div>
        {feed && (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase"
            style={{ background: "rgba(6,182,212,0.15)", color: "rgba(6,182,212,0.8)", border: "1px solid rgba(6,182,212,0.2)" }}>
            {feed}
          </span>
        )}
      </div>

      {/* Post content */}
      <div className="flex-1 px-4 py-4">
        {/* Author */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-[16px] font-bold"
            style={{
              background: "linear-gradient(135deg, rgba(6,182,212,0.5), rgba(168,85,247,0.5))",
              color: "white",
              boxShadow: "0 0 20px rgba(6,182,212,0.2)",
            }}>
            {initial}
          </div>
          <div>
            <div className="text-[15px] font-bold text-white">@{author}</div>
            {date && (
              <div className="flex items-center gap-1 text-[11px] text-white/35 mt-0.5">
                <Clock className="w-3 h-3" />
                {date}
              </div>
            )}
          </div>
        </div>

        {/* Post text */}
        <div className="text-[14px] leading-[1.7] text-white/85 whitespace-pre-wrap mb-5">
          {linkedText}
        </div>

        {/* Engagement stats */}
        <div className="flex items-center gap-5 py-3 mb-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-pink-400/70" />
            <span className="text-[13px] font-semibold text-white/70">{likes.toLocaleString()}</span>
            <span className="text-[11px] text-white/30">likes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Repeat2 className="w-4 h-4 text-green-400/70" />
            <span className="text-[13px] font-semibold text-white/70">{reposts.toLocaleString()}</span>
            <span className="text-[11px] text-white/30">reposts</span>
          </div>
          {views > 0 && (
            <div className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-cyan-400/70" />
              <span className="text-[13px] font-semibold text-white/70">{views.toLocaleString()}</span>
              <span className="text-[11px] text-white/30">views</span>
            </div>
          )}
        </div>

        {/* View original */}
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all hover:scale-[1.02]"
            style={{
              background: "rgba(6,182,212,0.12)",
              border: "1px solid rgba(6,182,212,0.25)",
              color: "rgba(6,182,212,0.95)",
            }}>
            <ExternalLink className="w-3.5 h-3.5" />
            View original on X
          </a>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 flex-shrink-0 text-center"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="text-[10px] text-white/20">Fetched from Kaspa.news • TTT Agent</span>
      </div>
    </div>
  );
}