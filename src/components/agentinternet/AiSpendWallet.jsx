import React, { useState, useEffect, useCallback } from "react";
import { Bot, Loader2, Copy, Check, ArrowDownToLine, Sparkles, KeyRound, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getWallet } from "@/lib/localKaspaWallet";
import { getAiWallet, generateAiWallet } from "@/lib/aiSpendWallet";
import { AI_WALLET_RULES, assertSelfSendOnly } from "@/lib/aiWalletRules";

export default function AiSpendWallet() {
  const [wallet, setWallet] = useState(() => getAiWallet());
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fundOpen, setFundOpen] = useState(false);
  const [amount, setAmount] = useState("1");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [keysOpen, setKeysOpen] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => setIsAdmin(u?.role === "admin")).catch(() => setIsAdmin(false));
  }, []);

  const ttt = getWallet();

  const loadBalance = useCallback(async (address) => {
    if (!address) return;
    setLoading(true);
    try {
      const raw = await base44.functions.invoke("getKaspaBalance", { address });
      const res = raw?.data ?? raw;
      const kas = res?.balance ?? res?.kas ?? (res?.sompi ? res.sompi / 1e8 : null);
      setBalance(typeof kas === "number" ? kas : 0);
    } catch { /* leave previous */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadBalance(wallet?.address); }, [wallet?.address, loadBalance]);

  const fund = async () => {
    setError(""); setMsg("");
    if (!ttt?.privateKey) { setError("Create or import your TTT wallet first."); return; }
    setSending(true);
    try {
      const raw = await base44.functions.invoke("sendKaspaTransaction", {
        privateKey: ttt.privateKey,
        fromAddress: ttt.address,
        toAddress: wallet.address,
        amountKas: amount,
      });
      const res = raw?.data ?? raw;
      if (res?.error) throw new Error(res.error);
      setMsg(`Sent ${res.amountKas} KAS to your AI wallet`);
      setFundOpen(false);
      setTimeout(() => loadBalance(wallet.address), 4000);
    } catch (e) {
      setError(e?.message || "Transfer failed");
    }
    setSending(false);
  };

  // Rule-enforced: the AI wallet may only send KAS to its own address.
  const selfSend = async () => {
    setError(""); setMsg("");
    setSending(true);
    try {
      assertSelfSendOnly(wallet.address, wallet.address);
      const raw = await base44.functions.invoke("sendKaspaTransaction", {
        privateKey: wallet.privateKey,
        fromAddress: wallet.address,
        toAddress: wallet.address,
        amountKas: amount,
      });
      const res = raw?.data ?? raw;
      if (res?.error) throw new Error(res.error);
      setMsg(`AI usage paid — self-sent ${res.amountKas} KAS`);
      setTimeout(() => loadBalance(wallet.address), 4000);
    } catch (e) {
      setError(e?.message || "Self-send failed");
    }
    setSending(false);
  };

  const short = (a) => (a ? `${a.slice(0, 12)}…${a.slice(-6)}` : "");

  return (
    <div className="border-b border-white/10 bg-cyan-500/[0.03]">
      <div className="flex items-center gap-2 px-4 py-2">
        <Bot className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
        <span className="text-[10px] uppercase tracking-wide text-cyan-300/70 flex-shrink-0">AI wallet</span>
        {wallet ? (
          <>
            <button
              onClick={() => { navigator.clipboard?.writeText(wallet.address); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              className="text-[11px] font-mono text-white/50 hover:text-white truncate flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {short(wallet.address)}
            </button>
            <span className="ml-auto text-[11px] font-mono text-emerald-400 flex-shrink-0">
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : `${(balance ?? 0).toLocaleString(undefined, { maximumFractionDigits: 4 })} KAS`}
            </span>
            <button
              onClick={() => setFundOpen(o => !o)}
              className="flex-shrink-0 px-2 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[10px] text-cyan-200 hover:bg-cyan-500/30 flex items-center gap-1"
            >
              <ArrowDownToLine className="w-3 h-3" /> Fund
            </button>
            <button
              onClick={() => setKeysOpen(o => !o)}
              className="flex-shrink-0 px-2 py-1 rounded-full bg-white/[0.06] border border-white/10 text-[10px] text-white/60 hover:text-white flex items-center gap-1"
            >
              <KeyRound className="w-3 h-3" /> Keys
            </button>
          </>
        ) : (
          <>
            <span className="text-[11px] text-white/40">Spending wallet for paid AI chats</span>
            <button
              onClick={() => setWallet(generateAiWallet())}
              className="ml-auto px-2.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[10px] text-cyan-200 hover:bg-cyan-500/30 flex-shrink-0"
            >
              Create AI wallet
            </button>
          </>
        )}
        {isAdmin && (
          <Link to="/AWA" target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
            <span className="px-2 py-1 rounded-full bg-purple-500/20 border border-purple-400/40 text-[10px] text-purple-200 hover:bg-purple-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Claim AI
            </span>
          </Link>
        )}
      </div>

      {keysOpen && wallet && (
        <div className="px-4 pb-3 space-y-2">
          <button
            onClick={() => { navigator.clipboard?.writeText(wallet.privateKey); setKeyCopied(true); setTimeout(() => setKeyCopied(false), 1500); }}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-[11px] text-white/70 hover:text-white"
          >
            {keyCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Download className="w-3 h-3" />}
            {keyCopied ? "AI wallet private key copied" : "Export AI wallet private key"}
          </button>
          <p className="text-[10px] text-white/30">Keys stay on this device — never sent to any server.</p>
        </div>
      )}

      {fundOpen && wallet && (
        <div className="px-4 pb-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              value={amount}
              onChange={e => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="KAS amount"
              className="flex-1 h-8 px-3 rounded-lg bg-white/[0.05] border border-white/10 text-[11px] text-white font-mono placeholder:text-white/25 focus:outline-none focus:border-cyan-500/40 min-w-0"
            />
            <button
              onClick={fund}
              disabled={sending || !parseFloat(amount)}
              className="h-8 px-3 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-[11px] text-cyan-200 disabled:opacity-40 flex items-center gap-1 flex-shrink-0"
            >
              {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowDownToLine className="w-3 h-3" />}
              Send from TTT wallet
            </button>
          </div>
          <p className="text-[10px] text-white/30">Moves KAS from your TTT wallet into this AI spending wallet.</p>
          <button
            onClick={selfSend}
            disabled={sending || !parseFloat(amount)}
            className="w-full h-8 rounded-lg bg-emerald-500/15 border border-emerald-400/40 text-[11px] text-emerald-200 disabled:opacity-40 flex items-center justify-center gap-1"
          >
            {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bot className="w-3 h-3" />}
            Pay AI usage (self-send {amount || 0} KAS)
          </button>
          <ul className="space-y-0.5">
            {AI_WALLET_RULES.map(rule => (
              <li key={rule} className="text-[10px] text-white/30">• {rule}</li>
            ))}
          </ul>
        </div>
      )}

      {(msg || error) && (
        <p className={`px-4 pb-2 text-[10px] ${error ? "text-red-400" : "text-emerald-400"}`}>{error || msg}</p>
      )}
    </div>
  );
}