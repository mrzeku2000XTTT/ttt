import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2, Users, Link2, ArrowUpRight, Home, Radio } from 'lucide-react';
import KaspaMark from '@/components/tttbuilder/landing/KaspaMark';
import { shortKaspaAddress } from '@/lib/useKcc20Wallet';
import '@/components/kaspacollab/landing.css';

const HERO_IMG = 'https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/9b1f846ef_generated_image.png';

const STATS = [
  { value: '2 wallets', label: 'Covenant-locked' },
  { value: 'Required', label: 'Partner address' },
  { value: 'Free', label: 'Cost' },
];

const STEPS = [
  { n: '01', t: 'Connect', d: 'Link your Kaspa wallet' },
  { n: '02', t: 'Invite', d: "Add your partner's address" },
  { n: '03', t: 'Build', d: 'Share a live pad & notes' },
];

export default function CollabDashboard({ address, sessions, loadingSessions, onNew, onOpen, onHome }) {
  const navigate = useNavigate();
  const onlineCount = sessions.length;

  return (
    <div className="kaspa-collab-landing kc-page relative h-screen overflow-hidden bg-background text-foreground">
      <div className="relative mx-auto flex h-full max-w-[1240px] flex-col px-5 sm:px-10">
        {/* Header */}
        <header className="relative z-30 flex min-h-[72px] shrink-0 items-center justify-between gap-5 pr-12 sm:pr-36">
          <button onClick={onHome} className="flex shrink-0 items-center gap-2.5 transition hover:opacity-80" title="Back to landing">
            <KaspaMark size={24} />
            <span className="text-lg font-bold tracking-tight">Kaspa<span className="text-primary">Collab</span></span>
          </button>
          <div className="flex items-center gap-2">
            <div className="kc-glass flex items-center gap-2 rounded-full px-4 py-2 text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="font-mono text-muted-foreground">{shortKaspaAddress(address)}</span>
            </div>
            <button onClick={() => navigate("/CollabCollaborators")} className="kc-button" title="See who's online">
              <Radio className="h-3.5 w-3.5" /> Collaborators
            </button>
            <button onClick={() => navigate("/AppStoreV2")} className="kc-button" title="Exit to Store">
              <Home className="h-3.5 w-3.5" /> Exit to Store
            </button>
          </div>
        </header>

        {/* Main — two columns, fills remaining height, no page scroll */}
        <main className="relative z-10 grid min-h-0 flex-1 gap-6 py-5 lg:grid-cols-[1.05fr_1fr]">
          {/* Left: hero + stats + how it works */}
          <section className="flex min-h-0 flex-col justify-center">
            <div className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Wallet connected · Ready to build
            </div>
            <h1 className="kc-display text-[clamp(30px,4vw,52px)] leading-[1.1] tracking-tight">
              YOUR WORKSPACE.<br /><span className="kc-outline">START CREATING.</span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">
              Start a session and bring your partner in by their Kaspa address. Every session is covenant-locked to exactly two wallets — only you and your partner can read or write.
            </p>
            <button onClick={onNew} className="kc-button kc-button-primary mt-6 self-start">
              <Plus className="h-4 w-4" /> New Collab Session <ArrowUpRight className="h-4 w-4" />
            </button>

            {/* Stat pills — no icons, no boxes */}
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              {STATS.map((s, i) => (
                <React.Fragment key={s.label}>
                  <span className="flex items-baseline gap-2">
                    <span className="font-medium">{s.value}</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</span>
                  </span>
                  {i < STATS.length - 1 && <span className="h-3 w-px bg-foreground/15" />}
                </React.Fragment>
              ))}
            </div>

            {/* How it works — inline steps, no big box */}
            <div className="mt-7">
              <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-primary">How it works</p>
              <div className="flex flex-wrap gap-x-7 gap-y-3">
                {STEPS.map((s) => (
                  <div key={s.n} className="flex items-start gap-2.5">
                    <span className="kc-display text-sm text-accent">{s.n}</span>
                    <div>
                      <p className="text-xs font-medium">{s.t}</p>
                      <p className="text-[11px] text-muted-foreground">{s.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Right: image banner + sessions list (internal scroll only) */}
          <section className="flex min-h-0 flex-col gap-4">
            <div className="relative h-28 shrink-0 overflow-hidden rounded-2xl border border-foreground/15">
              <img src={HERO_IMG} alt="Collaboration" className="h-full w-full object-cover opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
              <div className="absolute bottom-3 left-4 text-[10px] uppercase tracking-[0.2em] text-foreground/80">
                Two wallets · one shared workspace
              </div>
            </div>

            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="mb-0.5 text-[10px] uppercase tracking-[0.2em] text-primary">Your sessions</p>
                <h2 className="text-xl font-medium">Pick up where you left off</h2>
              </div>
              <span className="text-xs text-muted-foreground">{onlineCount} active</span>
            </div>

            <div className="kc-glass min-h-0 flex-1 overflow-y-auto rounded-2xl p-3">
              {loadingSessions ? (
                <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : sessions.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                  <Users className="mb-3 h-7 w-7 text-primary/70" />
                  <p className="text-sm font-medium">No sessions yet</p>
                  <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
                    Create one and invite a partner by their Kaspa address.
                  </p>
                  <button onClick={onNew} className="kc-button kc-button-primary mt-4">
                    <Plus className="h-4 w-4" /> Start your first session
                  </button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {sessions.map((s) => {
                    const partner = s.wallet_a === address ? s.wallet_b : s.wallet_a;
                    const isCreator = s.wallet_a === address;
                    return (
                      <button
                        key={s.id}
                        onClick={() => onOpen(s)}
                        className="group rounded-xl border border-foreground/12 bg-secondary/15 p-4 text-left transition hover:border-primary/50 hover:bg-secondary/25"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
                            <Users className="h-4 w-4 text-primary" />
                          </span>
                          {isCreator && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[9px] font-mono text-primary">CREATOR</span>}
                        </div>
                        <h3 className="truncate text-sm font-medium">{s.title}</h3>
                        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Link2 className="h-3 w-3" />
                          <span className="font-mono">{shortKaspaAddress(partner)}</span>
                        </div>
                        {s.notes?.length > 0 && (
                          <span className="mt-2 inline-block rounded-full bg-foreground/5 px-2.5 py-0.5 text-[10px] text-muted-foreground">
                            {s.notes.length} notes
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}