import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Store, User as UserIcon } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useKcc20Wallet, shortKaspaAddress } from '@/lib/useKcc20Wallet';
import PrismLandingHero from './PrismLandingHero';
import PrismHeroMockup from './PrismHeroMockup';
import PrismLandingFeatures from './PrismLandingFeatures';
import PrismLandingExtracts from './PrismLandingExtracts';
import PrismLandingFooter from './PrismLandingFooter';

const LOGO = 'https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/1fe645919_generated_image.png';

const PRODUCT = [
  { label: 'What it reads', href: '#product' },
  { label: 'The workflow', href: '#workflow' },
  { label: 'What it extracts', href: '#extracts' },
];

export default function PrismLanding({ onEnter }) {
  const { address, loading, error: walletError, connect } = useKcc20Wallet();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  /** The gate: connect once, then hand the file (if any) to the studio. */
  const enterWith = async (file) => {
    setError('');
    if (address) {
      onEnter(file || null);
      return;
    }
    setBusy(true);
    try {
      await connect();
      onEnter(file || null);
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
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const picked = e.target.files?.[0];
          e.target.value = '';
          if (picked) enterWith(picked);
        }}
      />

      {/* header */}
      <header className="sticky top-0 z-30 border-b border-[#f0f0f0] bg-white/85 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-14 flex items-center gap-4">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2 shrink-0">
            <img src={LOGO} alt="PRISM" className="w-6 h-6 rounded-md object-cover" />
            <span className="text-[11px] font-bold tracking-[0.28em]">PRISM</span>
            <span className="hidden sm:inline text-[10px] tracking-[0.2em] text-[#8a8a8a] font-semibold">
              VIDEO INSPECTOR
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-1 ml-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] text-[#666666] hover:text-black hover:bg-[#f7f7f8] transition-colors">
                  Product <ChevronDown className="w-3 h-3" />
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
            <a href="#workflow" className="px-3 py-1.5 rounded-lg text-[12px] text-[#666666] hover:text-black hover:bg-[#f7f7f8] transition-colors">
              Workflow
            </a>
            <a href="#extracts" className="px-3 py-1.5 rounded-lg text-[12px] text-[#666666] hover:text-black hover:bg-[#f7f7f8] transition-colors">
              Examples
            </a>
            <Link to="/Docs" className="px-3 py-1.5 rounded-lg text-[12px] text-[#666666] hover:text-black hover:bg-[#f7f7f8] transition-colors">
              Docs
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <Link
              to="/AppStoreV2"
              className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-[#ececec] text-[11px] text-[#666666] hover:text-black hover:border-[#c9c9c9] transition-colors"
            >
              <Store className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Store</span>
            </Link>
            <button
              onClick={() => enterWith(null)}
              disabled={busy}
              className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-[11px] text-[#666666] hover:text-black hover:bg-[#f7f7f8] transition-colors disabled:opacity-50"
              title={address ? shortKaspaAddress(address) : 'Connect your wallet'}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{address ? shortKaspaAddress(address) : 'Account'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-14">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <PrismLandingHero
            onFile={enterWith}
            onPick={pick}
            connecting={busy || loading}
            error={error || walletError}
          />
          <div className="order-first lg:order-last">
            <PrismHeroMockup />
          </div>
        </div>
      </section>

      <PrismLandingFeatures />

      <PrismLandingExtracts onDrop={pick} />

      <PrismLandingFooter />
    </div>
  );
}