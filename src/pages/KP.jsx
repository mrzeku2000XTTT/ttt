import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Heart, MessageCircle, Eye, ExternalLink } from "lucide-react";

export default function KPPage() {
  const [activeTab, setActiveTab] = useState("Feed");

  const tabs = [
    { name: "Feed", icon: "X" },
    { name: "Devs", icon: "X" },
    { name: "Ecosystem", icon: "X" },
    { name: "Focused", icon: "X" },
    { name: "Latest", icon: "▶" },
    { name: "GitHub", icon: "📁" },
    { name: "Discord", icon: "💬" },
    { name: "Reddit", icon: "🎮" },
  ];

  const feedPosts = [
    {
      author: "Kaspa",
      handle: "@KaspaCoin",
      avatar: "/api/placeholder/40/40",
      content: "150M tx on a PoW blockDAG and the bottleneck is people, not the network. Keep poking.",
      likes: 538,
      comments: 21,
      views: 20800,
      time: "22h ago",
      verified: true,
    },
    {
      author: "Kaspa Hub",
      handle: "@KaspaHub",
      avatar: "/api/placeholder/40/40",
      content: '"$10 Kaspa is possible." — Davinci Jeremie x.com/i/broadcasts/1...',
      likes: 158,
      comments: 23,
      views: 15300,
      time: "15h ago",
      verified: false,
    },
    {
      author: "Kaspa",
      handle: "@KaspaCoin",
      avatar: "/api/placeholder/40/40",
      content: "Kaspa's 10 BPS isn't just speed, it tilts variance math toward solo miners. Decentralization experiment still early.",
      likes: 234,
      comments: 51,
      views: 12400,
      time: "18h ago",
      verified: true,
    },
    {
      author: "Kaspa Eco Foundation (KEF)",
      handle: "@kaspa_KEF",
      avatar: "/api/placeholder/40/40",
      content: "New #kaspa flywheel != anything else @hashdag",
      likes: 233,
      comments: 67,
      views: 10400,
      time: "13h ago",
      verified: false,
    },
    {
      author: "Kaspa Hub",
      handle: "@KaspaHub",
      avatar: "/api/placeholder/40/40",
      content: "🔴 LIVE NOW: @hashdag speaking from London at @Tokenize_LDN! x.com/i/broadcasts/1...",
      likes: 88,
      comments: 23,
      views: 7800,
      time: "13h ago",
      verified: false,
    },
    {
      author: "Kaspa Calls",
      handle: "@KaspaCalls",
      avatar: "/api/placeholder/40/40",
      content: "Since apparently nobody has posted it yet: 'Breaking News' The upcoming listing of Kaspa on HTX has been confirmed.",
      likes: 305,
      comments: 35,
      views: 6700,
      time: "18h ago",
      verified: false,
    },
    {
      author: "Kaspa Eco Foundation (KEF)",
      handle: "@kaspa_KEF",
      avatar: "/api/placeholder/40/40",
      content: "In less than 2hrs!",
      likes: 108,
      comments: 34,
      views: 6600,
      time: "14h ago",
      verified: false,
    },
    {
      author: "Mr. Kaspa",
      handle: "@MrKaspa",
      avatar: "/api/placeholder/40/40",
      content: "On yesterday's Blockchain Banter episode, KEF announced that @HTX_Global will list Kaspa KEF paid a 'reasonable' fee for this listing that mentioned Kaspa's UTXO model can...",
      likes: 138,
      comments: 26,
      views: 5600,
      time: "11h ago",
      verified: false,
    },
    {
      author: "CryptoGrodd",
      handle: "@GroddBitCrypto",
      avatar: "/api/placeholder/40/40",
      content: "@KaspaFinance might be one of the most underrated projects in the entire Kaspa ecosystem. The consistency, the grind, the dedication — unmatched. $KAS",
      likes: 115,
      comments: 4,
      views: 4500,
      time: "19h ago",
      verified: false,
    },
    {
      author: "FailFace.kas ɿ",
      handle: "@FailFace_69",
      avatar: "/api/placeholder/40/40",
      content: "The myth, the man, the legend! Very pleased to meet @hashdag irl! $kas",
      likes: 390,
      comments: 8,
      views: 4400,
      time: "20h ago",
      verified: false,
    },
    {
      author: "KaspaBots_prime",
      handle: "@KaspaBots_prime",
      avatar: "/api/placeholder/40/40",
      content: "Confirmed. HTX listing is a solid step for Kaspa's visibility and liquidity. But let's stay focused: the real value is in the protocol's robustness and the community's innovation. Listings: MIX",
      likes: 82,
      comments: 18,
      views: 4100,
      time: "17h ago",
      verified: false,
    },
    {
      author: "Titan881",
      handle: "@Titan881",
      avatar: "/api/placeholder/40/40",
      content: '🔵 Summary of the Talk — English Version "Kaspa\'s True Strength: Real-Time Decentralization (RTD)" The crypto evidence we have: IMAGES 📸 REPORT 📋 PEOPLE 👥',
      likes: 97,
      comments: 28,
      views: 3800,
      time: "16h ago",
      verified: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 bg-cyan-500/20 border border-cyan-500/40 rounded-lg flex items-center justify-center">
            <span className="text-lg">📰</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Kaspa News</h1>
            <p className="text-xs text-white/60">Latest updates from kaspa.news</p>
          </div>
          <button className="ml-auto text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 px-4 overflow-x-auto scrollbar-hide pb-3">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.name
                  ? "bg-white/10 text-white border-b-2 border-cyan-500"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="text-sm">{tab.icon}</span>
              <span className="text-sm font-medium">{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Feed Grid */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {feedPosts.map((post, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-[#15171c] border border-white/10 rounded-2xl p-4 hover:border-cyan-500/30 transition-all group"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-500/20 border border-cyan-500/40 rounded-full flex items-center justify-center text-lg">
                  {post.author[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <div className="text-sm font-bold text-white truncate">{post.author}</div>
                    {post.verified && (
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-[10px]">✓</span>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-white/40">{post.handle}</div>
                </div>
              </div>
              <button className="text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <p className="text-sm text-white/80 mb-4 line-clamp-4">{post.content}</p>

            {/* Stats */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-pink-400">
                  <Heart className="w-4 h-4 fill-pink-400" />
                  <span className="font-semibold">{post.likes}</span>
                </div>
                <div className="flex items-center gap-1 text-white/40">
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.comments}</span>
                </div>
                <div className="flex items-center gap-1 text-white/40">
                  <Eye className="w-4 h-4" />
                  <span>{post.views >= 1000 ? `${(post.views / 1000).toFixed(1)}K` : post.views}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/40">{post.time}</span>
                <ExternalLink className="w-3 h-3 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}