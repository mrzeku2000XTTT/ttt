import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export default function MicroSteps({ steps, title, subtitle }) {
  if (!steps?.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-xl shadow-gray-200/40"
    >
      <div className="flex items-center gap-2 mb-1">
        <CheckCircle2 className="w-4 h-4 text-green-600" />
        <h3 className="text-sm font-bold text-gray-900">{title || "EXECUTIVE FUNCTION BYPASS"}</h3>
      </div>
      {subtitle && <p className="text-xs text-gray-500 mb-4">{subtitle}</p>}
      <div className="space-y-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
            <div className="w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              {i + 1}
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-800">{s.step}</div>
              {s.description && <div className="text-xs text-gray-500 mt-0.5">{s.description}</div>}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}