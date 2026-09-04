import React, { useState } from 'react';
import BackToStore from '@/components/BackToStore';
import HyperLanding from '@/components/hyper/HyperLanding';
import HyperStudio from '@/components/hyper/HyperStudio';

export default function Hyper() {
  const [view, setView] = useState('landing');

  return (
    <div className="min-h-screen bg-black text-white">
      <BackToStore />
      {view === 'landing' ? (
        <HyperLanding onEnterStudio={() => setView('studio')} />
      ) : (
        <HyperStudio onBack={() => setView('landing')} />
      )}
    </div>
  );
}