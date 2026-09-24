import React, { useState } from 'react';
import HybridLanding from '@/components/hybrid/HybridLanding';
import HybridStudio from '@/components/hybrid/HybridStudio';

const ENTER_KEY = 'hybrid_entered';

export default function Hybrid() {
  const [entered, setEntered] = useState(() => {
    try { return sessionStorage.getItem(ENTER_KEY) === '1'; } catch { return false; }
  });

  const enter = () => {
    try { sessionStorage.setItem(ENTER_KEY, '1'); } catch {}
    setEntered(true);
  };

  const backHome = () => {
    try { sessionStorage.removeItem(ENTER_KEY); } catch {}
    setEntered(false);
  };

  return (
    <div className="hybrid-page min-h-screen bg-background text-foreground">
      {/* Store navigation lives in the landing/studio headers — no floating
          button here, so "Exit to Store" never renders twice. */}
      {entered ? <HybridStudio onHome={backHome} /> : <HybridLanding onEnter={enter} />}
    </div>
  );
}