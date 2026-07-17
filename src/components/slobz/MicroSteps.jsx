import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export default function MicroSteps({ steps, title, subtitle }) {
  if (!steps?.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#FDFBF7] rounded-[28px] shadow-[0_16px_40px_rgba(124,92,252,0.18)] p-7 md:p-8"
    >
      <div className="flex items-center gap-2 mb-1">
        <CheckCircle2 className="w-4 h-4 text-[#7C5CFC]" />
        <h3 className="font-heading text-xl font-semibold text-[#1F1B2E]">{title || "Executive Function Bypass"}</h3>
      </div>
      {subtitle && <p className="text-sm text-[#8B84A3] mb-5">{subtitle}</p>}
      <div className="space-y-2.5">
        {steps.map((s, i) => (
          <div key={i} className="flex items-start gap-4 bg-[#F4F1FB] rounded-[18px] p-4">
            <div className="w-8 h-8 rounded-full bg-[#7C5CFC] text-white text-xs font-display font-extrabold flex items-center justify-center flex-shrink-0 shadow-[0_4px_10px_rgba(124,92,252,0.35)]">
              {i + 1}
            </div>
            <div>
              <div className="text-sm font-bold text-[#1F1B2E] font-display">{s.step}</div>
              {s.description && <div className="text-xs text-[#8B84A3] mt-1">{s.description}</div>}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}