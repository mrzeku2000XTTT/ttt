import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Copy, Check, Loader2, Unplug } from 'lucide-react';
import {
  getSearchWallet, resetSearchWallet, setExternalSearchWallet,
  fetchWalletBalance, subscribe, SEARCH_FEE_KAS,
} from '@/lib/searchKaspaWallet';
import { connectKcc20 } from '@/lib/useKcc20Wallet';

/** Wallet card for the Search Kaspa profile tab — connects the user's
 * external Scorpion (KCC20) wallet. Keys never touch this app. */
export default function SearchKaspaWalletCard() {
  const [wallet, setWallet] = useState(() => getSearchWallet());
  const [spentSompi, setSpentSompi] = useState(() => (getSearchWallet()?.spentSompi || 0));
  const [searches, setSearches] = useState(() => (getSearchWallet()?.searches || 0));
  const [balanceSompi, setBalanceSompi] = useState(null);
  const [busy, setBusy] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState(null);
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

  // Scorpion popup — the user approves the connection in their own wallet.
  const connectScorpion = async () => {
    setConnecting(true);
    setConnectError(null);
    try {
      const res = await connectKcc20();
      if (res?.address) setExternalSearchWallet(res.address);
      else throw new Error('Scorpion did not return an address');
    } catch (e) {
      setConnectError(e?.message || 'Connection rejected');
    } finally {
      setConnecting(false);
    }
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
        <h2 className="text-sm font-semibold text-white">Search Kaspa wallet</h2>
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
            Every search runs a KAS micro-transaction of {SEARCH_FEE_KAS} KAS. Connect your Scorpion wallet and each search fee is signed by you — straight from your own wallet.
          </p>
          <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/[0.06] px-3 py-2.5">
            <p className="text-[11px] leading-relaxed text-cyan-200/90">
              Self-custody: your keys stay in your Scorpion wallet — we never hold your funds and this app never sees a key.
            </p>
          </div>
          <button
            onClick={connectScorpion}
            disabled={connecting}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 text-sm font-bold text-black transition-transform active:scale-95 disabled:opacity-40"
          >
            {connecting ? <><Loader2 className="h-4 w-4 animate-spin" /> Opening Scorpion…</> : 'Connect Scorpion wallet'}
          </button>
          {connectError && <p className="text-center text-[11px] text-red-400">{connectError}</p>}
        </>
      ) : (
        <>
          <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/[0.06] px-3 py-2.5">
            <p className="text-[11px] leading-relaxed text-cyan-200/90">
              Connected to your <span className="font-bold">Scorpion wallet</span>. Your keys never leave Scorpion — we never hold your funds, and you sign every search fee yourself.
            </p>
          </div>
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
          <p className="text-[11px] text-white/40">Each search deducts {SEARCH_FEE_KAS} KAS — signed in your Scorpion wallet.</p>
          <div>
            <p className="mb-1.5 text-[11px] uppercase tracking-wider text-white/35">Scorpion wallet address</p>
            <button onClick={copyAddress} className="w-full break-all rounded-xl border border-white/10 bg-black/40 p-3 text-left font-mono text-[11px] text-cyan-200 transition-transform active:scale-[0.99]">
              {wallet.address}
            </button>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <p className="text-[10px] text-white/30">Fund it inside your Scorpion wallet, or send KAS to this address.</p>
              <span className="inline-flex flex-shrink-0 items-center gap-1 text-[10px] text-white/40">
                {copied ? <><Check className="h-3 w-3 text-emerald-400" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Disconnect your Scorpion wallet from Search Kaspa?\n\nYour funds stay safe in your Scorpion wallet — this only removes the connection on this device.')) {
                resetSearchWallet();
                setWallet(null);
                setBalanceSompi(null);
                setSpentSompi(0);
                setSearches(0);
              }
            }}
            className="inline-flex w-full items-center justify-center gap-1 text-[11px] text-red-400/70 hover:text-red-300"
          >
            <Unplug className="h-3 w-3" /> Disconnect wallet
          </button>
        </>
      )}
    </section>
  );
}