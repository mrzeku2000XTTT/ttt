import React from "react";
import { Heart, Repeat2, Eye, ExternalLink, Play, MessageSquare } from "lucide-react";

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatCount(n) {
  if (!n) return '0';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// Tweet / post card
export function TweetCard({ post, onViewInBrowser }) {
  const author = post.author_username || post.author || 'Unknown';
  const name = post.author_name || author;
  const avatar = post.author_avatar || '';
  const text = (post.text || post.content || '').slice(0, 280);
  const date = post.published_at || post.created_at;

  return (
    <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center gap-2">
        {avatar ? (
          <img src={avatar} alt={author} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
            style={{ background: "rgba(6,182,212,0.25)", color: "rgba(6,182,212,1)" }}>
            {author[0]?.toUpperCase() || '?'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <span className="text-[12px] font-semibold text-white/90">@{author}</span>
          {date && <span className="text-[10px] text-white/35 ml-1.5">{timeAgo(date)}</span>}
        </div>
      </div>
      <p className="text-[12px] leading-relaxed text-white/75">{text}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-[10px] text-white/40">
          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{formatCount(post.likes)}</span>
          <span className="flex items-center gap-1"><Repeat2 className="w-3 h-3" />{formatCount(post.reposts)}</span>
          {post.views > 0 && <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatCount(post.views)}</span>}
        </div>
        {post.url && (
          <button onClick={() => onViewInBrowser(post.url)}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold transition-all hover:scale-105"
            style={{ background: "rgba(6,182,212,0.2)", border: "1px solid rgba(6,182,212,0.3)", color: "rgba(6,182,212,1)" }}>
            <ExternalLink className="w-2.5 h-2.5" /> View
          </button>
        )}
      </div>
    </div>
  );
}

// Video card
export function VideoCard({ video, onViewInBrowser }) {
  const title = video.title || 'Untitled Video';
  const channel = video.channel || video.author || '';
  const views = video.views || video.view_count || 0;
  const url = video.url || video.link || '';
  const thumbnail = video.thumbnail || '';
  const date = video.published_at || video.created_at;

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      {thumbnail && (
        <div className="relative w-full h-24 bg-black/50">
          <img src={thumbnail} alt={title} className="w-full h-full object-cover opacity-80" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
              <Play className="w-4 h-4 text-white fill-white" />
            </div>
          </div>
        </div>
      )}
      <div className="p-3 space-y-1.5">
        <p className="text-[12px] font-semibold text-white/90 line-clamp-2 leading-tight">{title}</p>
        <div className="flex items-center justify-between">
          <div className="text-[10px] text-white/40 flex items-center gap-2">
            {channel && <span>{channel}</span>}
            {views > 0 && <span className="flex items-center gap-1"><Eye className="w-2.5 h-2.5" />{formatCount(views)}</span>}
            {date && <span>{timeAgo(date)}</span>}
          </div>
          {url && (
            <button onClick={() => onViewInBrowser(url)}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold transition-all hover:scale-105"
              style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.3)", color: "rgba(239,68,68,1)" }}>
              <Play className="w-2.5 h-2.5" /> Watch
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Reddit post card
export function RedditCard({ post, onViewInBrowser }) {
  const title = post.title || '';
  const author = post.author || 'Unknown';
  const score = post.score || post.ups || 0;
  const comments = post.num_comments || post.comments || 0;
  const url = post.url || post.permalink || '';
  const date = post.created_at || post.published_at;

  return (
    <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <p className="text-[12px] font-semibold text-white/90 leading-tight">{title}</p>
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-white/40 flex items-center gap-2">
          <span>u/{author}</span>
          <span>⬆️ {formatCount(score)}</span>
          <span className="flex items-center gap-1"><MessageSquare className="w-2.5 h-2.5" />{formatCount(comments)}</span>
          {date && <span>{timeAgo(date)}</span>}
        </div>
        {url && (
          <button onClick={() => onViewInBrowser(url)}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold transition-all hover:scale-105"
            style={{ background: "rgba(255,69,0,0.2)", border: "1px solid rgba(255,69,0,0.3)", color: "rgba(255,69,0,1)" }}>
            <ExternalLink className="w-2.5 h-2.5" /> Open
          </button>
        )}
      </div>
    </div>
  );
}