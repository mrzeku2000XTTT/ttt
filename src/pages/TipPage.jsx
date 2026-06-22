import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Wallet, Copy, Check, Send, ArrowRight, X, Pencil, ExternalLink, ChevronDown, ChevronUp, Upload, Bot, Link as LinkIcon } from "lucide-react";

const BG_IMAGE = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/df3ad1026_generated_image.png";

// Preset Kaspa anime avatars
const PRESET_AVATARS = [
  { id: "destroyer", url: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/3b1e6b952_generated_image.png", label: "Destroyer" },
  { id: "esp", url: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/39ee5b58e_generated_image.png", label: "ESP" },
  { id: "professor", url: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/0094b4662_generated_image.png", label: "Professor" },
  { id: "king", url: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/020cd962c_generated_image.png", label: "King" },
  { id: "builder", url: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/1516cfcca_generated_image.png", label: "Builder" },
  { id: "warrior", url: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/2e6837d45_generated_image.png", label: "Warrior" },
  { id: "phantom", url: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/aaefa5272_generated_image.png", label: "Phantom" },
];

// Per-username hardcoded avatars
const USERNAME_AVATARS = {
  destroyer: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/3b1e6b952_generated_image.png",
  esp: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/39ee5b58e_generated_image.png",
  professor: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/0094b4662_generated_image.png",
  ayomuiz: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/020cd962c_generated_image.png",
};

function getAvatarUrl(user) {
  if (user.avatar_url) return user.avatar_url;
  const n = user.username?.toLowerCase().trim().replace(/\s+/g, "");
  if (n && USERNAME_AVATARS[n]) return USERNAME_AVATARS[n];
  // Deterministic preset by username hash
  if (n) {
    let hash = 0;
    for (let i = 0; i < n.length; i++) hash = ((hash << 5) - hash) + n.charCodeAt(i);
    return PRESET_AVATARS[Math.abs(hash) % PRESET_AVATARS.length].url;
  }
  return PRESET_AVATARS[0].url;
}

export default function TipPage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [tipAmount, setTipAmount] = useState("");
  const [copiedAddress, setCopiedAddress] = useState("");
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editWallet, setEditWallet] = useState("");
  const [editProject, setEditProject] = useState("");
  const [editProjectSite, setEditProjectSite] = useState("");
  const [editGithub, setEditGithub] = useState("");
  const [editTiptree, setEditTiptree] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [editAgentName, setEditAgentName] = useState("");
  const [editAgentPersona, setEditAgentPersona] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showZkVerification, setShowZkVerification] = useState(false);
  const [zkVerifying, setZkVerifying] = useState(false);
  const [zkWalletBalance, setZkWalletBalance] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [editTab, setEditTab] = useState("profile"); // profile | avatar | agent
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadCurrentUser();
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredUsers(users.filter(u =>
        u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.created_wallet_address?.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const loadCurrentUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      if (user?.created_wallet_address) loadZkWalletBalance(user.created_wallet_address);
    } catch { setCurrentUser(null); }
  };

  const loadZkWalletBalance = async (address) => {
    try {
      const r = await base44.functions.invoke("getKaspaBalance", { address });
      if (r.data?.balance) setZkWalletBalance(r.data.balance);
    } catch {}
  };

  const loadUsers = async (freshUser = null) => {
    try {
      setLoading(true);
      const activeUser = freshUser || currentUser;
      const allPosts = await base44.entities.Post.list("-created_date");
      const map = new Map();
      allPosts.forEach(post => {
        if ((post.author_wallet_address || post.author_agent_zk_id) && post.author_name) {
          const key = post.author_wallet_address || post.author_agent_zk_id;
          if (!map.has(key)) map.set(key, {
            id: post.id, username: post.author_name, email: post.created_by,
            created_wallet_address: post.author_wallet_address,
            agent_zk_id: post.author_agent_zk_id, role: post.author_role || "user",
            created_date: post.created_date,
            avatar_url: post.author_avatar_url || null,
          });
        }
      });
      const allUsers = Array.from(map.values());

      const hardcoded = [
        { id: "destroyer_hc", username: "destroyer", email: "destroyer@ttt.com", created_wallet_address: "kaspa:qpx0pwgksy0g7hzeqyajn9r3tavz2ga07v3p4kuptqgcnp7l6j2m5jp85jdf6", role: "admin", endsWith: "jdf6" },
        { id: "esp_hc", username: "ESP", email: "esp@ttt.com", created_wallet_address: "kaspa:qruat45zkdtuznry8gahmgp7yw78fnelx29wvn0p5cl9slep7x3l553cugx9h", role: "user", endsWith: "gx9h" },
        { id: "olatomiwa2_hc", username: "olatomiwa2", email: "olatomiwa2@ttt.com", created_wallet_address: "kaspa:qpe6jqvzhyhqqphy2c6n047zzlrnrng20fpy2nkm4y54gdd979t279ld96ppj", role: "user", endsWith: "6ppj" },
        { id: "kehindeayo2_hc", username: "kehindeayo2", email: "kehindeayo2@ttt.com", created_wallet_address: "kaspa:qpjf44x584fw7getwqjfnp0pvy7lwkr8l0pxatxc6jh7elwpvdmhu5h9p3nuh", role: "user", endsWith: "3nuh" },
      ];
      hardcoded.forEach(h => {
        if (!allUsers.some(u => u.created_wallet_address?.toLowerCase().endsWith(h.endsWith))) allUsers.push(h);
      });

      if (activeUser?.created_wallet_address) {
        const idx = allUsers.findIndex(u => u.email === activeUser.email);
        if (idx !== -1) allUsers.splice(idx, 1);
        allUsers.unshift({
          id: activeUser.id || "current",
          username: activeUser.username || activeUser.full_name || activeUser.email?.split("@")[0],
          email: activeUser.email,
          created_wallet_address: activeUser.created_wallet_address,
          role: activeUser.role || "user",
          project_tagline: activeUser.project_tagline,
          project_site: activeUser.project_site,
          github_url: activeUser.github_url,
          tiptree_url: activeUser.tiptree_url,
          avatar_url: activeUser.avatar_url,
          agent_name: activeUser.agent_name,
          agent_persona: activeUser.agent_persona,
        });
      }

      const filtered = allUsers.filter(u => {
        if (!u.created_wallet_address && !u.agent_zk_id) return false;
        if (u.username?.toLowerCase() === "olatomiwa" && u.created_wallet_address?.toLowerCase().endsWith("x82")) return false;
        if (u.username?.toLowerCase() === "ttt") {
          const addr = (u.created_wallet_address || u.agent_zk_id || "").toLowerCase();
          return ["vru","feq","kq3","cvru"].some(e => addr.endsWith(e));
        }
        if (u.username?.toLowerCase() === "esp") return (u.created_wallet_address || "").toLowerCase().endsWith("gx9h");
        if (u.username?.toLowerCase() === "destroyer") return (u.created_wallet_address || "").toLowerCase().endsWith("jdf6");
        return true;
      });

      const allBadges = await base44.entities.UserBadge.filter({ is_active: true });
      const badgesMap = {};
      allBadges.forEach(b => { if (!badgesMap[b.username]) badgesMap[b.username] = []; badgesMap[b.username].push(b); });

      filtered.sort((a, b) => {
        const aIsCur = activeUser && a.email === activeUser.email;
        const bIsCur = activeUser && b.email === activeUser.email;
        if (aIsCur && !bIsCur) return -1; if (!aIsCur && bIsCur) return 1;
        const aIsD = a.username?.toLowerCase() === "destroyer"; const bIsD = b.username?.toLowerCase() === "destroyer";
        if (aIsD && !bIsD) return -1; if (!aIsD && bIsD) return 1;
        const aIsT = a.username?.toLowerCase() === "ttt"; const bIsT = b.username?.toLowerCase() === "ttt";
        if (aIsT && !bIsT) return -1; if (!aIsT && bIsT) return 1;
        const pri = ["esp", "zeku"];
        const aP = pri.some(p => a.username?.toLowerCase().includes(p));
        const bP = pri.some(p => b.username?.toLowerCase().includes(p));
        if (aP && !bP) return -1; if (!aP && bP) return 1;
        return (badgesMap[b.username]?.length || 0) - (badgesMap[a.username]?.length || 0);
      });

      setUsers(filtered); setFilteredUsers(filtered);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleCopyAddress = (address, e) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(""), 2000);
  };

  const openEditProfile = (e) => {
    e?.stopPropagation();
    setEditName(currentUser?.username || currentUser?.full_name || "");
    setEditWallet(currentUser?.created_wallet_address || "");
    setEditProject(currentUser?.project_tagline || "");
    setEditProjectSite(currentUser?.project_site || "");
    setEditGithub(currentUser?.github_url || "");
    setEditTiptree(currentUser?.tiptree_url || "");
    setEditAvatarUrl(currentUser?.avatar_url || "");
    setEditAgentName(currentUser?.agent_name || "");
    setEditAgentPersona(currentUser?.agent_persona || "");
    setEditTab("profile");
    setShowEditProfile(true);
  };

  const handleAvatarFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const r = await base44.integrations.Core.UploadFile({ file });
      if (r?.file_url) setEditAvatarUrl(r.file_url);
    } catch (err) { console.error(err); }
    finally { setUploadingAvatar(false); }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await base44.auth.updateMe({
        username: editName.trim(),
        created_wallet_address: editWallet.trim(),
        project_tagline: editProject.trim(),
        project_site: editProjectSite.trim(),
        github_url: editGithub.trim(),
        tiptree_url: editTiptree.trim(),
        avatar_url: editAvatarUrl.trim(),
        agent_name: editAgentName.trim(),
        agent_persona: editAgentPersona.trim(),
      });
      const updated = await base44.auth.me();
      setCurrentUser(updated);
      setShowEditProfile(false);
      loadUsers(updated);
    } catch {} finally { setSavingProfile(false); }
  };

  const handleKaswareTip = async () => {
    if (!selectedUser || !tipAmount) return;
    if (typeof window.kasware === "undefined") { alert("Kasware wallet not detected."); return; }
    try {
      const address = selectedUser.created_wallet_address || selectedUser.agent_zk_id;
      const sompi = Math.floor(parseFloat(tipAmount) * 100000000);
      const txr = await window.kasware.sendKaspa(address, sompi);
      let txid;
      if (typeof txr === "string") { try { txid = JSON.parse(txr).id; } catch { txid = txr; } }
      else if (txr?.id) txid = txr.id;
      if (!txid || !/^[a-f0-9]{64}$/i.test(txid)) throw new Error("Invalid tx ID");
      alert(`✅ Sent ${tipAmount} KAS to ${selectedUser.username}!`);
      setSelectedUser(null); setTipAmount("");
    } catch (e) { alert(`Failed: ${e.message}`); }
  };

  const handleZkTip = async () => {
    if (!currentUser?.created_wallet_address) { alert("Please connect your TTT wallet first"); return; }
    if (!tipAmount || parseFloat(tipAmount) <= 0) { alert("Enter a valid amount"); return; }
    const ts = Date.now(); setZkVerifying(true); setShowZkVerification(true);
    let attempts = 0;
    const check = async () => {
      attempts++;
      try {
        const r = await base44.functions.invoke("verifyKaspaSelfTransaction", { address: currentUser.created_wallet_address, expectedAmount: parseFloat(tipAmount), timestamp: ts });
        if (r.data?.verified) {
          setZkVerifying(false);
          alert(`✅ Sent ${tipAmount} KAS to ${selectedUser.username} via ZK!`);
          setShowZkVerification(false); setSelectedUser(null); setTipAmount(""); return;
        }
      } catch {}
      if (attempts < 200) setTimeout(check, 3000);
      else { setZkVerifying(false); alert("Verification timeout."); }
    };
    check();
  };

  const getBadges = (user) => {
    const n = user.username?.toLowerCase().trim().replace(/\s+/g, "");
    const a = (user.created_wallet_address || "").toLowerCase();
    const badges = [];
    if (n === "destroyer") badges.push(<span key="death" className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{ background: "linear-gradient(90deg,#dc2626,#000)" }}>DEATH</span>);
    if (n === "esp") badges.push(<span key="god" className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{ background: "linear-gradient(90deg,#eab308,#ea580c)" }}>GOD</span>);
    if (n === "ttt") badges.push(<span key="zeku" className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{ background: "linear-gradient(90deg,#06b6d4,#8b5cf6)" }}>ZEKU</span>);
    if (n === "hayphase") badges.push(<span key="pov" className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{ background: "linear-gradient(90deg,#34d399,#0d9488)" }}>👁️ POV</span>);
    if (n === "olatomiwa" && a.endsWith("du4")) badges.push(<span key="fl" className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{ background: "linear-gradient(90deg,#3b82f6,#7c3aed)" }}>FIRSTLADY</span>);
    if (n === "ayomuiz" && a.endsWith("ygt")) badges.push(<span key="king" className="px-1.5 py-0.5 rounded text-[9px] font-bold text-black" style={{ background: "linear-gradient(90deg,#fbbf24,#ea580c)" }}>👑 KING</span>);
    if (n === "peculiar" && a.endsWith("x20")) badges.push(<span key="knight" className="px-1.5 py-0.5 rounded text-[9px] font-bold text-black" style={{ background: "linear-gradient(90deg,#94a3b8,#64748b)" }}>⚔️ KNIGHT</span>);
    return badges;
  };

  const toggleRow = (userId) => {
    setExpandedRow(prev => prev === userId ? null : userId);
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#010a1a" }}>
      {/* BG image */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: `url(${BG_IMAGE})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.35 }} />
      <div className="fixed inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(1,10,26,0.5) 0%, rgba(1,10,26,0.2) 40%, rgba(1,10,26,0.7) 100%)" }} />

      <div className="relative z-10 px-4 sm:px-6 max-w-2xl mx-auto" style={{ paddingTop: "4rem", paddingBottom: "6rem" }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          {/* Badge - no icon */}
          <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-widest uppercase"
            style={{ background: "rgba(0,100,255,0.12)", border: "1px solid rgba(0,150,255,0.3)", color: "#60a5fa" }}>
            Instant KAS Tips
          </div>

          {/* TapToTip with heavy shader */}
          <h1 className="font-black mb-3 leading-none select-none" style={{
            fontSize: "clamp(3.5rem,12vw,6rem)",
            fontFamily: "'Arial Black', 'Impact', system-ui, sans-serif",
            background: "linear-gradient(180deg, #ffffff 0%, #7dd3fc 30%, #3b82f6 60%, #1d4ed8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "none",
            letterSpacing: "-0.03em",
          }}>
            TapToTip
          </h1>
          <p className="text-white/40 text-sm tracking-wide">Send KAS to anyone, instantly</p>
        </motion.div>

        {/* Status banner */}
        {!currentUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5 p-4 rounded-xl flex items-center gap-3"
            style={{ background: "rgba(0,30,80,0.7)", border: "1px solid rgba(0,100,200,0.35)", backdropFilter: "blur(12px)" }}>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">Want to receive KAS tips?</p>
              <p className="text-white/40 text-xs mt-0.5">Sign in and add your Kaspa address</p>
            </div>
            <button onClick={() => base44.auth.redirectToLogin()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: "rgba(0,100,255,0.8)", border: "1px solid rgba(0,150,255,0.5)" }}>
              Sign In <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}

        {currentUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5 p-4 rounded-xl flex items-center gap-3"
            style={{ background: "rgba(0,30,80,0.7)", border: "1px solid rgba(0,100,200,0.35)", backdropFilter: "blur(12px)" }}>
            {/* Mini avatar */}
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2"
              style={{ borderColor: "rgba(0,150,255,0.5)", boxShadow: "0 0 12px rgba(0,100,255,0.4)" }}>
              <img src={getAvatarUrl(currentUser)} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">{currentUser.created_wallet_address ? "Your address is live" : "Add your wallet to receive tips"}</p>
              {currentUser.created_wallet_address && (
                <p className="text-blue-400/40 text-xs font-mono truncate mt-0.5">{currentUser.created_wallet_address.slice(0,20)}...{currentUser.created_wallet_address.slice(-8)}</p>
              )}
            </div>
            <button onClick={openEditProfile}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-300 transition-all hover:opacity-80"
              style={{ background: "rgba(0,100,255,0.2)", border: "1px solid rgba(0,150,255,0.3)" }}>
              <Pencil className="w-3 h-3" /> Edit
            </button>
          </motion.div>
        )}

        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(96,165,250,0.4)" }} />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or wallet..."
            className="w-full pl-11 pr-4 py-3 rounded-xl text-sm text-white outline-none"
            style={{ background: "rgba(0,25,70,0.6)", border: "1px solid rgba(0,100,200,0.25)", backdropFilter: "blur(12px)" }}
          />
        </div>

        {/* Directory list */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 rounded-full animate-spin" style={{ border: "2px solid rgba(0,100,255,0.2)", borderTop: "2px solid #3b82f6" }} />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-blue-400/40 font-semibold">No users found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredUsers.map((user, i) => {
              const address = user.created_wallet_address || user.agent_zk_id;
              const isCopied = copiedAddress === address;
              const isCur = currentUser && user.email === currentUser.email;
              const isExpanded = expandedRow === user.id;
              const rank = i + 1;
              const badges = getBadges(user);
              const projectTagline = user.project_tagline || (isCur && currentUser?.project_tagline) || null;
              const projectSite = user.project_site || (isCur && currentUser?.project_site) || null;
              const githubUrl = user.github_url || (isCur && currentUser?.github_url) || null;
              const tiptreeUrl = user.tiptree_url || (isCur && currentUser?.tiptree_url) || null;
              const agentName = user.agent_name || (isCur && currentUser?.agent_name) || null;
              const avatarUrl = getAvatarUrl(isCur ? { ...user, avatar_url: currentUser?.avatar_url || user.avatar_url } : user);

              return (
                <motion.div key={user.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                  <div
                    onClick={() => toggleRow(user.id)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all"
                    style={{
                      background: isExpanded ? "rgba(0,60,160,0.3)" : isCur ? "rgba(0,50,130,0.22)" : "rgba(0,25,70,0.5)",
                      border: isExpanded ? "1px solid rgba(0,150,255,0.5)" : isCur ? "1px solid rgba(0,120,255,0.4)" : "1px solid rgba(0,80,180,0.25)",
                      backdropFilter: "blur(14px)",
                    }}
                  >
                    {/* Rank */}
                    <div className="text-2xl font-black w-8 flex-shrink-0 text-right"
                      style={{ color: rank <= 3 ? "#4db8ff" : "rgba(96,165,250,0.25)", fontFamily: "monospace", textShadow: rank <= 3 ? "0 0 16px rgba(0,140,255,0.7)" : "none" }}>
                      {rank}
                    </div>

                    {/* Anime avatar */}
                    <div className="relative w-11 h-11 rounded-full flex-shrink-0 overflow-hidden"
                      style={{ border: "2px solid rgba(0,150,255,0.5)", boxShadow: "0 0 14px rgba(0,100,255,0.35)" }}>
                      <img src={avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full"
                        style={{ background: "#22c55e", border: "1.5px solid #010a1a", boxShadow: "0 0 6px rgba(34,197,94,0.8)" }} />
                    </div>

                    {/* Name + badges */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-white font-bold text-sm">{user.username || "Anonymous"}</span>
                        {isCur && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: "rgba(0,100,255,0.25)", color: "#93c5fd", border: "1px solid rgba(0,150,255,0.35)" }}>YOU</span>}
                        {agentName && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5" style={{ background: "rgba(139,92,246,0.25)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.35)" }}><Bot className="w-2 h-2" /> AI</span>}
                        {badges}
                      </div>
                      {projectTagline ? (
                        <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(148,197,255,0.55)", fontFamily: "monospace" }}>{projectTagline}</p>
                      ) : (
                        <p className="text-xs mt-0.5 font-mono truncate" style={{ color: "rgba(96,165,250,0.3)" }}>{address?.slice(0,14)}...{address?.slice(-6)}</p>
                      )}
                    </div>

                    {/* Tip button */}
                    <button
                      onClick={e => { e.stopPropagation(); setSelectedUser(user); setTipAmount(""); }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold flex-shrink-0 transition-all hover:opacity-90 active:scale-95"
                      style={{ background: "rgba(0,90,220,0.85)", border: "1px solid rgba(0,150,255,0.5)", color: "#93c5fd", boxShadow: "0 2px 14px rgba(0,80,200,0.35)" }}>
                      ⚡ Tip
                    </button>

                    <div className="flex-shrink-0 ml-1" style={{ color: "rgba(96,165,250,0.4)" }}>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* Expanded panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}>
                        <div className="mx-2 mb-1 px-4 py-4 rounded-b-xl"
                          style={{ background: "rgba(0,15,50,0.8)", border: "1px solid rgba(0,100,200,0.2)", borderTop: "none", backdropFilter: "blur(14px)" }}>

                          {/* Profile header */}
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0"
                              style={{ border: "2px solid rgba(0,150,255,0.4)", boxShadow: "0 0 20px rgba(0,100,255,0.3)" }}>
                              <img src={avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-bold">{user.username}</p>
                              {agentName && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Bot className="w-3 h-3" style={{ color: "#a78bfa" }} />
                                  <span className="text-xs" style={{ color: "#a78bfa" }}>{agentName}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <p className="text-xs font-bold mb-2 uppercase tracking-widest" style={{ color: "#4db8ff" }}>What I'm building</p>
                          {projectTagline ? (
                            <p className="text-sm leading-relaxed mb-3" style={{ color: "rgba(200,230,255,0.7)", fontFamily: "monospace" }}>{projectTagline}</p>
                          ) : (
                            <p className="text-sm mb-3" style={{ color: "rgba(96,165,250,0.3)", fontFamily: "monospace" }}>
                              {isCur ? "Click Edit above to add your project description." : "This builder hasn't added their project yet."}
                            </p>
                          )}

                          {/* Links */}
                          <div className="flex items-center gap-3 flex-wrap mb-3">
                            {tiptreeUrl && (
                              <a href={tiptreeUrl.startsWith("http") ? tiptreeUrl : `https://tiptr.ee/${tiptreeUrl}`} target="_blank" rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-all hover:opacity-80"
                                style={{ background: "rgba(234,88,12,0.2)", border: "1px solid rgba(234,88,12,0.4)", color: "#fb923c" }}>
                                🌳 TipTree <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                            {projectSite && (
                              <a href={projectSite} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                                className="flex items-center gap-1 text-xs transition-all hover:opacity-80" style={{ color: "#60a5fa" }}>
                                Project Site <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            {githubUrl && (
                              <a href={githubUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                                className="flex items-center gap-1 text-xs transition-all hover:opacity-80" style={{ color: "#60a5fa" }}>
                                GitHub <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>

                          {/* Wallet row */}
                          <div className="flex items-center gap-2 pt-3" style={{ borderTop: "1px solid rgba(0,80,180,0.2)" }}>
                            <code className="text-xs flex-1 truncate" style={{ color: "rgba(96,165,250,0.5)" }}>{address}</code>
                            <button onClick={e => handleCopyAddress(address, e)} style={{ color: isCopied ? "#34d399" : "rgba(96,165,250,0.4)" }}>
                              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            {isCur && (
                              <button onClick={openEditProfile}
                                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg ml-1"
                                style={{ background: "rgba(0,80,200,0.2)", border: "1px solid rgba(0,120,255,0.25)", color: "#93c5fd" }}>
                                <Pencil className="w-2.5 h-2.5" /> Edit
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tip Modal */}
      <AnimatePresence>
        {selectedUser && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200]" style={{ background: "rgba(0,4,20,0.92)", backdropFilter: "blur(20px)" }}
              onClick={() => setSelectedUser(null)} />
            <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm rounded-3xl p-6"
                style={{ background: "linear-gradient(135deg, rgba(0,20,80,0.98) 0%, rgba(0,10,40,0.99) 100%)", border: "1px solid rgba(0,120,255,0.3)", boxShadow: "0 0 80px rgba(0,80,255,0.2), 0 32px 64px rgba(0,0,0,0.6)" }}>
                {/* Header with avatar */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-full overflow-hidden" style={{ border: "2px solid rgba(0,150,255,0.5)" }}>
                    <img src={getAvatarUrl(selectedUser)} alt="" className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-white font-black text-xl flex-1">Tip <span style={{ color: "#60a5fa" }}>{selectedUser.username}</span></h3>
                  <button onClick={() => setSelectedUser(null)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="bg-white p-3 rounded-2xl mb-4">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedUser.created_wallet_address || selectedUser.agent_zk_id)}`} alt="QR" className="w-full h-auto rounded-xl" />
                </div>
                <div className="p-3 rounded-xl mb-4 text-center" style={{ background: "rgba(0,60,180,0.1)", border: "1px solid rgba(0,120,255,0.2)" }}>
                  <p className="text-xs mb-1" style={{ color: "rgba(96,165,250,0.5)" }}>Recipient Address</p>
                  <code className="text-[11px] break-all" style={{ color: "#60a5fa" }}>{selectedUser.created_wallet_address || selectedUser.agent_zk_id}</code>
                  <button onClick={e => handleCopyAddress(selectedUser.created_wallet_address || selectedUser.agent_zk_id, e)}
                    className="flex items-center gap-1.5 mx-auto mt-2 text-xs" style={{ color: copiedAddress === (selectedUser.created_wallet_address || selectedUser.agent_zk_id) ? "#34d399" : "rgba(96,165,250,0.5)" }}>
                    {copiedAddress === (selectedUser.created_wallet_address || selectedUser.agent_zk_id) ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                </div>
                <div className="mb-4">
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(96,165,250,0.6)" }}>Amount (KAS)</label>
                  <input type="number" step="0.01" value={tipAmount} onChange={e => setTipAmount(e.target.value)} placeholder="0.00"
                    className="w-full py-3 text-center text-2xl font-black text-white rounded-xl outline-none"
                    style={{ background: "rgba(0,40,140,0.15)", border: "1px solid rgba(0,120,255,0.25)", caretColor: "#60a5fa" }} />
                </div>
                <div className="space-y-2.5">
                  <button onClick={handleZkTip} disabled={!tipAmount || parseFloat(tipAmount) <= 0}
                    className="w-full py-3 rounded-xl text-sm font-bold tracking-wide transition-all disabled:opacity-40 hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #0050ff 0%, #003acc 100%)", color: "white", border: "1px solid rgba(0,120,255,0.5)" }}>
                    <Wallet className="inline w-4 h-4 mr-1.5 mb-0.5" /> ZK · Send via Kaspium
                  </button>
                  <button onClick={handleKaswareTip} disabled={!tipAmount || parseFloat(tipAmount) <= 0}
                    className="w-full py-3 rounded-xl text-sm font-bold tracking-wide transition-all disabled:opacity-40 hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, rgba(234,179,8,0.9) 0%, rgba(234,88,12,0.9) 100%)", color: "white" }}>
                    <Send className="inline w-4 h-4 mr-1.5 mb-0.5" /> Kasware Wallet
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditProfile && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200]" style={{ background: "rgba(0,4,20,0.88)", backdropFilter: "blur(16px)" }}
              onClick={() => setShowEditProfile(false)} />
            <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 overflow-y-auto">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md rounded-3xl p-6 my-4"
                style={{ background: "linear-gradient(135deg, rgba(0,15,60,0.99), rgba(0,8,30,0.99))", border: "1px solid rgba(0,120,255,0.25)", boxShadow: "0 32px 80px rgba(0,0,0,0.8)" }}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-white font-black text-xl">Edit Profile</h3>
                  <button onClick={() => setShowEditProfile(false)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: "rgba(0,20,60,0.6)" }}>
                  {[
                    { id: "profile", label: "Profile" },
                    { id: "avatar", label: "Avatar" },
                    { id: "agent", label: "Agent" },
                  ].map(tab => (
                    <button key={tab.id} onClick={() => setEditTab(tab.id)}
                      className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                      style={{
                        background: editTab === tab.id ? "rgba(0,100,255,0.6)" : "transparent",
                        color: editTab === tab.id ? "white" : "rgba(96,165,250,0.5)",
                        border: editTab === tab.id ? "1px solid rgba(0,150,255,0.4)" : "1px solid transparent",
                      }}>
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {/* PROFILE TAB */}
                  {editTab === "profile" && <>
                    <div>
                      <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(96,165,250,0.6)" }}>Display Name</label>
                      <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your username"
                        className="w-full px-4 py-3 rounded-xl text-white outline-none text-sm"
                        style={{ background: "rgba(0,40,140,0.15)", border: "1px solid rgba(0,120,255,0.2)", caretColor: "#60a5fa" }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(96,165,250,0.6)" }}>Kaspa Wallet Address</label>
                      <input value={editWallet} onChange={e => setEditWallet(e.target.value)} placeholder="kaspa:q..."
                        className="w-full px-4 py-3 rounded-xl text-white outline-none text-sm font-mono"
                        style={{ background: "rgba(0,40,140,0.15)", border: "1px solid rgba(0,120,255,0.2)", caretColor: "#60a5fa" }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(96,165,250,0.6)" }}>What I'm building on Kaspa</label>
                      <textarea value={editProject} onChange={e => setEditProject(e.target.value)} placeholder="e.g. Building a KRC-20 DeFi protocol..." rows={3}
                        className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none resize-none"
                        style={{ background: "rgba(0,40,140,0.15)", border: "1px solid rgba(0,120,255,0.2)", caretColor: "#60a5fa", fontFamily: "monospace" }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(96,165,250,0.6)" }}>Project Site URL</label>
                      <input value={editProjectSite} onChange={e => setEditProjectSite(e.target.value)} placeholder="https://myproject.xyz"
                        className="w-full px-4 py-3 rounded-xl text-white outline-none text-sm"
                        style={{ background: "rgba(0,40,140,0.15)", border: "1px solid rgba(0,120,255,0.2)", caretColor: "#60a5fa" }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(96,165,250,0.6)" }}>GitHub URL</label>
                      <input value={editGithub} onChange={e => setEditGithub(e.target.value)} placeholder="https://github.com/..."
                        className="w-full px-4 py-3 rounded-xl text-white outline-none text-sm"
                        style={{ background: "rgba(0,40,140,0.15)", border: "1px solid rgba(0,120,255,0.2)", caretColor: "#60a5fa" }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: "rgba(96,165,250,0.6)" }}>
                        <span>🌳</span> TipTree Profile
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-400/40 text-sm pl-1">tiptr.ee/</span>
                        <input value={editTiptree} onChange={e => setEditTiptree(e.target.value)} placeholder="yourusername"
                          className="flex-1 px-3 py-3 rounded-xl text-white outline-none text-sm"
                          style={{ background: "rgba(0,40,140,0.15)", border: "1px solid rgba(234,88,12,0.3)", caretColor: "#fb923c" }} />
                      </div>
                      <p className="text-xs mt-1" style={{ color: "rgba(96,165,250,0.3)" }}>Link to your <a href="https://tiptr.ee" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "#fb923c" }}>tiptr.ee</a> profile</p>
                    </div>
                  </>}

                  {/* AVATAR TAB */}
                  {editTab === "avatar" && <>
                    {/* Current avatar preview */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden" style={{ border: "2px solid rgba(0,150,255,0.4)" }}>
                        <img src={editAvatarUrl || getAvatarUrl({ username: editName })} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">Current Avatar</p>
                        <p className="text-xs mt-0.5" style={{ color: "rgba(96,165,250,0.4)" }}>Choose a preset or upload your own</p>
                      </div>
                    </div>

                    {/* Upload */}
                    <div>
                      <label className="text-xs font-semibold mb-2 block" style={{ color: "rgba(96,165,250,0.6)" }}>Upload Custom Avatar</label>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFileUpload} />
                      <button onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}
                        className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-80 disabled:opacity-40"
                        style={{ background: "rgba(0,80,200,0.2)", border: "1px dashed rgba(0,150,255,0.4)", color: "#93c5fd" }}>
                        <Upload className="w-4 h-4" />
                        {uploadingAvatar ? "Uploading..." : "Upload Image"}
                      </button>
                    </div>

                    {/* Or custom URL */}
                    <div>
                      <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(96,165,250,0.6)" }}>Or paste image URL</label>
                      <input value={editAvatarUrl} onChange={e => setEditAvatarUrl(e.target.value)} placeholder="https://..."
                        className="w-full px-4 py-3 rounded-xl text-white outline-none text-sm"
                        style={{ background: "rgba(0,40,140,0.15)", border: "1px solid rgba(0,120,255,0.2)", caretColor: "#60a5fa" }} />
                    </div>

                    {/* Preset grid */}
                    <div>
                      <label className="text-xs font-semibold mb-2 block" style={{ color: "rgba(96,165,250,0.6)" }}>Kaspa Anime Presets</label>
                      <div className="grid grid-cols-4 gap-2">
                        {PRESET_AVATARS.map(p => (
                          <button key={p.id} onClick={() => setEditAvatarUrl(p.url)}
                            className="relative rounded-xl overflow-hidden transition-all hover:scale-105 active:scale-95"
                            style={{
                              border: editAvatarUrl === p.url ? "2px solid #3b82f6" : "2px solid rgba(0,80,180,0.3)",
                              boxShadow: editAvatarUrl === p.url ? "0 0 12px rgba(59,130,246,0.6)" : "none",
                              aspectRatio: "1",
                            }}>
                            <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                            <div className="absolute bottom-0 left-0 right-0 text-[8px] text-white text-center font-bold pb-0.5"
                              style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.7))" }}>
                              {p.label}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>}

                  {/* AGENT TAB */}
                  {editTab === "agent" && <>
                    <div className="p-3 rounded-xl mb-2 flex items-center gap-2" style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)" }}>
                      <Bot className="w-4 h-4 flex-shrink-0" style={{ color: "#a78bfa" }} />
                      <p className="text-xs" style={{ color: "rgba(196,181,253,0.8)" }}>Give yourself a custom AI agent persona visible on your profile card.</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(196,181,253,0.6)" }}>Agent Name</label>
                      <input value={editAgentName} onChange={e => setEditAgentName(e.target.value)} placeholder="e.g. KaspaBot, DeFi Guide..."
                        className="w-full px-4 py-3 rounded-xl text-white outline-none text-sm"
                        style={{ background: "rgba(80,40,140,0.15)", border: "1px solid rgba(139,92,246,0.25)", caretColor: "#a78bfa" }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(196,181,253,0.6)" }}>Agent Persona / Description</label>
                      <textarea value={editAgentPersona} onChange={e => setEditAgentPersona(e.target.value)}
                        placeholder="e.g. I help people navigate the Kaspa ecosystem and explain KRC-20 tokens..." rows={4}
                        className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none resize-none"
                        style={{ background: "rgba(80,40,140,0.15)", border: "1px solid rgba(139,92,246,0.25)", caretColor: "#a78bfa" }} />
                    </div>
                  </>}

                  <button onClick={handleSaveProfile} disabled={savingProfile || !editName.trim()}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #0050ff 0%, #003acc 100%)", boxShadow: "0 4px 20px rgba(0,80,255,0.3)" }}>
                    {savingProfile ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ZK Modal */}
      <AnimatePresence>
        {showZkVerification && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[300]" style={{ background: "rgba(0,4,20,0.95)", backdropFilter: "blur(20px)" }} />
            <div className="fixed inset-0 z-[301] flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                className="w-full max-w-sm rounded-3xl p-6 text-center"
                style={{ background: "linear-gradient(135deg, rgba(0,20,80,0.99), rgba(0,8,30,0.99))", border: "1px solid rgba(0,120,255,0.3)", boxShadow: "0 0 80px rgba(0,80,255,0.25)" }}>
                <div className="w-16 h-16 rounded-full mx-auto mb-4 animate-spin" style={{ border: "3px solid rgba(0,120,255,0.2)", borderTop: "3px solid #3b82f6" }} />
                <h3 className="text-white font-black text-xl mb-2">ZK Verification</h3>
                <p className="text-sm mb-6" style={{ color: "rgba(96,165,250,0.6)" }}>Send <span className="text-blue-300 font-bold">{tipAmount} KAS</span> to yourself in Kaspium</p>
                {zkWalletBalance !== null && (
                  <div className="p-3 rounded-xl mb-4" style={{ background: "rgba(0,40,140,0.12)", border: "1px solid rgba(0,120,255,0.15)" }}>
                    <p className="text-xs mb-1" style={{ color: "rgba(96,165,250,0.5)" }}>Balance</p>
                    <p className="text-white text-xl font-black">{zkWalletBalance.toFixed(2)} KAS</p>
                  </div>
                )}
                {currentUser?.created_wallet_address && (
                  <div className="p-3 rounded-xl mb-4" style={{ background: "rgba(0,40,140,0.12)", border: "1px solid rgba(0,120,255,0.15)" }}>
                    <p className="text-xs mb-1 text-center" style={{ color: "rgba(96,165,250,0.5)" }}>Your Address</p>
                    <p className="text-blue-300/70 text-xs font-mono break-all">{currentUser.created_wallet_address}</p>
                    <button onClick={() => navigator.clipboard.writeText(currentUser.created_wallet_address)}
                      className="mt-2 mx-auto flex items-center gap-1 text-xs px-3 py-1 rounded-lg"
                      style={{ background: "rgba(0,80,255,0.15)", color: "#60a5fa", border: "1px solid rgba(0,120,255,0.2)" }}>
                      Copy
                    </button>
                  </div>
                )}
                <button onClick={() => { setZkVerifying(false); setShowZkVerification(false); setTipAmount(""); }}
                  className="w-full py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
                  Cancel
                </button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}