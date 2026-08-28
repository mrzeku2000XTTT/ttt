import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Flame, Heart, Repeat2, MessageCircle, Eye, ExternalLink, ArrowLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function TrendingPage() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const openTopic = (topic) => {
    window.open(topic.tweet_url, "_blank", "noopener,noreferrer");
  };

  const formatNum = (n) => {
    if (!n) return "0";
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Trending $KAS</h1>
            <p className="text-sm text-white/40">Most popular Kaspa posts this week</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
            ))}
          </div>
        ) : topics.length === 0 ? (
          <p className="text-white/40 text-center py-20">No trending topics found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map((topic, i) => (
              <button
                key={topic.id || i}
                onClick={() => openTopic(topic)}
                className="text-left rounded-2xl bg-white/5 border border-white/10 hover:border-white/25 p-4 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-[12px] font-bold text-white">
                    {(topic.author_name || topic.author_handle || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-white truncate">{topic.author_name || topic.author_handle}</div>
                    <div className="text-[10px] text-white/40 truncate">@{topic.author_handle}</div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition-colors" />
                </div>
                <p className="text-[12px] text-white/70 leading-relaxed line-clamp-3 mb-3">{topic.content}</p>
                <div className="flex items-center gap-3 text-[10px] text-white/40">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {formatNum(topic.impressions)}</span>
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {formatNum(topic.likes)}</span>
                  <span className="flex items-center gap-1"><Repeat2 className="w-3 h-3" /> {formatNum(topic.retweets)}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {formatNum(topic.replies)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}