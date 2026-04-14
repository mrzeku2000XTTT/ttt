import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  ArrowLeft, ArrowUpRight, Sparkles, Zap, Brain, Shield,
  Gamepad2, Palette, TrendingUp, Users, Globe, Rocket,
  Search, ChevronRight, Star, Eye
} from "lucide-react";

const FEATURED = [
  {
    title: "Agent ZK",
    desc: "Your cryptographic identity on the blockDAG. Verify wallets, build trust, own your digital self.",
    path: "/AgentZK",
    gradient: "from-violet-600 via-purple-600 to-indigo-700",
    icon: Shield,
    tag: "Identity",
  },
  {
    title: "StakeDAG",
    desc: "Prediction markets powered by Kaspa. Bet on outcomes, earn rewards, shape the future.",
    path: "/StakeDAG",
    gradient: "from-amber-500 via-orange-500 to-red-500",
    icon: TrendingUp,
    tag: "DeFi",
  },
  {
    title: "Hikaru",
    desc: "AI image generation studio. Turn words into stunning visuals in seconds.",
    path: "/Hikaru",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    icon: Sparkles,
    tag: "Create",
  },
];

const CATEGORIES = [
  {
    name: "Create",
    icon: Palette,
    color: "text-pink-400",
    bg: "bg-pink-500/10 ring-pink-500/20",
    apps: [
      { name: "Xunhua", desc: "Sketch → AI art", path: "/Xunhua" },
      { name: "Hikaru", desc: "Text → image", path: "/Hikaru" },
      { name: "Speed", desc: "Quick image gen", path: "/Speed" },
      { name: "Canvas", desc: "Template studio", path: "/Canvas" },
      { name: "Prompto", desc: "Prompt engineering", path: "/Prompto" },
    ],
  },
  {
    name: "Finance",
    icon: Zap,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 ring-cyan-500/20",
    apps: [
      { name: "Send KAS", desc: "L1 ↔ L2 bridge", path: "/Bridge" },
      { name: "Terra", desc: "Wallet manager", path: "/Terra" },
      { name: "DAGKnight", desc: "Multi-wallet", path: "/DAGKnightWallet" },
      { name: "StakeDAG", desc: "Predictions", path: "/StakeDAG" },
    ],
  },
  {
    name: "Social",
    icon: Users,
    color: "text-violet-400",
    bg: "bg-violet-500/10 ring-violet-500/20",
    apps: [
      { name: "TTT Feed", desc: "Posts & tips", path: "/Feed" },
      { name: "DAG Feed", desc: "DAG content", path: "/DAGFeed" },
      { name: "Agent ZK", desc: "Identity", path: "/AgentZK" },
      { name: "NFT Mint", desc: "Create NFTs", path: "/NFTMint" },
    ],
  },
  {
    name: "AI",
    icon: Brain,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 ring-emerald-500/20",
    apps: [
      { name: "Zeku AI", desc: "Premium assistant", path: "/ZekuAI" },
      { name: "Prompto", desc: "Prompt craft", path: "/Prompto" },
      { name: "Cinekas", desc: "Movie browser", path: "/Cinekas" },
    ],
  },
  {
    name: "Play",
    icon: Gamepad2,
    color: "text-amber-400",
    bg: "bg-amber-500/10 ring-amber-500/20",
    apps: [
      { name: "Arcade", desc: "Games hub", path: "/Arcade" },
      { name: "Farlands", desc: "Explore", path: "/Farlands" },
      { name: "Area 51", desc: "Experiments", path: "/Area51" },
    ],
  },
  {
    name: "Learn",
    icon: Globe,
    color: "text-blue-400",
    bg: "bg-blue-500/10 ring-blue-500/20",
    apps: [
      { name: "Courses", desc: "Kaspa education", path: "/Courses" },
      { name: "What is Kaspa", desc: "Deep dive", path: "/WhatIsKaspa" },
      { name: "Docs", desc: "Documentation", path: "/Docs" },
    ],
  },
];

const QUOTES = [
  "The blockDAG doesn't sleep.",
  "Every block confirms in one second.",
  "No premine. No ICO. Pure proof of work.",
  "Build without permission. Create without limits.",
  "80+ apps. One ecosystem. Zero boundaries.",
];

export default function ExplorePage() {
  const navigate = useNavigate();
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadRecentPosts();
  }, []);

  const loadRecentPosts = async () => {
    try {
      const posts = await base44.entities.Post.list("-created_date", 6);
      setRecentPosts(posts.filter(p => !p.parent_post_id && p.content?.length > 20).slice(0, 4));
    } catch {}
  };

  const allApps = CATEGORIES.flatMap(c => c.apps.map(a => ({ ...a, category: c.name })));
  const filtered = search
    ? allApps.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.desc.toLowerCase().includes(search.toLowerCase()))
    : [];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-400/30">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 h-12 flex items-center justify-between px-5 bg-black/70 backdrop-blur-2xl border-b border-white/5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <span className="text-sm font-[900] tracking-tight">Explore</span>
        <Link to="/TTTV2" className="text-[12px] font-semibold text-white/50 hover:text-white transition-colors">
          TTT 2.0
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative pt-24 pb-16 px-5 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-radial from-violet-500/10 via-transparent to-transparent rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-gradient-radial from-cyan-500/8 via-transparent to-transparent rounded-full blur-3xl" />
        </div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 ring-1 ring-white/10 mb-6">
            <Rocket className="w-3 h-3 text-cyan-400" />
            <span className="text-[11px] font-medium text-white/60">Where ideas meet the blockDAG</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-[900] tracking-tight leading-[0.95] mb-4">
            <span className="text-white">Discover.</span><br />
            <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">Create. Build.</span>
          </h1>

          <p className="text-sm sm:text-base text-white/40 max-w-md mx-auto mb-8 italic">"{quote}"</p>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search apps…"
              className="w-full h-11 pl-11 pr-4 bg-white/5 rounded-2xl text-sm text-white outline-none ring-1 ring-white/10 focus:ring-white/25 placeholder-white/25 transition-all"
            />
            {filtered.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900/95 backdrop-blur-xl rounded-2xl ring-1 ring-white/10 overflow-hidden max-h-64 overflow-y-auto z-10">
                {filtered.map((app, i) => (
                  <Link key={i} to={app.path}>
                    <div className="px-4 py-3 hover:bg-white/5 flex items-center justify-between transition-colors">
                      <div>
                        <div className="text-sm font-semibold text-white">{app.name}</div>
                        <div className="text-[11px] text-white/40">{app.desc} · {app.category}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/20" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </section>

      {/* Featured */}
      <section className="px-5 pb-16">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Star className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest">Featured</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {FEATURED.map((f, i) => {
              const Icon = f.icon;
              return (
                <Link key={i} to={f.path}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -4 }}
                    className={`relative bg-gradient-to-br ${f.gradient} rounded-[20px] p-6 h-full overflow-hidden group cursor-pointer`}
                  >
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-white/60">{f.tag}</span>
                        <Icon className="w-5 h-5 text-white/40 group-hover:text-white/80 transition-colors" />
                      </div>
                      <h3 className="text-xl font-[900] text-white mb-2">{f.title}</h3>
                      <p className="text-[13px] text-white/70 leading-relaxed">{f.desc}</p>
                      <div className="mt-4 flex items-center gap-1 text-[12px] font-semibold text-white/50 group-hover:text-white transition-colors">
                        Open <ArrowUpRight className="w-3 h-3" />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-5 pb-16">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Eye className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest">Browse by Category</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.map((cat, ci) => {
              const Icon = cat.icon;
              return (
                <motion.div
                  key={ci}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: ci * 0.05 }}
                  className="bg-white/[0.03] rounded-[20px] ring-1 ring-white/[0.06] p-5 hover:ring-white/15 transition-all"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-9 h-9 rounded-xl ${cat.bg} ring-1 flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${cat.color}`} />
                    </div>
                    <h3 className="text-sm font-bold text-white">{cat.name}</h3>
                  </div>
                  <div className="space-y-1">
                    {cat.apps.map((app, ai) => (
                      <Link key={ai} to={app.path}>
                        <div className="flex items-center justify-between px-3 py-2.5 -mx-1 rounded-xl hover:bg-white/5 transition-colors group">
                          <div>
                            <div className="text-[13px] font-semibold text-white/90">{app.name}</div>
                            <div className="text-[11px] text-white/30">{app.desc}</div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-white/10 group-hover:text-white/40 transition-colors" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Live from the Feed */}
      {recentPosts.length > 0 && (
        <section className="px-5 pb-16">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest">Live from the Feed</h2>
              </div>
              <Link to="/Feed" className="text-[12px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                View All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {recentPosts.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white/[0.03] rounded-2xl ring-1 ring-white/[0.06] p-4 hover:ring-white/15 transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/60">
                      {post.author_name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <span className="text-[12px] font-semibold text-white/70">{post.author_name}</span>
                    <span className="text-[10px] text-white/20 ml-auto">{new Date(post.created_date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[12px] text-white/50 leading-relaxed line-clamp-2">{post.content}</p>
                  {(post.tips_received > 0 || post.likes > 0) && (
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-white/30">
                      {post.likes > 0 && <span>♥ {post.likes}</span>}
                      {post.tips_received > 0 && <span className="text-cyan-400/60">💰 {post.tips_received} KAS</span>}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="px-5 pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-gradient-to-br from-zinc-900 to-black rounded-[24px] ring-1 ring-white/10 p-10 sm:p-14 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(6,182,212,0.08),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.06),transparent_60%)]" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-[900] tracking-tight mb-3">Ready to build?</h2>
              <p className="text-white/40 text-sm max-w-md mx-auto mb-8">The Kaspa super-app is live. 80+ apps, zero limits.</p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link to="/Feed">
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    className="h-11 px-8 bg-white text-black text-[14px] font-semibold rounded-full flex items-center gap-2">
                    Enter Feed <ArrowUpRight className="w-4 h-4" />
                  </motion.button>
                </Link>
                <Link to="/AppStore">
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    className="h-11 px-8 text-white text-[14px] font-semibold rounded-full ring-1 ring-white/20 hover:ring-white/40 transition-all">
                    App Store
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}