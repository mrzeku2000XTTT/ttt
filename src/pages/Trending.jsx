import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Flame, Heart, Repeat2, MessageCircle, Eye, ExternalLink, ArrowLeft, Sparkles, FileText } from "lucide-react";
import { base44 } from "@/api/base44Client";

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
    <img
      src={src}
      onError={() => setError(true)}
      className={`${size} rounded-full object-cover flex-shrink-0`}
      alt=""
      loading="lazy"
    />
  );
}

function formatNum(n) {
  if (!n) return "0";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default function TrendingPage() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState({});
  const [summarizing, setSummarizing] = useState({});

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
        prompt: `Summarize this content about Kaspa in 1-2 clear sentences. Focus on the key point or announcement:\n\nTitle: ${topic.author_name}\nContent: ${topic.content}\nSource: ${topic.author_handle}`,
      });
      const summary = typeof res === "string" ? res : res?.text || "";
      setSummaries((prev) => ({ ...prev, [topic.id]: summary }));
    } catch (e) {
      console.error(e);
    } finally {
      setSummarizing((prev) => ({ ...prev, [topic.id]: false }));
    }
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
            <p className="text-sm text-white/40">Most popular Kaspa content this week</p>
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
            {topics.map((topic, i) => {
              const hasMetrics = topic.impressions > 0 || topic.likes > 0 || topic.retweets > 0 || topic.replies > 0;
              return (
                <div
                  key={topic.id || i}
                  className="rounded-2xl bg-white/5 border border-white/10 hover:border-white/25 p-4 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <TopicAvatar topic={topic} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold text-white/80 truncate">{topic.author_handle}</div>
                    </div>
                    <button onClick={() => openTopic(topic)} className="text-white/20 hover:text-white/50 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[13px] text-white font-medium leading-relaxed line-clamp-2 mb-1">{topic.author_name}</p>
                  <p className="text-[12px] text-white/60 leading-relaxed line-clamp-3 mb-3">{topic.content}</p>
                  {summaries[topic.id] && (
                    <div className="mb-3 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                      <p className="text-[11px] text-violet-200 leading-relaxed">{summaries[topic.id]}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-3">
                    {hasMetrics && (
                      <div className="flex items-center gap-3 text-[10px] text-white/40">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {formatNum(topic.impressions)}</span>
                        <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {formatNum(topic.likes)}</span>
                        <span className="flex items-center gap-1"><Repeat2 className="w-3 h-3" /> {formatNum(topic.retweets)}</span>
                        <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {formatNum(topic.replies)}</span>
                      </div>
                    )}
                    <button
                      onClick={() => summarizeTopic(topic)}
                      disabled={summarizing[topic.id]}
                      className={`flex items-center gap-1 text-[10px] text-violet-300 hover:text-violet-200 transition-colors disabled:opacity-50 ${!hasMetrics ? "ml-auto" : ""}`}
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