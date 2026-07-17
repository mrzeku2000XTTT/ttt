import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export default function MicroSteps({ steps, title, subtitle }) {
  if (!steps?.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-[0_2px_24px_rgba(0,0,0,0.04)] border border-[#EDE9E1] p-8"
    >
      <div className="flex items-center gap-2 mb-1">
        <CheckCircle2 className="w-4 h-4 text-[#0D5B3A]" />
        <h3 className="font-heading text-lg font-semibold text-[#1A1A1A]">{title || "Executive Function Bypass"}</h3>
      </div>
      {subtitle && <p className="text-sm text-[#8A857C] mb-5">{subtitle}</p>}
      <div className="space-y-2.5">
        {steps.map((s, i) => (
          <div key={i} className="flex items-start gap-4 bg-[#FBF7F0] rounded-xl p-4 border border-[#F0EDE5]">
            <div className="w-7 h-7 rounded-full bg-[#0D5B3A] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              {i + 1}
            </div>
            <div>
              <div className="text-sm font-semibold text-[#1A1A1A]">{s.step}</div>
              {s.description && <div className="text-xs text-[#8A857C] mt-1">{s.description}</div>}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}