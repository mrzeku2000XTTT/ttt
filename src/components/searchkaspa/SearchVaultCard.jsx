import React, { useEffect, useState } from 'react';
import { Loader2, Copy, Check, ShieldCheck, Unplug } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getSearchWallet } from '@/lib/searchKaspaWallet';
import {
  compileSearchVaultArtifact, fundVaultWithScorpion, unlockVault, getSearchVault, TREASURY_ADDRESS,
} from '@/lib/searchVault';

// Each pay_search_fee burns 100_000 sompi fee + 1000 sompi miner fee.
const SOMPI_PER_SEARCH = 101000;

/** Search Vault — covenant-locked prepaid search meter (KCC20 Wallet
 * SearchVault, SilverScript v1.0.0). Keys stay in Scorpion. */
export default function SearchVaultCard() {
  const [vault, setVault] = useState(() => getSearchVault());
  const [isAdmin, setIsAdmin] = useState(false);
  const [amount, setAmount] = useState('1');
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState('');
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    base44.auth.me().then((u) => setIsAdmin(u?.role === 'admin')).catch(() => setIsAdmin(false));
  }, []);

  const fund = async () => {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) { setError('Enter a KAS amount'); return; }
    const ownerPubkey = getSearchWallet()?.publicKey;
    if (!ownerPubkey) { setError('Connect your Scorpion wallet first.'); return; }
    setBusy(true); setError(null);
    try {
      setStage('Compiling your vault covenant (silverc v1.0.0)…');
      const artifact = await compileSearchVaultArtifact(ownerPubkey);
      setStage('Approve + PIN in Scorpion…');
      await fundVaultWithScorpion({ artifact, ownerPubkey, amountKas: amt });
      setVault(getSearchVault());
    } catch (e) {
      setError(e?.message || 'Vault funding failed');
    } finally {
      setStage('');
      setBusy(false);
    }
  };

  const unlock = async () => {
    if (!window.confirm('Unlock your Search Vault?\n\nThe covenant returns ALL leftover KAS to your Scorpion wallet (one output to your key). You can fund a new vault anytime.')) return;
    setBusy(true); setError(null);
    try {
      setStage('Approve unlock in Scorpion…');
      await unlockVault();
      setVault(getSearchVault());
    } catch (e) {
      setError(e?.message || 'Unlock failed');
    } finally {
      setStage('');
      setBusy(false);
    }
  };

  const copyAddress = async () => {
    if (!vault?.address) return;
    try {
      await navigator.clipboard.writeText(vault.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const remainingSompi = Number.isFinite(vault?.remainingSompi)
    ? vault.remainingSompi
    : (vault?.funds || []).reduce((s, f) => s + Math.round(Number(f.amountKas) * 1e8), 0);
  const searchesPrepaid = Math.floor(remainingSompi / SOMPI_PER_SEARCH);

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Search Vault</h2>
        {vault && (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
            <ShieldCheck className="h-3 w-3" /> covenant locked
          </span>
        )}
      </div>

      {!isAdmin ? (
        <p className="text-xs leading-relaxed text-white/50">
          Paid search is admin-only for now — everyone else searches for free. Covenant vaults open up for all users later.
        </p>
      ) : !vault ? (
        <>
          <p className="text-xs leading-relaxed text-white/50">
            Lock KAS once into your Search Vault. Each search then spends exactly 0.001 KAS from it — signed by you in Scorpion, nothing more.
          </p>
          <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/[0.06] px-3 py-2.5">
            <p className="text-[11px] leading-relaxed text-cyan-200/90">
              Self-custody: your keys stay in Scorpion — we never hold your funds. The covenant itself caps every spend at one 0.001 KAS fee to the treasury; leftover KAS always stays yours.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              disabled={busy}
              className="h-11 w-28 rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus:border-cyan-400/60"
              aria-label="KAS amount to lock"
            />
            <button
              onClick={fund}
              disabled={busy}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-500 text-sm font-bold text-black transition-transform active:scale-95 disabled:opacity-40"
            >
              {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> {stage || 'Working…'}</> : 'Fund Search Vault'}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/[0.06] px-3 py-2.5">
            <p className="text-[11px] leading-relaxed text-cyan-200/90">
              Vault funded. Every search signs one <span className="font-bold">pay_search_fee</span> in Scorpion — the covenant only ever allows 0.001 KAS to the treasury, and your remaining KAS re-locks itself.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] py-2">
              <p className="text-[10px] uppercase tracking-wider text-white/35">Remaining</p>
              <p className="text-sm font-medium text-white/80">{(remainingSompi / 1e8).toFixed(4)} KAS</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] py-2">
              <p className="text-[10px] uppercase tracking-wider text-white/35">Searches prepaid</p>
              <p className="text-sm font-medium text-white/80">≈ {searchesPrepaid.toLocaleString()}</p>
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-[11px] uppercase tracking-wider text-white/35">Vault address (kaspa:p)</p>
            <button onClick={copyAddress} className="w-full break-all rounded-xl border border-white/10 bg-black/40 p-3 text-left font-mono text-[11px] text-cyan-200 transition-transform active:scale-[0.99]">
              {vault.address}
            </button>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <p className="text-[10px] text-white/30">Top up anytime — funds go to the same vault.</p>
              <span className="inline-flex flex-shrink-0 items-center gap-1 text-[10px] text-white/40">
                {copied ? <><Check className="h-3 w-3 text-emerald-400" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              disabled={busy}
              className="h-10 w-28 rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus:border-cyan-400/60"
              aria-label="Top-up KAS amount"
            />
            <button
              onClick={fund}
              disabled={busy}
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-500/15 text-[12px] font-bold text-cyan-200 transition-transform active:scale-95 disabled:opacity-40"
            >
              {busy ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {stage || 'Working…'}</> : 'Top up vault'}
            </button>
          </div>
          <button
            onClick={unlock}
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-1 text-[11px] text-red-400/70 hover:text-red-300 disabled:opacity-40"
          >
            <Unplug className="h-3 w-3" /> Unlock vault — return leftover KAS to my wallet
          </button>
        </>
      )}

      {error && <p className="text-[11px] text-red-400">{error}</p>}
      <p className="text-[10px] text-white/30">
        Search fees: KCC20 Wallet SearchVault (SilverScript v1). Keys stay in Scorpion. Treasury: {TREASURY_ADDRESS.slice(0, 18)}…
      </p>
    </section>
  );
}