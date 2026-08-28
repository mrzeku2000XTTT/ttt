import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Flame, Heart, Repeat2, Eye, ExternalLink, ChevronRight, Sparkles, FileText } from "lucide-react";
import { base44 } from "@/api/base44Client";

function TopicAvatar({ topic, size = "w-6 h-6", textSize = "text-[10px]" }) {
  const [error, setError] = useState(false);
  const src = topic.profile_image_url || `https://unavatar.io/x/${topic.author_handle}`;
  if (error) {
    return (
      <div className={`${size} rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center ${textSize} font-bold text-white flex-shrink-0`}>
        {(topic.author_name || topic.author_handle || "?")[0].toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={src}
      onError={() => setError(true)}
      className={`${size} rounded-full object-cover flex-shrink-0`}
      alt={topic.author_handle}
      loading="lazy"
    />
  );
}

export default function KaspaHotTopics() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [summaries, setSummaries] = useState({});
  const [summarizing, setSummarizing] = useState({});

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
    } catch (e) {}
  };

  const openTopic = (topic) => {
    trackView(topic);
    window.open(topic.tweet_url, "_blank", "noopener,noreferrer");
  };

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
        prompt: `Summarize this X post about Kaspa in 1-2 clear sentences. Focus on the key point or announcement:\n\n"${topic.content}"\n\nAuthor: @${topic.author_handle}`,
      });
      const summary = typeof res === "string" ? res : res?.text || "";
      setSummaries((prev) => ({ ...prev, [topic.id]: summary }));
    } catch (e) {
      console.error(e);
    } finally {
      setSummarizing((prev) => ({ ...prev, [topic.id]: false }));
    }
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
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-shrink-0 w-44 h-28 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (failed || topics.length === 0) return null;

  return (
    <div className="w-full mt-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <Flame className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[11px] font-mono tracking-widest uppercase text-white/60">Hot Topics</span>
        </div>
        <Link
          to="/Trending"
          className="flex items-center gap-1 text-[10px] font-mono text-white/40 hover:text-white/70 transition-colors"
        >
          View more <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-5 px-5 sm:-mx-8 sm:px-8">
        {topics.map((topic, i) => (
          <motion.div
            key={topic.id || i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => openTopic(topic)}
            className="flex-shrink-0 w-44 rounded-xl bg-white/5 border border-white/10 hover:border-white/25 p-3 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-2">
              <TopicAvatar topic={topic} />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-white truncate">{topic.author_name || topic.author_handle}</div>
                <div className="text-[9px] text-white/40 truncate">@{topic.author_handle}</div>
              </div>
              <ExternalLink className="w-3 h-3 text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0" />
            </div>
            <p className="text-[11px] text-white/70 leading-snug line-clamp-2 mb-2">{topic.content}</p>
            {summaries[topic.id] && (
              <div className="mb-2 px-2 py-1.5 rounded-md bg-violet-500/10 border border-violet-500/20">
                <p className="text-[10px] text-violet-200 leading-snug">{summaries[topic.id]}</p>
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[9px] text-white/40">
                <span className="flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" /> {formatNum(topic.impressions)}</span>
                <span className="flex items-center gap-0.5"><Heart className="w-2.5 h-2.5" /> {formatNum(topic.likes)}</span>
                <span className="flex items-center gap-0.5"><Repeat2 className="w-2.5 h-2.5" /> {formatNum(topic.retweets)}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); summarizeTopic(topic); }}
                disabled={summarizing[topic.id]}
                className="flex items-center gap-1 text-[9px] text-violet-300 hover:text-violet-200 transition-colors disabled:opacity-50"
              >
                {summarizing[topic.id] ? (
                  <><Sparkles className="w-2.5 h-2.5 animate-pulse" /> ...</>
                ) : summaries[topic.id] ? (
                  <><FileText className="w-2.5 h-2.5" /> Hide</>
                ) : (
                  <><FileText className="w-2.5 h-2.5" /> Summary</>
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}