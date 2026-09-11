import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useKcc20Wallet } from '@/lib/useKcc20Wallet';
import CAMLanding from '@/components/cam/CAMLanding';
import CAMStudio from '@/components/cam/CAMStudio';
import '@/components/cam/cam.css';

export default function CAMPage() {
  const { address, loading, error, connect } = useKcc20Wallet();
  const [user, setUser] = useState(null);
  // Landing-first: show the landing on open even if the wallet is already connected
  const [entered, setEntered] = useState(() => sessionStorage.getItem('cam_entered') === '1');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
    if (address) base44.auth.updateMe({ created_wallet_address: address }).catch(() => {});
  }, [address]);

  const enter = () => {
    sessionStorage.setItem('cam_entered', '1');
    setEntered(true);
  };
  const home = () => {
    sessionStorage.removeItem('cam_entered');
    setEntered(false);
  };

  if (!address || !entered) {
    return (
      <CAMLanding
        hasWallet={!!address}
        onConnect={connect}
        onEnter={enter}
        loading={loading}
        error={error}
        onExit={() => (window.location.href = '/AppStoreV2')}
      />
    );
  }
  return <CAMStudio address={address} onHome={home} />;
}