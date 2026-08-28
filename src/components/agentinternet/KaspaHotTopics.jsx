import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, Heart, Repeat2, MessageCircle, Eye, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function KaspaHotTopics() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    setLoading(true);
    setFailed(false);
    try {
      const res = await base44.functions.invoke("fetchKaspaHotTopics", {});
      const data = res?.data || res;
      if (data?.topics?.length > 0) {
        setTopics(data.topics);
      } else {
        setFailed(true);
      }
    } catch (e) {
      console.error("Hot topics fetch failed", e);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  const trackView = async (topic) => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) return;
      await base44.entities.KaspaHotTopic.update(topic.id, {
        app_views: (topic.app_views || 0) + 1,
      });
    } catch (e) {
      // silent — view tracking is best-effort
    }
  };

  const openTopic = (topic) => {
    trackView(topic);
    window.open(topic.tweet_url, "_blank", "noopener,noreferrer");
  };

  const formatNum = (n) => {
    if (!n) return "0";
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  if (loading) {
    return (
      <div className="w-full mt-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <Flame className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[11px] font-mono tracking-widest uppercase text-white/60">Hot Topics</span>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 w-72 h-36 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (failed || topics.length === 0) return null;

  return (
    <div className="w-full mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <Flame className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[11px] font-mono tracking-widest uppercase text-white/60">Hot Topics</span>
        </div>
        <span className="text-[10px] font-mono text-white/30">Trending $KAS · this week</span>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-5 px-5 sm:-mx-8 sm:px-8">
        {topics.map((topic, i) => (
          <motion.button
            key={topic.id || i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => openTopic(topic)}
            className="flex-shrink-0 w-72 text-left rounded-2xl bg-white/5 border border-white/10 hover:border-white/25 p-4 transition-colors group"
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
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" /> {formatNum(topic.impressions)}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" /> {formatNum(topic.likes)}
              </span>
              <span className="flex items-center gap-1">
                <Repeat2 className="w-3 h-3" /> {formatNum(topic.retweets)}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" /> {formatNum(topic.replies)}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}