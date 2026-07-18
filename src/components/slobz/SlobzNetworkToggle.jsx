import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useSlobzNetwork, setSlobzNetwork } from "@/components/slobz/slobzNetwork";

export default function SlobzNetworkToggle() {
  const network = useSlobzNetwork();
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    base44.auth
      .me()
      .then((u) => setIsAdmin(u?.role === "admin"))
      .catch(() => setIsAdmin(false));
  }, []);

  // Non-admins are locked to testnet
  useEffect(() => {
    if (isAdmin === false && network === "mainnet") setSlobzNetwork("testnet");
  }, [isAdmin, network]);

  const btn = (active) =>
    `px-3 py-1.5 rounded-full text-[10px] font-display font-extrabold transition-colors ${
      active ? "bg-[#7C5CFC] text-white shadow-[0_4px_12px_rgba(124,92,252,0.4)]" : "text-[#5A4B8A] hover:bg-[#EBE6F8]"
    }`;

  if (isAdmin !== true) {
    return (
      <div className="flex items-center gap-1 bg-[#FDFBF7] rounded-full p-1 shadow-[0_6px_16px_rgba(124,92,252,0.18)]">
        <span className="px-3 py-1.5 rounded-full text-[10px] font-display font-extrabold bg-[#7C5CFC] text-white shadow-[0_4px_12px_rgba(124,92,252,0.4)] flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#5CE1A4] animate-pulse" />
          TESTNET
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 bg-[#FDFBF7] rounded-full p-1 shadow-[0_6px_16px_rgba(124,92,252,0.18)]">
      <button onClick={() => setSlobzNetwork("mainnet")} className={btn(network === "mainnet")}>
        MAINNET
      </button>
      <button onClick={() => setSlobzNetwork("testnet")} className={btn(network === "testnet")}>
        <span className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${network === "testnet" ? "bg-[#5CE1A4] animate-pulse" : "bg-[#B9A8F5]"}`} />
          TESTNET
        </span>
      </button>
    </div>
  );
}