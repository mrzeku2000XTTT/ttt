import React from "react";
import { motion } from "framer-motion";
import { BadgeCheck } from "lucide-react";
import { CERTIFICATIONS } from "./aboutData";

export default function AboutCertifications() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-emerald-300 text-[11px] font-bold tracking-[0.25em] uppercase mb-2">Verified</p>
        <h2 className="text-2xl sm:text-3xl font-[200] tracking-tight">Certifications & achievements</h2>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {CERTIFICATIONS.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06 }}
            className="relative rounded-2xl bg-white/[0.03] border border-emerald-400/20 p-4 overflow-hidden"
          >
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-emerald-400/10 blur-2xl rounded-full" />
            <div className="relative flex items-start gap-3">
              <BadgeCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-[600] flex items-center gap-2">
                  {c.title}
                  {c.verified && <span className="text-[9px] font-bold text-emerald-300 bg-emerald-400/15 px-1.5 py-0.5 rounded-full tracking-wide">VERIFIED</span>}
                </h3>
                <p className="text-white/40 text-xs mt-0.5 font-[300]">{c.issuer}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}