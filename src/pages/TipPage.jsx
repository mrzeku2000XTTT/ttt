import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Search, Wallet, User as UserIcon, Copy, Check, Send, CheckCircle2, ArrowRight, X, Pencil, Star } from "lucide-react";

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
  const [savingProfile, setSavingProfile] = useState(false);
  const [showZkVerification, setShowZkVerification] = useState(false);
  const [zkVerifying, setZkVerifying] = useState(false);
  const [zkWalletBalance, setZkWalletBalance] = useState(null);
  const [zkTimestamp, setZkTimestamp] = useState(null);

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
            created_date: post.created_date
          });
        }
      });
      const allUsers = Array.from(map.values());

      // Hard-coded wallets
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
        allUsers.unshift({ id: activeUser.id || "current", username: activeUser.username || activeUser.full_name || activeUser.email?.split("@")[0], email: activeUser.email, created_wallet_address: activeUser.created_wallet_address, role: activeUser.role || "user" });
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

  const handleCopyAddress = (address) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(""), 2000);
  };

  const openEditProfile = () => {
    setEditName(currentUser?.username || currentUser?.full_name || "");
    setEditWallet(currentUser?.created_wallet_address || "");
    setShowEditProfile(true);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await base44.auth.updateMe({ username: editName.trim(), created_wallet_address: editWallet.trim() });
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
    const ts = Date.now(); setZkTimestamp(ts); setZkVerifying(true); setShowZkVerification(true);
    let attempts = 0;
    const check = async () => {
      attempts++;
      try {
        const r = await base44.functions.invoke("verifyKaspaSelfTransaction", { address: currentUser.created_wallet_address, expectedAmount: parseFloat(tipAmount), timestamp: ts });
        if (r.data?.verified) {
          setZkVerifying(false);
          alert(`✅ Sent ${tipAmount} KAS to ${selectedUser.username} via ZK!`);
          setShowZkVerification(false); setSelectedUser(null); setTipAmount(""); setZkTimestamp(null); return;
        }
      } catch {}
      if (attempts < 200) setTimeout(check, 3000);
      else { setZkVerifying(false); alert("Verification timeout."); }
    };
    check();
  };

  const getBadge = (user) => {
    const n = user.username?.toLowerCase().trim().replace(/\s+/g, "");
    const a = (user.created_wallet_address || "").toLowerCase();
    if (n === "destroyer") return <span className="px-1.5 py-0.5 bg-gradient-to-r from-red-600 to-black rounded text-[9px] font-bold text-white">DEATH</span>;
    if (n === "esp") return <span className="px-1.5 py-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded text-[9px] font-bold text-white">GOD</span>;
    if (n === "ttt") return <span className="px-1.5 py-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded text-[9px] font-bold text-white">ZEKU</span>;
    if (n === "hayphase") return <span className="px-1.5 py-0.5 bg-gradient-to-r from-emerald-400 to-teal-600 rounded text-[9px] font-bold text-white">👁️ POV</span>;
    if (n === "olatomiwa" && a.endsWith("du4")) return <><span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded text-[9px] font-bold">TTT</span><span className="px-1.5 py-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded text-[9px] font-bold text-white">FIRSTLADY</span></>;
    if (n === "ayomuiz" && a.endsWith("ygt")) return <><span className="px-1.5 py-0.5 bg-gradient-to-r from-amber-400 to-orange-600 text-black rounded text-[9px] font-bold">👑 KING</span></>;
    if (n === "peculiar" && a.endsWith("x20")) return <span className="px-1.5 py-0.5 bg-gradient-to-r from-slate-400 to-slate-500 rounded text-[9px] font-bold text-black">⚔️ KNIGHT</span>;
    return null;
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "linear-gradient(135deg, #000510 0%, #000d1f 40%, #001233 70%, #000a1a 100%)" }}>
      {/* Futuristic blue ambient light */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,100,255,0.12) 0%, transparent 70%)" }} />
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 40% at 20% 80%, rgba(0,60,200,0.08) 0%, transparent 60%)" }} />
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 40% at 80% 80%, rgba(0,180,255,0.06) 0%, transparent 60%)" }} />

      {/* Animated grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: "linear-gradient(rgba(0,120,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,120,255,0.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      <div className="relative z-10 px-4 sm:px-6 max-w-6xl mx-auto" style={{ paddingTop: "5rem", paddingBottom: "6rem" }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-widest uppercase"
            style={{ background: "rgba(0,120,255,0.1)", border: "1px solid rgba(0,120,255,0.3)", color: "#60a5fa" }}>
            <Zap className="w-3 h-3" /> Instant KAS Tips
          </div>
          <h1 className="text-5xl sm:text-6xl font-black mb-3 tracking-tight"
            style={{ background: "linear-gradient(135deg, #ffffff 0%, #93c5fd 40%, #3b82f6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            TapToTip
          </h1>
          <p className="text-blue-300/60 text-base font-medium">Send KAS to anyone, instantly</p>
        </motion.div>

        {/* Wallet status */}
        {currentUser && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto mb-6">
            {currentUser.created_wallet_address ? (
              <div className="flex items-center gap-3 p-4 rounded-2xl"
                style={{ background: "rgba(0,80,255,0.08)", border: "1px solid rgba(0,120,255,0.25)", backdropFilter: "blur(12px)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,120,255,0.15)" }}>
                  <Star className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-blue-300 font-semibold text-sm">Your address is live</p>
                  <p className="text-blue-400/40 text-xs font-mono truncate mt-0.5">{currentUser.created_wallet_address.slice(0,20)}...{currentUser.created_wallet_address.slice(-8)}</p>
                </div>
                <button onClick={openEditProfile} className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs px-3 py-1.5 rounded-lg transition-all"
                  style={{ border: "1px solid rgba(0,120,255,0.3)", background: "rgba(0,120,255,0.08)" }}>
                  <Pencil className="w-3 h-3" /> Edit
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-2xl"
                style={{ background: "rgba(0,80,255,0.06)", border: "1px solid rgba(0,120,255,0.2)", backdropFilter: "blur(12px)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,120,255,0.1)" }}>
                  <Wallet className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">Add your wallet to receive tips</p>
                  <p className="text-blue-400/40 text-xs mt-0.5">Appear in the grid and let the community support you</p>
                </div>
                <button onClick={openEditProfile} className="flex items-center gap-1 text-blue-400 text-xs px-3 py-1.5 rounded-lg transition-all"
                  style={{ border: "1px solid rgba(0,120,255,0.3)", background: "rgba(0,120,255,0.08)" }}>
                  Add <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </motion.div>
        )}

        {!currentUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto mb-6">
            <div className="flex items-center gap-3 p-4 rounded-2xl"
              style={{ background: "rgba(0,60,180,0.06)", border: "1px solid rgba(0,100,255,0.15)", backdropFilter: "blur(12px)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,100,255,0.1)" }}>
                <Wallet className="w-4 h-4 text-blue-400/60" />
              </div>
              <div className="flex-1">
                <p className="text-white/80 font-semibold text-sm">Want to receive KAS tips?</p>
                <p className="text-blue-400/40 text-xs mt-0.5">Sign in and add your Kaspa address</p>
              </div>
              <button onClick={() => base44.auth.redirectToLogin()} className="flex items-center gap-1 text-blue-400 text-xs px-3 py-1.5 rounded-lg transition-all"
                style={{ border: "1px solid rgba(0,120,255,0.25)", background: "rgba(0,120,255,0.06)" }}>
                Sign In <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(96,165,250,0.5)" }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or wallet..."
              className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none text-white placeholder-blue-400/30"
              style={{ background: "rgba(0,60,180,0.08)", border: "1px solid rgba(0,120,255,0.2)", backdropFilter: "blur(12px)" }}
            />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-24">
            <UserIcon className="w-14 h-14 mx-auto mb-4" style={{ color: "rgba(59,130,246,0.3)" }} />
            <p className="text-blue-400/50 font-semibold">No users found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user, i) => {
              const address = user.created_wallet_address || user.agent_zk_id;
              const isCopied = copiedAddress === address;
              const isCur = currentUser && user.email === currentUser.email;
              return (
                <motion.div key={user.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <div className="rounded-2xl p-4 transition-all hover:shadow-lg"
                    style={{
                      background: isCur ? "rgba(0,80,255,0.10)" : "rgba(0,40,120,0.06)",
                      border: isCur ? "1px solid rgba(0,120,255,0.4)" : "1px solid rgba(0,100,255,0.12)",
                      backdropFilter: "blur(16px)",
                      boxShadow: isCur ? "0 0 0 1px rgba(59,130,246,0.15), 0 4px 32px rgba(0,80,255,0.08)" : "none"
                    }}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="relative w-11 h-11 rounded-xl flex items-center justify-center text-base font-black text-white flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, rgba(0,80,200,0.5) 0%, rgba(0,40,120,0.8) 100%)", border: "1px solid rgba(0,120,255,0.3)" }}>
                        {(user.username || user.email || "?")[0].toUpperCase()}
                        {user.created_wallet_address && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center" style={{ border: "2px solid #000d1f" }}>
                            <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 flex-wrap mb-0.5">
                          <span className="text-white font-bold text-sm truncate">{user.username || "Anonymous"}</span>
                          {isCur && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: "rgba(0,120,255,0.2)", color: "#60a5fa", border: "1px solid rgba(0,120,255,0.3)" }}>YOU</span>}
                          {getBadge(user)}
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.3), rgba(5,150,105,0.3))", color: "#34d399", border: "1px solid rgba(16,185,129,0.2)" }}>$KAS</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <code className="text-[11px] truncate" style={{ color: "rgba(96,165,250,0.6)" }}>
                            {address.slice(0,12)}...{address.slice(-6)}
                          </code>
                          <button onClick={() => handleCopyAddress(address)} className="flex-shrink-0 transition-all" style={{ color: isCopied ? "#34d399" : "rgba(96,165,250,0.4)" }}>
                            {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => { setSelectedUser(user); setTipAmount(""); }}
                      className="w-full py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all hover:opacity-90 active:scale-95"
                      style={{ background: "linear-gradient(135deg, rgba(0,80,220,0.7) 0%, rgba(0,40,160,0.9) 100%)", border: "1px solid rgba(0,120,255,0.4)", color: "#93c5fd", backdropFilter: "blur(8px)" }}>
                      <Zap className="inline w-3.5 h-3.5 mr-1.5 mb-0.5" />
                      Tip
                    </button>
                  </div>
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
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-white font-black text-xl">Tip <span style={{ color: "#60a5fa" }}>{selectedUser.username}</span></h3>
                  <button onClick={() => setSelectedUser(null)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* QR */}
                <div className="bg-white p-3 rounded-2xl mb-4">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedUser.created_wallet_address || selectedUser.agent_zk_id)}`}
                    alt="QR" className="w-full h-auto rounded-xl" />
                </div>

                <div className="p-3 rounded-xl mb-4 text-center"
                  style={{ background: "rgba(0,60,180,0.1)", border: "1px solid rgba(0,120,255,0.2)" }}>
                  <p className="text-xs mb-1" style={{ color: "rgba(96,165,250,0.5)" }}>Recipient Address</p>
                  <code className="text-[11px] break-all" style={{ color: "#60a5fa" }}>{selectedUser.created_wallet_address || selectedUser.agent_zk_id}</code>
                  <button onClick={() => handleCopyAddress(selectedUser.created_wallet_address || selectedUser.agent_zk_id)}
                    className="flex items-center gap-1.5 mx-auto mt-2 text-xs transition-all" style={{ color: copiedAddress === (selectedUser.created_wallet_address || selectedUser.agent_zk_id) ? "#34d399" : "rgba(96,165,250,0.5)" }}>
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
                  <p className="text-center text-[10px]" style={{ color: "rgba(96,165,250,0.3)" }}>ZK verifies automatically via Kaspium self-send</p>
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
            <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md rounded-3xl p-6"
                style={{ background: "linear-gradient(135deg, rgba(0,20,80,0.98), rgba(0,8,30,0.99))", border: "1px solid rgba(0,120,255,0.25)", boxShadow: "0 32px 80px rgba(0,0,0,0.7)" }}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-black text-xl">Edit Profile</h3>
                  <button onClick={() => setShowEditProfile(false)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block" style={{ color: "rgba(96,165,250,0.6)" }}>Display Name</label>
                    <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your username"
                      className="w-full px-4 py-3 rounded-xl text-white outline-none"
                      style={{ background: "rgba(0,40,140,0.15)", border: "1px solid rgba(0,120,255,0.2)", caretColor: "#60a5fa" }} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block" style={{ color: "rgba(96,165,250,0.6)" }}>Kaspa Wallet Address</label>
                    <input value={editWallet} onChange={e => setEditWallet(e.target.value)} placeholder="kaspa:q..."
                      className="w-full px-4 py-3 rounded-xl text-white font-mono text-sm outline-none"
                      style={{ background: "rgba(0,40,140,0.15)", border: "1px solid rgba(0,120,255,0.2)", caretColor: "#60a5fa" }} />
                  </div>
                  <button onClick={handleSaveProfile} disabled={savingProfile || !editName.trim()}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg, #0050ff 0%, #003acc 100%)" }}>
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
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ border: "3px solid rgba(0,120,255,0.3)", borderTop: "3px solid #3b82f6", animation: "spin 1s linear infinite" }} />
                <h3 className="text-white font-black text-xl mb-2">ZK Verification</h3>
                <p className="text-sm mb-6" style={{ color: "rgba(96,165,250,0.6)" }}>Send <span className="text-blue-300 font-bold">{tipAmount} KAS</span> to yourself in Kaspium to verify</p>
                {zkWalletBalance !== null && (
                  <div className="p-3 rounded-xl mb-4" style={{ background: "rgba(0,40,140,0.12)", border: "1px solid rgba(0,120,255,0.15)" }}>
                    <p className="text-xs mb-1" style={{ color: "rgba(96,165,250,0.5)" }}>Your Balance</p>
                    <p className="text-white text-xl font-black">{zkWalletBalance.toFixed(2)} KAS</p>
                  </div>
                )}
                {currentUser?.created_wallet_address && (
                  <div className="p-3 rounded-xl mb-4" style={{ background: "rgba(0,40,140,0.12)", border: "1px solid rgba(0,120,255,0.15)" }}>
                    <p className="text-xs mb-1" style={{ color: "rgba(96,165,250,0.5)" }}>Your Address</p>
                    <p className="text-blue-300/70 text-xs font-mono break-all">{currentUser.created_wallet_address}</p>
                    <button onClick={() => { navigator.clipboard.writeText(currentUser.created_wallet_address); }}
                      className="mt-2 text-xs px-3 py-1 rounded-lg" style={{ background: "rgba(0,80,255,0.15)", color: "#60a5fa", border: "1px solid rgba(0,120,255,0.2)" }}>
                      Copy Address
                    </button>
                  </div>
                )}
                <button onClick={() => { setZkVerifying(false); setShowZkVerification(false); setTipAmount(""); }}
                  className="w-full py-2.5 rounded-xl text-sm font-bold mt-2"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
                  Cancel
                </button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}