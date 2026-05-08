import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Bot, Sparkles, Search, Zap, Brain, Film, Wand2, MessageSquare, Image as ImageIcon, Code2, Palette, Mic, Globe, FileText, Video, Megaphone, Users } from "lucide-react";

const AGENTS = [
  // ── Featured ──
  {
    name: "Trinity",
    tagline: "3 agents · 3 results · 1 prompt",
    desc: "Three distinct AI personalities (Alpha, Beta, Gamma) generate parallel results for any prompt. Pick your favorite or remix all three.",
    path: "Trinity",
    icon: Sparkles,
    color: "from-cyan-400 via-fuchsia-500 to-amber-400",
    category: "Featured",
    badge: "Multi-Agent",
  },
  {
    name: "Kine",
    tagline: "Text-to-video AI",
    desc: "Describe anything. Watch it move. Your AI video agent enhances prompts and generates cinematic 6-second HD clips.",
    path: "Kine",
    icon: Film,
    color: "from-fuchsia-500 via-violet-500 to-cyan-400",
    category: "Featured",
    badge: "Video",
  },
  {
    name: "Katagami Auto-Editor",
    tagline: "Motion ad master agent",
    desc: "A self-improving multi-agent loop: research → analyze → plan → choreograph → critique → refine. Generates 50+ keyframe motion ads.",
    path: "Katagami",
    icon: Wand2,
    color: "from-fuchsia-500 to-orange-500",
    category: "Featured",
    badge: "Master Agent",
  },

  // ── AI ──
  {
    name: "Zeku AI",
    tagline: "Premium AI assistant",
    desc: "Advanced AI assistant with deep Kaspa & crypto knowledge, web search, and personalized memory.",
    path: "ZekuAI",
    icon: Brain,
    color: "from-emerald-400 to-cyan-500",
    category: "AI",
    premium: true,
  },
  {
    name: "Agent ZK",
    tagline: "Crypto identity agent",
    desc: "Your zero-knowledge identity layer. Manages profiles, connections, and verifications across the Kaspa ecosystem.",
    path: "AgentZK",
    icon: Bot,
    color: "from-cyan-400 to-blue-500",
    category: "AI",
    premium: true,
  },
  {
    name: "Prompto",
    tagline: "Prompt engineering",
    desc: "Refine, enhance, and remix prompts for any LLM. Built-in memory anchors keep context across sessions.",
    path: "Prompto",
    icon: Sparkles,
    color: "from-purple-500 to-fuchsia-500",
    category: "AI",
  },
  {
    name: "Freedom",
    tagline: "Privacy AI tools",
    desc: "Local-first AI utilities for image-to-3D, depth extraction, and offline inference.",
    path: "Freedom",
    icon: Zap,
    color: "from-lime-400 to-green-500",
    category: "AI",
  },
  {
    name: "TELE Agent",
    tagline: "TTT agent on Telegram",
    desc: "Bring TTT's AI agents into Telegram. Chat, query, and control your Kaspa apps from anywhere.",
    path: "TELE",
    icon: MessageSquare,
    color: "from-blue-400 to-cyan-500",
    category: "AI",
  },

  // ── Creative ──
  {
    name: "Hikaru",
    tagline: "AI image studio",
    desc: "Generate, edit, upscale, and relight images with multiple AI models in one unified studio.",
    path: "Hikaru",
    icon: ImageIcon,
    color: "from-cyan-400 to-pink-500",
    category: "Creative",
  },
  {
    name: "Hiro",
    tagline: "AI typography studio",
    desc: "Generate brand-consistent type systems with reusable kits, smart pairing, and guided refinement.",
    path: "Hiro",
    icon: FileText,
    color: "from-rose-400 to-pink-500",
    category: "Creative",
  },
  {
    name: "Haru",
    tagline: "AI typography brain",
    desc: "Type-focused AI design tool that builds, tests, and remembers brand-specific type pairings.",
    path: "Haru",
    icon: Palette,
    color: "from-violet-400 to-fuchsia-500",
    category: "Creative",
  },
  {
    name: "BeatCut",
    tagline: "AI beat-synced editor",
    desc: "Drop a video. The agent analyzes motion + brightness frame-by-frame and generates synced cuts automatically.",
    path: "BeatCut",
    icon: Video,
    color: "from-orange-400 to-red-500",
    category: "Creative",
  },
  {
    name: "Cháoxiào",
    tagline: "Device mockup agent",
    desc: "AI-driven device mockups with timeline animation, motion presets, and auto-render to MP4.",
    path: "UltraMock",
    icon: Megaphone,
    color: "from-fuchsia-500 to-orange-500",
    category: "Creative",
  },
  {
    name: "Xùnhuà",
    tagline: "AI sketch to image",
    desc: "Turn rough sketches into polished AI-generated artwork in seconds.",
    path: "Xunhua",
    icon: Wand2,
    color: "from-pink-400 to-rose-500",
    category: "Creative",
  },
  {
    name: "Speed",
    tagline: "Quick image gen",
    desc: "The fastest path from prompt to image. No menus, no settings — just speed.",
    path: "Speed",
    icon: Zap,
    color: "from-yellow-400 to-orange-500",
    category: "Creative",
  },

  // ── Dev / Tools ──
  {
    name: "NODA",
    tagline: "Node-based AI workflows",
    desc: "Visual workflow agent — chain LLMs, image gen, video, and web tools into reusable AI pipelines.",
    path: "NODA",
    icon: Code2,
    color: "from-violet-500 to-cyan-500",
    category: "Dev",
  },
  {
    name: "Motion",
    tagline: "Vibe-code landing pages",
    desc: "Describe a landing page. The agent writes & previews production-ready React + Framer Motion code.",
    path: "Motion",
    icon: Code2,
    color: "from-fuchsia-500 to-violet-500",
    category: "Dev",
  },
  {
    name: "OneShot",
    tagline: "Clone & vibe-code any UI",
    desc: "Drop a URL or screenshot. The agent recreates and customizes the UI in your tech stack.",
    path: "UICloner",
    icon: Code2,
    color: "from-fuchsia-500 to-orange-500",
    category: "Dev",
  },
  {
    name: "RMX Ultra",
    tagline: "Visual workflow automation",
    desc: "Compose multi-step image/video/text generation pipelines on an infinite canvas.",
    path: "RMX",
    icon: Wand2,
    color: "from-cyan-400 to-fuchsia-500",
    category: "Dev",
  },
  {
    name: "MIRAGE",
    tagline: "AI orchestration platform",
    desc: "Connect TTT apps into automated AI workflows that act on your behalf across the ecosystem.",
    path: "MIRAGE",
    icon: Globe,
    color: "from-purple-500 to-pink-500",
    category: "Dev",
    admin: true,
  },

  // ── Knowledge & Search ──
  {
    name: "Doom",
    tagline: "Doomscroll any topic",
    desc: "AI agent fetches dark facts on any subject and generates matching imagery for an infinite feed.",
    path: "Doom",
    icon: Search,
    color: "from-orange-500 to-red-600",
    category: "Knowledge",
  },
  {
    name: "Klock",
    tagline: "NBA AI analyst",
    desc: "Live NBA scores + predictive analytics. Learns from each game to improve future predictions.",
    path: "Klock",
    icon: Brain,
    color: "from-amber-400 to-orange-500",
    category: "Knowledge",
  },
  {
    name: "UNI Oracle",
    tagline: "Universal answers",
    desc: "Ask anything. The oracle agent searches, reasons, and synthesizes a confident answer.",
    path: "UNI",
    icon: Sparkles,
    color: "from-indigo-400 to-purple-500",
    category: "Knowledge",
  },
  {
    name: "Explore",
    tagline: "Web3 ideation",
    desc: "AI brainstormer for Web3 product concepts tailored to the Kaspa blockchain.",
    path: "Explore",
    icon: Sparkles,
    color: "from-cyan-400 to-emerald-500",
    category: "Knowledge",
  },

  // ── Voice ──
  {
    name: "Voxa",
    tagline: "Voice AI tutor",
    desc: "Conversational AI for language learning, flashcards, and kids' modes — all voice-driven.",
    path: "Voxa",
    icon: Mic,
    color: "from-cyan-400 to-blue-500",
    category: "Voice",
  },
  {
    name: "KivR",
    tagline: "IVR voice agent",
    desc: "AI-powered phone agent that handles calls and triggers KAS payments via voice prompts.",
    path: "KivR",
    icon: Mic,
    color: "from-red-500 to-pink-500",
    category: "Voice",
  },
];

const CATEGORIES = ["All", "Featured", "AI", "Creative", "Dev", "Knowledge", "Voice"];

export default function AIAgentHubPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = AGENTS.filter((a) => {
    if (category !== "All" && a.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.tagline.toLowerCase().includes(q) ||
        a.desc.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const featured = AGENTS.filter((a) => a.category === "Featured");

  return (
    <div className="min-h-screen bg-[#06060A] text-white relative overflow-hidden">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-fuchsia-500/15 blur-[140px] rounded-full" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-cyan-500/12 blur-[140px] rounded-full" />
        <div className="absolute bottom-0 left-1/2 w-[500px] h-[500px] bg-violet-500/10 blur-[140px] rounded-full" />
      </div>

      {/* Nav */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-3 sm:px-5 bg-black/40 backdrop-blur-2xl border-b border-white/10"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="flex items-center justify-between w-full h-14 max-w-6xl mx-auto">
          <Link
            to="/AppStoreV2"
            className="flex items-center gap-1.5 text-white/70 hover:text-white h-11 px-3 rounded-lg active:bg-white/5"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-[14px] font-medium">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-fuchsia-500 via-violet-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-fuchsia-500/40">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="text-[15px] font-[900] tracking-tight">AGENT HUB</span>
          </div>
          <div className="w-20" />
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-20">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-[0.3em] uppercase text-fuchsia-300 mb-5">
            <Sparkles className="w-3 h-3" /> {AGENTS.length} AI Agents · One Hub
          </div>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative inline-block mb-6"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500 via-violet-500 to-cyan-400 blur-3xl opacity-50 rounded-full" />
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-fuchsia-500 via-violet-500 to-cyan-400 flex items-center justify-center shadow-2xl shadow-fuchsia-500/40">
              <Users className="w-10 h-10 text-white" />
            </div>
          </motion.div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-[900] tracking-tight mb-4 bg-gradient-to-r from-fuchsia-300 via-violet-200 to-cyan-300 bg-clip-text text-transparent">
            AI Agent Hub
          </h1>
          <p className="text-white/70 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Every AI agent in TTT — text, image, video, voice, code, and orchestration. One place to launch them all.
          </p>
        </motion.div>

        {/* Featured strip */}
        {category === "All" && !search && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-10"
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-300" />
              <h2 className="text-[10px] font-black tracking-[0.3em] uppercase text-fuchsia-300">Featured Agents</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {featured.map((a) => (
                <FeaturedCard key={a.name} agent={a} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-5"
        >
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search agents…"
              style={{ fontSize: "16px" }}
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm outline-none focus:border-fuchsia-400/50 placeholder-white/30 transition-all"
            />
          </div>
        </motion.div>

        {/* Category pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mb-8 flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1"
        >
          {CATEGORIES.map((cat) => {
            const active = category === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex-shrink-0 px-3.5 py-2 rounded-full text-[12px] font-semibold transition-all ${
                  active
                    ? "bg-gradient-to-r from-fuchsia-500 to-cyan-400 text-white shadow-lg shadow-fuchsia-500/30"
                    : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((agent, i) => (
            <AgentCard key={agent.name} agent={agent} index={i} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-white/40 text-sm">No agents found.</div>
        )}
      </main>
    </div>
  );
}

function FeaturedCard({ agent }) {
  const Icon = agent.icon;
  return (
    <Link to={`/${agent.path}`}>
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative p-5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-fuchsia-400/40 overflow-hidden group h-full"
      >
        <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${agent.color} opacity-30 blur-2xl group-hover:opacity-50 transition-opacity`} />
        <div className="relative">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center mb-3 shadow-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          {agent.badge && (
            <div className="inline-block px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-[9px] font-black tracking-widest uppercase text-white/70 mb-2">
              {agent.badge}
            </div>
          )}
          <h3 className="text-white font-black text-lg mb-0.5">{agent.name}</h3>
          <p className="text-fuchsia-300 text-[11px] font-bold mb-2">{agent.tagline}</p>
          <p className="text-white/55 text-[12px] leading-relaxed">{agent.desc}</p>
        </div>
      </motion.div>
    </Link>
  );
}

function AgentCard({ agent, index }) {
  const Icon = agent.icon;
  return (
    <Link to={`/${agent.path}`}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 + (index % 9) * 0.04, duration: 0.4 }}
        whileHover={{ y: -3, scale: 1.015 }}
        whileTap={{ scale: 0.98 }}
        className="relative p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/25 hover:bg-white/[0.05] transition-colors h-full group"
      >
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${agent.color} flex items-center justify-center flex-shrink-0 shadow-md`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h3 className="text-white font-bold text-[14px] truncate">{agent.name}</h3>
              {agent.premium && (
                <span className="text-[8px] font-black tracking-widest text-yellow-400 uppercase">Pro</span>
              )}
            </div>
            <p className="text-fuchsia-300 text-[10px] font-semibold mb-1.5 truncate">{agent.tagline}</p>
            <p className="text-white/50 text-[11px] leading-snug line-clamp-2">{agent.desc}</p>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}