import React from "react";
import { motion } from "framer-motion";
import { Zap, Brain, Briefcase } from "lucide-react";

export default function SkillsPanel({ hardSkills, softSkills, suggestedRoles }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-2xl shadow-[0_2px_24px_rgba(0,0,0,0.04)] border border-[#EDE9E1] p-8"
    >
      <h3 className="font-heading text-lg font-semibold text-[#1A1A1A] mb-5">SAE: Skills Extracted From Your Chaos</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-3.5 h-3.5 text-[#0D5B3A]" />
            <span className="text-[10px] font-bold text-[#8A857C] tracking-[0.2em]">HARD SKILLS</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {hardSkills?.map((s, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full bg-[#0D5B3A]/8 border border-[#0D5B3A]/15 text-xs text-[#0D5B3A] font-medium">{s}</span>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-3.5 h-3.5 text-[#2D5F8A]" />
            <span className="text-[10px] font-bold text-[#8A857C] tracking-[0.2em]">SOFT SKILLS</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {softSkills?.map((s, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full bg-[#2D5F8A]/8 border border-[#2D5F8A]/15 text-xs text-[#2D5F8A] font-medium">{s}</span>
            ))}
          </div>
        </div>
      </div>
      {suggestedRoles?.length > 0 && (
        <div className="mt-6 pt-5 border-t border-[#F0EDE5]">
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="w-3.5 h-3.5 text-[#8A857C]" />
            <span className="text-[10px] font-bold text-[#8A857C] tracking-[0.2em]">SUGGESTED ROLES — NO TOXIC ENVIRONMENTS</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestedRoles.map((r, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full bg-[#F5F2EB] border border-[#E8E4DD] text-xs text-[#3A3A37] font-medium">{r}</span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}