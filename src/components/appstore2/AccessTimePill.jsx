import React from "react";
import { Clock, Wallet } from "lucide-react";
import { useAppStoreAccess, formatRemaining } from "@/lib/useAppStoreAccess";
import { shortKaspaAddress } from "@/lib/useKcc20Wallet";

// Shows the user's remaining App Store access time when they are connected
// to Scorpion AND have a valid (paid) self-send window. Hidden otherwise.
export default function AccessTimePill({ className = "" }) {
  const { address, valid, remaining } = useAppStoreAccess();
  if (!address || !valid) return null;
  return (
    <div
      className={`inline-flex items-center gap-2 h-9 px-3 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 text-[12px] font-semibold ${className}`}
      title={`Scorpion connected · access expires in ${formatRemaining(remaining)}`}
    >
      <Wallet className="w-3.5 h-3.5" />
      <span className="font-mono text-[11px] text-emerald-600 hidden sm:inline">
        {shortKaspaAddress(address)}
      </span>
      <span className="w-px h-3 bg-emerald-200 hidden sm:inline-block" />
      <Clock className="w-3.5 h-3.5" />
      <span className="tabular-nums">{formatRemaining(remaining)}</span>
    </div>
  );
}