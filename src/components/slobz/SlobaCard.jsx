import React from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";

const CARD_IMG = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/2fdf8782e_generated_image.png";
const ICON_BOLT = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/59b9b3958_generated_image.png";
const ICON_LOCK = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/ff3973122_generated_image.png";
const ICON_GROWTH = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/66c946f8c_generated_image.png";

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
        <img src={CARD_IMG} alt="Sloba Card" className="w-20 h-20 rounded-2xl object-cover" />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-4 bg-[#241E33] rounded-[18px] p-4">
          <img src={ICON_BOLT} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
          <div>
            <div className="text-sm font-bold text-white font-display">Instant Payouts</div>
            <div className="text-xs text-[#A79FC0] mt-0.5">Micro-gig earnings hit the card immediately. No 3-day delays.</div>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-[#241E33] rounded-[18px] p-4">
          <img src={ICON_LOCK} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
          <div>
            <div className="text-sm font-bold text-white font-display">Behavioral Guardrails</div>
            <div className="text-xs text-[#A79FC0] mt-0.5">Lock food delivery apps & microtransactions during recovery.</div>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-[#241E33] rounded-[18px] p-4">
          <img src={ICON_GROWTH} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
          <div>
            <div className="text-sm font-bold text-white font-display">Get Out Bucket</div>
            <div className="text-xs text-[#A79FC0] mt-0.5">Redirected funds auto-save into your independence fund.</div>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-[#E9E4F5] flex items-center gap-2">
        <Lock className="w-3 h-3 text-[#8B84A3]" />
        <div className="text-xs text-[#8B84A3]">Coming soon to Slobz</div>
      </div>
    </motion.div>
  );
}