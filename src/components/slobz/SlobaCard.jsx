import React from "react";
import { motion } from "framer-motion";
import { CreditCard, Lock, Zap, TrendingUp } from "lucide-react";

export default function SlobaCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 shadow-xl shadow-gray-300/40 text-white overflow-hidden relative"
    >
      <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/10 rounded-full blur-3xl" />
      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-[10px] tracking-[0.3em] text-green-400 font-bold">SLOBA CARD</div>
            <div className="text-lg font-black mt-1">Financial Wellness</div>
          </div>
          <CreditCard className="w-8 h-8 text-green-400" />
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <div className="text-sm font-bold">Instant Payouts</div>
              <div className="text-xs text-gray-400">Micro-gig earnings hit the card immediately. No 3-day delays.</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <div className="text-sm font-bold">Behavioral Guardrails</div>
              <div className="text-xs text-gray-400">Lock food delivery apps & microtransactions during recovery.</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <div className="text-sm font-bold">Get Out Bucket</div>
              <div className="text-xs text-gray-400">Redirected funds auto-save into your independence fund.</div>
            </div>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="text-[10px] text-gray-500">Coming soon to Slobz</div>
        </div>
      </div>
    </motion.div>
  );
}