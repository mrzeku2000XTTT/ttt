import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Newspaper, Loader2, ExternalLink, TrendingUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

export default function ArticlesPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: "Get the latest 10 trending news articles from around the world today. Include title, summary, source, and category. Format as JSON array.",
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
                  category: { type: "string" }
                }
              }
            }
          }
        }
      });
      setArticles(response.articles || []);
    } catch (err) {
      console.error("Failed to load news:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-black text-white mb-2">Global News</h1>
              <p className="text-white/60">Latest articles from around the world</p>
            </div>
            <Button onClick={loadNews} disabled={loading} className="bg-cyan-500 hover:bg-cyan-600">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
            </Button>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <p className="text-white/40">Loading news...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                      <Newspaper className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span className="text-cyan-400 text-xs font-semibold uppercase tracking-wider">
                      {article.category}
                    </span>
                  </div>
                  <span className="text-white/40 text-xs">{article.source}</span>
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{article.title}</h3>
                <p className="text-white/70 text-sm leading-relaxed">{article.summary}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}