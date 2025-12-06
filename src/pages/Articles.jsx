import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Newspaper, Loader2, ExternalLink, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

export default function ArticlesPage() {
  const [articles, setArticles] = useState([]);
  const [oldArticles, setOldArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    loadNews();
    const interval = setInterval(() => {
      loadNews(true);
    }, 3600000); // 1 hour
    return () => clearInterval(interval);
  }, []);

  const loadNews = async (isAutoUpdate = false) => {
    if (!isAutoUpdate) setLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: "Get the latest 30 trending news articles from around the world today. Include title, summary (max 100 chars), source, category, and a valid news article URL link. Format as JSON array.",
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            articles: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  summary: { type: "string" },
                  source: { type: "string" },
                  category: { type: "string" },
                  url: { type: "string" }
                }
              }
            }
          }
        }
      });
      if (isAutoUpdate && articles.length > 0) {
        setOldArticles([...oldArticles, ...articles]);
      }
      setArticles(response.articles || []);
      setLastUpdate(Date.now());
    } catch (err) {
      console.error("Failed to load news:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black px-3 py-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-black text-white">Global News</h1>
              <p className="text-white/40 text-xs flex items-center gap-2">
                <Clock className="w-3 h-3" />
                Updated {new Date(lastUpdate).toLocaleTimeString()}
              </p>
            </div>
            <Button onClick={() => loadNews()} disabled={loading} size="sm" className="bg-cyan-500 hover:bg-cyan-600 h-8">
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Refresh"}
            </Button>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <p className="text-white/40">Loading news...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-6">
              {articles.map((article, idx) => (
                <motion.a
                  key={idx}
                  href={article.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg p-3 hover:bg-white/10 hover:border-cyan-500/30 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-cyan-400 text-[10px] font-bold uppercase tracking-wider">
                      {article.category}
                    </span>
                    <ExternalLink className="w-3 h-3 text-white/30 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <h3 className="text-white font-bold text-sm mb-1 line-clamp-2 leading-tight">{article.title}</h3>
                  <p className="text-white/60 text-xs leading-snug line-clamp-2 mb-2">{article.summary}</p>
                  <span className="text-white/30 text-[10px]">{article.source}</span>
                </motion.a>
              ))}
            </div>

            {oldArticles.length > 0 && (
              <div className="border-t border-white/10 pt-4">
                <h2 className="text-white/60 text-sm font-bold mb-3">Previous Updates</h2>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {oldArticles.map((article, idx) => (
                    <a
                      key={idx}
                      href={article.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-white/5 border border-white/5 rounded-lg p-2 hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-cyan-400/70 text-[9px] font-bold uppercase">{article.category}</span>
                        <span className="text-white/20 text-[9px]">{article.source}</span>
                      </div>
                      <h4 className="text-white/70 text-xs font-semibold line-clamp-1">{article.title}</h4>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}