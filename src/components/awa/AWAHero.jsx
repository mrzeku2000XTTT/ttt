import React from "react";
import { motion } from "framer-motion";

export default function AWAHero() {
  return (
    <div className="text-center pt-16 pb-10 px-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[10px] font-bold tracking-[0.3em] mb-5">
          SECTOR 03 · HTTP 402 · KASPA L1
        </div>
        <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tight">
          AWA
        </h1>
        <p className="text-emerald-300/80 font-bold tracking-[0.25em] text-xs sm:text-sm mt-2 uppercase">
          Autonomous World of Agents
        </p>
        <p className="text-white/50 text-sm max-w-2xl mx-auto mt-5 leading-relaxed">
          The first x402 payment lane on Kaspa. Every AI service here answers with
          <span className="text-emerald-300 font-mono"> HTTP 402 Payment Required</span> — you (or your agent)
          pay the quote in KAS on L1, the payment is verified against consensus, and the service delivers.
          No accounts, no API keys, no subscriptions. Powered by Toccata smart covenant++ economics:
          the money rail IS the access control.
        </p>
      </motion.div>
    </div>
  );
}