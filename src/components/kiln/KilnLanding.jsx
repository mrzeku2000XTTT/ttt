import React, { useRef } from 'react';
import { ArrowRight, ArrowUpRight, Loader2 } from 'lucide-react';
import { KILN_HERO, KILN_LOGO } from './kilnAssets';
import { IconCodeSheet, IconLayers, IconLinkDrop, IconPixelWallet, IconSpark } from './KilnIcons';
import { KilnLandingFooter, KilnLandingProduces, KilnLandingWorkflow } from './KilnLandingSections';

const FEATURES = [
  { Icon: IconLinkDrop, title: 'Image, file or link', body: 'Drop a screenshot or paste an image URL.' },
  { Icon: IconLayers, title: 'Mapped to ETA', body: 'Every block becomes an ETA component.' },
  { Icon: IconCodeSheet, title: 'Real HTML', body: 'One self-contained file you can copy.' },
  { Icon: IconSpark, title: 'Keeps editing', body: 'Tell the agent what to change, in chat.' },
];

export default function KilnLanding({ hasWallet, loading, error, onConnect, onEnter, onSeed, onExit, wallet }) {
  const picker = useRef(null);
  const primary = hasWallet ? onEnter : onConnect;

  return (
    <div className="kiln-page">
      <header className="mx-auto flex w-full max-w-[1180px] items-center gap-4 px-5 py-5">
        <div className="flex items-center gap-2">
          <img src={KILN_LOGO} alt="KILN" className="h-8 w-8 rounded-[8px]" />
          <span className="kiln-display text-[19px] leading-none">KILN</span>
          <span className="kiln-mono ml-2 hidden text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--k-muted))] sm:block">
            image → ETA components
          </span>
        </div>
        <nav className="ml-auto hidden items-center gap-5 text-[11.5px] font-semibold md:flex">
          <a href="#how" className="hover:text-[hsl(var(--k-amber))]">How it works</a>
          <a href="#makes" className="hover:text-[hsl(var(--k-amber))]">What it builds</a>
          <a href="#enter" className="hover:text-[hsl(var(--k-amber))]">Enter</a>
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-4">
          <button onClick={onExit} className="kiln-btn px-3 py-2 text-[11px]">Store</button>
          <button onClick={hasWallet ? onEnter : onConnect} disabled={loading} className="kiln-btn kiln-btn-primary px-3 py-2 text-[11px]">
            <IconPixelWallet size={13} />
            {loading ? 'Connecting…' : hasWallet ? (wallet || 'Wallet connected') : 'Connect Scorpion'}
          </button>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-[1180px] items-center gap-10 px-5 pb-6 pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:pt-10">
        <div>
          <span className="kiln-mono inline-flex items-center gap-2 border border-[hsl(var(--k-line))] bg-[hsl(var(--k-surface))] px-3 py-1.5 text-[10px] uppercase tracking-[0.2em]">
            <span className="kiln-px is-on" />
            Built on the ETA motion model
          </span>
          <h1 className="kiln-display mt-5 text-[clamp(32px,4.6vw,54px)] leading-[1.08]">
            Your image becomes
            <br />
            <span className="kiln-grad">working UI components.</span>
          </h1>
          <p className="mt-5 max-w-[430px] text-[13px] leading-6 text-[hsl(var(--k-muted))]">
            Drop a screenshot, a mock or a component sheet. KILN reads it, maps every block onto the ETA component
            library, writes the HTML at the source's own size — then keeps editing it while you watch, in chat.
          </p>

          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const file = Array.from(event.dataTransfer?.files || []).find((entry) => entry.type.startsWith('image/'));
              if (file) onSeed(file);
            }}
            className="kiln-pixel mt-7 max-w-[440px] border border-dashed border-[hsl(var(--k-line))] bg-[hsl(var(--k-surface))] p-4"
          >
            <div className="flex items-center gap-3">
              <IconLinkDrop size={22} className="shrink-0 text-[hsl(var(--k-amber))]" />
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-semibold">Drop the image you made</p>
                <p className="text-[11px] text-[hsl(var(--k-muted))]">or paste an image link in the studio chat</p>
              </div>
              <button onClick={() => picker.current?.click()} className="kiln-btn shrink-0 px-3 py-2 text-[11px]">
                Pick file
              </button>
            </div>
            <input
              ref={picker}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) onSeed(file);
              }}
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button onClick={primary} disabled={loading} className="kiln-btn kiln-btn-primary px-5 py-3 text-[12px]">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
              {hasWallet ? 'Enter Studio' : 'Connect Scorpion'}
            </button>
            <a href="#how" className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold">
              See how it works <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
          {error && <p className="mt-3 text-[12px] text-red-700">{error}</p>}
          <p className="kiln-mono mt-4 text-[10px] text-[hsl(var(--k-muted))]">
            Your images stay yours — uploads are private and only used to read the interface.
          </p>
        </div>

        <div className="relative">
          <img
            src={KILN_HERO}
            alt="Cream component sheets dissolving into pixel blocks over a deep brown gradient"
            className="h-[300px] w-full rounded-[20px] object-cover lg:h-[420px]"
          />
          <div className="kiln-card absolute inset-x-4 bottom-4 p-3">
            <div className="flex items-center gap-1.5">
              {['BrowserWindow', 'Cards4', 'SplitText'].map((name) => (
                <span key={name} className="kiln-mono border border-[hsl(var(--k-line))] px-1.5 py-0.5 text-[9px] font-semibold">
                  {name}
                </span>
              ))}
              <span className="kiln-mono ml-auto text-[9px] text-[hsl(var(--k-muted))]">1440 × 900</span>
            </div>
            <div className="mt-2.5 rounded-[12px] border border-[hsl(var(--k-line))] bg-[hsl(var(--k-bg))] p-2.5">
              <div className="mb-2 flex items-center gap-1.5">
                <span className="kiln-px is-on" />
                <span className="kiln-px is-on" />
                <span className="kiln-px" />
                <span className="kiln-mono ml-1 text-[9px] text-[hsl(var(--k-muted))]">kiln-components.html</span>
              </div>
              <div className="h-2 w-3/4 rounded-full bg-[hsl(var(--k-ink))] opacity-[0.14]" />
              <div className="mt-1.5 h-2 w-1/2 rounded-full bg-[hsl(var(--k-ink))] opacity-[0.1]" />
              <div className="mt-2.5 flex gap-1.5">
                <span className="h-5 w-16 rounded-full bg-gradient-to-r from-[hsl(var(--k-accent))] to-[hsl(var(--k-amber))]" />
                <span className="h-5 w-12 rounded-full border border-[hsl(var(--k-line))]" />
              </div>
            </div>
            <div className="kiln-mono mt-2 flex items-center gap-1 text-[9px] text-[hsl(var(--k-muted))]">
              <span className="kiln-px is-on is-pulse" />
              data-eta-component=&quot;BrowserWindow&quot; · 1:1 to source
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1180px] gap-3 px-5 py-8 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ Icon, title, body }) => (
          <div key={title} className="kiln-card flex items-start gap-3 p-4">
            <Icon size={18} className="mt-0.5 shrink-0 text-[hsl(var(--k-amber))]" />
            <div>
              <p className="text-[12.5px] font-semibold">{title}</p>
              <p className="mt-0.5 text-[11px] leading-5 text-[hsl(var(--k-muted))]">{body}</p>
            </div>
          </div>
        ))}
      </section>

      <KilnLandingWorkflow />
      <KilnLandingProduces onEnter={primary} hasWallet={hasWallet} />
      <KilnLandingFooter />
    </div>
  );
}