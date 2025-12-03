import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ExternalLink, RefreshCw, Loader2, MapPin, Clock, Globe, Stamp, Sparkles, Brain } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import NewsAnalysisModal from "@/components/NewsAnalysisModal";

export default function GlobalWarPage() {
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [error, setError] = useState(null);
  const [kaswareWallet, setKaswareWallet] = useState({ connected: false, address: null });
  const [stampingNewsId, setStampingNewsId] = useState(null);
  const [selectedNewsForAnalysis, setSelectedNewsForAnalysis] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState("all");

  useEffect(() => {
    loadWarNews().catch(err => {
      console.error('Init error:', err);
      setError('Failed to load');
      setIsLoading(false);
      setNews([{
        title: "System Error",
        summary: "Unable to load war news. Please refresh the page.",
        category: "system",
        location: "Global",
        source: "TTT Monitor",
        timestamp: new Date().toISOString()
      }]);
    });
    
    checkKasware().catch(() => {});
    
    const interval = setInterval(() => {
      loadWarNews(true).catch(() => {});
    }, 300000);
    
    return () => clearInterval(interval);
  }, []);

  const checkKasware = async () => {
    if (typeof window.kasware !== 'undefined') {
      try {
        const accounts = await window.kasware.getAccounts();
        if (accounts.length > 0) {
          setKaswareWallet({ connected: true, address: accounts[0] });
        }
      } catch (err) {
        console.log('Kasware not connected');
      }
    }
  };

  const connectKasware = async () => {
    if (typeof window.kasware === 'undefined') {
      setError('Kasware wallet not found. Please install Kasware extension.');
      return;
    }

    try {
      const accounts = await window.kasware.requestAccounts();
      setKaswareWallet({ connected: true, address: accounts[0] });
      setError(null);
    } catch (err) {
      setError('Failed to connect Kasware: ' + err.message);
    }
  };

  const loadWarNews = async (isAutoRefresh = false) => {
    if (!isAutoRefresh) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    
    setError(null);
    let cachedData = [];
    
    try {
      console.log('🌍 Fetching war news...');
      
      // Load from localStorage first
      try {
        const cached = localStorage.getItem('global_war_news');
        if (cached) {
          cachedData = JSON.parse(cached);
          if (!isAutoRefresh && cachedData.length > 0) {
            setNews(cachedData);
            console.log(`📦 Loaded ${cachedData.length} cached news items`);
          }
        }
      } catch (parseErr) {
        console.log('⚠️ Cache error:', parseErr);
        cachedData = [];
      }

      let allNewItems = [];

      // Try aggregateWarNews first
      try {
        const response = await base44.functions.invoke('aggregateWarNews', {});
        if (response?.data?.news?.length > 0) {
          allNewItems = response.data.news;
        }
      } catch (e) {
        console.log('⚠️ aggregateWarNews failed');
      }

      // Fallback to InvokeLLM
      if (allNewItems.length < 5) {
        try {
          const llmResponse = await base44.integrations.Core.InvokeLLM({
            prompt: `Search for the LATEST global war, conflict, and crisis news from the past 24 hours. Provide 20 unique news items with: title, summary (max 200 chars), category (conflict/humanitarian/military), location, source, timestamp.`,
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
                      timestamp: { type: "string" }
                    }
                  }
                }
              }
            }
          });

          if (llmResponse?.news?.length > 0) {
            allNewItems = [...allNewItems, ...llmResponse.news];
          }
        } catch (e) {
          console.log('⚠️ LLM failed');
        }
      }

      // ALWAYS have fallback data
      if (allNewItems.length === 0) {
        allNewItems = [
          {
            title: "Global Conflict Monitoring Active",
            summary: "Real-time war monitoring system is loading. Click refresh to update.",
            category: "system",
            location: "Global",
            source: "TTT Monitor",
            timestamp: new Date().toISOString()
          }
        ];
      }

      // Merge with cache
      const existingTitles = new Set(cachedData.map(item => item?.title?.toLowerCase()).filter(Boolean));
      const uniqueNewItems = allNewItems.filter(item => 
        item?.title && !existingTitles.has(item.title.toLowerCase())
      );

      const updatedNews = [...uniqueNewItems, ...cachedData].slice(0, 100);

      setNews(updatedNews);
      
      try {
        localStorage.setItem('global_war_news', JSON.stringify(updatedNews));
      } catch (e) {}
      
      setLastUpdate(Date.now());

    } catch (error) {
      console.error('❌ Load failed:', error);
      setError('Failed to load. Click refresh.');
      
      // FORCE fallback to prevent white screen
      const fallbackNews = cachedData.length > 0 ? cachedData : [{
        title: "System Loading",
        summary: "War monitoring system is initializing. Please refresh the page.",
        category: "system",
        location: "Global",
        source: "TTT Monitor",
        timestamp: new Date().toISOString()
      }];
      
      setNews(fallbackNews);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleStampNews = async (newsItem) => {
    if (!kaswareWallet.connected) {
      setError('Please connect Kasware wallet first to stamp news');
      await connectKasware();
      return;
    }

    const newsId = newsItem.title;
    setStampingNewsId(newsId);
    setError(null);

    try {
      console.log('📝 Step 1: Generating AI blog content...');
      
      // Generate blog content using AI
      const blogResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `Write a comprehensive, well-structured blog post about this breaking news:

Title: ${newsItem.title}
Summary: ${newsItem.summary}
Location: ${newsItem.location}
Category: ${newsItem.category}

Create a detailed blog post (500-800 words) that:
- Provides context and background
- Explains the significance
- Analyzes potential implications
- Maintains journalistic objectivity
- Uses clear, engaging language

Format the response as markdown with proper headings, paragraphs, and structure.`,
        add_context_from_internet: true
      });

      console.log('✅ Blog content generated');
      console.log('🔐 Step 2: Requesting Kasware signature...');

      // Create message to sign
      const message = `TTT News Stamp\n\nTitle: ${newsItem.title}\nDate: ${new Date().toISOString()}\nStamper: ${kaswareWallet.address}`;

      // Request signature from Kasware
      const signature = await window.kasware.signMessage(message);
      
      console.log('✅ Signature received');
      console.log('💾 Step 3: Saving stamped news to database...');

      // Save to database
      const stampedNews = await base44.entities.StampedNews.create({
        news_title: newsItem.title,
        news_summary: newsItem.summary,
        news_category: newsItem.category,
        news_location: newsItem.location,
        news_source: newsItem.source,
        news_timestamp: newsItem.timestamp,
        blog_content: blogResponse,
        stamper_address: kaswareWallet.address,
        signature: signature,
        stamped_date: new Date().toISOString(),
        views: 0,
        likes: 0
      });

      console.log('✅ Stamped news saved with ID:', stampedNews.id);
      
      setError(null);
      alert(`✅ News stamped successfully!\n\nYour AI-generated blog has been created and signed with your Kasware wallet.`);

    } catch (error) {
      console.error('❌ Failed to stamp news:', error);
      
      if (error.message && error.message.includes('User reject')) {
        setError('Signature cancelled by user');
      } else {
        setError('Failed to stamp news: ' + error.message);
      }
    } finally {
      setStampingNewsId(null);
    }
  };

  const handleAIAnalysis = async (newsItem) => {
    setError(null);
    
    try {
      console.log('🧠 Preparing AI analysis for:', newsItem.title);
      
      // Check if this news has been stamped
      const stampedNews = await base44.entities.StampedNews.filter({
        news_title: newsItem.title
      });
  
      if (stampedNews.length > 0) {
        // Use existing stamped news ID
        console.log('✅ Found existing stamped news:', stampedNews[0].id);
        setSelectedNewsForAnalysis({ ...newsItem, id: stampedNews[0].id });
      } else {
        // Need to stamp first - create a temporary stamped entry for analysis
        console.log('📝 Creating temporary StampedNews entry for AI analysis...');
        
        try {
          const tempStamp = await base44.entities.StampedNews.create({
            news_title: newsItem.title,
            news_summary: newsItem.summary,
            news_category: newsItem.category,
            news_location: newsItem.location,
            news_source: newsItem.source,
            news_timestamp: newsItem.timestamp,
            blog_content: "", // Placeholder - not needed for analysis
            stamper_address: "system_analysis", // System-generated
            signature: `analysis_${Date.now()}`, // Unique placeholder
            stamped_date: new Date().toISOString(),
            views: 0,
            likes: 0
          });
          
          console.log('✅ Temporary StampedNews entry created with ID:', tempStamp.id);
          setSelectedNewsForAnalysis({ ...newsItem, id: tempStamp.id });
          
        } catch (createError) {
          console.error('❌ Failed to create temporary stamp:', createError);
          setError('Failed to prepare analysis. Please try again or stamp the news first.');
          return;
        }
      }
    } catch (err) {
      console.error('❌ Failed to prepare AI analysis:', err);
      setError('Failed to start AI analysis. Please try again.');
    }
  };

  const getCategoryColor = (category) => {
    switch (category?.toLowerCase()) {
      case "conflict":
      case "military":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      case "humanitarian":
      case "crisis":
        return "bg-orange-500/20 text-orange-300 border-orange-500/30";
      case "diplomatic":
      case "peace":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "system":
      case "error":
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
      default:
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
    }
  };

  if (isLoading && news.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-400 animate-spin mx-auto mb-4" />
          <p className="text-white font-semibold text-xl mb-2">Loading Global War Monitor...</p>
          <p className="text-gray-500 text-sm">Fetching latest conflict updates</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 p-4 md:p-6 lg:p-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 md:mb-12"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 md:w-12 md:h-12 backdrop-blur-xl bg-red-500/20 border border-red-500/30 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-red-400" />
                  </div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                    Global War Monitor
                  </h1>
                </div>
                <p className="text-gray-400 text-xs md:text-sm ml-13 md:ml-15">
                  Real-time conflict tracking & humanitarian crisis updates
                </p>
              </div>

              <div className="flex gap-3">
                {!kaswareWallet.connected && (
                  <Button
                    onClick={connectKasware}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg shadow-orange-500/50"
                  >
                    <Stamp className="w-4 h-4 mr-2" />
                    Connect Kasware
                  </Button>
                )}

                <Button
                  onClick={() => loadWarNews(false)}
                  disabled={isRefreshing}
                  className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg shadow-red-500/50"
                >
                  {isRefreshing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Refresh News
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-4 md:gap-8">
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg px-3 py-2 md:px-4 md:py-3">
                <div className="text-xl md:text-2xl font-bold text-white mb-1">{news.length}</div>
                <div className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider">Active Reports</div>
              </div>
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg px-3 py-2 md:px-4 md:py-3">
                <div className="text-xl md:text-2xl font-bold text-red-400 mb-1">
                  {formatDistanceToNow(lastUpdate, { addSuffix: true })}
                </div>
                <div className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider">Last Update</div>
              </div>
              {kaswareWallet.connected && (
                <div className="backdrop-blur-xl bg-orange-500/20 border border-orange-500/30 rounded-lg px-3 py-2 md:px-4 md:py-3">
                  <div className="text-xs md:text-sm font-mono text-orange-300">
                    {kaswareWallet.address.substring(0, 10)}...
                  </div>
                  <div className="text-[10px] text-orange-400 uppercase tracking-wider">Kasware Connected</div>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            {/* Region Filter */}
            <div className="mt-6 flex flex-wrap gap-2">
              {["all", "Europe", "Middle East", "Africa", "Asia", "Americas"].map((region) => (
                <Button
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  size="sm"
                  className={selectedRegion === region 
                    ? "bg-red-500/30 border-red-500/50 text-white" 
                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"}
                >
                  {region === "all" ? "🌍 All Regions" : region}
                </Button>
              ))}
            </div>
          </motion.div>

          {/* News Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <AnimatePresence>
              {news
                .filter(item => {
                  if (selectedRegion === "all") return true;
                  const location = item.location?.toLowerCase() || "";
                  const region = selectedRegion.toLowerCase();
                  
                  // Check if location contains region keywords
                  if (region === "africa") {
                    return location.includes("africa") || 
                           location.includes("sudan") || 
                           location.includes("ethiopia") || 
                           location.includes("somalia") ||
                           location.includes("nigeria") ||
                           location.includes("sahel") ||
                           location.includes("drc") ||
                           location.includes("congo") ||
                           location.includes("kenya") ||
                           location.includes("south africa") ||
                           location.includes("mali") ||
                           location.includes("burkina faso") ||
                           location.includes("niger") ||
                           location.includes("chad") ||
                           location.includes("mozambique") ||
                           location.includes("uganda") ||
                           location.includes("rwanda") ||
                           location.includes("zimbabwe") ||
                           location.includes("libya") ||
                           location.includes("egypt") ||
                           location.includes("tunisia") ||
                           location.includes("algeria") ||
                           location.includes("morocco");
                  }
                  if (region === "middle east") {
                    return location.includes("middle east") ||
                           location.includes("israel") ||
                           location.includes("gaza") ||
                           location.includes("palestine") ||
                           location.includes("syria") ||
                           location.includes("yemen") ||
                           location.includes("lebanon") ||
                           location.includes("iraq") ||
                           location.includes("iran");
                  }
                  if (region === "europe") {
                    return location.includes("europe") ||
                           location.includes("ukraine") ||
                           location.includes("russia") ||
                           location.includes("poland") ||
                           location.includes("belarus");
                  }
                  return location.includes(region);
                })
                .map((item, index) => (
                <motion.div
                  key={`${item.title}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="backdrop-blur-xl bg-white/5 border-white/10 hover:bg-white/10 transition-all h-full">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant="outline" className={getCategoryColor(item.category)}>
                          {item.category || 'news'}
                        </Badge>
                        {item.location && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />
                            {item.location}
                          </div>
                        )}
                      </div>

                      <h3 className="text-base md:text-lg font-bold text-white mb-2 line-clamp-2">
                        {item.title}
                      </h3>

                      <p className="text-xs md:text-sm text-gray-400 mb-4 line-clamp-3">
                        {item.summary}
                      </p>

                      <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.timestamp ? formatDistanceToNow(new Date(item.timestamp), { addSuffix: true }) : 'Recently'}
                        </span>
                        {item.source && (
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {item.source}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2 pt-3 border-t border-white/10">
                         {/* AI Analysis Button */}
                        <Button
                          onClick={() => handleAIAnalysis(item)}
                          size="sm"
                          className="flex-1 bg-cyan-500/20 border border-cyan-500 hover:bg-cyan-500/30 text-cyan-400 text-xs"
                        >
                          <Brain className="w-3 h-3 mr-1" />
                          AI Analysis
                        </Button>

                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1"
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full bg-white/5 border-white/10 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 text-xs"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Read
                            </Button>
                          </a>
                        )}

                        <Button
                          onClick={() => handleStampNews(item)}
                          disabled={!kaswareWallet.connected || stampingNewsId === item.title}
                          variant="outline"
                          size="sm"
                          className={`flex-1 bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30 text-orange-300 hover:from-orange-500/30 hover:to-red-500/30 text-xs ${
                            !kaswareWallet.connected ? 'opacity-50' : ''
                          }`}
                        >
                          {stampingNewsId === item.title ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Stamping...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3 mr-1" />
                              KAS Stamp
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {news.length === 0 && !isLoading && (
            <div className="text-center py-20">
              <Globe className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No war news available at the moment</p>
              <Button
                onClick={() => loadWarNews(false)}
                className="mt-4 bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                Try Loading Again
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Analysis Modal */}
      <AnimatePresence>
        {selectedNewsForAnalysis && (
          <NewsAnalysisModal
            news={selectedNewsForAnalysis}
            onClose={() => setSelectedNewsForAnalysis(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}