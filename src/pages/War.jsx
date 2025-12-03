import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skull, RefreshCw, Loader2, MapPin, Clock, Globe, Flame, Brain } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import NewsAnalysisModal from "@/components/NewsAnalysisModal";

export default function WarPage() {
  const [news, setNews] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [error, setError] = useState(null);
  const [selectedNewsForAnalysis, setSelectedNewsForAnalysis] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState("all");

  useEffect(() => {
    loadWarNews();
    const interval = setInterval(() => loadWarNews(true), 180000);
    return () => clearInterval(interval);
  }, []);

  const loadWarNews = async (isAutoRefresh = false) => {
    if (!isAutoRefresh) setIsRefreshing(true);
    setError(null);

    try {
      const llmResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `Search for BREAKING global war, military conflicts, and crisis news from LAST 12 HOURS ONLY. Include: Ukraine, Gaza, Israel, Syria, Yemen, Sudan, Myanmar, and any major conflicts. Return 25 urgent reports with: title (max 100 chars), summary (max 180 chars), category (conflict/military/humanitarian/crisis/diplomatic), location (city/country), source, timestamp (ISO format), severity (1-10).`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            news: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  summary: { type: "string" },
                  category: { type: "string" },
                  location: { type: "string" },
                  source: { type: "string" },
                  timestamp: { type: "string" },
                  severity: { type: "number" }
                }
              }
            }
          }
        }
      });

      if (llmResponse?.news?.length > 0) {
        const sortedNews = llmResponse.news
          .filter(item => item?.title && item?.summary)
          .sort((a, b) => (b.severity || 5) - (a.severity || 5));
        
        setNews(sortedNews);
        localStorage.setItem('war_news_cache', JSON.stringify(sortedNews));
        localStorage.setItem('war_news_timestamp', Date.now().toString());
      } else {
        const cached = localStorage.getItem('war_news_cache');
        if (cached) setNews(JSON.parse(cached));
      }

      setLastUpdate(Date.now());
    } catch (error) {
      console.error('Failed to load war news:', error);
      setError('Failed to load live news. Click refresh.');
      
      const cached = localStorage.getItem('war_news_cache');
      if (cached) {
        setNews(JSON.parse(cached));
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAIAnalysis = async (newsItem) => {
    try {
      const stampedNews = await base44.entities.StampedNews.filter({ news_title: newsItem.title });
      
      if (stampedNews.length > 0) {
        setSelectedNewsForAnalysis({ ...newsItem, id: stampedNews[0].id });
      } else {
        const tempStamp = await base44.entities.StampedNews.create({
          news_title: newsItem.title,
          news_summary: newsItem.summary,
          news_category: newsItem.category,
          news_location: newsItem.location,
          news_source: newsItem.source,
          news_timestamp: newsItem.timestamp,
          blog_content: "",
          stamper_address: "system_analysis",
          signature: `analysis_${Date.now()}`,
          stamped_date: new Date().toISOString(),
          views: 0,
          likes: 0
        });
        
        setSelectedNewsForAnalysis({ ...newsItem, id: tempStamp.id });
      }
    } catch (err) {
      setError('Failed to prepare analysis.');
    }
  };

  const getCategoryColor = (category) => {
    switch (category?.toLowerCase()) {
      case "conflict":
      case "military":
        return "bg-gradient-to-r from-red-600/40 to-red-700/40 text-red-100 border-red-500/60 shadow-lg shadow-red-500/20";
      case "humanitarian":
      case "crisis":
        return "bg-gradient-to-r from-orange-600/40 to-red-600/40 text-orange-100 border-orange-500/60 shadow-lg shadow-orange-500/20";
      case "diplomatic":
        return "bg-gradient-to-r from-red-500/30 to-pink-600/30 text-red-200 border-red-400/50 shadow-lg shadow-red-400/20";
      default:
        return "bg-red-500/30 text-red-200 border-red-500/50 shadow-lg shadow-red-500/20";
    }
  };

  const getSeverityBadge = (severity) => {
    if (!severity) return null;
    if (severity >= 8) return { label: "CRITICAL", color: "bg-red-600 text-white border-red-700 animate-pulse" };
    if (severity >= 6) return { label: "HIGH", color: "bg-red-500/80 text-white border-red-600" };
    if (severity >= 4) return { label: "MEDIUM", color: "bg-orange-500/80 text-white border-orange-600" };
    return { label: "LOW", color: "bg-yellow-500/80 text-white border-yellow-600" };
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 p-4 md:p-6 lg:p-12">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 md:mb-12">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 md:w-12 md:h-12 backdrop-blur-xl bg-red-500/20 border border-red-500/40 rounded-xl flex items-center justify-center">
                    <Skull className="w-5 h-5 md:w-6 md:h-6 text-red-400" />
                  </div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-red-500 tracking-tight">
                    WAR
                  </h1>
                </div>
                <p className="text-red-400/60 text-xs md:text-sm ml-13 md:ml-15">
                  Real-time global conflict monitoring
                </p>
              </div>

              <Button onClick={() => loadWarNews(false)} disabled={isRefreshing} className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white shadow-lg shadow-red-500/50 border border-red-500/30">
                {isRefreshing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Refresh
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-4 md:gap-8">
              <div className="backdrop-blur-xl bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 md:px-4 md:py-3">
                <div className="text-xl md:text-2xl font-bold text-red-400 mb-1">{news.length}</div>
                <div className="text-[10px] md:text-xs text-red-400/60 uppercase tracking-wider">Reports</div>
              </div>
              <div className="backdrop-blur-xl bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 md:px-4 md:py-3">
                <div className="text-xl md:text-2xl font-bold text-red-400 mb-1">
                  {formatDistanceToNow(lastUpdate, { addSuffix: true })}
                </div>
                <div className="text-[10px] md:text-xs text-red-400/60 uppercase tracking-wider">Updated</div>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-500/20 border border-red-500/40 rounded-lg flex items-center gap-3">
                <Flame className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              {["all", "Europe", "Middle East", "Africa", "Asia", "Americas"].map((region) => (
                <Button key={region} onClick={() => setSelectedRegion(region)} size="sm" className={selectedRegion === region ? "bg-red-500/30 border-red-500/50 text-red-200" : "bg-black/50 border-red-500/20 text-red-400/60 hover:bg-red-500/10"}>
                  {region === "all" ? "🌍 All" : region}
                </Button>
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <AnimatePresence>
              {news.filter(item => {
                if (selectedRegion === "all") return true;
                const location = item.location?.toLowerCase() || "";
                return location.includes(selectedRegion.toLowerCase());
              }).map((item, index) => {
                const severityBadge = getSeverityBadge(item.severity);
                return (
                  <motion.div key={`${item.title}-${index}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.03, type: "spring" }}>
                    <Card className="backdrop-blur-2xl bg-gradient-to-br from-red-950/40 via-black/60 to-black/80 border-red-500/40 hover:border-red-400/60 hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-300 h-full group">
                      <CardContent className="p-5 md:p-6">
                        <div className="flex items-start justify-between mb-3 gap-2">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className={getCategoryColor(item.category)}>
                              {item.category || 'news'}
                            </Badge>
                            {severityBadge && (
                              <Badge variant="outline" className={severityBadge.color}>
                                {severityBadge.label}
                              </Badge>
                            )}
                          </div>
                          {item.location && (
                            <div className="flex items-center gap-1 text-xs text-red-300/70 bg-red-950/50 px-2 py-1 rounded-md border border-red-500/30">
                              <MapPin className="w-3 h-3" />
                              <span className="font-medium">{item.location}</span>
                            </div>
                          )}
                        </div>

                        <h3 className="text-base md:text-lg font-bold text-red-300 group-hover:text-red-200 mb-3 line-clamp-2 transition-colors">{item.title}</h3>
                        <p className="text-xs md:text-sm text-red-400/70 mb-4 line-clamp-3 leading-relaxed">{item.summary}</p>

                        <div className="flex items-center justify-between text-xs text-red-500/50 mb-4 bg-black/40 rounded-lg p-2 border border-red-500/20">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {item.timestamp ? formatDistanceToNow(new Date(item.timestamp), { addSuffix: true }) : 'Recently'}
                          </span>
                          {item.source && (
                            <span className="flex items-center gap-1.5 font-medium">
                              <Globe className="w-3.5 h-3.5" />
                              {item.source}
                            </span>
                          )}
                        </div>

                        <Button onClick={() => handleAIAnalysis(item)} size="sm" className="w-full bg-gradient-to-r from-red-600/30 to-red-700/30 border border-red-500/50 hover:from-red-600/50 hover:to-red-700/50 hover:border-red-400/70 text-red-200 hover:text-red-100 shadow-lg shadow-red-900/30 transition-all duration-300">
                          <Brain className="w-4 h-4 mr-2" />
                          AI Analysis
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {news.length === 0 && (
            <div className="text-center py-20">
              <Skull className="w-16 h-16 text-red-500/40 mx-auto mb-4" />
              <p className="text-red-400/60 text-lg">No war news available</p>
              <Button onClick={() => loadWarNews(false)} className="mt-4 bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30">
                Load News
              </Button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedNewsForAnalysis && (
          <NewsAnalysisModal news={selectedNewsForAnalysis} onClose={() => setSelectedNewsForAnalysis(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}