import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, ArrowLeft, Sparkles, Crown, TrendingUp, Gamepad2, Wallet, BookOpen, Users, Wrench, Shield, Palette, Radio, ShoppingBag, ChevronRight, Bot, Menu, X, FileText, MapPin, Dumbbell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import AppStoreGrid from "@/components/appstore2/AppStoreGrid";
import AppStoreFeatured from "@/components/appstore2/AppStoreFeatured";
import ListAppButton from "@/components/appstore2/ListAppButton";
import AdminProposalsPanel from "@/components/appstore2/AdminProposalsPanel";
import BlueprintModal from "@/components/appstore2/BlueprintModal";

const CATEGORIES = [
  { id: "All", label: "All", icon: Sparkles },
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

const STORE_MENU_ITEMS = [
  { label: "Explore", path: "/AppStoreV2", icon: Sparkles },
  { label: "Products", path: "/AppStoreV2", icon: ShoppingBag },
  { label: "Kaspa", path: "/WhatIsKaspa", icon: Shield },
  { label: "TTTV", path: "/Browser", icon: Search },
  { label: "Community", path: "/Feed", icon: Users },
  { label: "What's New", path: "/TTTV2", icon: TrendingUp },
  { label: "Roadmap", path: "/TTTV2", icon: MapPin },
  { label: "Docs", path: "/Docs", icon: FileText },
];

export default function AppStoreV2Page() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [user, setUser] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [blueprintOpen, setBlueprintOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-zinc-900">
      {/* Nav */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-3 sm:px-5 bg-[#F5F5F7]/80 backdrop-blur-2xl border-b border-zinc-200/50"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="flex items-center justify-between w-full h-14">
          <Link
            to="/TTTV2"
            className="flex items-center gap-1.5 text-zinc-700 hover:text-zinc-900 transition-colors h-11 px-3 -ml-1 rounded-lg active:bg-zinc-200/60"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-[14px] font-medium">Back</span>
          </Link>
          <span className="text-[15px] font-[800] tracking-tight">App Store</span>
          <div className="hidden sm:flex items-center gap-2">
            {STORE_MENU_ITEMS.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className="flex items-center gap-1 text-[13px] font-medium text-zinc-600 hover:text-zinc-900 px-2 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="sm:hidden flex items-center">
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
                  {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {STORE_MENU_ITEMS.map(item => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.label} to={item.path}>
                      <DropdownMenuItem onClick={() => setMenuOpen(false)} className="cursor-pointer">
                        <Icon className="w-4 h-4 mr-2" />
                        <span>{item.label}</span>
                      </DropdownMenuItem>
                    </Link>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/AIAgentHub"
              className="hidden sm:flex items-center gap-1.5 text-[13px] font-semibold text-white bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 hover:opacity-90 h-10 px-3.5 rounded-full transition-opacity shadow-lg shadow-fuchsia-500/30"
            >
              <Bot className="w-3.5 h-3.5" />
              Agents
            </Link>
            <Link
              to="/AIAgentHub"
              className="sm:hidden flex items-center justify-center text-white bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 h-10 w-10 rounded-full shadow-lg shadow-fuchsia-500/30"
              title="AI Agent Hub"
            >
              <Bot className="w-4 h-4" />
            </Link>
            <Link
              to="/Home"
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

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search apps…"
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-white ring-1 ring-zinc-200/60 text-sm outline-none focus:ring-zinc-300 placeholder-zinc-400 transition-all"
            />
          </div>
        </motion.div>

        {/* Category pills */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-8 flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-semibold transition-all ${
                  active
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "bg-white text-zinc-500 ring-1 ring-zinc-200/60 hover:bg-zinc-50"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </motion.div>

        {/* Featured (only when no search) */}
        {!search && category === "All" && <AppStoreFeatured />}

        {/* Grid */}
        <AppStoreGrid search={search} category={category} isAdmin={isAdmin} refreshKey={refreshKey} />

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