import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Wallet, Trophy, Loader2, RefreshCw, Settings, Zap, Plus, TrendingUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import LiveGameCard from "@/components/kaching/LiveGameCard";
import BetModal from "@/components/kaching/BetModal";
import KaChingSettings from "@/components/kaching/KaChingSettings";
import GameTimer from "@/components/kaching/GameTimer";
import GameLogs from "@/components/kaching/GameLogs";
import { getCurrentRoundEnd, getRemainingMs } from "@/components/kaching/roundClock";

const LOGO_URL = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/2c211776c_generated_image.png";
const ADMIN_GATE = true;

export default function StakeDAGPage() {
  const [tab, setTab] = useState("live");
  const [games, setGames] = useState([]);
  const [userBets, setUserBets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [walletAddress, setWalletAddress] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [betModal, setBetModal] = useState(null); // { game, side }
  const [user, setUser] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => { init(); }, []);

  const init = async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      if (ADMIN_GATE && u?.role !== 'admin') { setAccessDenied(true); return; }
      const saved = localStorage.getItem('stakedag_wallet');
      if (saved) {
        const clean = saved.startsWith('kaspa:') ? saved.slice(6) : saved;
        setWalletAddress(clean);
        fetchBalance(clean);
      } else if (u?.created_wallet_address) {
        const clean = u.created_wallet_address.startsWith('kaspa:') ? u.created_wallet_address.slice(6) : u.created_wallet_address;
        setWalletAddress(clean);
        fetchBalance(clean);
      }
      loadGames();
      loadUserBets(u.email);
      // Auto-generate games for current round silently
      autoGenerate();
    } catch { setAccessDenied(true); }
  };

  const autoGenerate = async () => {
    try {
      await base44.functions.invoke('kachingAutoGenerate', {});
      loadGames();
    } catch {}
  };

  // The global round end is always the next UTC 15-min boundary — no need for state
  const globalEndTime = getCurrentRoundEnd().toISOString();

  const loadGames = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const allGames = await base44.entities.PredictionGame.list('-created_date', 50);
      setGames(allGames);
    } catch (err) { console.error('Failed to load games:', err); }
    finally { setLoading(false); }
  };

  const loadUserBets = async (email) => {
    if (!email) return;
    try {
      setUserBets(await base44.entities.GameBet.filter({ user_email: email }, '-created_date', 100));
    } catch {}
  };

  const fetchBalance = async (addr) => {
    if (!addr) return;
    try {
      const cleanAddr = addr.startsWith('kaspa:') ? addr.replace('kaspa:', '') : addr;
      const res = await fetch(`https://api.kaspa.org/addresses/kaspa:${cleanAddr}/balance`);
      if (!res.ok) {
        // Fallback: try UTXO aggregation
        const utxoRes = await fetch(`https://api.kaspa.org/addresses/kaspa:${cleanAddr}/utxos`);
        if (utxoRes.ok) {
          const utxos = await utxoRes.json();
          const totalSompi = (utxos || []).reduce((sum, u) => sum + (u?.utxoEntry?.amount || 0), 0);
          setWalletBalance(totalSompi / 1e8);
        }
        return;
      }
      const data = await res.json();
      if (data?.balance != null) {
        setWalletBalance(data.balance / 1e8);
      }
    } catch (err) {
      console.error('Balance fetch error:', err);
    }
  };

  const connectWallet = (addr) => {
    const clean = addr.startsWith('kaspa:') ? addr.slice(6) : addr;
    setWalletAddress(clean);
    localStorage.setItem('stakedag_wallet', clean);
    fetchBalance(clean);
    toast.success('Wallet connected');
  };

  const disconnectWallet = () => {
    setWalletAddress(null); setWalletBalance(0);
    localStorage.removeItem('stakedag_wallet');
    localStorage.removeItem('kaching_verified');
    toast.success('Disconnected');
  };



  const settleGames = async () => {
    try {
      const res = await base44.functions.invoke('kachingSettleGame', {});
      if (res.data?.success) {
        toast.success(`${res.data.settlements?.length || 0} games settled`);
        loadGames();
        if (user?.email) loadUserBets(user.email);
      }
    } catch (err) { toast.error('Settlement failed'); }
  };

  const verifyDeposits = async () => {
    try {
      const res = await base44.functions.invoke('kachingVerifyDeposits', {});
      if (res.data?.success) {
        const confirmed = res.data.results?.reduce((s, r) => s + (r.confirmed || 0), 0) || 0;
        if (confirmed > 0) toast.success(`${confirmed} deposits confirmed`);
        loadGames();
      }
    } catch {}
  };

  // Auto-refresh every 30s + auto-generate at round boundaries
  useEffect(() => {
    if (accessDenied) return;
    const refresh = setInterval(() => {
      loadGames(true);
      if (user?.email) loadUserBets(user.email);
    }, 30000);
    // Check for new round every 60s
    const roundCheck = setInterval(() => {
      const now = Date.now();
      const roundMs = 15 * 60 * 1000;
      const msSinceRound = now % roundMs;
      // If within first 30s of a new round, auto-generate
      if (msSinceRound < 30000) autoGenerate();
    }, 60000);
    return () => { clearInterval(refresh); clearInterval(roundCheck); };
  }, [accessDenied, user]);

  // Auto-settle expired games
  useEffect(() => {
    if (accessDenied) return;
    const interval = setInterval(() => {
      const expired = games.filter(g => g.status === 'open' && new Date(g.end_time) <= new Date());
      if (expired.length > 0) settleGames();
    }, 30000);
    return () => clearInterval(interval);
  }, [games, accessDenied]);

  const openBetModal = (game, side) => {
    if (!walletAddress) { setShowSettings(true); toast.error('Connect wallet first'); return; }
    const isVerified = localStorage.getItem('kaching_verified') === 'true';
    if (!isVerified) { setShowSettings(true); toast.error('Verify your PIN in settings first'); return; }
    setBetModal({ game, side });
  };

  // Only show real games with valid escrow addresses (66+ char kaspa addresses)
  const validGames = games.filter(g => g.escrow_address && g.escrow_address.length >= 60);
  const openGames = validGames.filter(g => g.status === 'open' && new Date(g.end_time) > new Date());
  const settledGames = validGames.filter(g => g.status === 'settled');

  const isVerified = localStorage.getItem('kaching_verified') === 'true';
  const myActiveBets = userBets.filter(b => b.status === 'confirmed' || b.status === 'pending_deposit');

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      {accessDenied && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 relative z-10">
          <img src={LOGO_URL} alt="KaChing" className="w-16 h-16 rounded-2xl opacity-30" />
          <p className="text-white/40 text-sm font-medium">Admin access required</p>
          <Link to={createPageUrl("AppStore")} className="text-emerald-400/60 text-xs hover:text-emerald-400 transition-colors">← Back to App Store</Link>
        </div>
      )}

      {!accessDenied && <>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/[0.04] rounded-full blur-[120px]" />
      </div>

      {/* Global Timer Bar — always shows countdown to next UTC :00/:15/:30/:45 */}
      {openGames.length > 0 && (
        <div className="flex-shrink-0 relative z-20 px-4 py-1.5 bg-emerald-500/8 border-b border-emerald-500/15">
          <div className="max-w-4xl mx-auto">
            <GameTimer />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex-shrink-0 relative z-10 px-4 py-3 border-b border-white/[0.06] bg-black/60 backdrop-blur-2xl">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <Link to={createPageUrl("AppStore")} className="text-white/30 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <img src={LOGO_URL} alt="KaChing" className="w-9 h-9 rounded-xl object-cover shadow-xl shadow-emerald-500/20 border border-emerald-500/20" />
          <div className="flex-1">
            <h1 className="text-white font-black text-lg tracking-tight">KaChing</h1>
            <p className="text-white/25 text-[10px] font-medium">
              Live Predictions · Real KAS
              {isVerified && <span className="text-emerald-400 ml-1">· Verified ✓</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] text-white/40 hover:text-white transition-all"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border transition-all duration-200 ${
                walletAddress
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                  : 'bg-white/[0.03] border-white/[0.06] text-white/40 hover:border-emerald-500/30'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span className="text-xs font-bold">
                {walletAddress ? `${walletBalance.toFixed(4)} KAS` : 'Connect'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 relative z-10 max-w-4xl w-full mx-auto px-4 py-2.5 flex items-center gap-2">
        {[
          { id: 'live', label: 'Live Games', icon: Zap, count: openGames.length },
          { id: 'mybets', label: 'My Bets', icon: Trophy, count: myActiveBets.length },
          { id: 'settled', label: 'Results', icon: TrendingUp, count: settledGames.length },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              tab === t.id
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
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
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setShowLogs(true)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/40 text-[10px] font-bold hover:bg-white/[0.08] hover:text-white transition-all"
          >
            Logs
          </button>
          <button
            onClick={() => loadGames()}
            className="text-white/15 hover:text-emerald-400 transition-colors p-2 rounded-xl hover:bg-white/[0.03]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto relative z-10 pb-20">
        <div className="max-w-4xl mx-auto px-4 py-3 space-y-4">

          {tab === 'live' && (
            <>

              {loading && games.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                  <p className="text-white/25 text-sm">Loading games...</p>
                </div>
              ) : openGames.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-6 h-6 text-white/10" />
                  </div>
                  <p className="text-white/25 text-sm font-medium">No active games</p>
                  <p className="text-white/15 text-xs mt-1">Click "New Round" to generate predictions</p>
                </div>
              ) : (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-emerald-400/60 text-[10px] font-bold uppercase tracking-[0.15em]">Live — {openGames.length} markets</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {openGames.map(g => <LiveGameCard key={g.id} game={g} userBets={userBets} onBet={openBetModal} />)}
                  </div>
                </section>
              )}
            </>
          )}

          {tab === 'mybets' && (
            <div className="space-y-3">
              {userBets.length === 0 ? (
                <div className="text-center py-16">
                  <Trophy className="w-8 h-8 text-white/10 mx-auto mb-3" />
                  <p className="text-white/25 text-sm">No bets yet</p>
                </div>
              ) : (
                userBets.map(bet => {
                  const game = games.find(g => g.id === bet.game_id);
                  return (
                    <div key={bet.id} className={`p-3.5 rounded-2xl border ${
                      bet.status === 'won' ? 'bg-emerald-500/8 border-emerald-500/20' :
                      bet.status === 'lost' ? 'bg-red-500/8 border-red-500/20' :
                      'bg-white/[0.03] border-white/[0.06]'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white/40 text-[10px] font-mono">#{bet.game_number}</span>
                        <span className={`text-[10px] font-bold uppercase ${
                          bet.status === 'won' ? 'text-emerald-400' : bet.status === 'lost' ? 'text-red-400' :
                          bet.status === 'confirmed' ? 'text-blue-400' : 'text-amber-400'
                        }`}>{bet.status}</span>
                      </div>
                      <p className="text-white text-xs font-bold">{game?.question || 'Game'}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs font-bold ${bet.side === 'yes' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {bet.side.toUpperCase()} — {bet.amount_kas} KAS
                        </span>
                        {bet.payout_kas > 0 && (
                          <span className="text-emerald-400 text-xs font-bold">+{bet.payout_kas.toFixed(2)} KAS</span>
                        )}
                      </div>
                      {bet.tx_hash_out && (
                        <p className="text-white/15 text-[9px] font-mono mt-1 truncate">TX: {bet.tx_hash_out}</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {tab === 'settled' && (
            <div className="space-y-3">
              {settledGames.length === 0 ? (
                <div className="text-center py-16">
                  <TrendingUp className="w-8 h-8 text-white/10 mx-auto mb-3" />
                  <p className="text-white/25 text-sm">No results yet</p>
                </div>
              ) : (
                settledGames.map(g => <LiveGameCard key={g.id} game={g} userBets={userBets} onBet={openBetModal} />)
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bet Modal */}
      <AnimatePresence>
        {betModal && (
          <BetModal
            game={betModal.game}
            side={betModal.side}
            walletAddress={walletAddress}
            onClose={() => setBetModal(null)}
            onSuccess={() => {
              loadGames();
              if (user?.email) loadUserBets(user.email);
            }}
          />
        )}
      </AnimatePresence>

      {/* Logs */}
      <GameLogs show={showLogs} onClose={() => setShowLogs(false)} />

      {/* Settings */}
      <KaChingSettings
        show={showSettings}
        onClose={() => setShowSettings(false)}
        walletAddress={walletAddress}
        walletBalance={walletBalance}
        onConnectWallet={connectWallet}
        onDisconnectWallet={disconnectWallet}
        onAutoSignChange={(v) => {
          if (v) {
            // Auto-connect linked wallet address
            try {
              const linked = localStorage.getItem('kaching_linked_wallet');
              const wallets = JSON.parse(localStorage.getItem('terra_wallets') || '[]');
              const w = wallets.find(w => w.address === linked && w.mnemonic);
              if (w) {
                const clean = w.address.startsWith('kaspa:') ? w.address.slice(6) : w.address;
                setWalletAddress(clean);
                localStorage.setItem('stakedag_wallet', clean);
                fetchBalance(clean);
              }
            } catch {}
          }
        }}
      />
      </>}
    </div>
  );
}