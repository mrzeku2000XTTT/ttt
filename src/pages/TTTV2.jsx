import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  CheckCircle2, Zap, Shield, Globe, Users, Layers, Rocket, Star,
  ChevronDown, ExternalLink, ArrowUpRight, Newspaper, MessageSquare,
  Sparkles, Play, ChevronRight, TrendingUp, Bot, Gamepad2, Wallet,
  Lock, Image, Radio, Crown
} from "lucide-react";

/* ─── data ─── */
const ROADMAP = [
  { phase: "01", title: "Core Platform", status: "completed", items: ["Community Feed — posts, comments, media", "Kaspa wallet auth (Kasware · Kastle · MetaMask)", "Real-time KAS tipping engine", "Encrypted Notepad & Kaspa stamps", "User profiles & auth system", "App Store — 80+ community apps"] },
  { phase: "02", title: "Identity & Media", status: "completed", items: ["Agent ZK — cryptographic wallet identity", "TTTV media browser & player", "KRC-20 multi-token tipping", "Grokipedia knowledge layer", "@zk AI bot — search · image gen", "Stamped News — blockchain-verified publishing"] },
  { phase: "03", title: "DeFi & Gaming", status: "completed", items: ["StakeDAG prediction markets + escrow", "KA-CHING automated betting", "DAGKnight advanced wallet", "Kaspa L1 bridge & send", "Bull Reels · badges · rewards", "Hikaru AI image studio"] },
  { phase: "04", title: "Expansion", status: "active", items: ["TTT 2.0 redesigned interface", "Agent ZK marketplace & connections", "KRC-20 cross-token swaps", "Mobile-native experience", "Community governance & voting", "Developer API & SDK"] },
  { phase: "05", title: "Vision", status: "upcoming", items: ["Decentralized app publishing", "ZK-proof identity verification", "DAO treasury management", "Multi-chain bridging", "Agent-to-agent protocol"] },
];

const PRODUCTS = [
  { icon: Users, name: "Feed", desc: "Post, comment, tip & stamp", color: "from-cyan-500 to-blue-500" },
  { icon: Bot, name: "Agent ZK", desc: "Cryptographic identity", color: "from-violet-500 to-purple-500" },
  { icon: Gamepad2, name: "StakeDAG", desc: "Prediction markets", color: "from-amber-500 to-orange-500" },
  { icon: Play, name: "TTTV", desc: "Media browser", color: "from-pink-500 to-rose-500" },
  { icon: Image, name: "Hikaru", desc: "AI image studio", color: "from-emerald-500 to-teal-500" },
  { icon: Wallet, name: "Bridge", desc: "Send KAS anywhere", color: "from-blue-500 to-indigo-500" },
  { icon: Lock, name: "DAGKnight", desc: "Advanced wallet", color: "from-zinc-600 to-zinc-800" },
  { icon: Crown, name: "App Store", desc: "80+ community apps", color: "from-yellow-500 to-amber-500" },
];

/* ─── components ─── */
function PhaseCard({ data, idx }) {
  const done = data.status === "completed";
  const active = data.status === "active";
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: idx * 0.1 }}
      className={`relative rounded-[20px] p-6 sm:p-8 transition-all duration-500 ${
        active
          ? "bg-white ring-1 ring-cyan-200 shadow-xl shadow-cyan-100/40"
          : done
          ? "bg-white/70 ring-1 ring-zinc-200/60"
          : "bg-zinc-50 ring-1 ring-zinc-200/40"
      }`}
    >
      {active && (
        <span className="absolute -top-3 left-6 px-3 py-1 text-[10px] font-bold tracking-widest bg-black text-white rounded-full">
          NOW
        </span>
      )}
      <div className="flex items-baseline gap-3 mb-5">
        <span className={`text-4xl font-[900] tracking-tight ${active ? "text-cyan-500" : done ? "text-zinc-300" : "text-zinc-200"}`}>
          {data.phase}
        </span>
        <span className="text-lg font-bold text-zinc-900">{data.title}</span>
      </div>
      <ul className="space-y-2.5">
        {data.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-zinc-600">
            {done ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            ) : active ? (
              <div className="w-4 h-4 mt-0.5 flex-shrink-0 rounded-full border-2 border-cyan-400 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
              </div>
            ) : (
              <div className="w-4 h-4 mt-0.5 flex-shrink-0 rounded-full border-2 border-zinc-300" />
            )}
            {item}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

/* ─── page ─── */
export default function TTTV2Page() {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.97]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const [news, setNews] = useState([]);
  const [posts, setPosts] = useState([]);
  const [kasData, setKasData] = useState({ price: null, change24h: null, loading: true });

  useEffect(() => { loadContent(); loadKasPrice(); }, []);

  const loadContent = async () => {
    try {
      const [s, p] = await Promise.all([
        base44.entities.StampedNews.list("-created_date", 4),
        base44.entities.Post.list("-created_date", 20),
      ]);
      setNews(s.map(n => ({ id: n.id, title: n.news_title, summary: n.news_summary || "", tag: n.news_category || "TTT", date: new Date(n.created_date).toLocaleDateString() })));
      setPosts(p.filter(x => !x.parent_post_id && x.content?.length > 30).slice(0, 4).map(x => ({
        id: x.id, author: x.author_name, text: x.content.slice(0, 140), tips: x.tips_received || 0, likes: x.likes || 0,
        date: new Date(x.created_date).toLocaleDateString(),
      })));
    } catch { /* fallback empty */ }
  };

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

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-zinc-900 selection:bg-cyan-200/60 overflow-x-hidden">

      {/* ── nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 h-12 flex items-center justify-between px-5 bg-[#F5F5F7]/70 backdrop-blur-2xl backdrop-saturate-150 border-b border-zinc-200/50">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 group">
          <span className="text-[15px] font-[900] tracking-tight text-zinc-900 group-hover:text-cyan-600 transition-colors">TTT</span>
          <span className="text-[9px] font-bold bg-black text-white px-1.5 py-[1px] rounded">2.0</span>
        </button>
        <div className="hidden sm:flex items-center gap-6 text-[13px] font-medium text-zinc-500">
          <a href="#products" className="hover:text-zinc-900 transition-colors">Products</a>
          <a href="#roadmap" className="hover:text-zinc-900 transition-colors">Roadmap</a>
          <a href="#news" className="hover:text-zinc-900 transition-colors">News</a>
        </div>
        <Link to="/Feed" className="text-[13px] font-semibold text-white bg-black hover:bg-zinc-800 px-4 py-1.5 rounded-full transition-colors">
          Open TTT
        </Link>
      </nav>

      {/* ── hero ── */}
      <motion.section style={{ scale: heroScale, opacity: heroOpacity }} className="relative pt-32 pb-24 sm:pt-44 sm:pb-36 px-5 text-center origin-top">
        {/* ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-radial from-cyan-400/10 via-transparent to-transparent rounded-full blur-3xl" />
        </div>

        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [.22,1,.36,1] }} className="relative max-w-3xl mx-auto">
          <p className="text-[13px] font-semibold text-cyan-600 tracking-wide uppercase mb-4">Introducing TTT 2.0</p>
          <h1 className="text-[clamp(2.5rem,7vw,5.5rem)] font-[900] leading-[0.92] tracking-tight mb-5">
            <span className="text-zinc-900">The Kaspa</span><br />
            <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 bg-clip-text text-transparent">Super-App.</span>
          </h1>
          <p className="text-base sm:text-lg text-zinc-500 max-w-xl mx-auto leading-relaxed mb-8">
            Feed. Identity. Prediction markets. AI agents. 80+ apps — all powered by the world's fastest blockDAG.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/Feed">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                className="h-11 px-7 bg-black text-white text-[14px] font-semibold rounded-full shadow-lg shadow-black/15 flex items-center gap-2">
                Get Started <ArrowUpRight className="w-4 h-4" />
              </motion.button>
            </Link>
            <a href="#products">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                className="h-11 px-7 text-zinc-600 text-[14px] font-semibold rounded-full border border-zinc-300 hover:border-zinc-400 transition-colors flex items-center gap-2">
                Explore <ChevronDown className="w-4 h-4" />
              </motion.button>
            </a>
          </div>
        </motion.div>
      </motion.section>

      {/* ── KAS market ribbon ── */}
      <section className="border-y border-zinc-200/60 bg-white py-8 px-5">
        <div className="max-w-5xl mx-auto">
          {kasData.loading ? (
            <div className="flex items-center justify-center gap-2 text-zinc-400 text-sm py-4">
              <div className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
              Loading market data…
            </div>
          ) : kasData.price ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-center gap-3">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/13e8ec094_image.png" alt="KAS" className="w-8 h-8 rounded-full" />
                <div>
                  <div className="text-[11px] text-zinc-400 font-medium tracking-wide uppercase">Kaspa Price</div>
                  <div className="text-2xl sm:text-3xl font-[900] text-zinc-900">${kasData.price.toFixed(4)}</div>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }} className="text-center">
                <div className="text-[11px] text-zinc-400 font-medium tracking-wide uppercase">24h Change</div>
                <div className={`text-2xl sm:text-3xl font-[900] ${kasData.change24h >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {kasData.change24h >= 0 ? '+' : ''}{kasData.change24h.toFixed(2)}%
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.16 }} className="text-center">
                <div className="text-[11px] text-zinc-400 font-medium tracking-wide uppercase">Network</div>
                <div className="text-lg sm:text-xl font-[900] text-zinc-900">blockDAG</div>
                <div className="text-[10px] text-zinc-400">32 blocks/sec</div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.24 }}>
                <a href="https://kaspa.org" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-cyan-600 hover:text-cyan-700 transition-colors">
                  kaspa.org <ExternalLink className="w-3 h-3" />
                </a>
              </motion.div>
            </div>
          ) : (
            <div className="text-center text-zinc-400 text-sm py-4">Market data unavailable</div>
          )}
        </div>
      </section>

      {/* ── products grid ── */}
      <section id="products" className="py-20 sm:py-28 px-5">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
            <p className="text-[13px] font-semibold text-zinc-400 tracking-wide uppercase mb-2">Ecosystem</p>
            <h2 className="text-3xl sm:text-4xl font-[900] tracking-tight">Everything in one place.</h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {PRODUCTS.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div key={p.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -6, transition: { duration: 0.3 } }}
                  className="group bg-white rounded-2xl p-5 sm:p-6 ring-1 ring-zinc-200/60 hover:ring-zinc-300 hover:shadow-xl hover:shadow-zinc-200/40 transition-all duration-500 cursor-default">
                  <div className={`w-10 h-10 rounded-[12px] bg-gradient-to-br ${p.color} flex items-center justify-center mb-4 shadow-lg shadow-zinc-300/30 group-hover:scale-110 transition-transform duration-500`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 mb-0.5">{p.name}</h3>
                  <p className="text-[12px] text-zinc-400 leading-relaxed">{p.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── news + community ── */}
      {(news.length > 0 || posts.length > 0) && (
        <section id="news" className="py-20 sm:py-28 px-5 bg-white">
          <div className="max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
              <p className="text-[13px] font-semibold text-zinc-400 tracking-wide uppercase mb-2">Live</p>
              <h2 className="text-3xl sm:text-4xl font-[900] tracking-tight">From the network.</h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-10">
              {/* stamped news */}
              {news.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-500" /> Stamped News
                  </h3>
                  <div className="space-y-3">
                    {news.map(n => (
                      <motion.div key={n.id} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                        className="p-4 rounded-xl ring-1 ring-zinc-100 hover:ring-zinc-200 hover:shadow-md transition-all duration-300 bg-zinc-50/50">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-md">{n.tag}</span>
                          <span className="text-[10px] text-zinc-300">{n.date}</span>
                        </div>
                        <p className="text-[13px] font-semibold text-zinc-800 leading-snug line-clamp-2">{n.title}</p>
                        {n.summary && <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{n.summary}</p>}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* community posts */}
              {posts.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-cyan-500" /> Community
                  </h3>
                  <div className="space-y-3">
                    {posts.map(p => (
                      <motion.div key={p.id} initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                        className="p-4 rounded-xl ring-1 ring-zinc-100 hover:ring-zinc-200 hover:shadow-md transition-all duration-300 bg-zinc-50/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[12px] font-semibold text-zinc-700">{p.author}</span>
                          <span className="text-[10px] text-zinc-300">{p.date}</span>
                        </div>
                        <p className="text-[12px] text-zinc-500 leading-relaxed line-clamp-2">{p.text}</p>
                        {(p.tips > 0 || p.likes > 0) && (
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-400">
                            {p.tips > 0 && <span className="text-cyan-600 font-semibold">💰 {p.tips} KAS</span>}
                            {p.likes > 0 && <span>♥ {p.likes}</span>}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── roadmap ── */}
      <section id="roadmap" className="py-20 sm:py-28 px-5">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
            <p className="text-[13px] font-semibold text-zinc-400 tracking-wide uppercase mb-2">Progress</p>
            <h2 className="text-3xl sm:text-4xl font-[900] tracking-tight">Built in public.</h2>
          </motion.div>

          {/* timeline */}
          <div className="relative">
            <div className="hidden md:block absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-400/60 via-cyan-400/40 to-zinc-200/30" />
            <div className="space-y-5 md:pl-16">
              {ROADMAP.map((r, i) => <PhaseCard key={r.phase} data={r} idx={i} />)}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 sm:py-28 px-5">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center bg-zinc-900 rounded-[28px] p-10 sm:p-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(6,182,212,0.15),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.1),transparent_60%)]" />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-[900] text-white tracking-tight mb-3">Start building.</h2>
            <p className="text-zinc-400 max-w-md mx-auto text-sm leading-relaxed mb-8">
              Post, tip, predict, create — the Kaspa super-app is live. Your move.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/Feed">
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  className="h-11 px-8 bg-white text-zinc-900 text-[14px] font-semibold rounded-full flex items-center gap-2">
                  Enter Feed <ArrowUpRight className="w-4 h-4" />
                </motion.button>
              </Link>
              <Link to="/AgentZK">
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  className="h-11 px-8 text-white text-[14px] font-semibold rounded-full ring-1 ring-white/20 hover:ring-white/40 transition-all flex items-center gap-2">
                  Agent ZK <ChevronRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── footer ── */}
      <footer className="py-8 px-5 border-t border-zinc-200/50">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-zinc-400">
          <span className="font-medium">TTT 2.0 — Built on Kaspa</span>
          <div className="flex items-center gap-5">
            <a href="https://kaspa.org" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-600 transition-colors flex items-center gap-1">
              Kaspa <ExternalLink className="w-3 h-3" />
            </a>
            <a href="https://kasplex.org" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-600 transition-colors flex items-center gap-1">
              Kasplex <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}