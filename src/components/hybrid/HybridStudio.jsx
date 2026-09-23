import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, Store, Loader2, Link2, AlertCircle, Youtube, Instagram, AtSign,
  Twitch, Music2, Sparkles, ArrowRight,
} from 'lucide-react';
import HybridLogo from './HybridLogo';
import HybridReport from './HybridReport';
import { base44 } from '@/api/base44Client';
import { useKcc20Wallet, shortKaspaAddress } from '@/lib/useKcc20Wallet';
import useElapsed from '@/hooks/useElapsed';

const HINTS = [
  { icon: Youtube, label: 'YouTube channel or video' },
  { icon: Music2, label: 'TikTok profile or post' },
  { icon: Instagram, label: 'Instagram profile or reel' },
  { icon: AtSign, label: 'X profile or post' },
  { icon: Twitch, label: 'Twitch channel' },
];

const LOADING_TIPS = [
  'Opening your channel on the live web…',
  'Reading your recent posts, views and titles…',
  'Measuring how real the engagement looks…',
  'Ranking the moves that will lift you fastest…',
];

export default function HybridStudio({ onHome }) {
  const navigate = useNavigate();
  const { address, connect, loading: walletLoading, error: walletError } = useKcc20Wallet();
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const seconds = useElapsed(busy);

  const analyze = async () => {
    const value = link.trim();
    if (!value) { setError('Paste your channel or video link first.'); return; }
    setError(null);
    setResult(null);
    setBusy(true);
    try {
      const res = await base44.functions.invoke('hybridChannelAudit', { link: value });
      const data = res?.data || res;
      if (data?.error) throw new Error(data.error);
      if (!data?.report) throw new Error('No audit came back for that link. Try the channel URL instead.');
      setResult({ ...data.report, url: data.url, platform: data.platform || data.report.platform });
    } catch (e) {
      setError(e?.message || 'The audit failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto pl-4 pr-14 sm:px-6 py-3 flex items-center justify-between gap-3">
          <button onClick={onHome} className="flex items-center gap-2.5">
            <HybridLogo size={30} />
            <span className="font-black tracking-tight">HYBRID</span>
          </button>
          <div className="flex items-center gap-2">
            {address ? (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/40 text-[11px] font-semibold text-primary">
                {shortKaspaAddress(address)}
              </span>
            ) : (
              <button
                onClick={() => connect().catch(() => {})}
                disabled={walletLoading}
                className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold disabled:opacity-60"
              >
                Connect Scorpion
              </button>
            )}
            <button
              onClick={onHome}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Home</span>
            </button>
            <button
              onClick={() => navigate('/AppStoreV2')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <Store className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Store</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {!address ? (
          <div className="max-w-lg mx-auto mt-10 rounded-3xl border border-border bg-card/70 p-8 text-center">
            <HybridLogo size={44} />
            <h2 className="mt-4 text-2xl font-black tracking-tight">Connect to run an audit</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              HYBRID runs live research on every audit, so your Scorpion wallet is the key to the studio.
            </p>
            {walletError && <p className="mt-3 text-xs text-destructive">{walletError}</p>}
            <button
              onClick={() => connect().catch(() => {})}
              disabled={walletLoading}
              className="mt-6 inline-flex items-center gap-2 px-7 py-3 rounded-full bg-primary text-primary-foreground font-bold text-sm disabled:opacity-60"
            >
              {walletLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              Connect Scorpion
            </button>
          </div>
        ) : (
          <>
            <div className="rounded-3xl border border-border bg-card/60 p-5 sm:p-7">
              <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5 text-primary" /> CHANNEL AUDIT
              </div>
              <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight">
                Paste your link. Get the truth.
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Any public channel, profile, video or post URL. HYBRID finds the creator behind it and audits their engagement.
              </p>

              <div className="mt-5 flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Link2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !busy) analyze(); }}
                    placeholder="https://youtube.com/@yourchannel"
                    className="w-full pl-10 pr-3 py-3 rounded-2xl bg-background border border-border text-sm outline-none focus:border-primary/60"
                  />
                </div>
                <button
                  onClick={analyze}
                  disabled={busy}
                  className="flex items-center justify-center gap-2 px-7 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-60"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {busy ? `Auditing ${seconds}s` : 'Audit my channel'}
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {HINTS.map((h) => {
                  const Icon = h.icon;
                  return (
                    <span key={h.label} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border text-[11px] text-muted-foreground">
                      <Icon className="w-3 h-3" /> {h.label}
                    </span>
                  );
                })}
              </div>

              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {busy && (
              <div className="mt-5 rounded-3xl border border-border bg-card/40 p-6">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-sm font-semibold">Researching your channel…</span>
                  <span className="ml-auto text-xs text-muted-foreground tabular-nums">{seconds}s</span>
                </div>
                <div className="mt-4 space-y-2">
                  {LOADING_TIPS.map((t, i) => (
                    <div key={t} className={`text-xs ${i <= Math.floor(seconds / 8) ? 'text-foreground' : 'text-muted-foreground/60'}`}>
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result && !busy && <HybridReport result={result} onAgain={() => { setResult(null); setLink(''); }} />}
          </>
        )}
      </main>
    </div>
  );
}