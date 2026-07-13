import React from "react";
import { motion } from "framer-motion";
import { Bot } from "lucide-react";

export default function KlipzAgent({ onHire, hasClips }) {
  return (
    <div className="max-w-4xl mx-auto px-4 mt-8">
      <button
        onClick={onHire}
        className="w-full text-left border border-cyan-500/40 bg-gradient-to-r from-cyan-950/40 to-black hover:border-cyan-400 transition-colors p-5 flex items-center gap-5 group"
        style={{ fontFamily: "monospace" }}
      >
        <div className="relative flex-shrink-0">
          <motion.div
            animate={{ boxShadow: ["0 0 12px rgba(34,211,238,0.3)", "0 0 28px rgba(34,211,238,0.7)", "0 0 12px rgba(34,211,238,0.3)"] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 rounded-full bg-black border-2 border-cyan-400 flex items-center justify-center"
          >
            <Bot className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" />
          </motion.div>
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-black rounded-full animate-pulse" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] text-emerald-400 tracking-[0.3em] mb-1">● ONLINE · ACCEPTING JOBS</p>
          <p className="text-white font-black text-base tracking-wider">AGENT KLIP</p>
          <p className="text-zinc-400 text-[11px] mt-1 leading-relaxed">
            {hasClips
              ? "Hire me and I'll package these clip drafts, verify your payment on-chain, and deliver them to your library."
              : "Scan a stream first, then hire me to package and deliver your clips."}
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-cyan-400 font-black text-xl">1 KAS</p>
          <p className="text-[9px] text-zinc-500 tracking-[0.2em] mt-1">TAP TO HIRE →</p>
        </div>
      </button>
    </div>
  );
}