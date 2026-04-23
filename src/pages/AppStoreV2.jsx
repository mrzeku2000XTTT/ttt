import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, ArrowLeft, Sparkles, Crown, TrendingUp, Gamepad2, Wallet, BookOpen, Users, Wrench, Shield, Palette, Radio, ShoppingBag, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";

import AppStoreGrid from "@/components/appstore2/AppStoreGrid";
import AppStoreFeatured from "@/components/appstore2/AppStoreFeatured";
import ListAppButton from "@/components/appstore2/ListAppButton";
import AdminProposalsPanel from "@/components/appstore2/AdminProposalsPanel";

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

export default function AppStoreV2Page() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [user, setUser] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-zinc-900">
      {/* Nav */}
      <nav className="sticky top-0 z-50 h-12 flex items-center justify-between px-5 bg-[#F5F5F7]/80 backdrop-blur-2xl border-b border-zinc-200/50">
        <Link to="/TTTV2" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[13px] font-medium">Back</span>
        </Link>
        <span className="text-[15px] font-[800] tracking-tight">App Store</span>
        <Link to="/Home" className="text-[13px] font-semibold text-white bg-black hover:bg-zinc-800 px-4 py-1.5 rounded-full transition-colors">
          Open TTT
        </Link>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-20">
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
      </div>
    </div>
  );
}