import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Wallet, Copy, Check, RefreshCw, Zap, Power, Send, ChevronDown, ChevronUp, Loader2, Trophy, TrendingUp, X } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

function BotCard({ bot, onRefresh, onToggle, onSendKas, expanded, onExpand }) {
  const [copied, setCopied] = useState(false);
  const fullAddr = bot.kaspa_address?.startsWith('kaspa:') ? bot.kaspa_address : `kaspa:${bot.kaspa_address}`;

  const copyAddr = () => {
    navigator.clipboard.writeText(fullAddr);
    setCopied(true);
    toast.success('Address copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const winRate = bot.total_bets > 0 ? ((bot.total_wins || 0) / bot.total_bets * 100).toFixed(0) : '—';

  return (
    <div className={`rounded-xl border transition-all ${
      bot.is_active
        ? 'bg-emerald-500/8 border-emerald-500/20'
        : 'bg-white/[0.02] border-white/[0.06]'
    }`}>
      {/* Compact header — always visible */}
      <button
        onClick={() => onExpand(expanded ? null : bot.id)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left"
      >
        <span className="text-lg">{bot.avatar_emoji || '🤖'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-white text-xs font-bold truncate">{bot.bot_name}</span>
            {bot.is_active && <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />}
          </div>
          <span className="text-emerald-400 text-[10px] font-mono font-bold">{(bot.balance_kas || 0).toFixed(4)} KAS</span>
        </div>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-white/20" /> : <ChevronDown className="w-3.5 h-3.5 text-white/20" />}
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t border-white/[0.04] pt-2">
              {/* Address */}
              <button onClick={copyAddr} className="flex items-center gap-1.5 w-full group">
                <Wallet className="w-3 h-3 text-white/20 flex-shrink-0" />
                <span className="text-white/30 text-[9px] font-mono truncate flex-1 text-left">{fullAddr}</span>
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-white/15 group-hover:text-white/40" />}
              </button>

              {/* Stats */}
              <div className="flex items-center gap-3 text-[9px]">
                <div className="flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-white/15" />
                  <span className="text-white/25">{bot.total_bets || 0} bets</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-white/15" />
                  <span className="text-white/25">Win: {winRate}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-white/25">Strategy: {bot.strategy}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onToggle(bot)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                    bot.is_active
                      ? 'bg-red-500/10 border-red-500/25 text-red-400 hover:bg-red-500/20'
                      : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20'
                  }`}
                >
                  <Power className="w-3 h-3" />
                  {bot.is_active ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => onSendKas(bot)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold border bg-white/[0.03] border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.06] transition-all"
                >
                  <Send className="w-3 h-3" />
                  Fund Bot
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FundBotModal({ bot, onClose }) {
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 0.1) { toast.error('Min 0.1 KAS'); return; }

    setSending(true);
    try {
      const wallets = JSON.parse(localStorage.getItem('terra_wallets') || '[]');
      const linked = localStorage.getItem('kaching_linked_wallet');
      const w = linked ? wallets.find(w => w.address === linked && w.mnemonic) : wallets.find(w => w.mnemonic);

      if (!w) { toast.error('No wallet with seed phrase found'); setSending(false); return; }

      const toAddr = bot.kaspa_address?.startsWith('kaspa:') ? bot.kaspa_address : `kaspa:${bot.kaspa_address}`;
      const res = await base44.functions.invoke('sendKaspaTransaction', {
        mnemonic: w.mnemonic,
        fromAddress: w.address,
        toAddress: toAddr,
        amountKas: amt,
      });

      if (res.data?.error) throw new Error(res.data.error);
      toast.success(`Sent ${amt} KAS to ${bot.bot_name}!`);
      onClose(true);
    } catch (err) {
      toast.error(err.message || 'Send failed');
    }
    setSending(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 backdrop-blur-lg z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        onClick={e => e.stopPropagation()}
        className="bg-zinc-950 border border-emerald-500/20 rounded-2xl p-4 w-full max-w-xs space-y-3 shadow-2xl shadow-black"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{bot.avatar_emoji}</span>
            <span className="text-white font-bold text-sm">Fund {bot.bot_name}</span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="text-white/20 text-[9px] font-mono truncate">
          {bot.kaspa_address?.startsWith('kaspa:') ? bot.kaspa_address : `kaspa:${bot.kaspa_address}`}
        </div>

        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Amount in KAS"
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm pr-12 focus:outline-none focus:border-emerald-500/40"
            autoFocus
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 text-xs">KAS</span>
        </div>

        <div className="flex gap-1.5">
          {[1, 5, 10, 25].map(v => (
            <button key={v} onClick={() => setAmount(v.toString())}
              className="flex-1 py-1.5 bg-white/[0.04] hover:bg-emerald-500/10 border border-white/[0.06] rounded-lg text-[10px] text-white/40 hover:text-emerald-300 font-bold transition-all"
            >{v}</button>
          ))}
        </div>

        <button
          onClick={handleSend}
          disabled={sending || !parseFloat(amount)}
          className="w-full py-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold hover:bg-emerald-500/25 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
        >
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          {sending ? 'Sending...' : `Send ${amount || '0'} KAS`}
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function AgentsPanel() {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedBot, setExpandedBot] = useState(null);
  const [fundBot, setFundBot] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadBots(); }, []);

  const loadBots = async () => {
    try {
      // First try to list existing bots via backend (never exposes mnemonics)
      const res = await base44.functions.invoke('kachingBotManager', { action: 'list_bots' });
      if (res.data?.bots?.length > 0) {
        setBots(res.data.bots);
        // Auto-refresh balances from chain on initial load
        try {
          const balRes = await base44.functions.invoke('kachingBotManager', { action: 'refresh_balances' });
          if (balRes.data?.results) setBots(balRes.data.results);
        } catch {}
      } else {
        // No bots yet — create them
        const createRes = await base44.functions.invoke('kachingBotManager', { action: 'create_bots' });
        if (createRes.data?.bots) {
          setBots(createRes.data.bots);
        }
      }
    } catch (err) {
      console.error('Failed to load bots:', err);
    }
    setLoading(false);
  };

  const refreshBalances = async () => {
    setRefreshing(true);
    try {
      const res = await base44.functions.invoke('kachingBotManager', { action: 'refresh_balances' });
      if (res.data?.results) {
        setBots(res.data.results);
      }
      toast.success('Balances refreshed');
    } catch {}
    setRefreshing(false);
  };

  const toggleBot = async (bot) => {
    try {
      const res = await base44.functions.invoke('kachingBotManager', { action: 'toggle_bot', bot_id: bot.id });
      if (res.data?.success) {
        setBots(prev => prev.map(b => b.id === bot.id ? { ...b, is_active: !b.is_active } : b));
        toast.success(`${bot.bot_name} ${bot.is_active ? 'disabled' : 'enabled'}`);
      }
    } catch (err) {
      toast.error('Failed to toggle bot');
    }
  };

  const handleFundClose = async (refresh) => {
    setFundBot(null);
    if (refresh) {
      await new Promise(r => setTimeout(r, 3000));
      refreshBalances();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-xl">
        <Loader2 className="w-3.5 h-3.5 text-white/20 animate-spin" />
        <span className="text-white/20 text-[10px]">Loading agents...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Bot className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-cyan-400/80 text-[10px] font-bold uppercase tracking-[0.12em]">Agents</span>
          <span className="text-white/15 text-[9px]">({bots.filter(b => b.is_active).length} active)</span>
        </div>
        <button
          onClick={refreshBalances}
          disabled={refreshing}
          className="text-white/15 hover:text-cyan-400 transition-colors p-1 rounded"
        >
          <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Bot cards */}
      <div className="space-y-1.5">
        {bots.map(bot => (
          <BotCard
            key={bot.id}
            bot={bot}
            expanded={expandedBot === bot.id}
            onExpand={setExpandedBot}
            onRefresh={refreshBalances}
            onToggle={toggleBot}
            onSendKas={setFundBot}
          />
        ))}
      </div>

      {/* Fund modal */}
      <AnimatePresence>
        {fundBot && <FundBotModal bot={fundBot} onClose={handleFundClose} />}
      </AnimatePresence>
    </div>
  );
}