import React from "react";
import { motion } from "framer-motion";
import { Zap, Brain, Briefcase } from "lucide-react";

export default function SkillsPanel({ hardSkills, softSkills, suggestedRoles }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-[#FDFBF7] rounded-[28px] shadow-[0_16px_40px_rgba(124,92,252,0.18)] p-7 md:p-8"
    >
      <h3 className="font-heading text-xl font-semibold text-[#1F1B2E] mb-5">SAE: Skills Extracted From Your Chaos</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-3.5 h-3.5 text-[#7C5CFC]" />
            <span className="text-[10px] font-bold text-[#8B84A3] tracking-[0.2em]">HARD SKILLS</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {hardSkills?.map((s, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full bg-[#7C5CFC]/10 text-xs text-[#5A3FD4] font-semibold font-display">{s}</span>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-3.5 h-3.5 text-[#F96B4C]" />
            <span className="text-[10px] font-bold text-[#8B84A3] tracking-[0.2em]">SOFT SKILLS</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {softSkills?.map((s, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full bg-[#F96B4C]/10 text-xs text-[#E05435] font-semibold font-display">{s}</span>
            ))}
          </div>
        </div>
      </div>
      {suggestedRoles?.length > 0 && (
        <div className="mt-6 pt-5 border-t border-[#EDE9F7]">
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="w-3.5 h-3.5 text-[#8B84A3]" />
            <span className="text-[10px] font-bold text-[#8B84A3] tracking-[0.2em]">SUGGESTED ROLES — NO TOXIC ENVIRONMENTS</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestedRoles.map((r, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full bg-[#F4F1FB] text-xs text-[#3A3450] font-semibold font-display">{r}</span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}