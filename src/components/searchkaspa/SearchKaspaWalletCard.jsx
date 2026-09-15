import React, { useCallback, useEffect, useState } from 'react';
import { Wallet, RefreshCw, Copy, Check, Loader2, Trash2 } from 'lucide-react';
import {
  getSearchWallet, generateSearchWallet, resetSearchWallet,
  fetchWalletBalance, subscribe, SEARCH_FEE_KAS,
} from '@/lib/searchKaspaWallet';

/** Wallet card for the Search Kaspa profile tab — create, fund, and track the micro-search wallet. */
export default function SearchKaspaWalletCard() {
  const [wallet, setWallet] = useState(() => getSearchWallet());
  const [spentSompi, setSpentSompi] = useState(() => (getSearchWallet()?.spentSompi || 0));
  const [searches, setSearches] = useState(() => (getSearchWallet()?.searches || 0));
  const [balanceSompi, setBalanceSompi] = useState(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const syncFromLib = useCallback(() => {
    const w = getSearchWallet();
    setWallet(w);
    setSpentSompi(w?.spentSompi || 0);
    setSearches(w?.searches || 0);
  }, []);

  const refresh = useCallback(async () => {
    if (!getSearchWallet()) return;
    setBusy(true);
    try {
      const res = await fetchWalletBalance(true);
      setBalanceSompi(res.ok ? res.balanceSompi : 0);
    } catch {
      setBalanceSompi(0);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (getSearchWallet()) refresh();
    return subscribe(syncFromLib);
  }, [refresh, syncFromLib]);

  const createWallet = () => {
    generateSearchWallet();
    syncFromLib();
    refresh();
  };

  const copyAddress = async () => {
    if (!wallet?.address) return;
    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const availableKas = balanceSompi === null ? null : Math.max(0, (balanceSompi - spentSompi) / 1e8);

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/15">
            <Wallet className="w-4 h-4 text-cyan-300" />
          </div>
          <h2 className="text-sm font-semibold text-white">Search Kaspa wallet</h2>
        </div>
        {wallet && (
          <button
            onClick={refresh}
            disabled={busy}
            title="Refresh balance"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white/60 transition-colors hover:text-white active:scale-95 disabled:opacity-40"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </button>
        )}
      </div>

      {!wallet ? (
        <>
          <p className="text-xs leading-relaxed text-white/50">
            Every search runs a KAS micro-transaction of {SEARCH_FEE_KAS} KAS. Create your wallet, fund it with KAS, and each search is paid straight from it.
          </p>
          <button onClick={createWallet} className="h-11 w-full rounded-xl bg-cyan-500 text-sm font-bold text-black transition-transform active:scale-95">
            Create Search Kaspa wallet
          </button>
        </>
      ) : (
        <>
          <p className="text-2xl font-bold text-white">
            {availableKas === null ? '—' : availableKas.toFixed(4)}
            <span className="ml-1 text-sm font-medium text-white/40">KAS available</span>
          </p>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] py-2">
              <p className="text-[10px] uppercase tracking-wider text-white/35">Balance</p>
              <p className="text-sm font-medium text-white/80">{balanceSompi === null ? '—' : (balanceSompi / 1e8).toFixed(4)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] py-2">
              <p className="text-[10px] uppercase tracking-wider text-white/35">Searches paid</p>
              <p className="text-sm font-medium text-white/80">{searches}</p>
            </div>
          </div>
          <p className="text-[11px] text-white/40">Each search deducts {SEARCH_FEE_KAS} KAS from this wallet.</p>
          <div>
            <p className="mb-1.5 text-[11px] uppercase tracking-wider text-white/35">Fund your wallet</p>
            <button onClick={copyAddress} className="w-full break-all rounded-xl border border-white/10 bg-black/40 p-3 text-left font-mono text-[11px] text-cyan-200 transition-transform active:scale-[0.99]">
              {wallet.address}
            </button>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <p className="text-[10px] text-white/30">Send KAS from any Kaspa wallet to this address.</p>
              <span className="inline-flex flex-shrink-0 items-center gap-1 text-[10px] text-white/40">
                {copied ? <><Check className="h-3 w-3 text-emerald-400" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Reset your Search Kaspa wallet? Any KAS left at its address stays on-chain, but this device loses the key.')) {
                resetSearchWallet();
                setWallet(null);
                setBalanceSompi(null);
                setSpentSompi(0);
                setSearches(0);
              }
            }}
            className="inline-flex w-full items-center justify-center gap-1 text-[11px] text-red-400/70 hover:text-red-300"
          >
            <Trash2 className="h-3 w-3" /> Reset wallet
          </button>
        </>
      )}
    </section>
  );
}