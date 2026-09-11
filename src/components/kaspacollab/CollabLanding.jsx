import React from 'react';
import { Loader2, Wallet } from 'lucide-react';
import BackToStore from '@/components/BackToStore';
import KaspaMark from '@/components/tttbuilder/landing/KaspaMark';
import CollabLandingHero from '@/components/kaspacollab/CollabLandingHero';
import CollabLandingWorkspace from '@/components/kaspacollab/CollabLandingWorkspace';
import CollabLandingIdeas from '@/components/kaspacollab/CollabLandingIdeas';
import '@/components/kaspacollab/landing.css';

export default function CollabLanding({ onConnect, loading, error }) {
  return (
    <div className="kaspa-collab-landing kc-page relative min-h-screen overflow-hidden bg-background text-foreground">
      <BackToStore />
      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-10">
        <header className="relative z-30 flex min-h-[88px] items-center justify-between gap-5 pr-12 sm:pr-36">
          <a href="#collab-home" className="flex shrink-0 items-center gap-2.5" aria-label="KaspaCollab home"><KaspaMark size={25} /><span className="text-lg font-bold tracking-tight">Kaspa<span className="text-primary">Collab</span></span></a>
          <nav aria-label="KaspaCollab navigation" className="hidden items-center gap-8 text-[11px] text-muted-foreground lg:flex"><a href="#collab-home" className="hover:text-foreground">Home</a><a href="#collab-workspace" className="hover:text-foreground">Workspace</a><a href="#collab-ideas" className="hover:text-foreground">Explore ideas</a></nav>
          <button onClick={onConnect} disabled={loading} className="kc-button hidden shrink-0 sm:inline-flex">{loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wallet className="h-3.5 w-3.5" />}{loading ? 'Connecting…' : 'Connect wallet'}</button>
        </header>
        <main>
          <CollabLandingHero onConnect={onConnect} loading={loading} error={error} />
          <CollabLandingWorkspace onConnect={onConnect} loading={loading} />
          <CollabLandingIdeas onConnect={onConnect} loading={loading} />
        </main>
      </div>
    </div>
  );
}