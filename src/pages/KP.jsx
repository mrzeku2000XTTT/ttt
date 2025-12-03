import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { X, Plus, Upload, ExternalLink, Wallet } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function KaspromoPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("VOTE");
  const [userVotes, setUserVotes] = useState(() => {
    const saved = localStorage.getItem('kp_votes');
    return saved ? JSON.parse(saved) : {};
  });
  const [user, setUser] = useState(null);
  const [devs, setDevs] = useState([]);
  const [showAddDevModal, setShowAddDevModal] = useState(false);
  const [newAvatar, setNewAvatar] = useState("");
  const [coverPhoto, setCoverPhoto] = useState("");
  const [knsId, setKnsId] = useState("");
  const [description, setDescription] = useState("");
  const [fundingGoal, setFundingGoal] = useState("");
  const [howFundsUsed, setHowFundsUsed] = useState("");
  const [appUrl, setAppUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [selectedDev, setSelectedDev] = useState(null);
  const [tipAmount, setTipAmount] = useState("");

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
        cover_photo: coverPhoto || "",
        kns_id: knsId || "",
        app_url: appUrl || "",
        description: description || "",
        funding_goal: fundingGoal ? parseFloat(fundingGoal) : 0,
        how_funds_used: howFundsUsed || "",
        verified: false,
        votes: 0,
        total_tips: 0
      });
      setShowAddDevModal(false);
      setNewAvatar("");
      setCoverPhoto("");
      setKnsId("");
      setDescription("");
      setFundingGoal("");
      setHowFundsUsed("");
      setAppUrl("");
      loadDevs();
    } catch (err) {
      console.error("Failed to add dev:", err);
      alert("Failed to register as dev");
    }
  };

  const handleTip = async () => {
    if (!tipAmount || parseFloat(tipAmount) <= 0) {
      alert("Please enter a valid tip amount");
      return;
    }

    if (typeof window.kasware === 'undefined') {
      alert('Kasware wallet not detected. Please install Kasware extension.');
      return;
    }

    try {
      // Convert KAS to sompi (1 KAS = 100,000,000 sompi)
      const sompiAmount = Math.floor(parseFloat(tipAmount) * 100000000);
      
      // Send KAS via Kasware
      const txResponse = await window.kasware.sendKaspa(selectedDev.kaspa_address, sompiAmount);
      
      // Extract transaction ID
      let txid;
      if (typeof txResponse === 'string') {
        try {
          const parsed = JSON.parse(txResponse);
          txid = parsed.id;
        } catch {
          txid = txResponse;
        }
      } else if (txResponse && typeof txResponse === 'object') {
        txid = txResponse.id;
      }
      
      if (!txid || !/^[a-f0-9]{64}$/i.test(txid)) {
        throw new Error('Invalid transaction ID');
      }

      // Update dev's total tips after successful transaction
      await base44.entities.KaspaDev.update(selectedDev.id, {
        total_tips: (selectedDev.total_tips || 0) + parseFloat(tipAmount)
      });
      
      alert(`✅ Tipped ${tipAmount} KAS to ${selectedDev.author}! 🚀\n\nTX: ${txid.substring(0, 8)}...`);
      setShowTipModal(false);
      setTipAmount("");
      setSelectedDev(null);
      loadDevs();
    } catch (err) {
      console.error("Failed to tip:", err);
      alert(`Failed to send tip: ${err.message || 'Transaction cancelled'}`);
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

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setCoverPhoto(file_url);
    } catch (err) {
      console.error("Failed to upload cover:", err);
    }
    setUploadingCover(false);
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
    id: dev.id,
    author: dev.username,
    handle: `@${dev.twitter_handle}`,
    avatar: dev.avatar,
    votes: dev.votes,
    verified: dev.verified,
    kaspa_address: dev.kaspa_address,
    app_url: dev.app_url,
    total_tips: dev.total_tips || 0,
    cover_photo: dev.cover_photo,
    kns_id: dev.kns_id,
    description: dev.description,
    funding_goal: dev.funding_goal,
    how_funds_used: dev.how_funds_used
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
      {activeTab === "DEVS" && (
        <div className="p-4">
          {user?.username ? (
            <motion.button
              onClick={() => setShowAddDevModal(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 text-white hover:border-cyan-400 transition-all rounded-xl py-4 px-6 flex items-center justify-center gap-3 group shadow-lg shadow-cyan-500/10"
            >
              <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center group-hover:bg-cyan-400 transition-colors">
                <Plus className="w-5 h-5 text-black" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold">Add Yourself as a KASPA DEV!</div>
                <div className="text-xs text-cyan-400">Showcase your Kaspa contributions</div>
              </div>
            </motion.button>
          ) : (
            <div className="text-center py-6 bg-white/5 rounded-xl border border-white/10">
              <p className="text-white/60 text-sm">Login with TTT to add yourself as a dev</p>
            </div>
          )}
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
            className="relative bg-gradient-to-br from-[#15171c] to-[#0a0a0a] border border-white/10 rounded-2xl p-5 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all group"
          >
            {/* Verified badge glow */}
            {post.verified && (
              <div className="absolute top-2 right-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50">
                  <span className="text-white text-sm">✓</span>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
              <div className="relative">
                <img 
                  src={post.avatar || defaultAvatar} 
                  alt={post.author}
                  className="w-14 h-14 rounded-full border-2 border-cyan-500/40 object-cover"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center border-2 border-[#15171c]">
                  <span className="text-[10px]">K</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                {post.app_url ? (
                  <a 
                    href={post.app_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors group"
                  >
                    {post.author}
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ) : (
                  <div className="text-sm font-bold text-white truncate">{post.author}</div>
                )}
                <div className="text-xs text-cyan-400/60">{post.handle}</div>
                {post.kaspa_address && (
                  <div className="text-[10px] text-white/30 mt-1 truncate">
                    {post.kaspa_address.slice(0, 12)}...{post.kaspa_address.slice(-8)}
                  </div>
                )}
                {activeTab === "DEVS" && post.total_tips > 0 && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-yellow-400">
                    <Wallet className="w-3 h-3" />
                    <span className="font-bold">{post.total_tips.toFixed(2)} KAS</span>
                    <span className="text-white/40">tips</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <motion.button
                onClick={() => handleVote(post.handle)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${
                  userVotes[post.handle]
                    ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30"
                    : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-cyan-400 border border-white/10"
                }`}
              >
                <span className="text-xl">
                  {userVotes[post.handle] ? "✓" : "○"}
                </span>
                <span className="text-sm">{userVotes[post.handle] ? "VOTED" : "VOTE"}</span>
                <span className="text-xs bg-black/30 px-2 py-1 rounded-full">
                  {getVoteCount(post.handle)}
                </span>
              </motion.button>

              {activeTab === "DEVS" && post.kaspa_address && (
                <motion.button
                  onClick={() => {
                    setSelectedDev(post);
                    setShowTipModal(true);
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 transition-all font-medium text-sm"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Tip Dev</span>
                </motion.button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Dev Modal */}
      {showAddDevModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4"
          onClick={() => setShowAddDevModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-[#1a1d2e] to-[#0a0a0a] border border-cyan-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl shadow-cyan-500/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Add Yourself as a KASPA DEV!</h2>
                <p className="text-xs text-cyan-400/60">Join the builder community</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-cyan-400 font-medium mb-2 block">Username (from TTT)</label>
                <Input
                  value={user?.username || ""}
                  disabled
                  className="bg-white/5 border-cyan-500/30 text-white h-12 rounded-xl"
                />
              </div>

              <div>
                <label className="text-sm text-cyan-400 font-medium mb-2 block">Kaspa Address (from KNS)</label>
                <Input
                  value={user?.created_wallet_address || ""}
                  disabled
                  className="bg-white/5 border-cyan-500/30 text-white text-xs h-12 rounded-xl"
                />
              </div>

              <div>
                <label className="text-sm text-cyan-400 font-medium mb-2 block">KNS ID (Optional)</label>
                <Input
                  value={knsId}
                  onChange={(e) => setKnsId(e.target.value)}
                  placeholder="your.kas"
                  className="bg-white/5 border-cyan-500/30 text-white h-12 rounded-xl"
                />
                <p className="text-xs text-white/40 mt-1">Your Kaspa Name Service ID</p>
              </div>

              <div>
                <label className="text-sm text-cyan-400 font-medium mb-2 block">App URL (Optional)</label>
                <Input
                  value={appUrl}
                  onChange={(e) => setAppUrl(e.target.value)}
                  placeholder="https://your-app.com"
                  className="bg-white/5 border-cyan-500/30 text-white h-12 rounded-xl"
                />
                <p className="text-xs text-white/40 mt-1">Link to your Kaspa project or app</p>
              </div>

              <div>
                <label className="text-sm text-cyan-400 font-medium mb-2 block">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What are you building? Why do you need funding?"
                  className="bg-white/5 border-cyan-500/30 text-white rounded-xl resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm text-cyan-400 font-medium mb-2 block">Funding Goal (KAS)</label>
                <Input
                  type="number"
                  value={fundingGoal}
                  onChange={(e) => setFundingGoal(e.target.value)}
                  placeholder="1000"
                  className="bg-white/5 border-cyan-500/30 text-white h-12 rounded-xl"
                />
              </div>

              <div>
                <label className="text-sm text-cyan-400 font-medium mb-2 block">How Funds Will Be Used</label>
                <Textarea
                  value={howFundsUsed}
                  onChange={(e) => setHowFundsUsed(e.target.value)}
                  placeholder="Server costs, development, marketing..."
                  className="bg-white/5 border-cyan-500/30 text-white rounded-xl resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm text-cyan-400 font-medium mb-2 block">Profile Photo (Optional)</label>
                {newAvatar ? (
                  <div className="flex items-center gap-4">
                    <img src={newAvatar} alt="Avatar" className="w-20 h-20 rounded-full border-2 border-cyan-500/40" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNewAvatar("")}
                      className="border-red-500/40 text-red-400 hover:bg-red-500/10"
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-3 px-6 py-4 bg-white/5 border-2 border-dashed border-cyan-500/30 rounded-xl cursor-pointer hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all group">
                    <Upload className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                    <span className="text-sm text-cyan-400 font-medium">
                      {uploadingAvatar ? "Uploading..." : "Upload Custom Avatar"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={uploadingAvatar}
                    />
                  </label>
                )}
                <p className="text-xs text-white/40 mt-2 text-center">
                  Leave empty to use default Kaspa logo
                </p>
                </div>

                <div>
                <label className="text-sm text-cyan-400 font-medium mb-2 block">Cover Photo / KNS Badge (Optional)</label>
                {coverPhoto ? (
                  <div className="flex items-center gap-4">
                    <img src={coverPhoto} alt="Cover" className="w-32 h-20 rounded-lg border-2 border-cyan-500/40 object-cover" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCoverPhoto("")}
                      className="border-red-500/40 text-red-400 hover:bg-red-500/10"
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-3 px-6 py-4 bg-white/5 border-2 border-dashed border-cyan-500/30 rounded-xl cursor-pointer hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all group">
                    <Upload className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                    <span className="text-sm text-cyan-400 font-medium">
                      {uploadingCover ? "Uploading..." : "Upload Cover Photo"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      className="hidden"
                      disabled={uploadingCover}
                    />
                  </label>
                )}
                <p className="text-xs text-white/40 mt-2 text-center">
                  Your KNS badge or custom banner
                </p>
                </div>

                <div className="flex gap-3 mt-8 pt-6 border-t border-white/10">
                <Button
                  onClick={() => {
                    setShowAddDevModal(false);
                    setNewAvatar("");
                    setCoverPhoto("");
                    setKnsId("");
                    setDescription("");
                    setFundingGoal("");
                    setHowFundsUsed("");
                    setAppUrl("");
                  }}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10 h-12 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddDev}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white h-12 rounded-xl font-bold shadow-lg shadow-cyan-500/30"
                >
                  Register as Dev
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Tip Modal */}
      {showTipModal && selectedDev && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4"
          onClick={() => setShowTipModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-[#1a1d2e] to-[#0a0a0a] border border-yellow-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl shadow-yellow-500/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Tip {selectedDev.author}</h2>
                <p className="text-xs text-yellow-400/60">Support this developer</p>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-yellow-500/20">
              <div className="flex items-center gap-3 mb-3">
                <img 
                  src={selectedDev.avatar || defaultAvatar} 
                  alt={selectedDev.author}
                  className="w-12 h-12 rounded-full border-2 border-yellow-500/40"
                />
                <div>
                  <div className="text-sm font-bold text-white">{selectedDev.author}</div>
                  <div className="text-xs text-white/60">{selectedDev.handle}</div>
                </div>
              </div>
              <div className="text-xs text-white/40">
                Address: {selectedDev.kaspa_address?.slice(0, 12)}...{selectedDev.kaspa_address?.slice(-8)}
              </div>
              {selectedDev.total_tips > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2">
                  <span className="text-xs text-white/60">Total tips received:</span>
                  <span className="text-sm font-bold text-yellow-400">{selectedDev.total_tips.toFixed(2)} KAS</span>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-yellow-400 font-medium mb-2 block">Tip Amount (KAS)</label>
                <Input
                  type="number"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                  placeholder="0.00"
                  className="bg-white/5 border-yellow-500/30 text-white h-12 rounded-xl text-lg font-bold"
                />
              </div>

              <div className="flex gap-2">
                {[1, 5, 10, 25].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setTipAmount(amount.toString())}
                    className="flex-1 px-3 py-2 bg-white/5 border border-yellow-500/30 rounded-lg text-yellow-400 hover:bg-yellow-500/10 transition-all text-sm font-medium"
                  >
                    {amount} KAS
                  </button>
                ))}
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
                <Button
                  onClick={() => {
                    setShowTipModal(false);
                    setTipAmount("");
                    setSelectedDev(null);
                  }}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10 h-12 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleTip}
                  disabled={!tipAmount || parseFloat(tipAmount) <= 0}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white h-12 rounded-xl font-bold shadow-lg shadow-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Tip
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}