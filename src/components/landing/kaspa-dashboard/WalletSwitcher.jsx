import React from "react";
import { Chrome, Shield } from "lucide-react";
import { IOS_FONT } from "./shared";

export default function WalletSwitcher({ activeWallet, onChange, kaswareAddress, tttAddress }) {
  const options = [
    { id: "kasware", label: "Kasware", icon: Chrome, available: !!kaswareAddress },
    { id: "ttt", label: "TTT Wallet", icon: Shield, available: !!tttAddress },
  ];

  return (
    <div className="flex items-center gap-1 p-1 rounded-full"
      style={{ background: "rgba(28,28,30,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}>
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = activeWallet === opt.id;
        return (
          <button key={opt.id} onClick={() => opt.available && onChange(opt.id)}
            disabled={!opt.available}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              isActive ? "text-white" : opt.available ? "text-white/40 hover:text-white/70" : "text-white/20"
            }`}
            style={{ background: isActive ? "#0A84FF" : "transparent" }}>
            <Icon className="w-3 h-3" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}