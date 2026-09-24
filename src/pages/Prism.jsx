import React, { useState } from 'react';
import '@/components/prism/prism.css';
import PrismLanding from '@/components/prism/PrismLanding';
import PrismStudio from '@/components/prism/PrismStudio';

const ENTERED_KEY = 'prism_entered';

/**
 * Landing first, always — the studio only opens once the visitor has chosen to
 * enter, and that choice lasts for the session.
 */
export default function Prism() {
  const [entered, setEntered] = useState(() => {
    try {
      return sessionStorage.getItem(ENTERED_KEY) === '1';
    } catch {
      return false;
    }
  });

  const enter = () => {
    try { sessionStorage.setItem(ENTERED_KEY, '1'); } catch {}
    setEntered(true);
  };

  const home = () => {
    try { sessionStorage.removeItem(ENTERED_KEY); } catch {}
    setEntered(false);
  };

  return (
    <div className="prism-page min-h-screen bg-white">
      {entered ? <PrismStudio onHome={home} /> : <PrismLanding onEnter={enter} />}
    </div>
  );
}