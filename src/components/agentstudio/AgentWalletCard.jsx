import React, { useState, useEffect, useCallback } from "react";
import { Wallet, Plus, Copy, Check, Eye, EyeOff, Download } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { generateAgentWallet, importAgentWallet } from "@/lib/agentInternetWallet";

/** AgentInternet Wallet — generate on-device, fund it, use it to train. */
export default function AgentWalletCard({ wallet, onWallet }) {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [importing, setImporting] = useState(false);
  const [pk, setPk] = useState("");
  const [error, setError] = useState("");

  const loadBalance = useCallback(async () => {
    if (!wallet?.address) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke("getKaspaBalance", { address: wallet.address });
      const data = res?.data || res;
      setBalance(data?.balance ?? data?.available ?? 0);
    } catch {
      setBalance(null);
    }
    setLoading(false);
  }, [wallet?.address]);

  useEffect(() => { loadBalance(); }, [loadBalance]);

  const copy = () => {
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const doImport = () => {
    try {
      onWallet(importAgentWallet(pk));
      setImporting(false);
      setPk("");
      setError("");
    } catch (e) {
      setError(e.message);
    }
  };

  if (!wallet) {
    return (
      <div className="bg-white rounded-2xl ring-1 ring-zinc-200 p-6">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="w-4 h-4 text-zinc-400" />
          <h3 className="font-bold text-zinc-900">AgentInternet Wallet</h3>
        </div>
        <p className="text-sm text-zinc-500 mb-5 leading-relaxed">
          Create a dedicated wallet for your agent. Keys are generated on this device and never leave it — your main TTT wallet stays untouched.
        </p>
        <button
          onClick={() => onWallet(generateAgentWallet())}
          className="w-full h-11 rounded-full bg-zinc-900 text-white text-sm font-bold hover:bg-zinc-800 transition-colors active:scale-[0.99] flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Generate AgentInternet Wallet
        </button>

        {importing ? (
          <div className="mt-4">
            <input
              value={pk}
              onChange={(e) => setPk(e.target.value)}
              placeholder="64-character private key"
              className="w-full h-10 px-3 rounded-xl border border-zinc-200 text-sm font-mono outline-none focus:border-zinc-400"
            />
            {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
            <button onClick={doImport} className="mt-2 w-full h-10 rounded-full bg-zinc-100 text-zinc-800 text-sm font-semibold hover:bg-zinc-200">
              Import
            </button>
          </div>
        ) : (
          <button onClick={() => setImporting(true)} className="mt-3 w-full text-xs text-zinc-400 hover:text-zinc-700 font-medium">
            or import an existing key
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl ring-1 ring-zinc-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-zinc-400" />
          <h3 className="font-bold text-zinc-900">AgentInternet Wallet</h3>
        </div>
        <span className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full uppercase tracking-wider">Live</span>
      </div>

      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="text-3xl font-[800] text-zinc-900 font-mono tracking-tight">
          {loading ? "···" : (balance ?? 0).toLocaleString(undefined, { maximumFractionDigits: 4 })}
        </span>
        <span className="text-sm font-semibold text-zinc-400">KAS</span>
      </div>
      <p className="text-xs text-zinc-400 mb-4">Fund this address to run training epochs.</p>

      <div className="rounded-xl bg-zinc-50 border border-zinc-200/70 p-3 mb-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-mono text-zinc-600 break-all">{wallet.address}</span>
          <button onClick={copy} className="shrink-0 text-zinc-400 hover:text-zinc-900">
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={loadBalance} className="flex-1 h-9 rounded-full bg-zinc-100 text-zinc-700 text-xs font-semibold hover:bg-zinc-200 flex items-center justify-center gap-1.5">
          <Download className="w-3.5 h-3.5" />
          Refresh
        </button>
        <button onClick={() => setShowKey((s) => !s)} className="flex-1 h-9 rounded-full bg-zinc-100 text-zinc-700 text-xs font-semibold hover:bg-zinc-200 flex items-center justify-center gap-1.5">
          {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showKey ? "Hide key" : "Backup key"}
        </button>
      </div>

      {showKey && (
        <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3">
          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-1">Private key — never share</p>
          <p className="text-[10px] font-mono text-amber-900 break-all">{wallet.privateKey}</p>
        </div>
      )}
    </div>
  );
}