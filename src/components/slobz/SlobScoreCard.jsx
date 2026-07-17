import React from "react";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";

export default function SlobScoreCard({ score, roast }) {
  const getColor = (s) => {
    if (s >= 80) return "text-[#F96B4C]";
    if (s >= 60) return "text-[#FF8A6B]";
    if (s >= 40) return "text-[#D4A017]";
    return "text-[#7C5CFC]";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#FDFBF7] rounded-[28px] shadow-[0_16px_40px_rgba(124,92,252,0.18)] p-7 md:p-8"
    >
      <div className="flex items-center gap-5 mb-5">
        <div className="w-16 h-16 rounded-[20px] bg-[#7C5CFC] flex items-center justify-center flex-shrink-0 shadow-[0_8px_20px_rgba(124,92,252,0.4)]">
          <Flame className="w-8 h-8 text-white" />
        </div>
        <div>
          <div className="text-[10px] text-[#8B84A3] font-bold tracking-[0.2em]">SLOB SCORE</div>
          <div className={`font-display text-5xl font-black ${getColor(score)}`}>
            {score}<span className="text-xl text-[#C8C2DC]">/100</span>
          </div>
        </div>
      </div>
      <div className="bg-[#F4F1FB] rounded-[20px] p-5">
        <div className="text-[10px] text-[#7C5CFC] font-bold tracking-[0.2em] mb-2">THE ROAST</div>
        <p className="text-sm text-[#3A3450] leading-relaxed whitespace-pre-wrap font-body">{roast}</p>
      </div>
    </motion.div>
  );
}