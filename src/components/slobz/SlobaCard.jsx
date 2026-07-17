import React from "react";
import { motion } from "framer-motion";
import { CreditCard, Lock, Zap, TrendingUp } from "lucide-react";

export default function SlobaCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#FDFBF7] rounded-[28px] shadow-[0_16px_40px_rgba(124,92,252,0.18)] p-7 md:p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-[10px] tracking-[0.3em] text-[#7C5CFC] font-bold">SLOBA CARD</div>
          <div className="font-heading text-2xl font-semibold text-[#1F1B2E] mt-1.5">Financial Wellness</div>
        </div>
        <div className="w-12 h-9 rounded-lg bg-[#E9E4F5] border-2 border-[#7C5CFC]/30 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-[#7C5CFC]" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-4 bg-[#241E33] rounded-[18px] p-4">
          <div className="w-10 h-10 rounded-xl bg-[#7C5CFC] flex items-center justify-center flex-shrink-0 shadow-[0_4px_12px_rgba(124,92,252,0.5)]">
            <Zap className="w-4.5 h-4.5 w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white font-display">Instant Payouts</div>
            <div className="text-xs text-[#A79FC0] mt-0.5">Micro-gig earnings hit the card immediately. No 3-day delays.</div>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-[#241E33] rounded-[18px] p-4">
          <div className="w-10 h-10 rounded-xl bg-[#7C5CFC] flex items-center justify-center flex-shrink-0 shadow-[0_4px_12px_rgba(124,92,252,0.5)]">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white font-display">Behavioral Guardrails</div>
            <div className="text-xs text-[#A79FC0] mt-0.5">Lock food delivery apps & microtransactions during recovery.</div>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-[#241E33] rounded-[18px] p-4">
          <div className="w-10 h-10 rounded-xl bg-[#7C5CFC] flex items-center justify-center flex-shrink-0 shadow-[0_4px_12px_rgba(124,92,252,0.5)]">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white font-display">Get Out Bucket</div>
            <div className="text-xs text-[#A79FC0] mt-0.5">Redirected funds auto-save into your independence fund.</div>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-[#E9E4F5]">
        <div className="text-xs text-[#8B84A3]">Coming soon to Slobz</div>
      </div>
    </motion.div>
  );
}