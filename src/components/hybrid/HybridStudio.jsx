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
  { icon: Youtube, label: 'YouTube' },
  { icon: Music2, label: 'TikTok' },
  { icon: Instagram, label: 'Instagram' },
  { icon: AtSign, label: 'X' },
  { icon: Twitch, label: 'Twitch' },
];

const LOADING_TIPS = [
  'Opening your channel on the live web…',
  'Reading recent posts, views and titles…',
  'Measuring how real the engagement looks…',
  'Ranking the moves that lift you fastest…',
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
        <div className="max-w-4xl mx-auto pl-4 pr-14 sm:px-6 py-2 flex items-center justify-between gap-3">
          <button onClick={onHome} className="flex items-center gap-2">
            <HybridLogo size={24} />
            <span className="text-sm font-semibold tracking-tight">HYBRID</span>
          </button>
          <div className="flex items-center gap-1.5">
            {address ? (
              <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full border border-primary/40 text-[10px] font-medium text-primary">
                {shortKaspaAddress(address)}
              </span>
            ) : (
              <button
                onClick={() => connect().catch(() => {})}
                disabled={walletLoading}
                className="px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold disabled:opacity-60"
              >
                Connect
              </button>
            )}
            <button
              onClick={onHome}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home className="w-3 h-3" />
              <span className="hidden sm:inline">Home</span>
            </button>
            <button
              onClick={() => navigate('/AppStoreV2')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Store className="w-3 h-3" />
              <span className="hidden sm:inline">Store</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
        {!address ? (
          <div className="max-w-sm mx-auto mt-8 rounded-2xl border border-border bg-card/60 p-6 text-center">
            <HybridLogo size={32} />
            <h2 className="mt-3 text-lg font-semibold">Connect to run an audit</h2>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              HYBRID researches the live web on every audit, so your Scorpion wallet is the key to the studio.
            </p>
            {walletError && <p className="mt-2 text-[11px] text-destructive">{walletError}</p>}
            <button
              onClick={() => connect().catch(() => {})}
              disabled={walletLoading}
              className="mt-5 inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-primary text-primary-foreground font-semibold text-xs disabled:opacity-60"
            >
              {walletLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
              Connect Scorpion
            </button>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-border bg-card/50 p-4 sm:p-5">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.15em] text-muted-foreground">
                <Sparkles className="w-3 h-3 text-primary" /> CHANNEL AUDIT
              </div>
              <h1 className="mt-2 text-lg sm:text-xl font-semibold">Paste your link. Get the truth.</h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Any public channel, profile, video or post URL.
              </p>

              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Link2 className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !busy) analyze(); }}
                    placeholder="https://youtube.com/@yourchannel"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-background border border-border text-xs outline-none focus:border-primary/60"
                  />
                </div>
                <button
                  onClick={analyze}
                  disabled={busy}
                  className="flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs disabled:opacity-60"
                >
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {busy ? `Auditing ${seconds}s` : 'Audit my channel'}
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {HINTS.map((h) => {
                  const Icon = h.icon;
                  return (
                    <span key={h.label} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-border text-[10px] text-muted-foreground">
                      <Icon className="w-2.5 h-2.5" /> {h.label}
                    </span>
                  );
                })}
              </div>

              {error && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {busy && (
              <div className="mt-3 rounded-2xl border border-border bg-card/40 p-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  <span className="text-xs font-medium">Researching your channel…</span>
                  <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">{seconds}s</span>
                </div>
                <div className="mt-3 space-y-1.5">
                  {LOADING_TIPS.map((t, i) => (
                    <div key={t} className={`text-[11px] ${i <= Math.floor(seconds / 8) ? 'text-foreground' : 'text-muted-foreground/60'}`}>
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