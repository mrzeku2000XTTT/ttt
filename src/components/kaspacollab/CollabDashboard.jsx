import React from 'react';
import { Plus, Loader2, Users, Link2, Shield, ArrowUpRight, Sparkles, FileText, MessagesSquare } from 'lucide-react';
import BackToStore from '@/components/BackToStore';
import KaspaMark from '@/components/tttbuilder/landing/KaspaMark';
import { shortKaspaAddress } from '@/lib/useKcc20Wallet';
import '@/components/kaspacollab/landing.css';

export default function CollabDashboard({ address, sessions, loadingSessions, onNew, onOpen }) {
  return (
    <div className="kaspa-collab-landing kc-page relative min-h-screen overflow-hidden bg-background text-foreground">
      <BackToStore />
      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-10">
        {/* Header */}
        <header className="relative z-30 flex min-h-[88px] items-center justify-between gap-5 pr-12 sm:pr-36">
          <div className="flex shrink-0 items-center gap-2.5">
            <KaspaMark size={25} />
            <span className="text-lg font-bold tracking-tight">Kaspa<span className="text-primary">Collab</span></span>
          </div>
          <div className="kc-glass flex items-center gap-2 rounded-full px-4 py-2 text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="font-mono text-muted-foreground">{shortKaspaAddress(address)}</span>
          </div>
        </header>

        <main className="relative z-10 pb-20">
          {/* Hero band */}
          <section className="kc-glass relative mb-8 overflow-hidden rounded-[28px] p-6 sm:p-9">
            <div className="grid items-center gap-6 lg:grid-cols-[1.3fr_1fr]">
              <div>
                <div className="mb-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-accent">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Wallet connected · Ready to build
                </div>
                <h1 className="kc-display text-[clamp(30px,4.2vw,56px)] leading-[1.12] tracking-tight">
                  YOUR WORKSPACE.<br /><span className="kc-outline">START CREATING.</span>
                </h1>
                <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">
                  Start a session and bring your partner in by their Kaspa address. Every session is covenant-locked to exactly two wallets — only you and your partner can read or write.
                </p>
                <button onClick={onNew} className="kc-button kc-button-primary mt-7">
                  <Plus className="h-4 w-4" /> New Collab Session <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Shield, label: 'Covenant-locked', value: '2 wallets' },
                  { icon: Link2, label: 'Partner address', value: 'Required' },
                  { icon: Sparkles, label: 'Cost', value: 'Free' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="kc-glass rounded-2xl p-4 text-center">
                    <Icon className="mx-auto mb-3 h-5 w-5 text-accent" />
                    <p className="text-sm font-medium">{value}</p>
                    <p className="mt-1 text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Sessions */}
          <section>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-primary">Your sessions</p>
                <h2 className="text-2xl font-medium">Pick up where you left off</h2>
              </div>
              <span className="text-xs text-muted-foreground">{sessions.length} active</span>
            </div>

            {loadingSessions ? (
              <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : sessions.length === 0 ? (
              <div className="kc-glass relative overflow-hidden rounded-[24px] p-10 text-center sm:p-16">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/40 bg-primary/10">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-medium">No sessions yet</h3>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
                  Create your first session and invite a partner by their Kaspa address. Two wallets, one shared workspace.
                </p>
                <button onClick={onNew} className="kc-button kc-button-primary mt-7">
                  <Plus className="h-4 w-4" /> Start your first session <ArrowUpRight className="h-4 w-4" />
                </button>
                <div className="mt-10 grid gap-3 sm:grid-cols-3">
                  {[
                    { icon: Link2, t: 'Bring your partner', d: 'Enter their Kaspa address' },
                    { icon: FileText, t: 'Think on the same page', d: 'A shared pad with live sync' },
                    { icon: MessagesSquare, t: 'Keep the conversation', d: 'Notes alongside your work' },
                  ].map(({ icon: Icon, t, d }) => (
                    <div key={t} className="rounded-2xl border border-border bg-secondary/20 p-4 text-left">
                      <Icon className="mb-2 h-4 w-4 text-accent" />
                      <p className="text-xs font-medium">{t}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{d}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sessions.map((s) => {
                  const partner = s.wallet_a === address ? s.wallet_b : s.wallet_a;
                  const isCreator = s.wallet_a === address;
                  return (
                    <button
                      key={s.id}
                      onClick={() => onOpen(s)}
                      className="kc-glass group rounded-2xl p-5 text-left transition hover:border-primary/50"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        {isCreator && (
                          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[9px] font-mono text-primary">CREATOR</span>
                        )}
                      </div>
                      <h3 className="truncate text-sm font-medium">{s.title}</h3>
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Link2 className="h-3 w-3" />
                        <span className="font-mono">{shortKaspaAddress(partner)}</span>
                      </div>
                      {s.notes?.length > 0 && (
                        <span className="mt-3 inline-block rounded-full bg-foreground/5 px-2.5 py-1 text-[10px] text-muted-foreground">
                          {s.notes.length} notes
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}