import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useKcc20Wallet } from '@/lib/useKcc20Wallet';
import KanvasLanding from '@/components/kanvas/KanvasLanding';
import KanvasStudio from '@/components/kanvas/KanvasStudio';
import '@/components/kanvas/kanvas.css';

export default function KanvasPage() {
  const { address, loading, error, connect, disconnect } = useKcc20Wallet();
  const [user, setUser] = useState(null);
  // Landing-first: show the landing on open even if the wallet is already connected
  const [entered, setEntered] = useState(() => sessionStorage.getItem('kanvas_entered') === '1');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
    if (address) base44.auth.updateMe({ created_wallet_address: address }).catch(() => {});
  }, [address]);

  const enter = () => {
    sessionStorage.setItem('kanvas_entered', '1');
    setEntered(true);
  };

  if (!address || !entered) {
    return (
      <KanvasLanding
        hasWallet={!!address}
        onConnect={connect}
        onEnter={enter}
        loading={loading}
        error={error}
        onExit={() => (window.location.href = '/AppStoreV2')}
      />
    );
  }
  return <KanvasStudio address={address} onHome={() => { try { disconnect(); } catch {} }} />;
}