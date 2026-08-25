import React, { useState } from "react";
import { X, Lock, Loader2 } from "lucide-react";
import PinPad from "@/components/wallet/PinPad";

// Local PIN gate before triggering a KCC20 wallet signing call.
// The KCC20 wallet manages its own key/PIN internally; this is a user-facing
// confirmation step so the user re-enters their wallet PIN before we ask
// the wallet to sign + broadcast.
export default function Kcc20PinModal({ open, onClose, onSubmit, title = "Enter wallet PIN", subtitle = "Confirm with your KCC20 wallet PIN to sign this transaction" }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (!open) return null;

  const handlePin = async (pin) => {
    setErr("");
    setBusy(true);
    try {
      await onSubmit(pin);
    } catch (e) {
      setErr(e?.message || "Signing failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-3xl bg-zinc-950 ring-1 ring-white/10 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 text-white">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 ring-1 ring-cyan-400/40 flex items-center justify-center">
              <Lock className="w-4 h-4 text-cyan-300" />
            </div>
            <span className="text-[15px] font-semibold">{title}</span>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-white/50 text-xs mb-5">{subtitle}</p>

        {busy ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 className="w-7 h-7 text-cyan-400 animate-spin" />
            <span className="text-white/60 text-sm">Asking KCC20 to sign…</span>
          </div>
        ) : (
          <PinPad onComplete={handlePin} />
        )}

        {err && (
          <div className="mt-4 text-center text-red-400 text-xs">{err}</div>
        )}
      </div>
    </div>
  );
}