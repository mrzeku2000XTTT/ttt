import React from "react";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";

export default function SlobScoreCard({ score, roast }) {
  const getColor = (s) => {
    if (s >= 80) return "text-red-500";
    if (s >= 60) return "text-orange-500";
    if (s >= 40) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-xl shadow-gray-200/40"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-2xl bg-gray-900 flex items-center justify-center">
          <Flame className="w-8 h-8 text-green-400" />
        </div>
        <div>
          <div className="text-xs text-gray-500 font-semibold tracking-wide">SLOB SCORE</div>
          <div className={`text-4xl font-black ${getColor(score)}`}>
            {score}<span className="text-lg text-gray-400">/100</span>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 rounded-2xl p-4">
        <div className="text-xs text-gray-500 font-semibold mb-2">THE ROAST</div>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{roast}</p>
      </div>
    </motion.div>
  );
}