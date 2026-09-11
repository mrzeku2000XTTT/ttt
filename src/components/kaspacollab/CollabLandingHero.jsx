import React from 'react';
import { ArrowUpRight, ArrowRight, Loader2, Link2, Wallet } from 'lucide-react';

const HERO = 'https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/f8c6c08fd_generated_image.png';
export default function CollabLandingHero({ onConnect, loading, error, hasWallet }) {
  return (
    <section id="collab-home" className="kc-hero relative grid items-center lg:grid-cols-2">
      <div className="relative z-10 pb-8 pt-12 lg:py-24">
        <div className="mb-7 flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-accent"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> A workspace for Kaspa builders</div>
        <p className="kc-display mb-3 text-sm tracking-[0.18em] sm:text-lg">Built for connection.</p>
        <h1 className="kc-display text-[clamp(36px,5.1vw,72px)] leading-[1.16] tracking-tight">CREATE.<br /><span className="kc-outline">TOGETHER.</span></h1>
        <p className="mt-7 max-w-sm text-sm leading-7 text-muted-foreground">Big ideas start with two people. Connect your Scorpion wallet, bring a partner, and turn a shared blank page into your next Kaspa project.</p>
        <div className="mt-8 flex flex-wrap items-center gap-6">
          <button onClick={onConnect} disabled={loading} className="kc-button kc-button-primary">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}{loading ? 'Connecting…' : hasWallet ? 'Enter workspace' : 'Connect Scorpion'}<ArrowUpRight className="h-4 w-4" /></button>
          <a href="#collab-workspace" className="inline-flex items-center gap-2 text-xs font-medium">Explore workspace <ArrowRight className="h-4 w-4" /></a>
        </div>
        {error && <p role="alert" className="mt-4 max-w-sm text-sm text-destructive">{error}</p>}
        <div className="kc-glass mt-12 inline-flex items-center gap-4 rounded-xl px-5 py-4"><Link2 className="h-6 w-6 text-accent" /><div><p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Made for your next idea</p><p className="mt-1 text-xs font-medium">Two wallets. One shared workspace.</p></div></div>
      </div>
      <div className="kc-hero-art relative min-w-0" aria-label="Futuristic Kaspa builder artwork">
        <img src={HERO} alt="Silver-haired cybernetic builder illuminated by pink and mint light" className="kc-portrait" fetchPriority="high" />
        <div className="kc-glass absolute right-0 top-[20%] rounded-lg px-4 py-3 text-xs"><span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-accent" />Wallet-connected</div>
        <div className="kc-glass absolute left-0 top-[48%] rounded-lg px-4 py-3"><p className="text-lg font-semibold">Your ideas.</p><p className="text-[10px] text-muted-foreground">A place to build on them.</p></div>
        <div className="kc-glass absolute bottom-[24%] right-0 rounded-lg px-4 py-3 text-xs">Shared notes · Live sync</div>
        <div className="absolute bottom-8 right-2 flex gap-3">{[['02', 'Collaborators'], ['01', 'Shared pad'], ['0', 'KAS to start']].map(([value, label]) => <div key={label} className="kc-glass min-w-[85px] rounded-lg px-3 py-3 text-center"><p className="text-xl font-medium">{value}</p><p className="mt-1 text-[8px] uppercase tracking-wider text-muted-foreground">{label}</p></div>)}</div>
      </div>
    </section>
  );
}