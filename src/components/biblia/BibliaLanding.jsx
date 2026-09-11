import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import BibliaMesh from './BibliaMesh';
import ParchmentCard, { CARDS } from './bibliaCards';
import '@/components/biblia/biblia.css';

const HERO = 'https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/ea864a700_generated_image.png';

// Gold ring with a cross/globe hybrid symbol — breathing glow, no motion.
function GoldRing() {
  return (
    <svg width="72" height="72" viewBox="0 0 76 76" className="bl-ring-glow" aria-hidden="true">
      <circle cx="38" cy="38" r="33" stroke="#c5b085" strokeWidth="1.5" fill="rgba(253,251,246,0.5)" />
      <ellipse cx="38" cy="38" rx="15" ry="26" stroke="#fdfbf6" strokeWidth="0.9" fill="none" />
      <line x1="38" y1="16" x2="38" y2="60" stroke="#fdfbf6" strokeWidth="1.2" />
      <line x1="22" y1="38" x2="54" y2="38" stroke="#fdfbf6" strokeWidth="1.2" />
    </svg>
  );
}

export default function BibliaLanding({ onEnter, leaving }) {
  const tyRef = useRef(null);

  // Any input is the invitation — keys, too.
  useEffect(() => {
    const onKey = (e) => {
      if (['ArrowDown', 'ArrowUp', ' ', 'Enter'].includes(e.key)) onEnter();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onEnter]);

  return (
    <motion.section
      className="bl-page relative h-[100dvh] overflow-hidden"
      onClick={onEnter}
      onWheel={(e) => { if (e.deltaY > 0) onEnter(); }}
      onTouchStart={(e) => { tyRef.current = e.touches[0].clientY; }}
      onTouchEnd={(e) => {
        if (tyRef.current != null && tyRef.current - e.changedTouches[0].clientY > 40) onEnter();
        tyRef.current = null;
      }}
      animate={{ opacity: leaving ? 0 : 1, y: leaving ? -40 : 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      <BibliaMesh />

      {/* figure — walking on the reflective surface, mid-depth */}
      <div className="absolute inset-0 z-[5] flex items-center justify-center">
        <img src={HERO} alt="" className="bl-figure-img h-[62vh] w-auto max-w-none object-contain" fetchPriority="high" />
      </div>

      {/* floating parchment cards */}
      {CARDS.map((c, i) => <ParchmentCard key={i} {...c} />)}

      {/* gold ring above the figure */}
      <div className="absolute inset-x-0 top-[17%] z-10 flex justify-center">
        <GoldRing />
      </div>

      {/* hero type */}
      <div className="absolute left-6 top-8 z-20 sm:left-12 sm:top-12">
        <h1 className="text-[clamp(30px,6vw,64px)] font-normal uppercase leading-tight tracking-[0.28em]">The Bible</h1>
        <p className="mt-3 text-sm font-light tracking-[0.12em] opacity-60 sm:text-base">Scroll. Read. Reflect.</p>
      </div>

      {/* footer */}
      <button
        onClick={(e) => { e.stopPropagation(); window.location.href = '/AppStoreV2'; }}
        className="absolute bottom-6 left-6 z-20 text-[10px] tracking-[0.3em] opacity-40 transition hover:opacity-80"
      >Exit to Store</button>
      <div className="absolute bottom-6 right-6 z-20 text-[10px] tracking-[0.3em] opacity-60">Built for Kaspa</div>
    </motion.section>
  );
}