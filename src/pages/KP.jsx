import React, { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

export default function KPPage() {
  const [activeTab, setActiveTab] = useState("VOTE");

  const tabs = [
    { name: "VOTE", icon: "X" },
    { name: "DEVS", icon: "X" },
    { name: "ECOSYSTEM", icon: "X" },
    { name: "Focused", icon: "X" },
    { name: "Latest", icon: "▶" },
    { name: "GitHub", icon: "📁" },
    { name: "Discord", icon: "💬" },
    { name: "Reddit", icon: "🎮" },
  ];

  const votePosts = [
    {
      author: "Kaspa",
      handle: "@kaspaunchained",
      avatar: "/api/placeholder/40/40",
      votes: 0,
      verified: true,
    },
    {
      author: "Kaspa Hub",
      handle: "@KaspaHub",
      avatar: "/api/placeholder/40/40",
      votes: 0,
      verified: false,
    },
    {
      author: "Kaspa",
      handle: "@kaspaunchained",
      avatar: "/api/placeholder/40/40",
      votes: 0,
      verified: true,
    },
    {
      author: "Kaspa Eco Foundation (KEF)",
      handle: "@kaspa_KEF",
      avatar: "/api/placeholder/40/40",
      votes: 0,
      verified: false,
    },
    {
      author: "Kaspa Hub",
      handle: "@KaspaHub",
      avatar: "/api/placeholder/40/40",
      votes: 0,
      verified: false,
    },
    {
      author: "Kaspa Calls",
      handle: "@KaspaCalls",
      avatar: "/api/placeholder/40/40",
      votes: 0,
      verified: false,
    },
    {
      author: "Kaspa Eco Foundation (KEF)",
      handle: "@kaspa_KEF",
      avatar: "/api/placeholder/40/40",
      votes: 0,
      verified: false,
    },
    {
      author: "Mr. Kaspa",
      handle: "@MrKaspa",
      avatar: "/api/placeholder/40/40",
      votes: 0,
      verified: false,
    },
    {
      author: "CryptoGrodd",
      handle: "@GroddBitCrypto",
      avatar: "/api/placeholder/40/40",
      votes: 0,
      verified: false,
    },
    {
      author: "FailFace.kas ɿ",
      handle: "@FailFace_69",
      avatar: "/api/placeholder/40/40",
      votes: 0,
      verified: false,
    },
    {
      author: "KaspaBots_prime",
      handle: "@KaspaBots_prime",
      avatar: "/api/placeholder/40/40",
      votes: 0,
      verified: false,
    },
    {
      author: "Titan881",
      handle: "@Titan881",
      avatar: "/api/placeholder/40/40",
      votes: 0,
      verified: false,
    },
  ];

  const devsPosts = [
    {
      author: "Kaspa Dev Team",
      handle: "@kaspadev",
      avatar: "/api/placeholder/40/40",
      votes: 0,
      verified: true,
    },
    {
      author: "BlockDAG Research",
      handle: "@blockdagresearch",
      avatar: "/api/placeholder/40/40",
      votes: 0,
      verified: false,
    },
    {
      author: "Core Contributors",
      handle: "@kaspacore",
      avatar: "/api/placeholder/40/40",
      votes: 0,
      verified: true,
    },
    {
      author: "GitHub Updates",
      handle: "@kaspagithub",
      avatar: "/api/placeholder/40/40",
      votes: 0,
      verified: false,
    },
  ];

  const ecosystemPosts = [
    {
      author: "Kaspa DeFi",
      handle: "@kaspadefi",
      avatar: "/api/placeholder/40/40",
      votes: 0,
      verified: false,
    },
    {
      author: "NFT Platform",
      handle: "@kaspanft",
      avatar: "/api/placeholder/40/40",
      votes: 0,
      verified: false,
    },
    {
      author: "Kaspa Wallets",
      handle: "@kaspawallets",
      avatar: "/api/placeholder/40/40",
      votes: 0,
      verified: true,
    },
    {
      author: "Mining Pools",
      handle: "@kaspamining",
      avatar: "/api/placeholder/40/40",
      votes: 0,
      verified: false,
    },
  ];

  const getCurrentPosts = () => {
    if (activeTab === "VOTE") return votePosts;
    if (activeTab === "DEVS") return devsPosts;
    if (activeTab === "ECOSYSTEM") return ecosystemPosts;
    return votePosts;
  };

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

      {/* Posts Grid */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {getCurrentPosts().map((post, i) => (
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

            {/* Votes */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-cyan-400">
                <span className="text-sm font-bold">{post.votes}</span>
                <span className="text-white/60">votes</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}