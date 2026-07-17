import React from "react";
import { motion } from "framer-motion";
import { Zap, Brain, Briefcase } from "lucide-react";

export default function SkillsPanel({ hardSkills, softSkills, suggestedRoles }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-xl shadow-gray-200/40"
    >
      <h3 className="text-sm font-bold text-gray-900 mb-4">SAE: SKILLS EXTRACTED FROM YOUR CHAOS</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-3.5 h-3.5 text-green-600" />
            <span className="text-xs font-semibold text-gray-700">HARD SKILLS</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {hardSkills?.map((s, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-xs text-green-700 font-medium">{s}</span>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs font-semibold text-gray-700">SOFT SKILLS</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {softSkills?.map((s, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs text-blue-700 font-medium">{s}</span>
            ))}
          </div>
        </div>
      </div>
      {suggestedRoles?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-3.5 h-3.5 text-gray-600" />
            <span className="text-xs font-semibold text-gray-700">SUGGESTED ROLES (NO TOXIC ENVIRONMENTS)</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestedRoles.map((r, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs text-gray-700 font-medium">{r}</span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}