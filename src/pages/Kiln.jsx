import React, { useState } from 'react';
import { useKcc20Wallet, shortKaspaAddress } from '@/lib/useKcc20Wallet';
import KilnLanding from '@/components/kiln/KilnLanding';
import KilnStudio from '@/components/kiln/KilnStudio';
import '@/components/kiln/kiln.css';

export default function KilnPage() {
  const { address, loading, error, connect } = useKcc20Wallet();
  const [entered, setEntered] = useState(() => sessionStorage.getItem('kiln_entered') === '1');
  const [seed, setSeed] = useState(null);

  // One gate at the door: a seed image waits here until the wallet is connected.
  const enter = (file) => {
    if (file) setSeed(file);
    if (!address) {
      connect();
      return;
    }
    sessionStorage.setItem('kiln_entered', '1');
    setEntered(true);
  };

  const home = () => {
    sessionStorage.removeItem('kiln_entered');
    setEntered(false);
  };

  if (!entered) {
    return (
      <KilnLanding
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

  return <KilnStudio onHome={home} initialFile={seed} />;
}