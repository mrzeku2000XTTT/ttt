import React, { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  ArrowRight, CheckCircle2, Zap, Shield, Globe, Users, Layers,
  Rocket, Star, ChevronDown, ExternalLink, ArrowUpRight, Newspaper,
  Clock, MessageSquare, Sparkles
} from "lucide-react";

const ROADMAP = [
  {
    phase: "Phase 1",
    title: "Core Platform",
    status: "completed",
    items: [
      "TTT Community Feed with posts, comments & media uploads",
      "Kaspa wallet integration (Kasware, Kastle, MetaMask)",
      "KAS tipping on posts & comments",
      "Encrypted Notepad with Kaspa stamps",
      "User profiles & authentication system",
      "App Store with 80+ community-built apps",
    ],
  },
  {
    phase: "Phase 2",
    title: "Identity & Media",
    status: "completed",
    items: [
      "Agent ZK — cryptographic wallet identity system",
      "TTTV media browser & video player",
      "KRC-20 token tipping (PACMAN, NACHO, etc.)",
      "Grokipedia knowledge integration",
      "@zk AI bot with real-time web search & image gen",
      "Stamped News — blockchain-verified news publishing",
    ],
  },
  {
    phase: "Phase 3",
    title: "DeFi & Gaming",
    status: "completed",
    items: [
      "StakeDAG — KAS prediction markets with escrow",
      "KA-CHING automated betting rounds",
      "DAGKnight wallet with advanced analytics",
      "Kaspa L1 bridge & send functionality",
      "Bull Reels, badges & community rewards",
      "Hikaru AI image generation studio",
    ],
  },
  {
    phase: "Phase 4",
    title: "Expansion (Current)",
    status: "active",
    items: [
      "TTT 2.0 redesigned interface",
      "Agent ZK marketplace & connections",
      "KRC-20 cross-token swaps",
      "Mobile-optimized native experience",
      "Community governance & app voting",
      "Developer API & SDK platform",
    ],
  },
  {
    phase: "Phase 5",
    title: "Vision",
    status: "upcoming",
    items: [
      "Decentralized app publishing",
      "ZK-proof identity verification",
      "DAO treasury management",
      "Multi-chain bridging (ETH, SOL)",
      "AI agent-to-agent communication protocol",
    ],
  },
];

const FEATURES = [
  { icon: Zap, title: "Sub-Second Tips", desc: "Send KAS and KRC-20 tokens instantly on any post or comment." },
  { icon: Shield, title: "Agent ZK Identity", desc: "Cryptographic wallet verification without compromising privacy." },
  { icon: Globe, title: "80+ Apps", desc: "Community-built tools from prediction markets to AI studios." },
  { icon: Users, title: "Community Feed", desc: "Post, comment, stamp, and earn tips from the TTT community." },
  { icon: Layers, title: "Multi-Token", desc: "Support for KAS, PACMAN, NACHO and any KRC-20 token." },
  { icon: Rocket, title: "AI-Powered", desc: "@zk bot with real-time search, image gen, and knowledge base." },
];

function AnimatedCounter({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const end = target;
    const dur = 1500;
    const step = Math.ceil(end / (dur / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { start = end; clearInterval(timer); }
      setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

function RoadmapCard({ phase, index }) {
  const statusColors = {
    completed: "bg-emerald-500",
    active: "bg-cyan-500",
    upcoming: "bg-white/20",
  };
  const statusBorder = {
    completed: "border-emerald-500/30",
    active: "border-cyan-500/40 shadow-lg shadow-cyan-500/10",
    upcoming: "border-zinc-300/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.12 }}
      className={`relative bg-white rounded-2xl border ${statusBorder[phase.status]} p-6`}
    >
      {phase.status === "active" && (
        <div className="absolute -top-3 right-6">
          <span className="px-3 py-1 text-xs font-bold bg-cyan-500 text-white rounded-full shadow-lg shadow-cyan-500/30">
            CURRENT
          </span>
        </div>
      )}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-3 h-3 rounded-full ${statusColors[phase.status]} ${phase.status === 'active' ? 'animate-pulse' : ''}`} />
        <span className="text-xs font-bold text-zinc-400 tracking-widest uppercase">{phase.phase}</span>
      </div>
      <h3 className="text-xl font-bold text-zinc-900 mb-3">{phase.title}</h3>
      <ul className="space-y-2.5">
        {phase.items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            {phase.status === "completed" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            ) : phase.status === "active" ? (
              <div className="w-4 h-4 rounded-full border-2 border-cyan-500 mt-0.5 flex-shrink-0 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
              </div>
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-zinc-300 mt-0.5 flex-shrink-0" />
            )}
            <span className={`text-sm leading-relaxed ${phase.status === 'completed' ? 'text-zinc-500' : 'text-zinc-700'}`}>
              {item}
            </span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function NewsCard({ news }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white rounded-xl border border-zinc-200/80 p-5 hover:border-cyan-300/50 hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-600 border border-cyan-200/50">
          {news.tag}
        </span>
        <span className="text-[10px] text-zinc-400">{news.date}</span>
      </div>
      <h4 className="text-sm font-semibold text-zinc-900 mb-1.5 line-clamp-2">{news.title}</h4>
      <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3">{news.summary}</p>
    </motion.div>
  );
}

export default function TTTV2Page() {
  const { scrollYProgress } = useScroll();
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const [recentNews, setRecentNews] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      const [stamped, posts] = await Promise.all([
        base44.entities.StampedNews.list("-created_date", 6),
        base44.entities.Post.list("-created_date", 20),
      ]);

      setRecentNews(stamped.map(n => ({
        id: n.id,
        title: n.news_title,
        summary: n.news_summary || "",
        tag: n.news_category || "TTT News",
        date: new Date(n.created_date).toLocaleDateString(),
      })));

      setRecentPosts(
        posts
          .filter(p => !p.parent_post_id && p.content && p.content.length > 30)
          .slice(0, 6)
          .map(p => ({
            id: p.id,
            author: p.author_name,
            content: p.content.slice(0, 120),
            tips: p.tips_received || 0,
            likes: p.likes || 0,
            date: new Date(p.created_date).toLocaleDateString(),
          }))
      );
    } catch {
      // fallback — no news loaded
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC] text-zinc-900 overflow-x-hidden">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-3 flex items-center justify-between bg-[#FAFBFC]/80 backdrop-blur-xl border-b border-zinc-200/60">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-2xl font-black text-zinc-900 tracking-tight group-hover:text-cyan-600 transition-colors">TTT</span>
          <span className="text-[10px] font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-2 py-0.5 rounded-md">2.0</span>
        </Link>
        <Link to="/Feed">
          <button className="text-sm text-zinc-500 hover:text-zinc-900 font-medium transition-colors flex items-center gap-1.5">
            Back to Feed <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </Link>
      </div>

      {/* Hero */}
      <section className="relative pt-28 pb-16 md:pt-40 md:pb-28 px-4 sm:px-6">
        <motion.div style={{ y: bgY }} className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-[120px]" />
          <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-blue-500/8 rounded-full blur-[100px]" />
        </motion.div>

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-50 border border-cyan-200 rounded-full mb-6">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-cyan-700 tracking-wide">PHASE 4 IN PROGRESS</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight leading-[0.9] mb-5">
              <span className="bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900 bg-clip-text text-transparent">
                The Future of
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">TTT</span>
            </h1>

            <p className="text-base md:text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed mb-8">
              From community feed to prediction markets, AI agents to KRC-20 tipping — see everything we've built and what's coming next.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/Feed">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="h-11 px-7 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-zinc-900/20">
                  Enter TTT Feed <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
              <a href="#roadmap">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="h-11 px-7 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold rounded-xl border border-zinc-200 transition-colors flex items-center gap-2">
                  View Roadmap <ChevronDown className="w-4 h-4" />
                </motion.button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 sm:px-6 border-y border-zinc-200/60 bg-white">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12">
          {[
            { label: "Active Users", value: 12500, suffix: "+" },
            { label: "Feed Posts", value: 25000, suffix: "+" },
            { label: "KAS Tipped", value: 45000, suffix: "+" },
            { label: "Apps Built", value: 80, suffix: "+" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
              <div className="text-2xl md:text-4xl font-black text-zinc-900 mb-1">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-sm text-zinc-400 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* TTT News Section */}
      {(recentNews.length > 0 || recentPosts.length > 0) && (
        <section className="py-16 md:py-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-full mb-4">
                <Newspaper className="w-3.5 h-3.5 text-cyan-500" />
                <span className="text-xs font-semibold text-zinc-600 tracking-wide">LATEST FROM TTT</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-zinc-900 mb-3">TTT Network Updates</h2>
              <p className="text-zinc-500 max-w-md mx-auto text-sm">What's happening across the TTT community right now.</p>
            </motion.div>

            {recentNews.length > 0 && (
              <div className="mb-10">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-500" /> Stamped News
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentNews.map(n => <NewsCard key={n.id} news={n} />)}
                </div>
              </div>
            )}

            {recentPosts.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-cyan-500" /> Trending Posts
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentPosts.map(p => (
                    <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                      className="bg-white rounded-xl border border-zinc-200/80 p-5 hover:border-cyan-300/50 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-zinc-700">{p.author}</span>
                        <span className="text-[10px] text-zinc-400">{p.date}</span>
                      </div>
                      <p className="text-xs text-zinc-600 leading-relaxed line-clamp-3 mb-2">{p.content}</p>
                      <div className="flex items-center gap-3 text-[10px] text-zinc-400">
                        {p.tips > 0 && <span className="text-cyan-600 font-semibold">💰 {p.tips} KAS</span>}
                        {p.likes > 0 && <span>❤️ {p.likes}</span>}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-16 md:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-black text-zinc-900 mb-3">What TTT Offers</h2>
            <p className="text-zinc-500 max-w-lg mx-auto text-sm">Everything built into the TTT platform today.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div key={feat.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }} transition={{ delay: i * 0.08 }} whileHover={{ y: -3 }}
                  className="bg-zinc-50 rounded-2xl border border-zinc-200/80 p-5 hover:border-cyan-300/50 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-300">
                  <div className="w-9 h-9 bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200/50 rounded-xl flex items-center justify-center mb-3">
                    <Icon className="w-4 h-4 text-cyan-600" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 mb-1.5">{feat.title}</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">{feat.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section id="roadmap" className="py-16 md:py-24 px-4 sm:px-6 bg-gradient-to-b from-zinc-50 to-white">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-full mb-4">
              <Star className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-zinc-600 tracking-wide">ROADMAP</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-zinc-900 mb-3">Where We've Been & Where We're Going</h2>
            <p className="text-zinc-500 max-w-lg mx-auto text-sm">A transparent view of TTT's development journey.</p>
          </motion.div>

          <div className="relative">
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-500/40 via-cyan-500/40 to-zinc-200/40" />
            <div className="grid md:grid-cols-2 gap-5">
              {ROADMAP.map((phase, i) => (
                <RoadmapCard key={phase.phase} phase={phase} index={i} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-3xl p-8 md:p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px]" />
            <div className="relative">
              <h2 className="text-2xl md:text-3xl font-black text-white mb-3">Join the TTT Community</h2>
              <p className="text-zinc-400 max-w-md mx-auto mb-6 text-sm leading-relaxed">
                Post, tip, predict, and build with the Kaspa community. Your journey starts now.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/Feed">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className="h-11 px-7 bg-white text-zinc-900 font-semibold rounded-xl hover:bg-zinc-100 transition-colors flex items-center gap-2">
                    Enter Feed <ArrowUpRight className="w-4 h-4" />
                  </motion.button>
                </Link>
                <Link to="/AgentZK">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className="h-11 px-7 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-colors flex items-center gap-2">
                    Claim Agent ZK <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 sm:px-6 border-t border-zinc-200/60">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-xs text-zinc-400">TTT 2.0 — Built on Kaspa</span>
          <div className="flex items-center gap-4">
            <a href="https://kaspa.org" target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors flex items-center gap-1">
              Kaspa <ExternalLink className="w-3 h-3" />
            </a>
            <a href="https://kasplex.org" target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors flex items-center gap-1">
              Kasplex <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}