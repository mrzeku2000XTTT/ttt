import React from "react";
import { motion } from "framer-motion";
import { CreditCard, Lock, Zap, TrendingUp } from "lucide-react";

export default function SlobaCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-8 md:p-10 shadow-[0_4px_32px_rgba(0,0,0,0.15)] text-white overflow-hidden relative"
      style={{ background: 'linear-gradient(135deg, #101C1A 0%, #1D2625 100%)' }}
    >
      <div className="relative">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-[10px] tracking-[0.3em] text-[#3DDC84] font-bold">SLOBA CARD</div>
            <div className="font-heading text-3xl font-medium text-white mt-2">Financial Wellness</div>
          </div>
          <CreditCard className="w-8 h-8 text-[#3DDC84]" />
        </div>
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-[#3DDC84]/15 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-[#3DDC84]" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Instant Payouts</div>
              <div className="text-xs text-[#8A9C92] mt-0.5">Micro-gig earnings hit the card immediately. No 3-day delays.</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-[#3DDC84]/15 flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4 text-[#3DDC84]" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Behavioral Guardrails</div>
              <div className="text-xs text-[#8A9C92] mt-0.5">Lock food delivery apps & microtransactions during recovery.</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-[#3DDC84]/15 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-[#3DDC84]" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Get Out Bucket</div>
              <div className="text-xs text-[#8A9C92] mt-0.5">Redirected funds auto-save into your independence fund.</div>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t border-white/10">
          <div className="text-[10px] text-[#5A6C62]">Coming soon to Slobz</div>
        </div>
      </div>
    </motion.div>
  );
}