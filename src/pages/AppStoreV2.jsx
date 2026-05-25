import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, ArrowLeft, Sparkles, Crown, TrendingUp, Gamepad2, Wallet, BookOpen, Users, Wrench, Shield, Palette, Radio, ShoppingBag, ChevronRight, Bot, Menu, X, FileText, MapPin } from "lucide-react";
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
  { label: "App Store", path: "/AppStoreV2", icon: ShoppingBag },
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
    <div className="min-h-screen bg-white text-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-32 pb-20">
        {/* Dark Glass Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-2xl bg-black mb-8 shadow-2xl shadow-black/20 ring-1 ring-white/10"
        >
          <img
            src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/1f3bc9ef2_generated_image.png"
            alt="Dark glass app store background"
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(34,211,238,0.22),transparent_34%)]" />
          <div className="relative p-4 sm:p-6 md:p-8 min-h-[18rem]">
            <nav className="flex items-center justify-between gap-4 rounded-2xl border border-white/15 bg-white/[0.055] px-4 sm:px-6 py-3 backdrop-blur-2xl shadow-inner shadow-white/5">
              <Link
                to="/TTTV2"
                className="text-white/90 hover:text-white text-base font-medium transition-colors"
              >
                Back
              </Link>
              <div className="hidden lg:flex items-center justify-center gap-1.5 flex-1">
                {STORE_MENU_ITEMS.map(item => {
                  const isAppStore = item.label === "App Store";
                  const isGlow = item.label === "Roadmap" || item.label === "Docs";
                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      className={`relative px-3 py-2 text-base font-medium transition-all ${
                        isAppStore
                          ? "text-cyan-300"
                          : isGlow
                            ? `text-white bg-white/10 ${item.label === "Roadmap" ? "rounded-l-xl ml-2" : "rounded-r-xl -ml-1"} shadow-[0_0_22px_rgba(34,211,238,0.55)]`
                            : "text-white/90 hover:text-cyan-200"
                      }`}
                    >
                      {item.label}
                      {isAppStore && <span className="absolute left-2 right-2 -bottom-3 h-1 bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.9)]" />}
                    </Link>
                  );
                })}
              </div>
              <div className="lg:hidden flex items-center">
                <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors">
                      {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48 bg-zinc-950 border-zinc-800 text-white">
                    {STORE_MENU_ITEMS.map(item => {
                      const Icon = item.icon;
                      return (
                        <Link key={item.label} to={item.path}>
                          <DropdownMenuItem onClick={() => setMenuOpen(false)} className="cursor-pointer focus:bg-white/10 focus:text-white">
                            <Icon className="w-4 h-4 mr-2" />
                            <span>{item.label}</span>
                          </DropdownMenuItem>
                        </Link>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-5">
                <Link
                  to="/AIAgentHub"
                  className="text-white/90 hover:text-cyan-200 text-base font-medium transition-colors"
                >
                  Agents
                </Link>
                <Link
                  to="/Home"
                  className="text-white/90 hover:text-cyan-200 text-base font-medium transition-colors"
                >
                  Open TTT
                </Link>
              </div>
            </nav>

            <button
              onClick={() => setBlueprintOpen(true)}
              className="absolute inset-x-6 bottom-8 mx-auto max-w-3xl text-center"
            >
              <div className="text-2xl text-white/45 mb-2">The Decentralized App Store</div>
              <h1 className="text-3xl text-white font-light tracking-tight mb-1">Discover</h1>
              <p className="text-3xl text-white font-light tracking-tight">80+ apps built on the Kaspa ecosystem</p>
            </button>
          </div>
        </motion.div>

        <BlueprintModal open={blueprintOpen} onClose={() => setBlueprintOpen(false)} />

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