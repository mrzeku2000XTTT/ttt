import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { X, Newspaper, ChevronRight, Sparkles, GripHorizontal, Minus, Rocket } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getLatestUpdates } from "./tttUpdates";

const FALLBACK_ITEMS = [
  { id: "kaspa_toccata_mainnet", title: "Toccata Hard Fork Activating on Mainnet", summary: "Kaspa's largest upgrade ever is live in late June 2026 — native tokens, covenants, ZK verification, and DeFi support all land on L1.", tag: "Kaspa" },
  { id: "kaspa_htx_upgrade", title: "HTX Supports Kaspa Toccata Upgrade", summary: "Exchange HTX has announced support for the Kaspa network upgrade, temporarily pausing deposits/withdrawals for a smooth mainnet transition.", tag: "Kaspa" },
  { id: "kaspa_dagknight_q3", title: "DAGKnight Consensus Upgrade Coming Q3 2026", summary: "After Toccata, the next milestone is the DAGKnight consensus upgrade aimed at faster finality and improved network scalability.", tag: "Kaspa" },
  { id: "kaspa_native_tokens", title: "Native Tokens & NFTs Now Possible on Kaspa L1", summary: "With the Toccata hard fork, native token issuance and NFT standards become available directly on the Kaspa base layer without bridges.", tag: "Kaspa" },
  { id: "ttt_feed", title: "TTT Feed Now Live", summary: "Share posts, tip creators with KAS, and interact with the @zk AI bot.", tag: "TTT" },
  { id: "agent_zk", title: "Agent ZK Identity", summary: "Verify your wallet and claim your cryptographic Agent ZK identity.", tag: "Agent ZK" },
  { id: "kaspaforge_new", title: "KaspaForge — Deploy Smart Contracts", summary: "Deploy timelocks, escrows, and vesting schedules on Kaspa — no coding needed. Connect Kasware and go.", tag: "New App" },
];

// Always-fresh TTT platform updates (prepended to every rotation)
const PLATFORM_UPDATES = getLatestUpdates(3);

export default function NewsToast() {
  const [visible, setVisible] = useState(false);
  const [currentNews, setCurrentNews] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [liveNews, setLiveNews] = useState([]);
  const constraintsRef = useRef(null);

  useEffect(() => {
    fetchDailyKaspaNews();
    const showTimer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!visible || dismissed || minimized) return;
    const kaspaItems = liveNews.length > 0 ? liveNews : FALLBACK_ITEMS;
    const items = [...PLATFORM_UPDATES, ...kaspaItems];
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentNews((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [visible, dismissed, minimized, liveNews]);

  const fetchDailyKaspaNews = async () => {
    const cacheKey = 'kaspa_toast_news';
    const cacheDate = 'kaspa_toast_news_date';
    const cacheVersion = 'kaspa_toast_news_v';
    const CURRENT_VERSION = '2026-06-27';
    // Bust cache if version changed
    if (localStorage.getItem(cacheVersion) !== CURRENT_VERSION) {
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(cacheDate);
      localStorage.setItem(cacheVersion, CURRENT_VERSION);
    }
    const today = new Date().toDateString();
    try {
      const cached = localStorage.getItem(cacheKey);
      const cachedDay = localStorage.getItem(cacheDate);
      if (cached && cachedDay === today) {
        setLiveNews(JSON.parse(cached));
        return;
      }
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Give me 4 brief, real Kaspa (KAS) blockchain news or community updates as of late June 2026. Key context: The Toccata hard fork is activating on mainnet in late June 2026, bringing native tokens, covenants, ZK verification, and DeFi to Kaspa L1. HTX exchange announced support for the upgrade. DAGKnight consensus upgrade is planned for Q3 2026. Topics: Toccata mainnet status, hashrate, exchange listings, ecosystem apps, KRC-20, community milestones. Be factual and current.`,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  summary: { type: "string" },
                  tag: { type: "string" }
                }
              }
            }
          }
        }
      });
      if (res?.items?.length) {
        const mapped = res.items.map((n, i) => ({ id: `k_${i}`, ...n }));
        setLiveNews(mapped);
        localStorage.setItem(cacheKey, JSON.stringify(mapped));
        localStorage.setItem(cacheDate, today);
      }
    } catch {
      // fallback to static items
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem("news_toast_dismissed", "true");
  };

  const kaspaItems = liveNews.length > 0 ? liveNews : FALLBACK_ITEMS;
  const items = [...PLATFORM_UPDATES, ...kaspaItems];
  const news = items[currentNews] || items[0];

  if (dismissed || !visible || !news) return null;

  return (
    <>
      {/* Invisible drag constraint boundary */}
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[99]" />

      <AnimatePresence>
        <motion.div
          drag
          dragConstraints={constraintsRef}
          dragElastic={0.1}
          dragMomentum={false}
          initial={{ y: 60, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 60, opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed z-[100] touch-none lg:left-3 lg:right-auto right-3"
          style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))', left: minimized ? undefined : undefined }}
        >
          {minimized ? (
            <MinimizedPill
              news={news}
              onExpand={() => setMinimized(false)}
              onDismiss={handleDismiss}
            />
          ) : (
            <ExpandedToast
              news={news}
              items={items}
              currentNews={currentNews}
              setCurrentNews={setCurrentNews}
              onMinimize={() => setMinimized(true)}
              onDismiss={handleDismiss}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}

function MinimizedPill({ news, onExpand, onDismiss }) {
  return (
    <div
      className="flex items-center gap-2 bg-black/95 backdrop-blur-2xl border border-white/15 rounded-full px-3 py-2 shadow-2xl shadow-black/60 cursor-grab active:cursor-grabbing"
    >
      <GripHorizontal className="w-3 h-3 text-white/30 flex-shrink-0" />
      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
      <button onClick={onExpand} className="flex items-center gap-2 min-w-0">
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 whitespace-nowrap flex-shrink-0">
          {news.tag}
        </span>
        <span className="text-white/80 text-xs font-medium truncate max-w-[140px]">
          {news.title}
        </span>
      </button>
      <button
        onClick={onDismiss}
        className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 text-white/40 hover:text-white flex-shrink-0"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

function ExpandedToast({ news, items, currentNews, setCurrentNews, onMinimize, onDismiss }) {
  return (
    <div className="relative bg-black/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden max-w-sm cursor-grab active:cursor-grabbing">
      {/* Progress bar */}
      <motion.div
        key={currentNews}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 5, ease: "linear" }}
        className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 origin-left"
      />

      <div className="p-3.5">
        {/* Header with drag handle */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <GripHorizontal className="w-4 h-4 text-white/25" />
            <div className="w-6 h-6 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-lg flex items-center justify-center">
              <Newspaper className="w-3 h-3 text-cyan-400" />
            </div>
            <span className="text-white/50 text-[10px] font-medium tracking-wider uppercase">TTT News</span>
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onMinimize}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all"
              title="Minimize"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDismiss}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
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
            <div className="flex items-start gap-2 mb-1.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap flex items-center gap-1 ${
                news.isPlatformUpdate
                  ? "bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 border border-pink-500/30"
                  : "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20"
              }`}>
                {news.isPlatformUpdate && <Rocket className="w-2.5 h-2.5" />}
                {news.tag}
              </span>
            </div>
            <h4 className="text-white text-sm font-semibold leading-snug mb-1">
              {news.title}
            </h4>
            <p className="text-white/80 text-xs leading-relaxed line-clamp-2">
              {news.summary}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-white/8">
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
            to={news.link || "/"}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors group ${
              news.isPlatformUpdate ? "text-pink-400 hover:text-pink-300" : "text-cyan-400 hover:text-cyan-300"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            {news.isPlatformUpdate ? "Open" : "More"}
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}