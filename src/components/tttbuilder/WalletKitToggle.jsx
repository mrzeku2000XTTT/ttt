import React from "react";
import { Wallet } from "lucide-react";

export default function WalletKitToggle({ value, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      disabled={disabled}
      title="Ship every generated app with the Kaspa wallet protocol (connect, balance, send, receive)"
      className={`flex items-center gap-1.5 h-8 px-3 rounded-lg border text-[11px] font-bold transition-colors disabled:opacity-40 ${
        value
          ? "bg-[#34C759]/10 border-[#34C759]/30 text-[#248A3D]"
          : "bg-white border-black/[0.08] text-[#86868B] hover:text-[#1D1D1F] hover:border-black/[0.12]"
      }`}
    >
      <Wallet className="w-3 h-3" />
      Kaspa Wallet
    </button>
  );
}