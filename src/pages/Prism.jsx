import React, { useState } from 'react';
import '@/components/prism/prism.css';
import PrismLanding from '@/components/prism/PrismLanding';
import PrismStudio from '@/components/prism/PrismStudio';

const ENTERED_KEY = 'prism_entered';

/**
 * Landing first, always — the studio only opens once the visitor has chosen to
 * enter, and that choice lasts for the session. A file dropped on the landing is
 * handed straight to the studio.
 */
export default function Prism() {
  const [entered, setEntered] = useState(() => {
    try {
      return sessionStorage.getItem(ENTERED_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [pending, setPending] = useState(null);

  const enter = (file) => {
    try { sessionStorage.setItem(ENTERED_KEY, '1'); } catch {}
    setPending(file || null);
    setEntered(true);
  };

  const home = () => {
    try { sessionStorage.removeItem(ENTERED_KEY); } catch {}
    setPending(null);
    setEntered(false);
  };

  return (
    <div className="prism-page min-h-screen bg-white">
      {entered ? <PrismStudio onHome={home} initialFile={pending} /> : <PrismLanding onEnter={enter} />}
    </div>
  );
}