import React, { useState } from 'react';
import BackToStore from '@/components/BackToStore';
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
      <BackToStore />
      {entered ? <HybridStudio onHome={backHome} /> : <HybridLanding onEnter={enter} />}
    </div>
  );
}