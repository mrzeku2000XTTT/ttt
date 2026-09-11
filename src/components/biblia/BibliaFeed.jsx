import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import BibliaMesh from './BibliaMesh';
import BibliaGive from './BibliaGive';

const fetchVerse = async () => {
  const res = await base44.functions.invoke('bibliaRandomVerse', {});
  if (!res?.data?.text) throw new Error('no verse');
  return res.data;
};

export default function BibliaFeed({ onHome }) {
  const [verse, setVerse] = useState(null);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const nextRef = useRef(null);
  const busyRef = useRef(false);
  const currentRef = useRef(null);

  const getVerse = useCallback(async (exclude) => {
    // never repeat the current verse back-to-back — draw again (max 3 tries)
    for (let i = 0; i < 3; i++) {
      try {
        const v = await fetchVerse();
        if (v.reference !== exclude) return v;
      } catch {}
    }
    return null;
  }, []);

  // first verse + prefetch the next so swipes feel instant
  useEffect(() => {
    let alive = true;
    (async () => {
      const v = await getVerse(null);
      if (!alive) return;
      if (v) { setVerse(v); currentRef.current = v; } else setError(true);
      setLoading(false);
      if (v) getVerse(v.reference).then((n) => { if (alive) nextRef.current = n; });
    })();
    return () => { alive = false; };
  }, [getVerse]);

  const advance = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const exclude = currentRef.current?.reference;
      let next = nextRef.current;
      if (!next || next.reference === exclude) next = await getVerse(exclude);
      if (next) {
        nextRef.current = null;
        setVerse(next);
        currentRef.current = next;
        setCount((c) => c + 1);
        getVerse(next.reference).then((n) => { nextRef.current = n; });
      } else if (!currentRef.current) {
        setError(true);
      }
    } finally {
      busyRef.current = false;
    }
  }, [getVerse]);

  // advance on wheel / keys / swipe up — tap handled on the stage itself
  useEffect(() => {
    let wheelAt = 0;
    let ty = null;
    const onWheel = (e) => {
      if (e.deltaY < 4) return;
      const now = Date.now();
      if (now - wheelAt < 650) return;
      wheelAt = now;
      advance();
    };
    const onKey = (e) => {
      if (['ArrowDown', ' ', 'Enter', 'PageDown'].includes(e.key)) { e.preventDefault(); advance(); }
    };
    const onTouchStart = (e) => { ty = e.touches[0].clientY; };
    const onTouchEnd = (e) => {
      if (ty == null) return;
      const dy = ty - e.changedTouches[0].clientY;
      ty = null;
      if (dy > 50) advance();
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [advance]);

  // scale verse type by length so even the longest passages fit on any screen
  const verseSize = verse
    ? (verse.text.length > 900 ? 'bl-verse-xs' : verse.text.length > 480 ? 'bl-verse-s' : verse.text.length > 220 ? 'bl-verse-m' : '')
    : '';

  return (
    <motion.section
      className="bl-page relative h-[100dvh] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <BibliaMesh faint />

      <header className="absolute inset-x-0 top-0 z-20 flex items-start justify-between p-5 sm:p-8">
        <div className="flex items-baseline gap-3 sm:gap-4">
          <button onClick={onHome} className="text-[10px] uppercase tracking-[0.3em] opacity-60 transition hover:opacity-100 sm:text-[11px]">
            The Bible
          </button>
          <span className="select-none text-[10px] tracking-[0.25em] opacity-40">no. {count + 1}</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); window.location.href = '/AppStoreV2'; }}
          className="text-[10px] uppercase tracking-[0.3em] opacity-60 transition hover:opacity-100 sm:text-[11px]"
        >
          Exit to Store
        </button>
      </header>

      <div className="relative z-10 flex h-full items-center justify-center overflow-y-auto px-6 py-24" onClick={() => advance()}>
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <span className="bl-node h-2 w-2 rounded-full" style={{ background: '#c5b085', animationDuration: '2s' }} />
            <span className="text-xs tracking-[0.2em] opacity-50">Be still…</span>
          </div>
        ) : error && !verse ? (
          <p className="text-sm tracking-[0.1em] opacity-60">The verses will come. Tap to try again.</p>
        ) : (
          <AnimatePresence mode="wait">
            {verse && (
              <motion.article
                key={`${count}-${verse.reference}`}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.26, ease: 'easeOut' } }}
                exit={{ opacity: 0, y: -18, transition: { duration: 0.18, ease: 'easeIn' } }}
                className="max-w-2xl text-center"
              >
                <p className="mb-8 text-[11px] uppercase tracking-[0.35em] opacity-50 sm:text-xs">{verse.reference}</p>
                <p className={`bl-verse ${verseSize}`}>{verse.text}</p>
              </motion.article>
            )}
          </AnimatePresence>
        )}
      </div>

      <BibliaGive />
    </motion.section>
  );
}