import React from "react";
import { ShieldCheck } from "lucide-react";
import KUSDMintForm from "@/components/kasdollar/KUSDMintForm";
import KUSDRedeemForm from "@/components/kasdollar/KUSDRedeemForm";
import VaultHealthDashboard from "@/components/kasdollar/VaultHealthDashboard";

export default function KASDollarPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">KAS Dollar — Covenant Stablecoin</h1>
          <p className="text-zinc-400 mt-3">KAS-pegged stablecoin for fixed-USD AI billing</p>
        </div>

        {/* Section A — What is KAS Dollar */}
        <div className="bg-zinc-900/80 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> What is KAS Dollar?
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            KAS Dollar (kUSD) is a Kaspa-native stablecoin backed by KAS collateral in a covenant vault.
            The peg is maintained by a ZK-verified price oracle (Pyth/Wormhole KAS/USD feed) and automated
            liquidation via CLTV sentinel. <span className="text-white font-semibold">1 kUSD = $1 USD.</span>
          </p>
        </div>

        {/* Sections B + C — Mint & Redeem */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <KUSDMintForm />
          <KUSDRedeemForm />
        </div>

        {/* Section D — Vault Health */}
        <VaultHealthDashboard />
      </div>
    </div>
  );
}