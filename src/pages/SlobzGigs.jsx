import React from "react";
import SlobzNav from "@/components/slobz/SlobzNav";
import SlobzBlobs from "@/components/slobz/SlobzBlobs";
import MomentumTrack from "@/components/slobz/MomentumTrack";

export default function SlobzGigs() {
  return (
    <div className="min-h-screen bg-[#DED6F2] text-[#1F1B2E] pb-20 font-body relative">
      <SlobzBlobs />
      <div className="max-w-3xl mx-auto px-4 md:px-6 relative z-10">
        <SlobzNav />
        <div className="text-center mb-8 pt-4">
          <h1 className="font-display text-3xl md:text-4xl font-black text-[#4A2FA8]">Slobz Momentum Track</h1>
          <p className="text-sm text-[#5A4B8A] mt-2">Low-stress micro-gigs. Instant payout. Zero friction.</p>
        </div>
        <MomentumTrack />
      </div>
    </div>
  );
}