import React, { useState, useEffect } from "react";
import { X, ShieldCheck, Loader2, Fingerprint } from "lucide-react";
import PinPad from "@/components/wallet/PinPad";
import { verifyStoredPin, biometricAvailable, verifyBiometric } from "@/components/wallet/walletLock";

export default function ProductivityPinModal({ amount, onVerified, onClose }) {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [bio, setBio] = useState(false);

  useEffect(() => {
    let alive = true;
    biometricAvailable().then((ok) => { if (alive) setBio(ok); });
    return () => { alive = false; };
  }, []);

  const tryBio = async () => {
    setErr("");
    try {
      await verifyBiometric();
      onVerified();
    } catch {
      setErr("Biometric verification failed — use your PIN.");
    }
  };

  const handle = async (pin) => {
    setBusy(true);
    setErr("");
    const ok = await verifyStoredPin(pin);
    setBusy(false);
    if (ok) onVerified();
    else setErr("Wrong PIN. Try again.");
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-[#44464c] bg-[#171717] p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#ff9d7d]" />
            <span className="text-sm font-semibold text-white">Authorize payment</span>
          </div>
          <button onClick={onClose} className="text-[#a0a0a0] hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-[#a0a0a0] mb-5 text-center">
          Enter your wallet PIN to send {amount} KAS from your wallet.
        </p>
        {busy ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-[#ff9d7d] animate-spin" />
          </div>
        ) : (
          <PinPad onComplete={handle} />
        )}
        {err && <p className="text-xs text-red-400 text-center mt-3">{err}</p>}
        {bio && !busy && (
          <button onClick={tryBio} className="w-full mt-4 h-9 rounded-lg border border-[#44464c] text-[#a0a0a0] hover:text-white text-xs flex items-center justify-center gap-1.5 transition">
            <Fingerprint className="w-3.5 h-3.5" /> Use biometric
          </button>
        )}
      </div>
    </div>
  );
}