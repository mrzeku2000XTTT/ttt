import React, { useState } from 'react';
import { KeyRound, Copy, Check, EyeOff } from 'lucide-react';

/** Private key export — the ONLY backup of a local, non-custodial wallet. */
export default function SearchWalletKeyExport({ privateKey }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(privateKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="space-y-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.05] p-3">
      <div className="flex items-center gap-2">
        <KeyRound className="h-3.5 w-3.5 text-amber-300" />
        <p className="text-[12px] font-semibold text-amber-200">Your private key</p>
      </div>
      <p className="text-[11px] leading-relaxed text-white/55">
        This key is the only way to ever move your KAS. We never hold your funds and can never recover it for you.
        Export it and keep it somewhere safe offline — if this device is lost without a backup, your KAS is gone forever.
      </p>
      {revealed ? (
        <>
          <div className="break-all rounded-lg border border-white/10 bg-black/50 p-2.5 font-mono text-[11px] text-amber-100">
            {privateKey}
          </div>
          <div className="flex gap-2">
            <button
              onClick={copy}
              className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.06] text-[11px] font-medium text-white/80 transition-transform active:scale-95"
            >
              {copied ? <><Check className="h-3.5 w-3.5 text-emerald-400" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy key</>}
            </button>
            <button
              onClick={() => setRevealed(false)}
              className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.06] text-[11px] font-medium text-white/60 transition-transform active:scale-95"
            >
              <EyeOff className="h-3.5 w-3.5" /> Hide
            </button>
          </div>
          <p className="text-[10px] text-red-300/80">Never share it — anyone with this key can spend your KAS.</p>
        </>
      ) : (
        <button
          onClick={() => setRevealed(true)}
          className="h-10 w-full rounded-lg border border-amber-400/40 bg-amber-500/15 text-[12px] font-bold text-amber-200 transition-transform active:scale-95"
        >
          Export key
        </button>
      )}
    </div>
  );
}