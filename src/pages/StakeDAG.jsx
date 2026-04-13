import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Wallet, Trophy, Loader2, RefreshCw, Settings, Zap, Plus, TrendingUp, Bot, Copy, Check, ExternalLink, Coins } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import LiveGameCard from "@/components/kaching/LiveGameCard.jsx";
import BetReceipt from "@/components/kaching/BetReceipt";
import BetRow from "@/components/kaching/BetRow";
import SettlementAnimation from "@/components/kaching/SettlementAnimation";

import BetModal from "@/components/kaching/BetModal";
import KaChingSettings from "@/components/kaching/KaChingSettings";
import GameTimer from "@/components/kaching/GameTimer";
import GameLogs from "@/components/kaching/GameLogs";
import AgentsPanel from "@/components/kaching/AgentsPanel";
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
  const [isSettling, setIsSettling] = useState(false);
  const [showAgents, setShowAgents] = useState(false);
  const [receiptBet, setReceiptBet] = useState(null);

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
      loadUserBets();
      // Auto-generate games for current round silently
      autoGenerate();
    } catch { setAccessDenied(true); }
  };

  const autoGenerate = async () => {
    try {
      const res = await base44.functions.invoke('kachingAutoGenerate', {});
      const created = res?.data?.games_created || 0;
      if (created > 0) {
        console.log(`Auto-generated ${created} new games`);
        await loadGames();
        // Trigger bot auto-betting on new games
        triggerBotBets();
      }
    } catch {}
  };

  const triggerBotBets = async () => {
    try {
      await base44.functions.invoke('kachingBotManager', { action: 'auto_bet_all' });
      console.log('Bot auto-bet triggered');
      // Refresh games after bots bet
      setTimeout(() => loadGames(true), 8000);
    } catch (err) {
      console.log('Bot auto-bet skipped:', err.message);
    }
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

  const loadUserBets = async () => {
    try {
      // Load bets by wallet address (primary) or email (fallback)
      const addr = walletAddress || localStorage.getItem('stakedag_wallet');
      if (addr) {
        const cleanAddr = addr.startsWith('kaspa:') ? addr.slice(6) : addr;
        const bets = await base44.entities.GameBet.filter({ user_wallet_address: cleanAddr }, '-created_date', 100);
        setUserBets(bets);
      } else if (user?.email) {
        setUserBets(await base44.entities.GameBet.filter({ user_email: user.email }, '-created_date', 100));
      }
    } catch {}
  };

  const fetchBalance = useCallback((addr, forceApi = false) => {
    if (!addr) return;
    const clean = addr.startsWith('kaspa:') ? addr.slice(6) : addr;
    const fullAddr = `kaspa:${clean}`;

    // On periodic refreshes, read Terra's localStorage cache (Terra keeps it fresh)
    if (!forceApi) {
      try {
        const cached = JSON.parse(localStorage.getItem('terra_balances') || '{}');
        const val = cached[fullAddr];
        if (val !== undefined && val !== '?' && val !== null) {
          setWalletBalance(Number(val) || 0);
          return;
        }
      } catch {}
    }

    // Fresh API call on init or when forced (after a bet)
    fetch(`https://api.kaspa.org/addresses/${fullAddr}/balance`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.balance !== undefined) {
          const bal = (data.balance || 0) / 1e8;
          setWalletBalance(bal);
          try {
            const c = JSON.parse(localStorage.getItem('terra_balances') || '{}');
            c[fullAddr] = bal;
            localStorage.setItem('terra_balances', JSON.stringify(c));
          } catch {}
        }
      }).catch(() => {});
  }, []);

  // Listen for KaChing wallet changes from Terra/Wallet pages
  useEffect(() => {
    const handler = () => {
      const linked = localStorage.getItem('kaching_linked_wallet');
      const autosign = localStorage.getItem('kaching_autosign') === 'true';
      if (linked && autosign) {
        const clean = linked.startsWith('kaspa:') ? linked.slice(6) : linked;
        setWalletAddress(clean);
        localStorage.setItem('stakedag_wallet', clean);
        fetchBalance(clean);
      } else if (!autosign && walletAddress) {
        setWalletAddress(null);
        setWalletBalance(0);
        localStorage.removeItem('stakedag_wallet');
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [walletAddress, fetchBalance]);

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



  const settleGames = async (showAnimation = false) => {
    if (showAnimation) setIsSettling(true);
    try {
      const res = await base44.functions.invoke('kachingSettleGame', {});
      if (res.data?.success) {
        const count = res.data.settlements?.length || 0;
        if (count > 0) toast.success(`${count} games settled`);
      }
    } catch (err) { console.error('Settlement error:', err); }
  };

  const onSettlementAnimationComplete = async () => {
    setIsSettling(false);
    // Immediately generate new games after settlement
    await autoGenerate();
    await loadGames();
    loadUserBets();
    // Double-check after a short delay in case CoinGecko was slow
    setTimeout(async () => {
      await autoGenerate();
      await loadGames(true);
    }, 5000);
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

  // Auto-refresh every 10s to keep games live + settle at round boundaries
  useEffect(() => {
    if (accessDenied) return;
    const refresh = setInterval(() => {
      loadGames(true);
      loadUserBets();
      // Read balance from Terra's localStorage cache
      if (walletAddress) fetchBalance(walletAddress);
    }, 10000);
    // Check every 5s for round boundary → trigger settlement animation
    const roundCheck = setInterval(() => {
      const remaining = getRemainingMs();
      // When round just ended (within 5s past boundary) and not already settling
      if (remaining > 14.9 * 60 * 1000 && !isSettling) {
        // We just crossed a boundary — settle and show animation
        settleGames(true);
      }
      // Continuously ensure games exist — check every cycle
      const roundMs = 15 * 60 * 1000;
      const msSinceRound = Date.now() % roundMs;
      // Generate at 3s, 15s, 30s, and 60s into each round for redundancy
      if ((msSinceRound > 2000 && msSinceRound < 7000) ||
          (msSinceRound > 14000 && msSinceRound < 19000) ||
          (msSinceRound > 29000 && msSinceRound < 34000) ||
          (msSinceRound > 59000 && msSinceRound < 64000)) {
        if (!isSettling) autoGenerate();
      }
    }, 5000);
    return () => { clearInterval(refresh); clearInterval(roundCheck); };
  }, [accessDenied, user, isSettling]);

  // Auto-settle expired games AND ensure new games exist (check every 10s)
  useEffect(() => {
    if (accessDenied) return;
    const interval = setInterval(async () => {
      const expired = games.filter(g => g.status === 'open' && new Date(g.end_time) <= new Date());
      if (expired.length > 0 && !isSettling) {
        settleGames(true);
      }
      // If no open games at all, force auto-generate immediately
      const openGames = games.filter(g => g.status === 'open' && new Date(g.end_time) > new Date());
      if (openGames.length === 0 && !isSettling) {
        console.log('No open games detected — forcing auto-generate');
        await autoGenerate();
        await loadGames(true);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [games, accessDenied, isSettling]);

  const openBetModal = (game, side) => {
    // Check for any usable wallet (Terra wallets with mnemonic or TTT wallet with PK)
    const wallets = JSON.parse(localStorage.getItem('terra_wallets') || '[]');
    const hasWallet = wallets.some(w => w.mnemonic) || localStorage.getItem('ttt_wallet_pk');
    if (!hasWallet && !walletAddress) {
      setShowSettings(true);
      toast.error('Connect or import a wallet first');
      return;
    }
    // PIN is verified once in settings — no need to re-verify each bet
    setBetModal({ game, side });
  };

  // Only show real games with valid escrow addresses (66+ char kaspa addresses)
  const validGames = games.filter(g => g.escrow_address && g.escrow_address.length >= 60);
  // Sort KAS games first, then by pool size
  const sortGames = (list) => list.sort((a, b) => {
    if (a.subcategory === 'KAS' && b.subcategory !== 'KAS') return -1;
    if (b.subcategory === 'KAS' && a.subcategory !== 'KAS') return 1;
    return (b.total_pool_kas || 0) - (a.total_pool_kas || 0);
  });
  const openGames = sortGames(validGames.filter(g => g.status === 'open' && new Date(g.end_time) > new Date()));
  const settledGames = sortGames(validGames.filter(g => g.status === 'settled'));

  const isVerified = localStorage.getItem('kaching_verified') === 'true';
  const myActiveBets = userBets.filter(b => b.status === 'confirmed' || b.status === 'pending_deposit');

  return (
    <div className="fixed inset-0 bg-[#08080c] flex flex-col overflow-hidden">
      {accessDenied && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 relative z-10">
          <img src={LOGO_URL} alt="KaChing" className="w-16 h-16 rounded-2xl opacity-30" />
          <p className="text-white/40 text-sm font-medium">Admin access required</p>
          <Link to={createPageUrl("AppStore")} className="text-violet-400/60 text-xs hover:text-violet-400 transition-colors">← Back to App Store</Link>
        </div>
      )}

      {!accessDenied && <>
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-violet-600/[0.06] rounded-full blur-[160px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-cyan-500/[0.03] rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="flex-shrink-0 relative z-20">
        {/* Timer bar */}
        {openGames.length > 0 && (
          <div className="px-4 py-2 bg-violet-500/[0.06] border-b border-violet-500/10">
            <div className="max-w-5xl mx-auto">
              <GameTimer />
            </div>
          </div>
        )}

        {/* Nav bar */}
        <div className="px-4 py-3 border-b border-white/[0.06] bg-[#08080c]/80 backdrop-blur-2xl">
          <div className="flex items-center gap-3 max-w-5xl mx-auto">
            <Link to={createPageUrl("AppStore")} className="text-white/30 hover:text-white transition-colors p-1">
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="flex-1 flex items-center gap-3">
              <div className="relative">
                <img src={LOGO_URL} alt="KaChing" className="w-10 h-10 rounded-2xl object-cover ring-2 ring-violet-500/20" />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#08080c]" />
              </div>
              <div>
                <h1 className="text-white font-black text-lg tracking-tight leading-none">KaChing</h1>
                <p className="text-white/30 text-[10px] mt-0.5">
                  Live Predictions · Real KAS
                  {isVerified && <span className="text-emerald-400 ml-1">· ✓</span>}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/40 hover:text-white transition-all"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 ${
                  walletAddress
                    ? 'bg-violet-500/15 border border-violet-500/25 text-violet-300'
                    : 'bg-white/[0.04] border border-white/[0.08] text-white/50 hover:border-violet-500/30'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">
                  {walletAddress ? `${walletBalance.toFixed(2)} KAS` : 'Connect'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 py-2 border-b border-white/[0.04] bg-[#08080c]/60 backdrop-blur-xl">
          <div className="flex items-center gap-1 max-w-5xl mx-auto">
            {[
              { id: 'live', label: 'Live', icon: Zap, count: openGames.length },
              { id: 'mybets', label: 'My Bets', icon: Trophy, count: myActiveBets.length },
              { id: 'settled', label: 'Results', icon: TrendingUp, count: settledGames.length },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  tab === t.id
                    ? 'bg-white/[0.08] text-white'
                    : 'text-white/30 hover:text-white/50 hover:bg-white/[0.03]'
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
                {t.count > 0 && (
                  <span className={`ml-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-black ${
                    tab === t.id ? 'bg-violet-500/25 text-violet-300' : 'bg-white/[0.06] text-white/25'
                  }`}>{t.count}</span>
                )}
              </button>
            ))}

            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={() => setShowAgents(!showAgents)}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-[10px] font-bold transition-all ${
                  showAgents ? 'bg-cyan-500/15 text-cyan-400' : 'text-white/25 hover:text-white/40 hover:bg-white/[0.03]'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                Agents
              </button>
              <button
                onClick={() => setShowLogs(true)}
                className="px-3 py-2 rounded-lg text-white/25 hover:text-white/40 hover:bg-white/[0.03] text-[10px] font-bold transition-all"
              >
                Logs
              </button>
              <button
                onClick={() => loadGames()}
                className="text-white/15 hover:text-violet-400 transition-colors p-2 rounded-lg hover:bg-white/[0.03]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Agents Panel — collapsible */}
      <AnimatePresence>
        {showAgents && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex-shrink-0 relative z-10 overflow-hidden border-b border-white/[0.04]"
          >
            <div className="max-w-5xl mx-auto px-4 py-3">
              <AgentsPanel />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="flex-1 overflow-y-auto relative z-10 pb-20">
        <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">

          {tab === 'live' && (
            <>
              <SettlementAnimation active={isSettling} onComplete={onSettlementAnimationComplete} />

              {!isSettling && loading && games.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                  <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                  <p className="text-white/25 text-sm">Loading markets...</p>
                </div>
              ) : !isSettling && openGames.length === 0 ? (
                <div className="text-center py-24">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-7 h-7 text-white/10" />
                  </div>
                  <p className="text-white/30 text-sm font-medium">No active markets</p>
                  <p className="text-white/15 text-xs mt-1">Next round starting soon...</p>
                </div>
              ) : !isSettling && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {openGames.map(g => <LiveGameCard key={g.id} game={g} userBets={userBets} onBet={openBetModal} />)}
                </div>
              )}
            </>
          )}

          {tab === 'mybets' && (
            <div className="space-y-2">
              {userBets.length === 0 ? (
                <div className="text-center py-24">
                  <Trophy className="w-8 h-8 text-white/10 mx-auto mb-3" />
                  <p className="text-white/25 text-sm">No bets yet</p>
                  <p className="text-white/15 text-xs mt-1">Place your first prediction</p>
                </div>
              ) : (
                userBets.map(bet => {
                  const game = games.find(g => g.id === bet.game_id);
                  return <BetRow key={bet.id} bet={bet} game={game} onReceipt={() => setReceiptBet(bet)} />;
                })
              )}
            </div>
          )}

          {tab === 'settled' && (
            <div className="space-y-3">
              {settledGames.length === 0 ? (
                <div className="text-center py-24">
                  <TrendingUp className="w-8 h-8 text-white/10 mx-auto mb-3" />
                  <p className="text-white/25 text-sm">No results yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {settledGames.map(g => <LiveGameCard key={g.id} game={g} userBets={userBets} onBet={openBetModal} />)}
                </div>
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
              loadUserBets();
                      // Force API refresh after a bet (balance actually changed)
              if (walletAddress) fetchBalance(walletAddress, true);
            }}
          />
        )}
      </AnimatePresence>

      <GameLogs show={showLogs} onClose={() => setShowLogs(false)} />

      <BetReceipt
        show={!!receiptBet}
        onClose={() => setReceiptBet(null)}
        bet={receiptBet}
      />

      <KaChingSettings
        show={showSettings}
        onClose={() => setShowSettings(false)}
        walletAddress={walletAddress}
        walletBalance={walletBalance}
        onConnectWallet={connectWallet}
        onDisconnectWallet={disconnectWallet}
        onAutoSignChange={(v) => {
          if (v) {
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