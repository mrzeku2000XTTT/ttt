import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  CheckCircle2, ExternalLink, ArrowUpRight,
  ChevronRight, ChevronDown, Monitor, Upload, X,
  Volume2, VolumeX
} from "lucide-react";

import HeroHeader from "@/components/tttv2/HeroHeader";

import WhatsNew from "@/components/tttv2/WhatsNew";
import TTTVMini from "@/components/tttv2/TTTVMini";
import CommunityVideos from "@/components/tttv2/CommunityVideos";
import KaspaAvatarChat from "@/components/kaspa/KaspaAvatarChat";
import MobileNavToast from "@/components/tttv2/MobileNavToast";
import EmbeddedSiteViewer from "@/components/tttv2/EmbeddedSiteViewer";

/* ─── roadmap data ─── */
const ROADMAP = [
  { phase: "01", title: "Core Platform", status: "completed", items: ["Community Feed — posts, comments, media", "Kaspa wallet auth (Kasware · Kastle · MetaMask)", "Real-time KAS tipping engine", "Encrypted Notepad & Kaspa stamps", "User profiles & auth system", "App Store — 80+ community apps"] },
  { phase: "02", title: "Identity & Media", status: "completed", items: ["Agent ZK — cryptographic wallet identity", "TTTV media browser & player", "KRC-20 multi-token tipping", "Grokipedia knowledge layer", "@zk AI bot — search · image gen", "Stamped News — blockchain-verified publishing"] },
  { phase: "03", title: "DeFi & Gaming", status: "completed", items: ["StakeDAG prediction markets + escrow", "KA-CHING automated betting", "DAGKnight advanced wallet", "Kaspa L1 bridge & send", "Bull Reels · badges · rewards", "Hikaru AI image studio"] },
  { phase: "04", title: "Expansion", status: "active", items: ["TTT 2.0 redesigned interface", "Agent ZK marketplace & connections", "KRC-20 cross-token swaps", "Mobile-native experience", "Community governance & voting", "Developer API & SDK"] },
  { phase: "05", title: "Vision", status: "upcoming", items: ["Decentralized app publishing", "ZK-proof identity verification", "DAO treasury management", "Multi-chain bridging", "Agent-to-agent protocol"] },
];

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
        active ? "bg-white ring-1 ring-cyan-200 shadow-xl shadow-cyan-100/40"
        : done ? "bg-white/70 ring-1 ring-zinc-200/60"
        : "bg-zinc-50 ring-1 ring-zinc-200/40"
      }`}
    >
      {active && (
        <span className="absolute -top-3 left-6 px-3 py-1 text-[10px] font-bold tracking-widest bg-black text-white rounded-full">NOW</span>
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

export default function TTTV2Page() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [kaspaUpdates, setKaspaUpdates] = useState([]);
  const [kasData, setKasData] = useState({ price: null, change24h: null, loading: true });
  const [embeddedSite, setEmbeddedSite] = useState(null);
  const [heroVideoUrl, setHeroVideoUrl] = useState("");
  const [heroMuted, setHeroMuted] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showVideoUpload, setShowVideoUpload] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const heroVideoRef = React.useRef(null);

  useEffect(() => { loadContent(); loadKasPrice(); loadDailyKaspaUpdates(); checkAdmin(); loadHeroVideo(); }, []);

  const checkAdmin = async () => {
    try {
      const user = await base44.auth.me();
      setIsAdmin(user?.role === "admin");
    } catch {}
  };

  const HERO_VIDEO_FALLBACK = "https://base44.app/api/apps/6901295fa9bcfaa0f5ba2c2a/files/mp/public/6901295fa9bcfaa0f5ba2c2a/82dea996a_f12bdf5aa_grok-video.mp4";

  const loadHeroVideo = async () => {
    try {
      const configs = await base44.entities.KAIConfig.filter({ config_key: "hero_video_url" });
      if (configs.length > 0 && configs[0].config_value) {
        setHeroVideoUrl(configs[0].config_value);
        return;
      }
    } catch { /* filter may fail for unauthenticated users */ }
    // Fallback: localStorage then hardcoded URL
    const local = localStorage.getItem("tttv2_hero_video");
    setHeroVideoUrl(local || HERO_VIDEO_FALLBACK);
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setHeroVideoUrl(file_url);
      localStorage.setItem("tttv2_hero_video", file_url);
      // Persist to DB so all users see it
      const existing = await base44.entities.KAIConfig.filter({ config_key: "hero_video_url" });
      if (existing.length > 0) {
        await base44.entities.KAIConfig.update(existing[0].id, { config_value: file_url });
      } else {
        await base44.entities.KAIConfig.create({ config_key: "hero_video_url", config_value: file_url });
      }
    } catch {}
    setUploadingVideo(false);
    setShowVideoUpload(false);
  };

  const removeHeroVideo = async () => {
    setHeroVideoUrl("");
    localStorage.removeItem("tttv2_hero_video");
    try {
      const existing = await base44.entities.KAIConfig.filter({ config_key: "hero_video_url" });
      if (existing.length > 0) {
        await base44.entities.KAIConfig.update(existing[0].id, { config_value: "" });
      }
    } catch {}
  };

  const loadContent = async () => {
    try {
      const p = await base44.entities.Post.list("-created_date", 20);
      setPosts(p.filter(x => !x.parent_post_id && x.content?.length > 30).slice(0, 6).map(x => ({
        id: x.id, author: x.author_name, text: x.content.slice(0, 140), tips: x.tips_received || 0, likes: x.likes || 0,
        date: new Date(x.created_date).toLocaleDateString(),
      })));
    } catch { /* fallback empty */ }
  };

  const loadDailyKaspaUpdates = async () => {
    const cacheKey = 'kaspa_daily_updates';
    const cacheDate = 'kaspa_daily_updates_date';
    const today = new Date().toDateString();
    try {
      const cached = localStorage.getItem(cacheKey);
      const cachedDay = localStorage.getItem(cacheDate);
      if (cached && cachedDay === today) {
        setKaspaUpdates(JSON.parse(cached));
        return;
      }
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Give me 4 real, current Kaspa blockchain community updates or news headlines as of today. Focus on: development progress, hashrate milestones, ecosystem growth, partnerships, KRC-20 tokens, or community events. Be factual and concise.`,
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
                  tag: { type: "string" }
                }
              }
            }
          }
        }
      });
      if (res?.updates?.length) {
        setKaspaUpdates(res.updates);
        localStorage.setItem(cacheKey, JSON.stringify(res.updates));
        localStorage.setItem(cacheDate, today);
      }
    } catch { /* silent */ }
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
        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-1.5 group">
          <span className="text-[15px] font-[900] tracking-tight text-zinc-900 group-hover:text-cyan-600 transition-colors">TTT</span>
          <span className="text-[9px] font-bold bg-black text-white px-1.5 py-[1px] rounded">2.0</span>
        </button>
        <div className="hidden sm:flex items-center gap-6 text-[13px] font-medium text-zinc-500">
          <Link to="/Explore" className="hover:text-zinc-900 transition-colors">Explore</Link>
          <a href="#products" className="hover:text-zinc-900 transition-colors">Products</a>
          <Link to="/WhatIsKaspa" className="hover:text-zinc-900 transition-colors">Kaspa</Link>
          <a href="#tttv" className="hover:text-zinc-900 transition-colors">TTTV</a>
          <a href="#community" className="hover:text-zinc-900 transition-colors">Community</a>
          <a href="#news" className="hover:text-zinc-900 transition-colors">What's New</a>
          <a href="#roadmap" className="hover:text-zinc-900 transition-colors">Roadmap</a>
        </div>
        <Link to="/Home" className="text-[13px] font-semibold text-white bg-black hover:bg-zinc-800 px-4 py-1.5 rounded-full transition-colors">
          Open TTT
        </Link>
      </nav>

      {/* ── new hero ── */}
      <div className="pt-12">
        <HeroHeader />
      </div>

      {/* ── original hero ── */}
      <section className="relative py-24 sm:py-36 px-5 text-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/20b6a8247_generated_image.png" alt="" className="w-full h-full object-contain sm:object-cover opacity-70" />
          {heroVideoUrl && (
            <>
              <video
                ref={heroVideoRef}
                src={heroVideoUrl}
                autoPlay loop playsInline muted
                className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-lighten"
              />
              {/* Edge fade masks so video blends seamlessly */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,1) 100%)'
              }} />
            </>
          )}
          <div className="absolute inset-0 bg-black/45" />
        </div>

        {/* Admin video controls */}
        {isAdmin && (
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            {heroVideoUrl ? (
              <button
                onClick={removeHeroVideo}
                className="h-8 px-3 rounded-full bg-red-500/80 hover:bg-red-500 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
              >
                <X className="w-3 h-3" /> Remove Video
              </button>
            ) : (
              <label className="h-8 px-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
                <Upload className="w-3 h-3" /> {uploadingVideo ? "Uploading…" : "Upload Hero Video"}
                <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" disabled={uploadingVideo} />
              </label>
            )}
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1, ease: [.22,1,.36,1] }} className="relative max-w-2xl mx-auto">
          <p className="text-[12px] font-semibold text-cyan-400 tracking-wide uppercase mb-3">Introducing TTT 2.0</p>
          <h1 className="text-[clamp(2rem,6vw,4rem)] font-[900] leading-[0.95] tracking-tight mb-4">
            <span className="text-white">The Kaspa</span><br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">Super-App.</span>
          </h1>
          <p className="text-sm sm:text-base text-zinc-300 max-w-md mx-auto leading-relaxed mb-6">
            Feed. Identity. Prediction markets. AI agents. 80+ apps — all powered by the world's fastest blockDAG.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/Feed">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                className="h-10 px-6 bg-white text-zinc-900 text-[13px] font-semibold rounded-full shadow-lg shadow-black/25 flex items-center gap-2">
                Get Started <ArrowUpRight className="w-4 h-4" />
              </motion.button>
            </Link>
            <a href="#products">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                className="h-10 px-6 text-white text-[13px] font-semibold rounded-full border border-white/30 hover:border-white/50 hover:bg-white/10 transition-colors flex items-center gap-2">
                Explore <ChevronDown className="w-4 h-4" />
              </motion.button>
            </a>
          </div>
        </motion.div>
      </section>

      {/* ── KAS market ribbon ── */}
      <motion.section initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7 }} className="py-8 px-5 bg-zinc-900 text-white">
        <div className="max-w-5xl mx-auto">
          <div className="space-y-6">
            {kasData.loading ? (
              <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm py-4">
                <div className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
                Loading market data…
              </div>
            ) : kasData.price ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-center gap-3">
                  <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/13e8ec094_image.png" alt="KAS" className="w-8 h-8 rounded-full" />
                  <div>
                    <div className="text-[11px] text-zinc-500 font-medium tracking-wide uppercase">Kaspa Price</div>
                    <div className="text-2xl sm:text-3xl font-[900] text-white">${kasData.price.toFixed(4)}</div>
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }} className="text-center">
                  <div className="text-[11px] text-zinc-500 font-medium tracking-wide uppercase">24h Change</div>
                  <div className={`text-2xl sm:text-3xl font-[900] ${kasData.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {kasData.change24h >= 0 ? '+' : ''}{kasData.change24h.toFixed(2)}%
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.16 }} className="text-center">
                  <div className="text-[11px] text-zinc-500 font-medium tracking-wide uppercase">Network</div>
                  <div className="text-lg sm:text-xl font-[900] text-white">blockDAG</div>
                  <div className="text-[10px] text-zinc-500">32 blocks/sec</div>
                </motion.div>
              </div>
            ) : null}

            <div className="flex items-center justify-center gap-3 sm:gap-5 flex-wrap">
              {[
                { label: "kaspa.org", url: "https://kaspa.org", embedable: false },
                { label: "kasmi.online", url: "https://kasmi.online", embedable: true },
                { label: "kaspahub.org", url: "https://kaspahub.org", embedable: true },
              ].map((site) => (
                <div key={site.label} className="flex items-center gap-1">
                  {site.embedable ? (
                    <button
                      onClick={() => setEmbeddedSite(site)}
                      className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      <Monitor className="w-3 h-3" /> {site.label}
                    </button>
                  ) : (
                    <a href={site.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
                      {site.label} <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <a href={site.url} target="_blank" rel="noopener noreferrer"
                    className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors" title="Open in new tab">
                    <ExternalLink className="w-2.5 h-2.5 text-zinc-500" />
                  </a>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
              {[
                { label: "Buy KAS", url: "https://www.topperpay.com", accent: "border-cyan-500/40 text-cyan-400 hover:border-cyan-400/60 hover:shadow-cyan-500/20" },
                { label: "Buy PACMAN", url: "https://kaspa.com/tokens/marketplace/token/PACMAN", accent: "border-amber-500/40 text-amber-400 hover:border-amber-400/60 hover:shadow-amber-500/20" },
                { label: "Buy BMT", url: "https://defi.kaspa.com/swap", accent: "border-purple-500/40 text-purple-400 hover:border-purple-400/60 hover:shadow-purple-500/20" },
                { label: "Buy KMI", url: "https://pump.fun/coin/5FVV1jCfJkUNAF55oXjxyQaZzr6X94Vkp9wvzdu4pump", accent: "border-emerald-500/40 text-emerald-400 hover:border-emerald-400/60 hover:shadow-emerald-500/20" },
              ].map((token) => (
                <a key={token.label} href={token.url} target="_blank" rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 text-[12px] font-bold bg-black/80 backdrop-blur-sm px-5 py-2.5 rounded-2xl border hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl ${token.accent}`}>
                  {token.label}
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              ))}
            </div>

            {/* Why Buy Kaspa */}
            <div className="mt-6 max-w-3xl mx-auto">
              <button
                onClick={() => document.getElementById('why-kaspa')?.classList.toggle('hidden')}
                className="text-[11px] font-semibold text-zinc-500 hover:text-cyan-400 transition-colors cursor-pointer flex items-center gap-1 mx-auto"
              >
                Why buy Kaspa? <ChevronDown className="w-3 h-3" />
              </button>
              <div id="why-kaspa" className="hidden mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="bg-white/5 rounded-xl p-3 ring-1 ring-white/10">
                  <div className="text-[18px] font-[900] text-cyan-400">10 BPS</div>
                  <div className="text-[10px] text-zinc-500 mt-1">Fastest PoW chain — 10 blocks per second, live on mainnet</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 ring-1 ring-white/10">
                  <div className="text-[18px] font-[900] text-emerald-400">Fair</div>
                  <div className="text-[10px] text-zinc-500 mt-1">Zero premine, zero ICO, zero VC — 100% community-driven</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 ring-1 ring-white/10">
                  <div className="text-[18px] font-[900] text-violet-400">blockDAG</div>
                  <div className="text-[10px] text-zinc-500 mt-1">Parallel blocks — no orphans, no wasted work, pure throughput</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 ring-1 ring-white/10">
                  <div className="text-[18px] font-[900] text-amber-400">Growing</div>
                  <div className="text-[10px] text-zinc-500 mt-1">KRC-20 tokens, smart contracts coming, DeFi ecosystem expanding</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── TTTV Mini Player ── */}
      <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7, delay: 0.1 }}>
        <TTTVMini />
      </motion.div>

      {/* ── Community Videos ── */}
      <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7, delay: 0.1 }}>
        <CommunityVideos />
      </motion.div>

      {/* ── What's New (updates + posts + coming soon) ── */}
      <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7, delay: 0.1 }}>
        <WhatsNew kaspaUpdates={kaspaUpdates} posts={posts} />
      </motion.div>

      {/* ── Roadmap ── */}
      <section id="roadmap" className="py-20 sm:py-28 px-5">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
            <p className="text-[13px] font-semibold text-zinc-400 tracking-wide uppercase mb-2">Progress</p>
            <h2 className="text-3xl sm:text-4xl font-[900] tracking-tight">Built in public.</h2>
          </motion.div>
          <div className="relative">
            <div className="hidden md:block absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-400/60 via-cyan-400/40 to-zinc-200/30" />
            <div className="space-y-5 md:pl-16">
              {ROADMAP.map((r, i) => <PhaseCard key={r.phase} data={r} idx={i} />)}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <motion.section initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7 }} className="py-20 sm:py-28 px-5">
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
      </motion.section>

      {/* Embedded site viewer */}
      {embeddedSite && (
        <EmbeddedSiteViewer
          url={embeddedSite.url}
          label={embeddedSite.label}
          onClose={() => setEmbeddedSite(null)}
        />
      )}

      {/* KAI floating chat */}
      <KaspaAvatarChat />

      {/* Mobile nav toast */}
      <MobileNavToast />

      {/* ── footer ── */}
      <motion.footer initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="py-8 px-5 border-t border-zinc-200/50">
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
      </motion.footer>
    </div>
  );
}