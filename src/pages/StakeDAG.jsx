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

export default function StakeDAGPage() {
  const [tab, setTab] = useState("games"); // games | history
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

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    // Load user
    try {
      const u = await base44.auth.me();
      setUser(u);
      // Restore wallet
      const saved = localStorage.getItem('stakedag_wallet');
      if (saved) {
        setWalletAddress(saved);
        fetchBalance(saved);
      } else if (u?.created_wallet_address) {
        setWalletAddress(u.created_wallet_address);
        fetchBalance(u.created_wallet_address);
      }
      loadBets(u.email);
    } catch {
      console.log('Not logged in');
    }
    fetchGames();
    const interval = setInterval(() => fetchGames(true), 30000);
    return () => clearInterval(interval);
  };

  const fetchGames = async (silent = false) => {
    if (!silent) setLoadingGames(true);
    try {
      const res = await base44.functions.invoke('getNBAScores', {});
      if (res.data?.games?.length) {
        setGames(res.data.games);
      }
    } catch (err) {
      console.error('Failed to fetch games:', err);
    } finally {
      setLoadingGames(false);
    }
  };

  const fetchBalance = async (addr) => {
    try {
      const res = await fetch(`https://api.kaspa.org/addresses/${addr}/balance`);
      const data = await res.json();
      if (data?.balance != null) {
        setWalletBalance(data.balance / 1e8);
      }
    } catch {
      // Fallback — just keep 0
    }
  };

  const loadBets = async (email) => {
    if (!email) return;
    setLoadingBets(true);
    try {
      const data = await base44.entities.SportsBet.filter({ user_email: email }, '-created_date', 50);
      setBets(data);
    } catch (err) {
      console.error('Failed to load bets:', err);
    } finally {
      setLoadingBets(false);
    }
  };

  const connectWallet = (addr) => {
    setWalletAddress(addr);
    localStorage.setItem('stakedag_wallet', addr);
    fetchBalance(addr);
    toast.success('Wallet connected!');
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setWalletBalance(0);
    localStorage.removeItem('stakedag_wallet');
    toast.success('Wallet disconnected');
  };

  const addSelection = (bet) => {
    // Prevent duplicates
    const exists = selections.find(s => s.game.id === bet.game.id && s.type === bet.type && s.pick === bet.pick);
    if (exists) {
      toast.error('Already in bet slip');
      return;
    }
    setSelections(prev => [...prev, bet]);
    toast.success(`${bet.pick} added to bet slip`);
  };

  const removeSelection = (idx) => {
    setSelections(prev => prev.filter((_, i) => i !== idx));
  };

  const placeBets = async (betsToPlace) => {
    if (!user) {
      toast.error('Login required');
      return;
    }
    setPlacing(true);
    try {
      for (const bet of betsToPlace) {
        await base44.entities.SportsBet.create({
          user_email: user.email,
          user_wallet_address: walletAddress,
          game_id: bet.game.id,
          team_a: bet.game.teamA,
          team_b: bet.game.teamB,
          team_a_short: bet.game.teamAShort,
          team_b_short: bet.game.teamBShort,
          team_a_logo: bet.game.teamALogo,
          team_b_logo: bet.game.teamBLogo,
          game_start_time: bet.game.startTime,
          bet_type: bet.type,
          pick: bet.pick,
          pick_detail: bet.detail,
          odds: bet.odds,
          odds_display: bet.detail,
          wager_kas: bet.wager_kas,
          potential_payout_kas: bet.potential_payout_kas,
          status: 'active',
          escrow_address: walletAddress
        });
      }
      toast.success(`${betsToPlace.length} bet${betsToPlace.length > 1 ? 's' : ''} placed!`);
      setSelections([]);
      loadBets(user.email);
    } catch (err) {
      console.error('Failed to place bet:', err);
      toast.error('Failed to place bet');
    } finally {
      setPlacing(false);
    }
  };

  const scheduledGames = games.filter(g => g.status === 'scheduled');
  const liveGames = games.filter(g => g.status === 'live');
  const finalGames = games.filter(g => g.status === 'final');

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-black z-10">
        <Link to={createPageUrl("AppStore")} className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <span className="text-white font-black text-sm">SD</span>
        </div>
        <div className="flex-1">
          <h1 className="text-white font-bold text-sm">StakeDAG</h1>
          <p className="text-white/40 text-[10px]">NBA Predictions · Powered by Kaspa</p>
        </div>

        <button
          onClick={() => setShowWallet(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${
            walletAddress
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
              : 'bg-white/5 border-white/10 text-white/50 hover:border-emerald-500/40'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span className="text-[10px] font-semibold">
            {walletAddress ? `${walletBalance.toFixed(1)} KAS` : 'Connect'}
          </span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 flex gap-1 px-4 py-2 border-b border-white/10 bg-black/50">
        {[
          { id: 'games', label: 'Games', icon: BarChart3, count: games.length },
          { id: 'history', label: 'My Bets', icon: Trophy, count: bets.filter(b => b.status === 'active' || b.status === 'pending').length },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              tab === t.id
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'text-white/40 hover:text-white/60 border border-transparent'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {t.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                tab === t.id ? 'bg-emerald-500/30 text-emerald-300' : 'bg-white/10 text-white/30'
              }`}>{t.count}</span>
            )}
          </button>
        ))}
        <button
          onClick={() => fetchGames()}
          className="ml-auto text-white/20 hover:text-emerald-400 transition-colors p-2"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ paddingBottom: selections.length > 0 ? '20rem' : '5rem' }}>
        {tab === 'games' && (
          <>
            {loadingGames && games.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                <p className="text-white/40 text-sm">Loading NBA games...</p>
              </div>
            ) : games.length === 0 ? (
              <div className="text-center py-20">
                <BarChart3 className="w-10 h-10 text-white/10 mx-auto mb-3" />
                <p className="text-white/30 text-sm">No NBA games today</p>
                <button onClick={() => fetchGames()} className="mt-3 px-4 py-2 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold">
                  Refresh
                </button>
              </div>
            ) : (
              <>
                {/* Live Games */}
                {liveGames.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-red-400 text-[10px] font-bold uppercase tracking-widest">Live Now</span>
                    </div>
                    <div className="space-y-3">
                      {liveGames.map(g => <GameCard key={g.id} game={g} onSelectBet={addSelection} isLive />)}
                    </div>
                  </div>
                )}

                {/* Upcoming — Bettable */}
                {scheduledGames.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                      <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">Upcoming — Open for Bets</span>
                    </div>
                    <div className="space-y-3">
                      {scheduledGames.map(g => <GameCard key={g.id} game={g} onSelectBet={addSelection} />)}
                    </div>
                  </div>
                )}

                {/* Final */}
                {finalGames.length > 0 && (
                  <div>
                    <span className="text-white/20 text-[10px] font-bold uppercase tracking-widest">Completed</span>
                    <div className="space-y-3 mt-2">
                      {finalGames.map(g => <GameCard key={g.id} game={g} onSelectBet={addSelection} />)}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {tab === 'history' && (
          <BetHistory bets={bets} loading={loadingBets} />
        )}
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