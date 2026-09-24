import React, { useState } from 'react';
import MorphLanding from '@/components/morph/MorphLanding';
import MorphStudioPage from '@/pages/MorphStudio';

const ENTER_KEY = 'morph_entered';

export default function Morph() {
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

  return entered
    ? <MorphStudioPage onHome={backHome} />
    : <MorphLanding onEnter={enter} />;
}