import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, ArrowRight } from "lucide-react";
import SlobzNav from "@/components/slobz/SlobzNav";
import SlobzBlobs from "@/components/slobz/SlobzBlobs";
import MomentumTrack from "@/components/slobz/MomentumTrack";
import SlobzAskButton from "@/components/slobz/SlobzAskButton";

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
        <Link
          to="/SlobzMarket"
          className="flex items-center gap-4 bg-[#FDFBF7] rounded-[28px] shadow-[0_16px_40px_rgba(124,92,252,0.18)] p-5 mb-6 hover:bg-white transition-colors"
        >
          <div className="w-11 h-11 rounded-[16px] bg-[#7C5CFC] flex items-center justify-center flex-shrink-0 shadow-[0_6px_14px_rgba(124,92,252,0.35)]">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-[#1F1B2E] font-display">Covenant Escrow Market</div>
            <div className="text-xs text-[#7A7290] mt-0.5">Real KAS locked on-chain per gig — work checked, funds released automatically.</div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#7C5CFC] flex-shrink-0" />
        </Link>
        <MomentumTrack />
      </div>
      <SlobzAskButton />
    </div>
  );
}