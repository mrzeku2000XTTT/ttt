import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Plus, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function KaspromoPage() {
  const [activeTab, setActiveTab] = useState("VOTE");
  const [userVotes, setUserVotes] = useState(() => {
    const saved = localStorage.getItem('kp_votes');
    return saved ? JSON.parse(saved) : {};
  });
  const [user, setUser] = useState(null);
  const [devs, setDevs] = useState([]);
  const [showAddDevModal, setShowAddDevModal] = useState(false);
  const [newAvatar, setNewAvatar] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    loadUser();
    loadDevs();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.log("Not logged in");
    }
  };

  const loadDevs = async () => {
    try {
      const devsData = await base44.entities.KaspaDev.list();
      setDevs(devsData);
    } catch (err) {
      console.error("Failed to load devs:", err);
    }
  };

  const handleAddDev = async () => {
    if (!user?.username || !user?.created_wallet_address) {
      alert("You need a TTT username and Kaspa address to register as a dev!");
      return;
    }

    const existingDev = devs.find(d => d.username === user.username);
    if (existingDev) {
      alert("You're already registered as a dev!");
      return;
    }

    try {
      await base44.entities.KaspaDev.create({
        username: user.username,
        kaspa_address: user.created_wallet_address,
        twitter_handle: user.username,
        avatar: newAvatar || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/53badb4f2_image.png",
        verified: false,
        votes: 0
      });
      setShowAddDevModal(false);
      setNewAvatar("");
      loadDevs();
    } catch (err) {
      console.error("Failed to add dev:", err);
      alert("Failed to register as dev");
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setNewAvatar(file_url);
    } catch (err) {
      console.error("Failed to upload avatar:", err);
    }
    setUploadingAvatar(false);
  };

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

  const defaultAvatar = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/53badb4f2_image.png";

  const votePosts = [
    {
      author: "Kaspa",
      handle: "@kaspaunchained",
      avatar: defaultAvatar,
      votes: 0,
      verified: true,
    },
    {
      author: "Kaspa Hub",
      handle: "@KaspaHub",
      avatar: defaultAvatar,
      votes: 0,
      verified: false,
    },
    {
      author: "Kaspa Eco Foundation (KEF)",
      handle: "@kaspa_KEF",
      avatar: defaultAvatar,
      votes: 0,
      verified: false,
    },
    {
      author: "Kaspa Calls",
      handle: "@KaspaCalls",
      avatar: defaultAvatar,
      votes: 0,
      verified: false,
    },
    {
      author: "Mr. Kaspa",
      handle: "@KaspaGuru",
      avatar: defaultAvatar,
      votes: 0,
      verified: false,
    },
    {
      author: "CryptoGrodd",
      handle: "@groddofcrypto",
      avatar: defaultAvatar,
      votes: 0,
      verified: false,
    },
    {
      author: "FailFace.kas ɿ",
      handle: "@FullFace_69",
      avatar: defaultAvatar,
      votes: 0,
      verified: false,
    },
    {
      author: "KaspaBots_prime",
      handle: "@KaspaBots_prime",
      avatar: defaultAvatar,
      votes: 0,
      verified: false,
    },
    {
      author: "Titan881",
      handle: "@TitanLin88",
      avatar: defaultAvatar,
      votes: 0,
      verified: false,
    },
    {
      author: "Kaspa Currency",
      handle: "@KaspaCurrency",
      avatar: defaultAvatar,
      votes: 0,
      verified: false,
    },
    {
      author: "Kaspa News",
      handle: "@KaspaNews",
      avatar: defaultAvatar,
      votes: 0,
      verified: false,
    },
    {
      author: "Kaspa Miners",
      handle: "@KaspaMiners",
      avatar: defaultAvatar,
      votes: 0,
      verified: false,
    },
    {
      author: "Shai Wyborski",
      handle: "@hashdag",
      avatar: defaultAvatar,
      votes: 0,
      verified: true,
    },
    {
      author: "Kaspa Finance",
      handle: "@KaspaFinance",
      avatar: defaultAvatar,
      votes: 0,
      verified: false,
    },
    {
      author: "Kaspa Price",
      handle: "@KaspaPrice",
      avatar: defaultAvatar,
      votes: 0,
      verified: false,
    },
  ];

  const devsPosts = devs.map(dev => ({
    author: dev.username,
    handle: `@${dev.twitter_handle}`,
    avatar: dev.avatar,
    votes: dev.votes,
    verified: dev.verified,
    kaspa_address: dev.kaspa_address
  }));

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

  const handleVote = (handle) => {
    const newVotes = { ...userVotes };
    if (newVotes[handle]) {
      delete newVotes[handle];
    } else {
      newVotes[handle] = true;
    }
    setUserVotes(newVotes);
    localStorage.setItem('kp_votes', JSON.stringify(newVotes));
  };

  const getVoteCount = (handle) => {
    return userVotes[handle] ? 1 : 0;
  };

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
            <span className="text-lg">🚀</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">KASPROMO</h1>
            <p className="text-xs text-white/60">Vote for Kaspa community leaders</p>
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

      {/* Add Dev Button - Only on DEVS tab */}
      {activeTab === "DEVS" && user?.username && (
        <div className="p-4">
          <Button
            onClick={() => setShowAddDevModal(true)}
            className="w-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Yourself as a Kaspa Dev
          </Button>
        </div>
      )}

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
              <button
                onClick={() => handleVote(post.handle)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  userVotes[post.handle]
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                    : "text-white/60 hover:text-cyan-400 hover:bg-white/5"
                }`}
              >
                <span className="text-base">
                  {userVotes[post.handle] ? "✓" : "○"}
                </span>
                <span className="text-sm font-bold">{getVoteCount(post.handle)}</span>
                <span className="text-xs">votes</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}