import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  ArrowLeft, ExternalLink, Zap, Shield, Globe, Layers,
  TrendingUp, Clock, Users, Cpu, ChevronRight, Loader2, FlaskConical
} from "lucide-react";
// KAI chat is now global via layout/TTTV2

const FEATURES = [
  { icon: Zap, title: "10,000+ TPS", desc: "Kaspa processes thousands of transactions per second using its blockDAG architecture — faster than any other PoW chain.", color: "from-cyan-500 to-blue-500" },
  { icon: Shield, title: "Proof of Work", desc: "Secured by kHeavyHash — GPU-mineable, fair, and fully decentralized consensus. No staking, no validators, no trust assumptions.", color: "from-emerald-500 to-green-500" },
  { icon: Layers, title: "blockDAG", desc: "Unlike a blockchain, Kaspa's DAG allows multiple blocks created simultaneously. No orphan blocks, no wasted work — pure parallel processing.", color: "from-violet-500 to-purple-500" },
  { icon: Globe, title: "Fair Launch", desc: "No premine, no ICO, no VC funding. 100% community-driven from day one. The most fairly distributed cryptocurrency since Bitcoin.", color: "from-amber-500 to-orange-500" },
  { icon: Clock, title: "1-Second Blocks", desc: "Kaspa achieves 1-second block times with instant visual confirmation. Transactions settle in seconds, not minutes or hours.", color: "from-pink-500 to-rose-500" },
  { icon: Cpu, title: "GHOSTDAG Protocol", desc: "The PHANTOM GHOSTDAG protocol orders all blocks — even those created simultaneously — into a consistent, tamper-proof ledger.", color: "from-blue-500 to-indigo-500" },
];

const TIMELINE = [
  { year: "2021", event: "Kaspa mainnet launches with fair distribution — no premine, no ICO" },
  { year: "2022", event: "Network grows to thousands of miners; community governance forms" },
  { year: "2023", event: "kHeavyHash algorithm attracts GPU miners; hashrate explodes 100x" },
  { year: "2024", event: "KRC-20 token standard launches; Kasplex L2 goes live; 10 BPS achieved" },
  { year: "2025", event: "Rust node rewrite complete; 32 BPS target; growing DeFi ecosystem" },
];

export default function WhatIsKaspaPage() {
  const navigate = useNavigate();
  const [kasData, setKasData] = useState({ price: null, change24h: null, loading: true });
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [rdUpdates, setRdUpdates] = useState([]);
  const [loadingRd, setLoadingRd] = useState(true);

  useEffect(() => {
    loadKasPrice();
    loadKaspaNews();
    loadCoreRD();
  }, []);

  const loadKasPrice = async () => {
    try {
      const res = await base44.functions.invoke('getKaspaPrice', {});
      if (res.data?.price) {
        setKasData({ price: res.data.price, change24h: res.data.change24h || 0, loading: false });
      } else {
        setKasData(prev => ({ ...prev, loading: false }));
      }
    } catch {
      setKasData(prev => ({ ...prev, loading: false }));
    }
  };

  const loadKaspaNews = async () => {
    const cacheKey = 'kaspa_community_news';
    const cacheDate = 'kaspa_community_news_date';
    const today = new Date().toDateString();
    try {
      const cached = localStorage.getItem(cacheKey);
      const cachedDay = localStorage.getItem(cacheDate);
      if (cached && cachedDay === today) {
        setNews(JSON.parse(cached));
        setLoadingNews(false);
        return;
      }
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Search kaspa.news and the Kaspa community for the latest 6 real news articles, blog posts, or updates about Kaspa cryptocurrency. Include real headlines, brief summaries, source names, and approximate dates. Focus on: development updates, ecosystem news, mining updates, KRC-20 tokens, partnerships, exchange listings, and community milestones. Be factual — only include real news you can verify.`,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
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
                  date: { type: "string" },
                  category: { type: "string" }
                }
              }
            }
          }
        }
      });
      if (res?.articles?.length) {
        setNews(res.articles);
        localStorage.setItem(cacheKey, JSON.stringify(res.articles));
        localStorage.setItem(cacheDate, today);
      }
    } catch { }
    setLoadingNews(false);
  };

  const loadCoreRD = async () => {
    const cacheKey = 'kaspa_core_rd';
    const cacheDate = 'kaspa_core_rd_date';
    const today = new Date().toDateString();
    try {
      const cached = localStorage.getItem(cacheKey);
      const cachedDay = localStorage.getItem(cacheDate);
      if (cached && cachedDay === today) {
        setRdUpdates(JSON.parse(cached));
        setLoadingRd(false);
        return;
      }
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Search kaspa.news specifically for the latest Kaspa CORE R&D and protocol development updates. Focus exclusively on:
- Rust node rewrite progress (Rusty Kaspa / kaspad-rust)
- GHOSTDAG and DAGKnight protocol research & improvements
- Consensus layer changes, BPS (blocks per second) upgrades
- Pruning, archival node, and data layer improvements
- Smart contract / scripting layer development
- Core developer updates, GitHub commits, technical blog posts
- Network performance benchmarks and stress tests
- Any GIP (Governance Improvement Proposals) or protocol-level changes

Return 6 real, verifiable R&D updates from kaspa.news or official Kaspa developer channels. Be highly technical and factual. Include commit references or PR numbers if available.`,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: "object",
          properties: {
            updates: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  summary: { type: "string" },
                  source: { type: "string" },
                  date: { type: "string" },
                  category: { type: "string" }
                }
              }
            }
          }
        }
      });
      if (res?.updates?.length) {
        setRdUpdates(res.updates);
        localStorage.setItem(cacheKey, JSON.stringify(res.updates));
        localStorage.setItem(cacheDate, today);
      }
    } catch { }
    setLoadingRd(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-zinc-900 selection:bg-cyan-200/60">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 h-12 flex items-center justify-between px-5 bg-[#F5F5F7]/70 backdrop-blur-2xl backdrop-saturate-150 border-b border-zinc-200/50">
        <button onClick={() => navigate("/TTTV2")} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors text-[13px] font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to TTT
        </button>
        <span className="text-[15px] font-[900] tracking-tight">What is Kaspa?</span>
        <a href="https://kaspa.org" target="_blank" rel="noopener noreferrer" className="text-[13px] font-semibold text-cyan-600 hover:text-cyan-700 flex items-center gap-1">
          kaspa.org <ExternalLink className="w-3 h-3" />
        </a>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-16 sm:pt-32 sm:pb-24 px-5 text-center bg-gradient-to-b from-zinc-900 to-black text-white">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/13e8ec094_image.png"
            alt="Kaspa"
            className="w-16 h-16 rounded-full mx-auto mb-6 shadow-xl shadow-cyan-500/20"
          />
          <h1 className="text-4xl sm:text-6xl font-[900] tracking-tight mb-4">
            The World's Fastest<br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">Proof-of-Work</span> Crypto
          </h1>
          <p className="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            Kaspa is a revolutionary blockDAG cryptocurrency that achieves instant confirmations while maintaining the security guarantees of Bitcoin-class consensus. No premine. No ICO. Pure decentralization.
          </p>

          {/* Live price */}
          {!kasData.loading && kasData.price && (
            <div className="inline-flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-full px-6 py-3 ring-1 ring-white/10">
              <span className="text-2xl font-[900]">${kasData.price.toFixed(4)}</span>
              <span className={`text-sm font-bold ${kasData.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {kasData.change24h >= 0 ? '+' : ''}{kasData.change24h.toFixed(2)}%
              </span>
              <span className="text-xs text-zinc-500">24h</span>
            </div>
          )}
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-20 sm:py-28 px-5">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
            <p className="text-[13px] font-semibold text-zinc-400 tracking-wide uppercase mb-2">Technology</p>
            <h2 className="text-3xl sm:text-4xl font-[900] tracking-tight">Why Kaspa is different.</h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="bg-white rounded-2xl p-6 ring-1 ring-zinc-200/60 hover:ring-zinc-300 hover:shadow-xl transition-all duration-300">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 mb-2">{f.title}</h3>
                  <p className="text-[13px] text-zinc-500 leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 sm:py-28 px-5 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
            <p className="text-[13px] font-semibold text-zinc-400 tracking-wide uppercase mb-2">Architecture</p>
            <h2 className="text-3xl sm:text-4xl font-[900] tracking-tight">Blockchain vs blockDAG</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-zinc-50 rounded-2xl p-6 ring-1 ring-zinc-200/60">
              <h3 className="text-lg font-bold text-zinc-900 mb-3">Traditional Blockchain ⛓️</h3>
              <ul className="space-y-2 text-[13px] text-zinc-500">
                <li>• One block at a time — sequential processing</li>
                <li>• Orphan blocks are wasted work</li>
                <li>• Slow confirmations (10+ minutes)</li>
                <li>• Limited throughput</li>
                <li>• Miners compete, most lose</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-6 ring-1 ring-cyan-200/60">
              <h3 className="text-lg font-bold text-zinc-900 mb-3">Kaspa blockDAG 🔷</h3>
              <ul className="space-y-2 text-[13px] text-zinc-700">
                <li>• Many blocks created simultaneously — parallel</li>
                <li>• All blocks are included — no waste</li>
                <li>• 1-second block times, instant confirmation</li>
                <li>• 10,000+ transactions per second</li>
                <li>• All miners contribute, all are rewarded</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 sm:py-28 px-5">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
            <p className="text-[13px] font-semibold text-zinc-400 tracking-wide uppercase mb-2">History</p>
            <h2 className="text-3xl sm:text-4xl font-[900] tracking-tight">Kaspa timeline.</h2>
          </motion.div>

          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-400 via-blue-400 to-zinc-200" />
            <div className="space-y-6">
              {TIMELINE.map((t, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="pl-10 relative">
                  <div className="absolute left-2.5 top-1.5 w-3 h-3 bg-white ring-2 ring-cyan-400 rounded-full" />
                  <div className="text-sm font-[900] text-cyan-600 mb-1">{t.year}</div>
                  <div className="text-[13px] text-zinc-600 leading-relaxed">{t.event}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Core R&D Updates */}
      <section className="py-20 sm:py-28 px-5 bg-gradient-to-b from-violet-50 to-white">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wide uppercase mb-4">
              <FlaskConical className="w-3.5 h-3.5" /> Agent-Scraped from kaspa.news
            </div>
            <h2 className="text-3xl sm:text-4xl font-[900] tracking-tight">Core R&D Updates</h2>
            <p className="text-zinc-400 text-sm mt-2 max-w-xl mx-auto">Latest protocol development, Rust node progress, GHOSTDAG research, and consensus improvements — fetched daily.</p>
          </motion.div>

          {loadingRd ? (
            <div className="text-center py-12 text-zinc-400 text-sm">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Scanning kaspa.news for R&D updates…
            </div>
          ) : rdUpdates.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rdUpdates.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-2xl p-5 ring-1 ring-violet-200/60 hover:ring-violet-300 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md">{item.category || 'R&D'}</span>
                    {item.date && <span className="text-[10px] text-zinc-400">{item.date}</span>}
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 mb-2 line-clamp-2">{item.title}</h3>
                  <p className="text-[12px] text-zinc-500 leading-relaxed line-clamp-3">{item.summary}</p>
                  {item.source && (
                    <div className="mt-3 pt-2 border-t border-violet-100 text-[10px] text-zinc-400">
                      Source: {item.source}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-400 text-sm">No R&D updates available right now</div>
          )}
        </div>
      </section>

      {/* Community News */}
      <section className="py-20 sm:py-28 px-5 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
            <p className="text-[13px] font-semibold text-zinc-400 tracking-wide uppercase mb-2">Latest from the community</p>
            <h2 className="text-3xl sm:text-4xl font-[900] tracking-tight">Kaspa News</h2>
          </motion.div>

          {loadingNews ? (
            <div className="text-center py-12 text-zinc-400 text-sm">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Fetching latest Kaspa news…
            </div>
          ) : news.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {news.map((article, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-2xl p-5 ring-1 ring-zinc-200/60 hover:ring-zinc-300 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-md">{article.category || 'News'}</span>
                    {article.date && <span className="text-[10px] text-zinc-400">{article.date}</span>}
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 mb-2 line-clamp-2">{article.title}</h3>
                  <p className="text-[12px] text-zinc-500 leading-relaxed line-clamp-3">{article.summary}</p>
                  {article.source && (
                    <div className="mt-3 pt-2 border-t border-zinc-100 text-[10px] text-zinc-400">
                      Source: {article.source}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-400 text-sm">No news available right now</div>
          )}
        </div>
      </section>

      {/* Links */}
      <section className="py-20 sm:py-28 px-5 bg-gradient-to-b from-zinc-900 to-black text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-[900] tracking-tight mb-4">Learn more.</h2>
          <p className="text-zinc-400 text-sm mb-8">Explore the Kaspa ecosystem through these official resources.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href="https://kaspa.org" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 bg-cyan-500/10 px-5 py-2.5 rounded-full ring-1 ring-cyan-500/20 hover:ring-cyan-500/40 transition-all">
              kaspa.org <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a href="https://kasplex.org" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-violet-400 bg-violet-500/10 px-5 py-2.5 rounded-full ring-1 ring-violet-500/20 hover:ring-violet-500/40 transition-all">
              Kasplex L2 <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a href="https://kaspa.news" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-amber-400 bg-amber-500/10 px-5 py-2.5 rounded-full ring-1 ring-amber-500/20 hover:ring-amber-500/40 transition-all">
              kaspa.news <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a href="https://explorer.kaspa.org" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 bg-emerald-500/10 px-5 py-2.5 rounded-full ring-1 ring-emerald-500/20 hover:ring-emerald-500/40 transition-all">
              Explorer <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="mt-12">
            <Link to="/TTTV2">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                className="h-11 px-8 bg-white text-zinc-900 text-[14px] font-semibold rounded-full">
                ← Back to TTT 2.0
              </motion.button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}