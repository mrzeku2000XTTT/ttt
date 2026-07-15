import React from "react";
import { TIERS } from "./kccNftTiers";

export default function KCCNftPreviewCard({ address, name, collection, tierId }) {
  const tier = TIERS.find(t => t.id === tierId) || TIERS[0];
  const truncated = address
    ? `${address.slice(0, 14)}...${address.slice(-6)}`
    : "kaspa:q...";

  return (
    <div className="rounded-3xl bg-zinc-900/80 border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.15)] p-6 backdrop-blur-xl">
      <div className="aspect-square rounded-2xl bg-black border border-white/10 overflow-hidden mb-5">
        <img
          src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/37ba9556a_generated_image.png"
          alt="KCC NFT artwork"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-white font-bold text-lg">{name || "Unnamed NFT"}</span>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${tier.badge}`}>{tier.name}</span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-white/40">Collection</span>
          <span className="text-white/80 font-medium">{collection}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/40">NFT ID</span>
          <span className="text-white/80 font-mono">#???</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/40">Owner</span>
          <span className="text-white/80 font-mono text-xs">{truncated}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-white/40">Status</span>
          <span className="text-amber-300 text-xs font-semibold bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">Pending Mint</span>
        </div>
      </div>
    </div>
  );
}