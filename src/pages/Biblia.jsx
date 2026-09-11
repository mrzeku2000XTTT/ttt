import React, { useState, useEffect, useCallback } from 'react';
import BibliaLanding from '@/components/biblia/BibliaLanding';
import BibliaFeed from '@/components/biblia/BibliaFeed';
import '@/components/biblia/biblia.css';

// BIBLIA — the whole landing is the invitation; any scroll, swipe, tap or key
// drifts it up and crossfades into the scripture feed. By design it carries no
// buttons and no wallet gate — the verse chooses you.
export default function BibliaPage() {
  const [phase, setPhase] = useState('landing'); // landing → leaving → feed

  const enter = useCallback(() => {
    setPhase((p) => (p === 'landing' ? 'leaving' : p));
  }, []);

  useEffect(() => {
    if (phase === 'leaving') {
      const t = setTimeout(() => setPhase('feed'), 500);
      return () => clearTimeout(t);
    }
  }, [phase]);

  return (
    <div className="min-h-[100dvh] bg-[#f2ede4]">
      {phase !== 'feed' && <BibliaLanding onEnter={enter} leaving={phase === 'leaving'} />}
      {phase === 'feed' && <BibliaFeed onHome={() => setPhase('landing')} />}
    </div>
  );
}