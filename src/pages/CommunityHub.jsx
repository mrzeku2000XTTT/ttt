import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  ArrowLeft, Send, Globe, Youtube, Twitter, Plus, Flame,
  Users, ExternalLink, X, CheckCircle, Loader2, Wallet,
  ChevronRight, Star, MessageCircle, Code, TrendingUp,
  BookOpen, Gamepad2, Zap, Shield
} from "lucide-react";

const HOT_TELEGRAMS = [
  { title: "Kaspa Official", url: "https://t.me/kaspaenglish", description: "The official Kaspa English community — news, updates, and discussions.", members: "40k+", badge: "🔥 Official" },
  { title: "Kaspa Trading", url: "https://t.me/Kasparians", description: "Price analysis, market signals and KAS trading strategies.", members: "15k+", badge: "📈 Trading" },
  { title: "Kaspa Developers", url: "https://t.me/kaspa_devs", description: "Build on Kaspa — KRC-20, smart contracts, and dev tools.", members: "5k+", badge: "🛠 Dev" },
  { title: "Kaspa News", url: "https://t.me/KaspaNews", description: "Real-time Kaspa news, Toccata hard fork updates, and ecosystem coverage.", members: "20k+", badge: "📰 News" },
  { title: "KRC-20 Gems", url: "https://t.me/krc20gems", description: "Early-stage KRC-20 token launches and community picks.", members: "8k+", badge: "💎 KRC-20" },
  { title: "Kaspa Mining", url: "https://t.me/KaspaMining", description: "Hashrate, miners, rig configs, and PoW discussion.", members: "12k+", badge: "⛏ Mining" },
];

const TYPE_CONFIG = {
  telegram: { icon: Send, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/30", label: "Telegram" },
  discord: { icon: MessageCircle, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/30", label: "Discord" },
  website: { icon: Globe, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", label: "Website" },
  twitter: { icon: Twitter, color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/30", label: "X / Twitter" },
  youtube: { icon: Youtube, color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", label: "YouTube" },
};

const CAT_ICONS = {
  trading: TrendingUp, developers: Code, news: Flame, gaming: Gamepad2,
  education: BookOpen, general: Users, nft: Star, defi: Zap
};

export default function CommunityHub() {
  const navigate = useNavigate();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState("");
  const [hasWallet, setHasWallet] = useState(false);
  const [checkingWallet, setCheckingWallet] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [form, setForm] = useState({ type: "telegram", title: "", url: "", description: "", category: "general", members_count: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    detectWallet();
    loadLinks();
  }, []);

  // Poll for wallet if not found (user might generate one)
  useEffect(() => {
    if (hasWallet) return;
    const interval = setInterval(detectWallet, 3000);
    return () => clearInterval(interval);
  }, [hasWallet]);

  const detectWallet = async () => {
    setCheckingWallet(true);
    try {
      // 1. Kasware extension
      if (typeof window.kasware !== "undefined") {
        const accounts = await window.kasware.getAccounts().catch(() => []);
        if (accounts.length > 0) { setWalletAddress(accounts[0]); setHasWallet(true); setCheckingWallet(false); return; }
      }
      // 2. TTT stored wallet
      const user = await base44.auth.me().catch(() => null);
      if (user?.created_wallet_address) { setWalletAddress(user.created_wallet_address); setHasWallet(true); setCheckingWallet(false); return; }
      // 3. localStorage TTT wallet
      const local = localStorage.getItem("ttt_wallet_address");
      if (local) { setWalletAddress(local); setHasWallet(true); setCheckingWallet(false); return; }
      // Terra wallets
      const terra = JSON.parse(localStorage.getItem("terra_wallets") || "[]");
      if (Array.isArray(terra) && terra[0]?.address) { setWalletAddress(terra[0].address); setHasWallet(true); setCheckingWallet(false); return; }
    } catch {}
    setHasWallet(false);
    setCheckingWallet(false);
  };

  const loadLinks = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.CommunityLink.list("-upvotes", 100);
      setLinks(data);
    } catch { setLinks([]); }
    setLoading(false);
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.title.trim()) { setError("Title is required"); return; }
    if (!form.url.trim()) { setError("URL is required"); return; }
    const urlOk = form.url.startsWith("http://") || form.url.startsWith("https://") || form.url.startsWith("t.me/") || form.url.startsWith("discord.gg/");
    if (!urlOk) { setError("Please enter a valid URL (https://... or t.me/...)"); return; }
    setSubmitting(true);
    try {
      const normalizedUrl = form.url.startsWith("http") ? form.url : `https://${form.url}`;
      await base44.entities.CommunityLink.create({
        wallet_address: walletAddress,
        type: form.type,
        title: form.title.trim(),
        url: normalizedUrl,
        description: form.description.trim(),
        category: form.category,
        members_count: form.members_count.trim(),
      });
      setSubmitted(true);
      setShowForm(false);
      setForm({ type: "telegram", title: "", url: "", description: "", category: "general", members_count: "" });
      await loadLinks();
      setTimeout(() => setSubmitted(false), 4000);
    } catch (e) { setError("Failed to submit. Try again."); }
    setSubmitting(false);
  };

  const handleUpvote = async (link) => {
    if (!hasWallet) return;
    try {
      await base44.entities.CommunityLink.update(link.id, { upvotes: (link.upvotes || 0) + 1 });
      setLinks(prev => prev.map(l => l.id === link.id ? { ...l, upvotes: (l.upvotes || 0) + 1 } : l));
    } catch {}
  };

  const filtered = activeFilter === "all" ? links : links.filter(l => l.type === activeFilter || l.category === activeFilter);

  const TypeIcon = ({ type, className }) => {
    const Ic = TYPE_CONFIG[type]?.icon || Globe;
    return <Ic className={className} />;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 h-14 flex items-center justify-between px-4 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-bold text-white">Community Hub</span>
        </div>
        <div className="w-16" />
      </nav>

      <div className="pt-14 pb-24">
        {/* Hero */}
        <div className="relative px-4 py-12 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/20 via-purple-900/10 to-transparent pointer-events-none" />
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-3 py-1 text-[11px] font-bold text-cyan-400 mb-4">
              <Flame className="w-3 h-3" /> Kaspa Community Links
            </div>
            <h1 className="text-3xl font-black tracking-tight mb-2">Community Hub</h1>
            <p className="text-white/50 text-sm leading-relaxed">Share your Telegram, Discord, or website — anonymously via your wallet. No name. No email. Just Kaspa.</p>
          </motion.div>
        </div>

        {/* HOT TELEGRAMS */}
        <section className="px-4 mb-10">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-bold text-white">🔥 Hot Telegram Groups</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {HOT_TELEGRAMS.map((tg, i) => (
                <motion.a
                  key={i}
                  href={tg.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group flex flex-col gap-2 bg-white/5 border border-white/10 hover:border-cyan-500/40 hover:bg-cyan-500/5 rounded-2xl p-4 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                        <Send className="w-4 h-4 text-cyan-400" />
                      </div>
                      <span className="font-bold text-sm text-white">{tg.title}</span>
                    </div>
                    <span className="text-[10px] bg-white/10 rounded-full px-2 py-0.5 text-white/60 whitespace-nowrap">{tg.badge}</span>
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed line-clamp-2">{tg.description}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-[11px] text-cyan-400 font-semibold">{tg.members} members</span>
                    <div className="flex items-center gap-1 text-white/40 group-hover:text-cyan-400 transition-colors text-xs">
                      Join <ExternalLink className="w-3 h-3" />
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>
          </div>
        </section>

        {/* Wallet Gate / Add Button */}
        <div className="px-4 mb-6">
          <div className="max-w-5xl mx-auto">
            {checkingWallet ? (
              <div className="flex items-center gap-2 text-white/40 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Detecting wallet...
              </div>
            ) : hasWallet ? (
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-xs text-white/40 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  <span className="font-mono">{walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}</span>
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm px-4 py-2 rounded-full transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Your Community
                </button>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-1">No wallet detected</h3>
                    <p className="text-white/50 text-sm mb-3">To post your community link anonymously, you need a Kaspa wallet. No email or name required — just your wallet address.</p>
                    <div className="flex flex-wrap gap-2">
                      <Link to="/ConnectWallet" className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs px-3 py-2 rounded-full transition-colors">
                        <Wallet className="w-3 h-3" /> Generate TTT Wallet
                      </Link>
                      <a href="https://kasware.xyz" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 border border-white/20 text-white/70 hover:text-white text-xs px-3 py-2 rounded-full transition-colors">
                        Install Kasware <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-white/30 text-[11px] mt-2">Once your wallet is ready, this page will detect it automatically.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit success */}
        <AnimatePresence>
          {submitted && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mx-4 mb-4 max-w-5xl lg:mx-auto bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle className="w-4 h-4 flex-shrink-0" /> Community submitted! It will appear in the list below.
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter tabs */}
        <div className="px-4 mb-4">
          <div className="max-w-5xl mx-auto flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {["all", "telegram", "discord", "website", "twitter"].map(f => (
              <button key={f} onClick={() => setActiveFilter(f)}
                className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all capitalize ${activeFilter === f ? "bg-cyan-500 border-cyan-500 text-black" : "bg-white/5 border-white/10 text-white/60 hover:text-white"}`}>
                {f === "all" ? "All" : TYPE_CONFIG[f]?.label || f}
              </button>
            ))}
          </div>
        </div>

        {/* Community Links Grid */}
        <div className="px-4">
          <div className="max-w-5xl mx-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-white/40 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading communities...
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-white/30">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No community links yet. Be the first to add yours!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map((link, i) => {
                  const tc = TYPE_CONFIG[link.type] || TYPE_CONFIG.website;
                  const CatIcon = CAT_ICONS[link.category] || Users;
                  return (
                    <motion.div key={link.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className={`flex flex-col gap-2 bg-white/5 border rounded-2xl p-4 transition-all hover:bg-white/8 ${link.is_featured ? "border-yellow-500/40 bg-yellow-500/5" : "border-white/10"}`}>
                      {link.is_featured && (
                        <span className="text-[10px] font-bold text-yellow-400 flex items-center gap-1"><Star className="w-3 h-3" /> Featured</span>
                      )}
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center border flex-shrink-0 ${tc.bg}`}>
                          <TypeIcon type={link.type} className={`w-4 h-4 ${tc.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-white truncate">{link.title}</div>
                          <div className="text-[10px] text-white/40">{tc.label} · {link.category}</div>
                        </div>
                      </div>
                      {link.description && (
                        <p className="text-xs text-white/50 leading-relaxed line-clamp-2">{link.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          {link.members_count && (
                            <span className="text-[10px] text-white/40 flex items-center gap-1"><Users className="w-3 h-3" /> {link.members_count}</span>
                          )}
                          <button onClick={() => handleUpvote(link)} disabled={!hasWallet}
                            className="text-[10px] text-white/40 hover:text-emerald-400 transition-colors flex items-center gap-1 disabled:opacity-30">
                            ↑ {link.upvotes || 0}
                          </button>
                        </div>
                        <a href={link.url} target="_blank" rel="noopener noreferrer"
                          className={`flex items-center gap-1 text-xs font-semibold ${tc.color} hover:opacity-80 transition-opacity`}>
                          Join <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Community Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowForm(false)}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md p-6"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-white">Add Your Community</h3>
                  <p className="text-xs text-white/40 mt-0.5">Submitted anonymously via your wallet</p>
                </div>
                <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Wallet display */}
              <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 mb-4 flex items-center gap-2 text-xs text-white/50">
                <Shield className="w-3 h-3 text-emerald-400" />
                <span className="font-mono">{walletAddress.slice(0, 12)}...{walletAddress.slice(-6)}</span>
                <span className="ml-auto text-emerald-400 font-semibold">✓ Anonymous</span>
              </div>

              <div className="space-y-3">
                {/* Type */}
                <div>
                  <label className="text-xs text-white/50 font-semibold mb-1 block">Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                      <button key={key} onClick={() => setForm(f => ({ ...f, type: key }))}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-2 rounded-xl border transition-all ${form.type === key ? `${cfg.bg} ${cfg.color}` : "bg-white/5 border-white/10 text-white/50 hover:text-white"}`}>
                        <cfg.icon className="w-3 h-3" /> {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/50 font-semibold mb-1 block">Community Name *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Kaspa Trading Hub"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50" />
                </div>

                <div>
                  <label className="text-xs text-white/50 font-semibold mb-1 block">Link / URL *</label>
                  <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                    placeholder="https://t.me/yourgroup or discord.gg/..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50" />
                </div>

                <div>
                  <label className="text-xs text-white/50 font-semibold mb-1 block">Short Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="What's this community about?"
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-white/50 font-semibold mb-1 block">Category</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50">
                      {["general","trading","developers","news","gaming","education","nft","defi"].map(c => (
                        <option key={c} value={c} className="bg-zinc-800">{c.charAt(0).toUpperCase()+c.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 font-semibold mb-1 block">Members (optional)</label>
                    <input value={form.members_count} onChange={e => setForm(f => ({ ...f, members_count: e.target.value }))}
                      placeholder="e.g. 5k+"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50" />
                  </div>
                </div>

                {error && <p className="text-red-400 text-xs">{error}</p>}

                <button onClick={handleSubmit} disabled={submitting}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-bold text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Plus className="w-4 h-4" /> Submit Community</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}