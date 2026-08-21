import React from "react";
import { Link } from "react-router-dom";
import { Bot, Zap, ShieldCheck } from "lucide-react";
import ProductivityChat from "@/components/productivity/ProductivityChat";

export default function Productivity() {
  return (
    <div className="min-h-screen bg-[#f5f6f8] text-slate-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Top bar — TTT logo back to App Store */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/AppStoreV2" className="flex items-center gap-2 group">
            <span className="text-slate-900 font-black text-2xl tracking-tight group-hover:opacity-70 transition">TTT</span>
          </Link>
        </div>

        {/* Hero */}
        <div className="flex items-start gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-400 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
              Better Ideas AI <Zap className="w-5 h-5 text-amber-500" />
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              A productivity coach that drops real tools into chat. Pay per reply in KAS on Kaspa L1.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[11px] text-emerald-700 font-medium">AWA x402 · L1</span>
          </div>
        </div>

        {/* Chat card */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5">
          <ProductivityChat />
        </div>
      </div>
    </div>
  );
}