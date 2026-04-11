import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Wallet, Trophy, Loader2, RefreshCw, Search, TrendingUp, Flame } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import MarketCard from "@/components/kaching/MarketCard";
import PredictionSlip from "@/components/kaching/PredictionSlip";
import CategoryTabs from "@/components/kaching/CategoryTabs";
import BetHistory from "@/components/stakedag/BetHistory";
import WalletPanel from "@/components/stakedag/WalletPanel";

const LOGO_URL = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/2c211776c_generated_image.png";
const ADMIN_GATE = true;

export default function StakeDAGPage() {
  const [tab, setTab] = useState("markets");
  const [category, setCategory] = useState("All");
  const [categories, setCategories] = useState(["All", "Sports", "Crypto", "Weather"]);
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selections, setSelections] = useState([]);
  const [walletAddress, setWalletAddress] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [showWallet, setShowWallet] = useState(false);
  const [bets, setBets] = useState([]);
  const [loadingBets, setLoadingBets] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [user, setUser] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => { init(); }, []);

  const init = async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      if (ADMIN_GATE && u?.role !== 'admin') { setAccessDenied(true); return; }
      const saved = localStorage.getItem('stakedag_wallet');
      if (saved) { setWalletAddress(saved); fetchBalance(saved); }
      else if (u?.created_wallet_address) { setWalletAddress(u.created_wallet_address); fetchBalance(u.created_wallet_address); }
      loadBets(u.email);
    } catch { setAccessDenied(true); }
    fetchMarkets();
    const interval = setInterval(() => fetchMarkets(true), 30000);
    return () => clearInterval(interval);
  };

  const fetchMarkets = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await base44.functions.invoke('getPredictionMarkets', { category: 'All' });
      if (res.data?.markets?.length) setMarkets(res.data.markets);
      if (res.data?.categories?.length) setCategories(res.data.categories);
    } catch (err) { console.error('Failed to fetch markets:', err); }
    finally { setLoading(false); }
  };

  const fetchBalance = async (addr) => {
    try {
      const res = await fetch(`https://api.kaspa.org/addresses/${addr}/balance`);
      const data = await res.json();
      if (data?.balance != null) setWalletBalance(data.balance / 1e8);
    } catch {}
  };

  const loadBets = async (email) => {
    if (!email) return;
    setLoadingBets(true);
    try { setBets(await base44.entities.SportsBet.filter({ user_email: email }, '-created_date', 50)); }
    catch (err) { console.error(err); }
    finally { setLoadingBets(false); }
  };

  const connectWallet = (addr) => {
    setWalletAddress(addr);
    localStorage.setItem('stakedag_wallet', addr);
    fetchBalance(addr);
    toast.success('Wallet connected');
  };

  const disconnectWallet = () => {
    setWalletAddress(null); setWalletBalance(0);
    localStorage.removeItem('stakedag_wallet');
    toast.success('Wallet disconnected');
  };

  const addSelection = (market, side) => {
    if (selections.find(s => s.market.id === market.id && s.side === side)) {
      toast.error('Already in slip'); return;
    }
    // Remove opposite side if exists
    setSelections(prev => [...prev.filter(s => s.market.id !== market.id), { market, side }]);
    toast.success(`${side.toUpperCase()} added`);
  };

  const removeSelection = (idx) => setSelections(prev => prev.filter((_, i) => i !== idx));

  const placeBets = async (betsToPlace) => {
    if (!user) { toast.error('Login required'); return; }
    setPlacing(true);
    try {
      for (const bet of betsToPlace) {
        await base44.entities.SportsBet.create({
          user_email: user.email,
          user_wallet_address: walletAddress,
          game_id: bet.market.id,
          team_a: bet.market.yes_label,
          team_b: bet.market.no_label,
          team_a_short: bet.side === 'yes' ? 'YES' : 'NO',
          team_b_short: bet.market.subcategory,
          game_start_time: bet.market.expires,
          bet_type: 'moneyline',
          pick: bet.side === 'yes' ? bet.market.yes_label : bet.market.no_label,
          pick_detail: `${bet.side === 'yes' ? bet.market.yes_price : bet.market.no_price}¢`,
          odds: 100 / (bet.side === 'yes' ? bet.market.yes_price : bet.market.no_price),
          odds_display: `${bet.side === 'yes' ? bet.market.yes_price : bet.market.no_price}¢`,
          wager_kas: bet.amount_kas,
          potential_payout_kas: bet.potential_payout_kas,
          status: 'active',
          escrow_address: walletAddress
        });
      }
      toast.success(`${betsToPlace.length} prediction${betsToPlace.length > 1 ? 's' : ''} placed!`);
      setSelections([]);
      loadBets(user.email);
    } catch (err) { console.error(err); toast.error('Failed to place prediction'); }
    finally { setPlacing(false); }
  };

  // Filter markets
  const filteredMarkets = markets.filter(m => {
    if (category !== 'All' && m.category !== category) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return m.title?.toLowerCase().includes(q) || m.question?.toLowerCase().includes(q) || m.subcategory?.toLowerCase().includes(q);
    }
    return true;
  });

  const openMarkets = filteredMarkets.filter(m => m.status === 'open');
  const liveMarkets = filteredMarkets.filter(m => m.status === 'live');
  const closedMarkets = filteredMarkets.filter(m => m.status === 'closed');

  const activeBets = bets.filter(b => b.status === 'active' || b.status === 'pending');

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      {/* Admin gate */}
      {accessDenied && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 relative z-10">
          <img src={LOGO_URL} alt="KaChing" className="w-16 h-16 rounded-2xl opacity-30" />
          <p className="text-white/40 text-sm font-medium">Admin access required</p>
          <Link to={createPageUrl("AppStore")} className="text-emerald-400/60 text-xs hover:text-emerald-400 transition-colors">← Back to App Store</Link>
        </div>
      )}

      {!accessDenied && <>
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-emerald-600/[0.03] rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <div className="flex-shrink-0 relative z-10 px-4 py-3 border-b border-white/[0.06] bg-black/60 backdrop-blur-2xl">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <Link to={createPageUrl("AppStore")} className="text-white/30 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <img src={LOGO_URL} alt="KaChing" className="w-9 h-9 rounded-xl object-cover shadow-xl shadow-emerald-500/20 border border-emerald-500/20" />
          <div className="flex-1">
            <h1 className="text-white font-black text-lg tracking-tight">KaChing</h1>
            <p className="text-white/25 text-[10px] font-medium">Prediction Markets · Kaspa Native</p>
          </div>
          <button
            onClick={() => setShowWallet(true)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border transition-all duration-200 ${
              walletAddress
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/15'
                : 'bg-white/[0.03] border-white/[0.06] text-white/40 hover:border-emerald-500/30 hover:text-emerald-400'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span className="text-xs font-bold">
              {walletAddress ? `${walletBalance.toFixed(4)} KAS` : 'Connect'}
            </span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 relative z-10 max-w-4xl w-full mx-auto px-4 py-2.5 flex items-center gap-2">
        {[
          { id: 'markets', label: 'Markets', icon: TrendingUp, count: openMarkets.length + liveMarkets.length },
          { id: 'portfolio', label: 'Portfolio', icon: Trophy, count: activeBets.length },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 ${
              tab === t.id
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shadow-lg shadow-emerald-500/5'
                : 'text-white/30 hover:text-white/50 border border-transparent hover:bg-white/[0.03]'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {t.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-lg text-[9px] font-black ${
                tab === t.id ? 'bg-emerald-500/25 text-emerald-300' : 'bg-white/[0.06] text-white/25'
              }`}>{t.count}</span>
            )}
          </button>
        ))}
        <button
          onClick={() => fetchMarkets()}
          className="ml-auto text-white/15 hover:text-emerald-400 transition-colors p-2 rounded-xl hover:bg-white/[0.03]"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto relative z-10" style={{ paddingBottom: selections.length > 0 ? '22rem' : '5rem' }}>
        <div className="max-w-4xl mx-auto px-4 py-3 space-y-4">
          {tab === 'markets' && (
            <>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search markets..."
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-emerald-500/30 transition-colors"
                />
              </div>

              {/* Category tabs */}
              <CategoryTabs categories={categories} active={category} onSelect={setCategory} />

              {loading && markets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                  </div>
                  <p className="text-white/25 text-sm font-medium">Loading prediction markets...</p>
                </div>
              ) : filteredMarkets.length === 0 ? (
                <div className="text-center py-24">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                    <Flame className="w-6 h-6 text-white/10" />
                  </div>
                  <p className="text-white/25 text-sm font-medium">No markets found</p>
                  <p className="text-white/15 text-xs mt-1">Try a different category or search</p>
                </div>
              ) : (
                <>
                  {/* Trending banner */}
                  {category === 'All' && markets.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/8 border border-emerald-500/15 rounded-xl">
                      <Flame className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400/70 text-[10px] font-semibold">{markets.filter(m => m.status === 'open').length} open markets · {markets.filter(m => m.status === 'live').length} live · Updated every 30s</span>
                    </div>
                  )}

                  {liveMarkets.length > 0 && (
                    <section>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-red-400/80 text-[10px] font-bold uppercase tracking-[0.15em]">Live</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {liveMarkets.map(m => <MarketCard key={m.id} market={m} onSelect={addSelection} />)}
                      </div>
                    </section>
                  )}

                  {openMarkets.length > 0 && (
                    <section>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                        <span className="text-emerald-400/60 text-[10px] font-bold uppercase tracking-[0.15em]">Open Markets</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {openMarkets.map(m => <MarketCard key={m.id} market={m} onSelect={addSelection} />)}
                      </div>
                    </section>
                  )}

                  {closedMarkets.length > 0 && (
                    <section>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-white/15 text-[10px] font-bold uppercase tracking-[0.15em]">Resolved</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {closedMarkets.map(m => <MarketCard key={m.id} market={m} onSelect={addSelection} />)}
                      </div>
                    </section>
                  )}
                </>
              )}
            </>
          )}

          {tab === 'portfolio' && <BetHistory bets={bets} loading={loadingBets} />}
        </div>
      </div>

      {/* Prediction Slip */}
      <AnimatePresence>
        {selections.length > 0 && (
          <PredictionSlip
            selections={selections}
            onRemove={removeSelection}
            onClearAll={() => setSelections([])}
            onPlaceBets={placeBets}
            walletAddress={walletAddress}
            walletBalance={walletBalance}
            placing={placing}
          />
        )}
      </AnimatePresence>

      {/* Wallet Modal */}
      <WalletPanel
        walletAddress={walletAddress}
        walletBalance={walletBalance}
        onConnect={connectWallet}
        onDisconnect={disconnectWallet}
        show={showWallet}
        onClose={() => setShowWallet(false)}
      />
      </>}
    </div>
  );
}