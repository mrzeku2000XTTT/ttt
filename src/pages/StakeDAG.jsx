import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Wallet, Trophy, BarChart3, Loader2, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import GameCard from "@/components/stakedag/GameCard";
import BetSlip from "@/components/stakedag/BetSlip";
import BetHistory from "@/components/stakedag/BetHistory";
import WalletPanel from "@/components/stakedag/WalletPanel";

const LOGO_URL = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/2c211776c_generated_image.png";

export default function StakeDAGPage() {
  const [tab, setTab] = useState("games");
  const [games, setGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [selections, setSelections] = useState([]);
  const [walletAddress, setWalletAddress] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [showWallet, setShowWallet] = useState(false);
  const [bets, setBets] = useState([]);
  const [loadingBets, setLoadingBets] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => { init(); }, []);

  const init = async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      const saved = localStorage.getItem('stakedag_wallet');
      if (saved) { setWalletAddress(saved); fetchBalance(saved); }
      else if (u?.created_wallet_address) { setWalletAddress(u.created_wallet_address); fetchBalance(u.created_wallet_address); }
      loadBets(u.email);
    } catch { console.log('Not logged in'); }
    fetchGames();
    const interval = setInterval(() => fetchGames(true), 30000);
    return () => clearInterval(interval);
  };

  const fetchGames = async (silent = false) => {
    if (!silent) setLoadingGames(true);
    try {
      const res = await base44.functions.invoke('getNBAScores', {});
      if (res.data?.games?.length) setGames(res.data.games);
    } catch (err) { console.error('Failed to fetch games:', err); }
    finally { setLoadingGames(false); }
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
    catch (err) { console.error('Failed to load bets:', err); }
    finally { setLoadingBets(false); }
  };

  const connectWallet = (addr) => {
    setWalletAddress(addr);
    localStorage.setItem('stakedag_wallet', addr);
    fetchBalance(addr);
    toast.success('Wallet connected!');
  };

  const disconnectWallet = () => {
    setWalletAddress(null); setWalletBalance(0);
    localStorage.removeItem('stakedag_wallet');
    toast.success('Wallet disconnected');
  };

  const addSelection = (bet) => {
    if (selections.find(s => s.game.id === bet.game.id && s.type === bet.type && s.pick === bet.pick)) {
      toast.error('Already in bet slip'); return;
    }
    setSelections(prev => [...prev, bet]);
    toast.success(`${bet.pick} added`);
  };

  const removeSelection = (idx) => setSelections(prev => prev.filter((_, i) => i !== idx));

  const placeBets = async (betsToPlace) => {
    if (!user) { toast.error('Login required'); return; }
    setPlacing(true);
    try {
      for (const bet of betsToPlace) {
        await base44.entities.SportsBet.create({
          user_email: user.email, user_wallet_address: walletAddress, game_id: bet.game.id,
          team_a: bet.game.teamA, team_b: bet.game.teamB, team_a_short: bet.game.teamAShort, team_b_short: bet.game.teamBShort,
          team_a_logo: bet.game.teamALogo, team_b_logo: bet.game.teamBLogo, game_start_time: bet.game.startTime,
          bet_type: bet.type, pick: bet.pick, pick_detail: bet.detail, odds: bet.odds, odds_display: bet.detail,
          wager_kas: bet.wager_kas, potential_payout_kas: bet.potential_payout_kas, status: 'active', escrow_address: walletAddress
        });
      }
      toast.success(`${betsToPlace.length} bet${betsToPlace.length > 1 ? 's' : ''} placed!`);
      setSelections([]);
      loadBets(user.email);
    } catch (err) { console.error('Failed to place bet:', err); toast.error('Failed to place bet'); }
    finally { setPlacing(false); }
  };

  const scheduledGames = games.filter(g => g.status === 'scheduled');
  const liveGames = games.filter(g => g.status === 'live');
  const finalGames = games.filter(g => g.status === 'final');

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-emerald-600/[0.03] rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <div className="flex-shrink-0 relative z-10 px-4 py-4 border-b border-white/[0.06] bg-black/60 backdrop-blur-2xl">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <Link to={createPageUrl("AppStore")} className="text-white/30 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <img src={LOGO_URL} alt="StakeDAG" className="w-10 h-10 rounded-2xl object-cover shadow-xl shadow-emerald-500/20 border border-emerald-500/20" />
          <div className="flex-1">
            <h1 className="text-white font-black text-lg tracking-tight">StakeDAG</h1>
            <p className="text-white/25 text-[10px] font-medium">NBA Predictions · Kaspa Native</p>
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
              {walletAddress ? `${walletBalance.toFixed(1)} KAS` : 'Connect'}
            </span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 relative z-10 max-w-3xl w-full mx-auto px-4 py-2.5 flex items-center gap-2">
        {[
          { id: 'games', label: 'Games', icon: BarChart3, count: games.length },
          { id: 'history', label: 'My Bets', icon: Trophy, count: bets.filter(b => b.status === 'active' || b.status === 'pending').length },
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
          onClick={() => fetchGames()}
          className="ml-auto text-white/15 hover:text-emerald-400 transition-colors p-2 rounded-xl hover:bg-white/[0.03]"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loadingGames ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-y-auto relative z-10"
        style={{ paddingBottom: selections.length > 0 ? '20rem' : '5rem' }}
      >
        <div className="max-w-3xl mx-auto px-4 py-3 space-y-4">
          {tab === 'games' && (
            <>
              {loadingGames && games.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                  </div>
                  <p className="text-white/25 text-sm font-medium">Loading games...</p>
                </div>
              ) : games.length === 0 ? (
                <div className="text-center py-24">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-6 h-6 text-white/10" />
                  </div>
                  <p className="text-white/25 text-sm font-medium">No NBA games today</p>
                  <button onClick={() => fetchGames()} className="mt-4 px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-emerald-400 text-xs font-bold hover:bg-emerald-500/15 transition-all">
                    Refresh
                  </button>
                </div>
              ) : (
                <>
                  {liveGames.length > 0 && (
                    <section>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-red-400/80 text-[10px] font-bold uppercase tracking-[0.15em]">Live Now</span>
                      </div>
                      <div className="space-y-3">
                        {liveGames.map(g => <GameCard key={g.id} game={g} onSelectBet={addSelection} isLive />)}
                      </div>
                    </section>
                  )}

                  {scheduledGames.length > 0 && (
                    <section>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                        <span className="text-emerald-400/60 text-[10px] font-bold uppercase tracking-[0.15em]">Upcoming — Open</span>
                      </div>
                      <div className="space-y-3">
                        {scheduledGames.map(g => <GameCard key={g.id} game={g} onSelectBet={addSelection} />)}
                      </div>
                    </section>
                  )}

                  {finalGames.length > 0 && (
                    <section>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-white/15 text-[10px] font-bold uppercase tracking-[0.15em]">Completed</span>
                      </div>
                      <div className="space-y-3">
                        {finalGames.map(g => <GameCard key={g.id} game={g} onSelectBet={addSelection} />)}
                      </div>
                    </section>
                  )}
                </>
              )}
            </>
          )}

          {tab === 'history' && <BetHistory bets={bets} loading={loadingBets} />}
        </div>
      </div>

      {/* Bet Slip */}
      <AnimatePresence>
        {selections.length > 0 && (
          <BetSlip
            selections={selections}
            onRemove={removeSelection}
            onClearAll={() => setSelections([])}
            onPlaceBet={placeBets}
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
    </div>
  );
}