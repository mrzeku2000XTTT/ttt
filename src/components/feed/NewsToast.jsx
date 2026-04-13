import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Newspaper, ExternalLink, ChevronRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";

const NEWS_ITEMS = [
  { id: 1, title: "Kaspa DAGKnight Consensus Upgrade", summary: "The latest consensus protocol brings faster finality and enhanced security to the Kaspa network.", tag: "Protocol" },
  { id: 2, title: "TTT Platform v2.0 Preview Available", summary: "Explore the new light-mode interface and animated roadmap for the next generation of TTT.", tag: "TTT" },
  { id: 3, title: "KRC-20 Token Standard Update", summary: "New improvements to the KRC-20 standard enable more efficient token operations on Kaspa.", tag: "Tokens" },
  { id: 4, title: "Community Growth Milestone", summary: "TTT community has surpassed a new milestone in active daily users and transactions.", tag: "Community" },
];

export default function NewsToast() {
  const [visible, setVisible] = useState(false);
  const [currentNews, setCurrentNews] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [liveNews, setLiveNews] = useState([]);

  useEffect(() => {
    // Clear previous session dismissal on fresh mount so toast always shows on Feed entry
    fetchNews();
    const showTimer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!visible || dismissed) return;
    const items = liveNews.length > 0 ? liveNews : NEWS_ITEMS;
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentNews((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [visible, dismissed, liveNews]);

  const fetchNews = async () => {
    try {
      const stamped = await base44.entities.StampedNews.list("-created_date", 5);
      if (stamped.length > 0) {
        setLiveNews(
          stamped.map((n) => ({
            id: n.id,
            title: n.news_title,
            summary: n.news_summary || "Latest update from the TTT network.",
            tag: n.news_category || "News",
          }))
        );
      }
    } catch {
      // fallback to static
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem("news_toast_dismissed", "true");
  };

  const items = liveNews.length > 0 ? liveNews : NEWS_ITEMS;
  const news = items[currentNews] || items[0];

  if (dismissed || !visible || !news) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 100, opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed left-3 right-3 md:left-auto md:right-6 z-[100] md:max-w-sm"
        style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="relative bg-black/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
          {/* Progress bar */}
          <motion.div
            key={currentNews}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 5, ease: "linear" }}
            className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 origin-left"
          />

          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-lg flex items-center justify-center">
                  <Newspaper className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <span className="text-white/50 text-xs font-medium tracking-wider uppercase">
                  Live Update
                </span>
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              </div>
              <button
                onClick={handleDismiss}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* News content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={news.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 whitespace-nowrap">
                    {news.tag}
                  </span>
                </div>
                <h4 className="text-white text-sm font-semibold leading-snug mb-1">
                  {news.title}
                </h4>
                <p className="text-white/45 text-xs leading-relaxed line-clamp-2">
                  {news.summary}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Footer with View V2 and dots */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/8">
              <div className="flex items-center gap-1.5">
                {items.slice(0, 4).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentNews(i)}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === currentNews
                        ? "w-4 bg-cyan-400"
                        : "w-1.5 bg-white/20 hover:bg-white/40"
                    }`}
                  />
                ))}
              </div>

              <Link
                to="/TTTV2"
                className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors group"
              >
                <Sparkles className="w-3 h-3" />
                View TTT 2.0
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}