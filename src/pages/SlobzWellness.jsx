import React from "react";
import SlobzNav from "@/components/slobz/SlobzNav";
import SlobzBlobs from "@/components/slobz/SlobzBlobs";
import SlobaCard from "@/components/slobz/SlobaCard";

const CARD_IMG = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/2fdf8782e_generated_image.png";

export default function SlobzWellness() {
  return (
    <div className="min-h-screen bg-[#DED6F2] text-[#1F1B2E] pb-20 font-body relative">
      <SlobzBlobs />
      <div className="max-w-3xl mx-auto px-4 md:px-6 relative z-10">
        <SlobzNav />
        <div className="text-center mb-8 pt-4">
          <img src={CARD_IMG} alt="Sloba Card" className="w-32 h-32 rounded-[28px] object-cover mx-auto mb-5 shadow-[0_16px_40px_rgba(124,92,252,0.3)]" />
          <h1 className="font-display text-3xl md:text-4xl font-black text-[#4A2FA8]">Financial Wellness</h1>
          <p className="text-sm text-[#5A4B8A] mt-2">The Sloba Card — built for recovering slobs, not banks.</p>
        </div>
        <SlobaCard />
      </div>
    </div>
  );
}