import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Store, User as UserIcon, ArrowRight } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useKcc20Wallet, shortKaspaAddress } from '@/lib/useKcc20Wallet';
import NudgeLandingHero from './NudgeLandingHero';
import NudgeHeroMockup from './NudgeHeroMockup';
import NudgeLandingFeatures from './NudgeLandingFeatures';
import NudgeLandingExtracts from './NudgeLandingExtracts';
import NudgeLandingFooter from './NudgeLandingFooter';

const LOGO = 'https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/17f6a9185_generated_image.png';

const PRODUCT = [
  { label: 'What it reads', href: '#product' },
  { label: 'The workflow', href: '#workflow' },
  { label: 'What it produces', href: '#extracts' },
];

export default function NudgeLanding({ onEnter }) {
  const { address, loading, error: walletError, connect } = useKcc20Wallet();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  /** The gate: connect once at the door, then hand the schedule to the studio. */
  const enterWith = async (payload) => {
    setError('');
    if (address) {
      onEnter(payload || null);
      return;
    }
    setBusy(true);
    try {
      await connect();
      onEnter(payload || null);
    } catch (e) {
      setError(e?.message || 'Connect your Scorpion wallet to enter the studio.');
    } finally {
      setBusy(false);
    }
  };

  const pick = () => fileRef.current?.click();

  return (
    <div className="min-h-screen bg-white text-black">
      <input
        ref={fileRef}
        type="file"
        accept="image/*,.ics,.txt,.csv,.tsv,.md,.json,text/calendar,text/*"
        className="hidden"
        onChange={(e) => {
          const picked = e.target.files?.[0];
          e.target.value = '';
          if (picked) enterWith({ file: picked });
        }}
      />

      <header className="sticky top-0 z-30 border-b border-[#f0f0f0] bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-5 sm:px-8">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex shrink-0 items-center gap-2">
            <img src={LOGO} alt="NUDGE" className="h-6 w-6 rounded-md object-cover" />
            <span className="text-[11px] font-bold tracking-[0.28em]">NUDGE</span>
            <span className="hidden text-[10px] font-semibold tracking-[0.2em] text-[#8a8a8a] sm:inline">
              CALENDAR NOTIFICATIONS
            </span>
          </button>

          <nav className="ml-4 hidden items-center gap-1 md:flex">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[12px] text-[#666666] transition-colors hover:bg-[#f7f7f8] hover:text-black">
                  Product <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                {PRODUCT.map((p) => (
                  <DropdownMenuItem key={p.href} asChild>
                    <a href={p.href} className="text-[12px]">{p.label}</a>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <a href="#workflow" className="rounded-lg px-3 py-1.5 text-[12px] text-[#666666] transition-colors hover:bg-[#f7f7f8] hover:text-black">
              Workflow
            </a>
            <a href="#extracts" className="rounded-lg px-3 py-1.5 text-[12px] text-[#666666] transition-colors hover:bg-[#f7f7f8] hover:text-black">
              Output
            </a>
            <Link to="/Docs" className="rounded-lg px-3 py-1.5 text-[12px] text-[#666666] transition-colors hover:bg-[#f7f7f8] hover:text-black">
              Docs
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <Link
              to="/AppStoreV2"
              className="flex h-9 items-center gap-1.5 rounded-lg border border-[#ececec] px-3 text-[11px] text-[#666666] transition-colors hover:border-[#c9c9c9] hover:text-black"
            >
              <Store className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Store</span>
            </Link>
            <button
              onClick={() => enterWith(null)}
              disabled={busy}
              className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-[11px] text-[#666666] transition-colors hover:bg-[#f7f7f8] hover:text-black disabled:opacity-50"
              title={address ? shortKaspaAddress(address) : 'Connect your wallet'}
            >
              <UserIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {address ? shortKaspaAddress(address) : busy || loading ? 'Connecting…' : 'Connect Scorpion'}
              </span>
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-14 pt-12 sm:px-8 sm:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <NudgeLandingHero
            onEnter={enterWith}
            onPick={pick}
            connecting={busy || loading}
            error={error || walletError}
          />
          <div className="order-first lg:order-last">
            <NudgeHeroMockup />
          </div>
        </div>
      </section>

      <NudgeLandingFeatures />
      <NudgeLandingExtracts onDrop={pick} />

      <section className="border-t border-[#f0f0f0] bg-white">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
          <div className="flex flex-col items-start gap-6 rounded-2xl bg-gradient-to-br from-[#0a0a14] via-[#141034] to-[#2a0f45] p-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">NUDGE</p>
              <p className="mt-3 max-w-md text-[19px] font-semibold leading-snug text-white">
                Stop reading your calendar. Read your notifications.
              </p>
            </div>
            <button
              onClick={() => enterWith(null)}
              disabled={busy}
              className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-white px-5 text-[12.5px] font-semibold text-[#0a0a14] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? 'Connecting…' : 'Turn into notifications'} <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      <NudgeLandingFooter />
    </div>
  );
}