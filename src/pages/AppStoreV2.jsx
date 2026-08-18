import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Sparkles, Shield, Wallet, Gamepad2, Dumbbell, Wrench, Palette, BookOpen, Users, Radio, ShoppingBag, Bot } from "lucide-react";

const playGTA = () => { try { const a = new Audio("https://media.base44.com/files/public/6901295fa9bcfaa0f5ba2c2a/e5aa22c46_gta-menu.mp3"); a.volume = 0.8; a.play().catch(() => {}); } catch {} };
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";

import AppStoreGrid from "@/components/appstore2/AppStoreGrid";
import AppStoreFeatured from "@/components/appstore2/AppStoreFeatured";
import ListAppButton from "@/components/appstore2/ListAppButton";
import AdminProposalsPanel from "@/components/appstore2/AdminProposalsPanel";
import BlueprintModal from "@/components/appstore2/BlueprintModal";
import AppStoreAISearch from "@/components/appstore2/AppStoreAISearch";
import AgentInternetAlphaCard from "@/components/appstore2/AgentInternetAlphaCard";

const CATEGORIES = [
  { id: "All", label: "All", icon: Sparkles },
  { id: "TTT", label: "TTT", icon: Sparkles },
  { id: "Kaspa", label: "Kaspa", icon: Shield },
  { id: "Builder", label: "Builder", icon: Wrench },
  { id: "AI", label: "AI", icon: Sparkles },
  { id: "Finance", label: "Finance", icon: Wallet },
  { id: "Games", label: "Games", icon: Gamepad2 },
  { id: "Fitness", label: "Fitness", icon: Dumbbell },
  { id: "Tools", label: "Tools", icon: Wrench },
  { id: "Creative", label: "Creative", icon: Palette },
  { id: "Education", label: "Education", icon: BookOpen },
  { id: "Community", label: "Community", icon: Users },
  { id: "Social", label: "Social", icon: Users },
  { id: "Media", label: "Media", icon: Radio },
  { id: "Communication", label: "Comms", icon: Radio },
  { id: "Dev Tools", label: "Dev", icon: Wrench },
  { id: "Shop", label: "Shop", icon: ShoppingBag },
  { id: "Security", label: "Security", icon: Shield },
];

export default function AppStoreV2Page() {
  const [search, setSearch] = useState("");
  const [aiResults, setAiResults] = useState(null);
  const [category, setCategory] = useState("All");
  const [user, setUser] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [blueprintOpen, setBlueprintOpen] = useState(false);
  const [view, setView] = useState("kaspa");
  const filtersRef = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Auto-toggle to the "All" tab whenever a search query is entered.
  useEffect(() => {
    if (search.trim()) {
      setCategory("All");
      setView("all");
    }
  }, [search]);

  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-zinc-900">
      {/* Nav */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-3 sm:px-5 bg-[#F5F5F7]/80 backdrop-blur-2xl border-b border-zinc-200/50"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="flex items-center justify-between w-full h-14 gap-2">
          <Link
            to="/TTTV2"
            className="flex items-center gap-1.5 text-zinc-700 hover:text-zinc-900 transition-colors h-14 px-3 -ml-3 rounded-lg active:bg-zinc-200/60"
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-[14px] font-medium">Back</span>
          </Link>
          <span className="text-[15px] font-[800] tracking-tight">App Store</span>
          <div className="flex items-center gap-2">
            <Link
              to="/AIAgentHub"
              onClick={playGTA}
              className="hidden sm:flex items-center gap-1.5 text-[13px] font-semibold text-white bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 hover:opacity-90 h-10 px-3.5 rounded-full transition-opacity shadow-lg shadow-fuchsia-500/30"
            >
              <Bot className="w-3.5 h-3.5" />
              Agents
            </Link>
            <Link
              to="/AIAgentHub"
              onClick={playGTA}
              className="sm:hidden flex items-center justify-center text-white bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 h-10 w-10 rounded-full shadow-lg shadow-fuchsia-500/30"
              title="AI Agent Hub"
            >
              <Bot className="w-4 h-4" />
            </Link>
            <Link
              to="/Home"
              onClick={playGTA}
              className="flex items-center text-[13px] font-semibold text-white bg-black hover:bg-zinc-800 h-10 px-4 rounded-full transition-colors"
            >
              Open TTT
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-20">
        {/* Cinematic Hero Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="relative w-full h-44 sm:h-64 md:h-80 mb-6 rounded-2xl overflow-hidden ring-1 ring-zinc-200/60 shadow-lg"
        >
          <img
            src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/334ebd062_generated_image.png"
            alt="Cinematic AI app store"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
            <div className="text-[10px] font-bold tracking-[0.2em] text-cyan-300 mb-2 uppercase">Welcome to TTT</div>
            <button
              onClick={() => setBlueprintOpen(true)}
              className="group text-left"
            >
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-[900] text-white tracking-tight leading-tight drop-shadow-lg group-hover:text-cyan-200 transition-colors">
                The Decentralized App Store
              </h2>
              <p className="text-white/70 text-xs sm:text-sm mt-1.5 max-w-md group-hover:text-white/90 transition-colors">
                Built on Kaspa · Powered by the community · <span className="underline">View Blueprint</span>
              </p>
            </button>
          </div>
        </motion.div>

        <BlueprintModal open={blueprintOpen} onClose={() => setBlueprintOpen(false)} />

        {/* Split Hero — Slobz (Play) + Agent Internet Alpha (Build) */}
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
          {/* Left: Slobz Kids Trading Playground — Featured Demo */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl overflow-hidden ring-1 ring-[#9B84F6]/40 shadow-lg shadow-purple-500/20"
          >
            <Link to="/KaspaKidsAcademy" className="block relative bg-gradient-to-br from-[#DED6F2] to-[#EBE6F8] p-5 sm:p-6 min-h-full">
              <img
                src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/0809726ab_generated_image.png"
                alt="Slobby the Slobz mascot"
                className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 rounded-[24px] object-cover shadow-[0_12px_30px_rgba(124,92,252,0.3)] -mr-1 -mt-1 rotate-[6deg]"
              />
              <div className="relative z-10">
                <div className="text-[10px] font-bold tracking-[0.2em] text-[#7C5CFC] mb-1 uppercase">New · Demo</div>
                <h3 className="text-xl sm:text-2xl font-[900] text-[#3D2E7C] tracking-tight mb-1 max-w-[60%]">Slobz Trading Playground</h3>
                <p className="text-[#5A4B8A] text-xs sm:text-sm max-w-md mb-3">
                A kids' trading simulator. <b>Learn trading first</b> with 10 quick lessons, then launch your own KRC20-style tokens on a bonding curve and watch friendly AI agents buy &amp; sell. Like KRON, but for learning. 🎈
                </p>
                <span className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-gradient-to-r from-[#FF8A6B] to-[#F96B4C] text-white text-xs font-bold shadow-lg shadow-orange-500/30">
                Learn &amp; Play the Demo →
                </span>
              </div>
            </Link>
          </motion.div>

          {/* Right: Agent Internet Alpha — Build your own LLM agents */}
          <AgentInternetAlphaCard />
        </div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-[900] tracking-tight mb-1">Discover</h1>
            <p className="text-zinc-400 text-sm">80+ apps built on the Kaspa ecosystem</p>
          </div>
          <ListAppButton user={user} />
        </motion.div>

        {/* Admin proposals panel */}
        {isAdmin && <AdminProposalsPanel onChange={() => setRefreshKey(k => k + 1)} />}

        {/* Search — LLM-powered semantic search */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
          <AppStoreAISearch
            value={search}
            onSearchChange={setSearch}
            onResults={setAiResults}
          />
        </motion.div>

        {/* Featured (only when no search) */}
        {!search && category === "All" && <AppStoreFeatured />}

        {/* Category pills — larger, below Featured */}
        <motion.div ref={filtersRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-8 flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = view === "all" && category === cat.id;
            const cls = `flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold transition-all ${
              active
                ? "bg-zinc-900 text-white shadow-md"
                : "bg-white text-zinc-500 ring-1 ring-zinc-200/60 hover:bg-zinc-50"
            }`;
            if (cat.to) {
              return (
                <Link key={cat.id} to={cat.to} className={cls}>
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </Link>
              );
            }
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setCategory(cat.id);
                  setView("all");
                  requestAnimationFrame(() => {
                    const target = gridRef.current || filtersRef.current;
                    if (target) {
                      const top = target.getBoundingClientRect().top + window.scrollY - 64;
                      window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
                    }
                  });
                }}
                className={cls}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </button>
            );
          })}
        </motion.div>

        {/* Grid */}
        <div ref={gridRef}>
          <AppStoreGrid search={search} category={category} isAdmin={isAdmin} refreshKey={refreshKey} view={view} onViewChange={setView} aiResults={aiResults} />
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-zinc-200/60 text-center">
          <p className="text-[11px] text-zinc-400 font-medium tracking-wide">
            TTT · Since November 7, 2025
          </p>
        </div>
      </div>
    </div>
  );
}