import React from "react";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";

export default function SlobScoreCard({ score, roast }) {
  const getColor = (s) => {
    if (s >= 80) return "text-[#C0392B]";
    if (s >= 60) return "text-[#E67E22]";
    if (s >= 40) return "text-[#D4A017]";
    return "text-[#0D5B3A]";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-[0_2px_24px_rgba(0,0,0,0.04)] border border-[#EDE9E1] p-8"
    >
      <div className="flex items-center gap-5 mb-5">
        <div className="w-16 h-16 rounded-2xl bg-[#1A1A1A] flex items-center justify-center flex-shrink-0">
          <Flame className="w-8 h-8 text-[#0D5B3A]" />
        </div>
        <div>
          <div className="text-[10px] text-[#8A857C] font-bold tracking-[0.2em]">SLOB SCORE</div>
          <div className={`font-heading text-5xl font-black ${getColor(score)}`}>
            {score}<span className="text-xl text-[#C4BFB4]">/100</span>
          </div>
        </div>
      </div>
      <div className="bg-[#FBF7F0] rounded-xl p-5 border border-[#F0EDE5]">
        <div className="text-[10px] text-[#8A857C] font-bold tracking-[0.2em] mb-2">THE ROAST</div>
        <p className="text-sm text-[#3A3A37] leading-relaxed whitespace-pre-wrap font-body">{roast}</p>
      </div>
    </motion.div>
  );
}