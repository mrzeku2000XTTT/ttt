import React, { useState } from 'react';
import { useKcc20Wallet, shortKaspaAddress } from '@/lib/useKcc20Wallet';
import GlyphLanding from '@/components/glyph/GlyphLanding';
import GlyphStudio from '@/components/glyph/GlyphStudio';
import '@/components/glyph/glyph.css';

export default function GlyphPage() {
  const { address, loading, error, connect } = useKcc20Wallet();
  const [entered, setEntered] = useState(() => sessionStorage.getItem('glyph_entered') === '1');
  const [seed, setSeed] = useState(null);

  // One gate at the door: an image dropped on the landing waits here until the
  // wallet is connected, then opens straight into the studio.
  const enter = (file) => {
    if (file) setSeed(file);
    if (!address) {
      connect();
      return;
    }
    sessionStorage.setItem('glyph_entered', '1');
    setEntered(true);
  };

  const home = () => {
    sessionStorage.removeItem('glyph_entered');
    setEntered(false);
  };

  if (!entered) {
    return (
      <GlyphLanding
        hasWallet={!!address}
        wallet={address ? shortKaspaAddress(address) : null}
        loading={loading}
        error={error}
        onConnect={connect}
        onEnter={() => enter()}
        onSeed={enter}
        onExit={() => {
          window.location.href = '/AppStoreV2';
        }}
      />
    );
  }

  return <GlyphStudio onHome={home} initialFile={seed} />;
}