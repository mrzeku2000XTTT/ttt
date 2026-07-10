import React, { useState, useEffect } from 'react';
import { Lock, ScanFace, ShieldCheck } from 'lucide-react';
import PinPad from '@/components/wallet/PinPad';
import {
  hashPin, getStoredPinHash, storePinHash, getBioCredId,
  isUnlocked, markUnlocked, biometricAvailable, registerBiometric, verifyBiometric,
} from '@/components/wallet/walletLock';

export default function WalletLockGate({ children }) {
  const [stage, setStage] = useState(() =>
    isUnlocked() ? 'open' : getStoredPinHash() ? 'locked' : 'setup'
  );
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [bioReady, setBioReady] = useState(false);

  useEffect(() => {
    biometricAvailable().then(setBioReady);
  }, []);

  if (stage === 'open') return children;

  const unlock = () => {
    markUnlocked();
    setStage('open');
  };

  const handlePin = async (pin) => {
    setError('');
    if (stage === 'locked') {
      const ok = (await hashPin(pin)) === getStoredPinHash();
      if (ok) unlock();
      else setError('Wrong PIN — try again');
    } else if (stage === 'setup') {
      setFirstPin(pin);
      setStage('confirm');
    } else if (stage === 'confirm') {
      if (pin === firstPin) {
        storePinHash(await hashPin(pin));
        if (bioReady) setStage('bio');
        else unlock();
      } else {
        setError('PINs did not match — start over');
        setFirstPin('');
        setStage('setup');
      }
    }
  };

  const tryBiometric = async () => {
    setError('');
    setBusy(true);
    try {
      await verifyBiometric();
      unlock();
    } catch {
      setError('Face ID failed — use your PIN');
    }
    setBusy(false);
  };

  const enableBiometric = async () => {
    setError('');
    setBusy(true);
    try {
      await registerBiometric();
      unlock();
    } catch {
      setError('Could not enable Face ID — you can still use your PIN');
    }
    setBusy(false);
  };

  const titles = {
    locked: 'Wallet Locked',
    setup: 'Create Wallet PIN',
    confirm: 'Confirm Your PIN',
    bio: 'Enable Face ID',
  };
  const subtitles = {
    locked: 'Enter your PIN to access your wallet',
    setup: 'Set a 6-digit PIN to protect your wallet',
    confirm: 'Re-enter the same 6-digit PIN',
    bio: 'Unlock your wallet instantly with Face ID or fingerprint',
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black flex flex-col items-center justify-center px-6 overflow-y-auto py-10">
      <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-5">
        {stage === 'bio' ? (
          <ScanFace className="w-8 h-8 text-cyan-400" />
        ) : (
          <Lock className="w-8 h-8 text-cyan-400" />
        )}
      </div>
      <h1 className="text-white text-xl font-bold mb-1">{titles[stage]}</h1>
      <p className="text-white/50 text-sm mb-2 text-center">{subtitles[stage]}</p>
      <p className="text-red-400 text-sm h-5 mb-4 text-center">{error}</p>

      {stage === 'bio' ? (
        <div className="w-full max-w-[280px] space-y-3">
          <button
            onClick={enableBiometric}
            disabled={busy}
            className="w-full h-14 rounded-2xl bg-cyan-500 text-black font-bold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
          >
            <ScanFace className="w-5 h-5" />
            {busy ? 'Waiting…' : 'Enable Face ID'}
          </button>
          <button
            onClick={unlock}
            className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 text-white/70 font-medium active:scale-95 transition-all"
          >
            Skip — use PIN only
          </button>
        </div>
      ) : (
        <>
          {stage === 'locked' && bioReady && getBioCredId() && (
            <button
              onClick={tryBiometric}
              disabled={busy}
              className="mb-6 flex items-center gap-2 px-6 py-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold active:scale-95 transition-all disabled:opacity-50"
            >
              <ScanFace className="w-5 h-5" />
              {busy ? 'Verifying…' : 'Unlock with Face ID'}
            </button>
          )}
          <PinPad key={stage} onComplete={handlePin} disabled={busy} />
        </>
      )}

      <div className="flex items-center gap-1.5 mt-8 text-white/30 text-xs">
        <ShieldCheck className="w-3.5 h-3.5" />
        Secured on this device
      </div>
    </div>
  );
}