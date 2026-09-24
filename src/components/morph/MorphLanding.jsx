import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Store, SplitSquareHorizontal, Move3d, Sparkles, Wallet, Loader2 } from 'lucide-react';
import { useKcc20Wallet, shortKaspaAddress } from '@/lib/useKcc20Wallet';

const HERO = 'https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/e1640ebf4_generated_image.png';
const LOGO = 'https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/76b25d579_generated_image.png';

const FEATURES = [
  {
    icon: SplitSquareHorizontal,
    title: 'Two surfaces, one engine',
    body: 'The VIEWPORT is the editable representation — grid, selection box, handles. FINAL is the compositor output. Drag the divider, or take either pane fullscreen.',
  },
  {
    icon: Move3d,
    title: 'RGB transform gizmo',
    body: 'Red is X, green is Y, blue is Z. Drag a handle and the transform changes; with auto-key on, the keyframe is written at the playhead and FINAL updates live.',
  },
  {
    icon: Sparkles,
    title: 'Real vector morphing',
    body: 'Shapes are re-sampled to equal points and blended point-for-point, so a circle genuinely becomes a star. Describe it and the AI director writes the keyframes.',
  },
];

export default function MorphLanding({ onEnter }) {
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
      // error surfaces inline below the button
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070707]/85 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src={LOGO} alt="Morph" className="w-6 h-6 rounded-md object-cover" />
            <span className="text-[11px] font-bold tracking-[0.25em]">MORPH</span>
            <span className="hidden sm:inline text-[10px] uppercase tracking-[0.2em] text-white/35">Motion Studio</span>
          </div>
          <div className="flex items-center gap-2">
            {address && (
              <span className="hidden sm:inline text-[10px] tabular-nums text-white/40">{shortKaspaAddress(address)}</span>
            )}
            <Link
              to="/AppStoreV2"
              className="flex items-center gap-1.5 px-3 h-8 rounded-full border border-white/15 text-[10px] text-white/60 hover:text-white hover:border-white/40 transition-colors"
            >
              <Store className="w-3 h-3" />
              Exit to Store
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <img src={HERO} alt="Shape morphing render" className="absolute inset-0 w-full h-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070707]/70 via-[#070707]/80 to-[#070707]" />
        <div className="relative max-w-3xl mx-auto px-5 sm:px-6 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/15 bg-white/[0.04] text-[10px] uppercase tracking-[0.2em] text-white/50">
            Viewport · Keyframes · Morph · AI director
          </div>
          <h1 className="mt-5 text-3xl sm:text-5xl font-semibold leading-[1.08] tracking-tight">
            Animate the shape.
            <br />
            <span className="text-white/55">Not the software.</span>
          </h1>
          <p className="mt-4 max-w-xl mx-auto text-sm text-white/55 leading-relaxed">
            A real motion engine with a split editor, RGB transform gizmo and true vector morphing —
            and an AI director that writes the keyframes for you.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-2">
            <button
              onClick={handleCta}
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-full bg-white text-black text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
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
              className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-white/15 text-xs text-white/60 hover:text-white hover:border-white/40 transition-colors text-center"
            >
              Back to Store
            </Link>
          </div>
          {error && <p className="mt-3 text-[11px] text-red-400">{error}</p>}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-5 sm:px-6 pb-16">
        <div className="grid sm:grid-cols-3 gap-2.5">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="mt-3 text-sm font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-[12px] text-white/50 leading-relaxed">{f.body}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-center">
          <h2 className="text-lg font-semibold">Try the director</h2>
          <p className="mt-1.5 text-xs text-white/50">
            Type “a circle grows, morphs into a star and drifts across the frame” and watch it build the timeline.
          </p>
          <button
            onClick={handleCta}
            disabled={loading}
            className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white text-black text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Start animating <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      <footer className="border-t border-white/10 py-4 text-center text-[10px] text-white/30 tracking-wide">
        MORPH · A TTT SUPER APP · AI-NATIVE MOTION GRAPHICS
      </footer>
    </div>
  );
}