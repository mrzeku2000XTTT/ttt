import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Flame, ExternalLink, ArrowLeft, Sparkles, FileText, Youtube, Megaphone } from "lucide-react";
import { base44 } from "@/api/base44Client";

const CATEGORY_BADGE = {
  kaspa: { label: "KASPA", cls: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
  crypto: { label: "CRYPTO", cls: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  youtube: { label: "YOUTUBE", cls: "bg-red-500/20 text-red-300 border-red-500/30" },
  advertisement: { label: "SPONSORED", cls: "bg-violet-500/20 text-violet-300 border-violet-500/30" },
};

function TopicAvatar({ topic, size = "w-8 h-8", textSize = "text-[12px]" }) {
  const [error, setError] = useState(false);
  const isXHandle = topic.profile_image_url || (topic.author_handle && !topic.author_handle.includes("."));
  const src = topic.profile_image_url ||
    (isXHandle
      ? `https://unavatar.io/x/${topic.author_handle}`
      : `https://www.google.com/s2/favicons?domain=${topic.author_handle}&sz=64`);
  if (error) {
    return (
      <div className={`${size} rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center ${textSize} font-bold text-white flex-shrink-0`}>
        {(topic.author_name || topic.author_handle || "?")[0].toUpperCase()}
      </div>
    );
  }
  return (
    <img src={src} onError={() => setError(true)} className={`${size} rounded-full object-cover flex-shrink-0`} alt="" loading="lazy" />
  );
}

export default function TrendingPage() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState({});
  const [summarizing, setSummarizing] = useState({});
  const [filter, setFilter] = useState("all");
  const [utcTime, setUtcTime] = useState("");

  // Live UTC clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, "0");
      const m = String(now.getUTCMinutes()).padStart(2, "0");
      const s = String(now.getUTCSeconds()).padStart(2, "0");
      setUtcTime(`${h}:${m}:${s} UTC`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke("fetchKaspaHotTopics", {});
        const data = res?.data || res;
        setTopics(data?.topics || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openTopic = (topic) => window.open(topic.tweet_url, "_blank", "noopener,noreferrer");

  const summarizeTopic = async (topic) => {
    if (summaries[topic.id]) {
      setSummaries((prev) => {
        const next = { ...prev };
        delete next[topic.id];
        return next;
      });
      return;
    }
    setSummarizing((prev) => ({ ...prev, [topic.id]: true }));
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Summarize this content in 1-2 clear sentences:\n\nTitle: ${topic.author_name}\nContent: ${topic.content}\nSource: ${topic.author_handle}`,
      });
      const summary = typeof res === "string" ? res : res?.text || "";
      setSummaries((prev) => ({ ...prev, [topic.id]: summary }));
    } catch (e) {
      console.error(e);
    } finally {
      setSummarizing((prev) => ({ ...prev, [topic.id]: false }));
    }
  };

  const filtered = filter === "all" ? topics : topics.filter(t => {
    if (filter === "sponsored") return t.is_advertisement;
    return !t.is_advertisement && t.category === filter;
  });

  const counts = {
    all: topics.length,
    kaspa: topics.filter(t => !t.is_advertisement && t.category === "kaspa").length,
    crypto: topics.filter(t => !t.is_advertisement && t.category === "crypto").length,
    youtube: topics.filter(t => !t.is_advertisement && t.category === "youtube").length,
    sponsored: topics.filter(t => t.is_advertisement).length,
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">24/7 Crypto News</h1>
              <p className="text-sm text-white/40">Kaspa + crypto + YouTube · updated hourly · 24h rolling window</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-emerald-300 tabular-nums">{utcTime}</span>
          </div>
        </div>

        {/* Category filter tabs */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {[
            { key: "all", label: "All", count: counts.all },
            { key: "kaspa", label: "Kaspa", count: counts.kaspa },
            { key: "crypto", label: "Crypto", count: counts.crypto },
            { key: "youtube", label: "YouTube", count: counts.youtube },
            { key: "sponsored", label: "Sponsored", count: counts.sponsored },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-widest border transition-colors ${
                filter === tab.key
                  ? "bg-white/10 border-white/30 text-white"
                  : "border-white/10 text-white/50 hover:text-white"
              }`}
            >
              {tab.key === "youtube" && <Youtube className="w-3 h-3" />}
              {tab.key === "sponsored" && <Megaphone className="w-3 h-3" />}
              {tab.label}
              <span className="text-[9px] text-white/30">{tab.count}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-white/40 text-center py-20">No items in this category.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((topic, i) => {
              const badge = CATEGORY_BADGE[topic.category] || CATEGORY_BADGE.kaspa;
              const isYT = topic.category === "youtube" && topic.youtube_video_id;
              return (
                <div key={topic.id || i} className="rounded-2xl bg-white/5 border border-white/10 hover:border-white/25 p-4 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <TopicAvatar topic={topic} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold text-white/80 truncate">{topic.author_handle}</div>
                    </div>
                    <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${badge.cls}`}>{badge.label}</span>
                    <button onClick={() => openTopic(topic)} className="text-white/20 hover:text-white/50 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* YouTube thumbnail */}
                  {isYT && (
                    <div className="relative mb-3 rounded-xl overflow-hidden bg-black/50 cursor-pointer" onClick={() => openTopic(topic)}>
                      <img
                        src={`https://img.youtube.com/vi/${topic.youtube_video_id}/mqdefault.jpg`}
                        className="w-full h-28 object-cover"
                        alt=""
                        loading="lazy"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="w-10 h-10 rounded-full bg-red-600/90 flex items-center justify-center">
                          <Youtube className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </div>
                  )}

                  <p className="text-[13px] text-white font-medium leading-relaxed line-clamp-2 mb-1">{topic.author_name}</p>
                  <p className="text-[12px] text-white/60 leading-relaxed line-clamp-2 mb-3">{topic.content}</p>

                  {summaries[topic.id] && (
                    <div className="mb-3 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                      <p className="text-[11px] text-violet-200 leading-relaxed">{summaries[topic.id]}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => summarizeTopic(topic)}
                      disabled={summarizing[topic.id]}
                      className="flex items-center gap-1 text-[10px] text-violet-300 hover:text-violet-200 transition-colors disabled:opacity-50"
                    >
                      {summarizing[topic.id] ? (
                        <><Sparkles className="w-3 h-3 animate-pulse" /> Summarizing...</>
                      ) : summaries[topic.id] ? (
                        <><FileText className="w-3 h-3" /> Hide</>
                      ) : (
                        <><FileText className="w-3 h-3" /> Summarize</>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}