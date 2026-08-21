import React from "react";
import { Link } from "react-router-dom";
import { Zap, ShieldCheck } from "lucide-react";
import ProductivityChat from "@/components/productivity/ProductivityChat";

const MASCOT_URL = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/ea557eac9_image.png";

export default function Productivity() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-[#f0f0f0] relative overflow-hidden">
      {/* soft coral ambient glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#ff9d7d]/10 blur-[120px]" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Top bar — TTT logo back to App Store */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/AppStoreV2" className="flex items-center gap-2 group">
            <span className="text-white font-black text-2xl tracking-tight group-hover:opacity-70 transition">TTT</span>
          </Link>
        </div>

        {/* Hero */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0 border border-[#ff9d7d]/40 shadow-[0_0_24px_rgba(255,157,125,0.45)] bg-[#1f2024]">
            <img src={MASCOT_URL} alt="Better Ideas AI" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              Better Ideas AI <Zap className="w-5 h-5 text-[#ff9d7d]" />
            </h1>
            <p className="text-sm text-[#a0a0a0] mt-1">
              A productivity coach that drops real tools into chat. Pay per reply in KAS on Kaspa L1.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-transparent border border-[#ff9d7d]/50">
            <ShieldCheck className="w-3.5 h-3.5 text-[#ff9d7d]" />
            <span className="text-[11px] text-white font-medium">AWA x402 · L1</span>
          </div>
        </div>

        {/* Chat card — glass */}
        <div className="rounded-3xl border border-[#44464c] bg-[#25262a]/70 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.4)] p-4 sm:p-5">
          <ProductivityChat />
        </div>
      </div>
    </div>
  );
}