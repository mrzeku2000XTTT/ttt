import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Loader2, ScanLine, Store, Type, Wallet } from 'lucide-react';
import { useKcc20Wallet, shortKaspaAddress } from '@/lib/useKcc20Wallet';

const HERO = 'https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/1b0978900_generated_image.png';
const LOGO = 'https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/1fe645919_generated_image.png';

const FEATURES = [
  {
    icon: ScanLine,
    title: 'Decoded in your tab',
    body: 'The file is read by this browser, not uploaded anywhere. We seek it, draw real pixels to a canvas and measure what is actually there.',
  },
  {
    icon: BarChart3,
    title: 'Measured, not guessed',
    body: 'Cut boundaries, shot lengths, pacing, motion between frames, brightness, how much of the frame is white — plus the palette, by area.',
  },
  {
    icon: Type,
    title: 'Typography & motion read',
    body: 'The sampled frames go to a vision model that reports the type treatment, the motion on each element, and a keyframe recipe you can rebuild.',
  },
];

export default function PrismLanding({ onEnter }) {
  const { address, loading, error, connect } = useKcc20Wallet();

  const handleCta = async () => {
    if (address) {
      onEnter();
      return;
    }
    try {
      await connect();
      onEnter();
    } catch {
      // the wallet error shows inline below the button
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#121212]">
      <header className="sticky top-0 z-20 border-b border-[#ececec] bg-white/85 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src={LOGO} alt="PRISM" className="w-6 h-6 rounded-md object-cover" />
            <span className="text-[11px] font-bold tracking-[0.25em]">PRISM</span>
            <span className="hidden sm:inline text-[10px] uppercase tracking-[0.2em] text-[#9a9a9a]">Video Inspector</span>
          </div>
          <div className="flex items-center gap-2">
            {address && (
              <span className="hidden sm:inline text-[10px] tabular-nums text-[#a3a3a3]">{shortKaspaAddress(address)}</span>
            )}
            <Link
              to="/AppStoreV2"
              className="flex items-center gap-1.5 px-3 h-8 rounded-full border border-[#e6e6e6] text-[10px] text-[#6b6b6b] hover:text-[#121212] hover:border-[#c9c9c9] transition-colors"
            >
              <Store className="w-3 h-3" />
              Exit to Store
            </Link>
          </div>
        </div>
        <div className="prism-hairline" />
      </header>

      <section className="relative overflow-hidden">
        <img src={HERO} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/85 to-white" />
        <div className="relative max-w-3xl mx-auto px-5 sm:px-6 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#e6e6e6] bg-white/70 text-[10px] uppercase tracking-[0.2em] text-[#8a8a8a]">
            Shots · Pacing · Typography · Motion
          </div>
          <h1 className="mt-5 text-3xl sm:text-5xl font-semibold leading-[1.08]">
            Read the video.
            <br />
            <span className="text-[#9c9c9c]">Frame by frame.</span>
          </h1>
          <p className="mt-4 max-w-xl mx-auto text-sm text-[#6f6f6f] leading-relaxed">
            Drop any MP4. PRISM measures the cut structure, pacing, motion and palette from the real pixels,
            reads the typography and animation, and writes the keyframe recipe to rebuild it.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-2">
            <button
              onClick={handleCta}
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-full bg-[#121212] text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Connecting…
                </>
              ) : address ? (
                <>
                  Enter Studio <ArrowRight className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <Wallet className="w-3.5 h-3.5" /> Connect Scorpion
                </>
              )}
            </button>
            <Link
              to="/AppStoreV2"
              className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-[#e6e6e6] text-xs text-[#6b6b6b] hover:text-[#121212] hover:border-[#c9c9c9] transition-colors text-center"
            >
              Back to Store
            </Link>
          </div>
          {error && <p className="mt-3 text-[11px] text-red-500">{error}</p>}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-5 sm:px-6 pb-16">
        <div className="grid sm:grid-cols-3 gap-2.5">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="rounded-2xl border border-[#ececec] bg-white p-4 prism-frame">
                <div className="w-8 h-8 rounded-lg bg-[#121212] text-white flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="mt-3 text-sm font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-[12px] text-[#6f6f6f] leading-relaxed">{f.body}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-3 rounded-2xl border border-[#ececec] bg-[#fafafa] p-5 text-center">
          <h2 className="text-lg font-semibold">What it hands back</h2>
          <p className="mt-1.5 text-xs text-[#6f6f6f]">
            A shot list with timings, a motion and brightness curve, the palette by area, a typography read,
            and a keyframe recipe — exportable as Markdown or JSON.
          </p>
          <button
            onClick={handleCta}
            disabled={loading}
            className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#121212] text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Inspect a video <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      <footer className="border-t border-[#ececec] py-4 text-center text-[10px] text-[#a3a3a3] tracking-wide">
        PRISM · A TTT SUPER APP · VIDEO FORENSICS FOR DESIGNERS
      </footer>
    </div>
  );
}