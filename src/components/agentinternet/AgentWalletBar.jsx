import React, { useState, useEffect } from "react";
import { Wallet, Loader2, KeyRound, Copy, Check, Download, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getWallet, generateWallet, importFromPrivateKey } from "@/lib/localKaspaWallet";

export default function AgentWalletBar() {
  const [wallet, setWallet] = useState(() => getWallet());
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [panel, setPanel] = useState(false);
  const [importKey, setImportKey] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    if (!wallet?.address) return;
    let alive = true;
    setLoading(true);
    base44.functions
      .invoke("getKaspaBalance", { address: wallet.address })
      .then((raw) => {
        const res = raw?.data ?? raw;
        const kas = res?.balance ?? res?.kas ?? (res?.sompi ? res.sompi / 1e8 : null);
        if (alive) setBalance(typeof kas === "number" ? kas : null);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [wallet?.address]);

  const create = () => {
    setError("");
    setWallet(generateWallet());
  };

  const doImport = () => {
    setError("");
    try {
      setWallet(importFromPrivateKey(importKey));
      setImportKey("");
      setPanel(false);
    } catch (e) {
      setError(e.message);
    }
  };

  const copy = (text, tag) => {
    navigator.clipboard?.writeText(text);
    setCopied(tag);
    setTimeout(() => setCopied(""), 1500);
  };

  const short = (a) => (a ? `${a.slice(0, 12)}…${a.slice(-6)}` : "");

  return (
    <div className="border-b border-white/10 bg-white/[0.02]">
      <div className="flex items-center gap-2 px-4 py-2">
        <Wallet className="w-3.5 h-3.5 text-white/50 flex-shrink-0" />
        <span className="text-[10px] uppercase tracking-wide text-white/40 flex-shrink-0">TTT wallet</span>
        {wallet ? (
          <>
            <button
              onClick={() => copy(wallet.address, "addr")}
              className="text-[11px] font-mono text-white/50 hover:text-white truncate"
              title="Copy address"
            >
              {copied === "addr" ? "copied" : short(wallet.address)}
            </button>
            <span className="ml-auto text-[11px] font-mono text-emerald-400 flex-shrink-0">
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : `${(balance ?? 0).toLocaleString(undefined, { maximumFractionDigits: 4 })} KAS`}
            </span>
            <button
              onClick={() => setPanel(p => !p)}
              className="flex-shrink-0 px-2 py-1 rounded-full bg-white/[0.06] border border-white/10 text-[10px] text-white/60 hover:text-white flex items-center gap-1"
            >
              <KeyRound className="w-3 h-3" /> Keys
            </button>
          </>
        ) : (
          <>
            <span className="text-[11px] text-white/40">No TTT wallet connected</span>
            <button
              onClick={create}
              className="ml-auto px-2.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[10px] text-cyan-200 hover:bg-cyan-500/30 flex-shrink-0"
            >
              Create wallet
            </button>
            <button
              onClick={() => setPanel(p => !p)}
              className="px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10 text-[10px] text-white/60 hover:text-white flex-shrink-0"
            >
              Import
            </button>
          </>
        )}
      </div>

      {panel && (
        <div className="px-4 pb-3 space-y-2">
          {wallet && (
            <button
              onClick={() => copy(wallet.privateKey, "key")}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-[11px] text-white/70 hover:text-white"
            >
              {copied === "key" ? <Check className="w-3 h-3 text-emerald-400" /> : <Download className="w-3 h-3" />}
              {copied === "key" ? "Private key copied" : "Export private key"}
            </button>
          )}
          <div className="flex items-center gap-2">
            <input
              value={importKey}
              onChange={e => setImportKey(e.target.value)}
              placeholder="Import private key (64 hex)"
              className="flex-1 h-8 px-3 rounded-lg bg-white/[0.05] border border-white/10 text-[11px] text-white font-mono placeholder:text-white/25 focus:outline-none focus:border-cyan-500/40 min-w-0"
            />
            <button
              onClick={doImport}
              disabled={!importKey.trim()}
              className="h-8 px-2.5 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-[11px] text-cyan-200 disabled:opacity-40 flex items-center gap-1 flex-shrink-0"
            >
              <Upload className="w-3 h-3" /> Import
            </button>
          </div>
          {error && <p className="text-[10px] text-red-400">{error}</p>}
          <p className="text-[10px] text-white/30">Keys stay on this device — never sent to any server.</p>
        </div>
      )}
    </div>
  );
}