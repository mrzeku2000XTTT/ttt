import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ScanFace, ShieldCheck, ArrowLeft, Wallet } from 'lucide-react';
import PinPad from '@/components/wallet/PinPad';
import WalletBgVideo from '@/components/wallet/WalletBgVideo';
import {
  hashPin, getStoredPinHash, storePinHash, getBioCredId, verifyStoredPin,
  isUnlocked, markUnlocked, biometricAvailable, registerBiometric, verifyBiometric,
  clearWalletLock,
} from '@/components/wallet/walletLock';

export default function WalletLockGate({ children }) {
  const navigate = useNavigate();
  const [stage, setStage] = useState(() =>
    isUnlocked() ? 'open' : getStoredPinHash() ? 'locked' : 'intro'
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
      // Accept both hash formats — the tip-wallet flow stores an unsalted hash
      // in the same key, and clobbering it here was "forgetting" users' PINs.
      const ok = await verifyStoredPin(pin);
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
    intro: 'Secure Your Wallet',
    locked: 'Wallet Locked',
    setup: 'Create Wallet PIN',
    confirm: 'Confirm Your PIN',
    bio: 'Enable Face ID',
  };
  const subtitles = {
    intro: 'First time here — set up a PIN and Face ID to protect your wallet',
    locked: 'Enter your PIN to access your wallet',
    setup: 'Set a 6-digit PIN to protect your wallet',
    confirm: 'Re-enter the same 6-digit PIN',
    bio: 'Unlock your wallet instantly with Face ID or fingerprint',
  };

  const goBack = () => {
    if (stage === 'confirm') { setFirstPin(''); setError(''); setStage('setup'); return; }
    if (stage === 'setup') { setError(''); setStage('intro'); return; }
    navigate(-1);
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black flex flex-col items-center justify-center px-6 overflow-y-auto py-10">
      <WalletBgVideo />
      <button
        onClick={goBack}
        className="fixed top-4 left-4 z-20 flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-white text-sm font-semibold active:scale-95 transition-all touch-manipulation"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>
      <div className="relative z-10 flex flex-col items-center w-full">
      <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-5">
        {stage === 'bio' ? (
          <ScanFace className="w-8 h-8 text-cyan-400" />
        ) : stage === 'intro' ? (
          <Wallet className="w-8 h-8 text-cyan-400" />
        ) : (
          <Lock className="w-8 h-8 text-cyan-400" />
        )}
      </div>
      <h1 className="text-white text-xl font-bold mb-1">{titles[stage]}</h1>
      <p className="text-white/50 text-sm mb-2 text-center">{subtitles[stage]}</p>
      <p className="text-red-400 text-sm h-5 mb-4 text-center">{error}</p>

      {stage === 'intro' ? (
        <div className="w-full max-w-[280px] space-y-3">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3 mb-2">
            <div className="flex items-center gap-3 text-white/70 text-sm">
              <Lock className="w-4 h-4 text-cyan-400 flex-shrink-0" /> 6-digit PIN protection
            </div>
            <div className="flex items-center gap-3 text-white/70 text-sm">
              <ScanFace className="w-4 h-4 text-cyan-400 flex-shrink-0" /> Face ID / fingerprint unlock
            </div>
            <div className="flex items-center gap-3 text-white/70 text-sm">
              <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" /> Stored only on this device
            </div>
          </div>
          <button
            onClick={() => setStage('setup')}
            className="w-full h-14 rounded-2xl bg-cyan-500 text-black font-bold active:scale-95 transition-all touch-manipulation"
          >
            Set Up Wallet PIN
          </button>
        </div>
      ) : stage === 'bio' ? (
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
          {stage === 'locked' && (
            <button
              onClick={() => {
                if (window.confirm('Reset your wallet PIN? You will set a new PIN now. Your wallet funds and seed phrases are NOT affected.')) {
                  clearWalletLock();
                  setError('');
                  setStage('setup');
                }
              }}
              className="mt-6 text-cyan-400/70 text-sm underline underline-offset-4 active:scale-95 transition-all touch-manipulation"
            >
              Forgot PIN? Reset it
            </button>
          )}
        </>
      )}

      <div className="flex items-center gap-1.5 mt-8 text-white/30 text-xs">
        <ShieldCheck className="w-3.5 h-3.5" />
        Secured on this device
      </div>
      </div>
    </div>
  );
}