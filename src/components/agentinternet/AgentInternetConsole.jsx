import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, Cpu, Zap } from "lucide-react";
import { AGENT_CARDS } from "./agentCards";

const NODES = ["ROUTER", "MEMORY", "PROOFS", "PAYMENTS", "MEDIA"];

export default function AgentInternetConsole({ onClose }) {
  const [linked, setLinked] = useState(0);

  useEffect(() => {
    if (linked >= AGENT_CARDS.length) return;
    const t = setTimeout(() => setLinked((n) => n + 1), 500);
    return () => clearTimeout(t);
  }, [linked]);

  const online = linked >= AGENT_CARDS.length;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.94)", backdropFilter: "blur(10px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: "#05070a", border: "1px solid rgba(34,211,238,0.3)", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
      >
        <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid rgba(34,211,238,0.2)" }}>
          <Cpu className="w-4 h-4" style={{ color: "#22d3ee" }} />
          <span className="text-[11px] tracking-[0.25em] uppercase flex-1" style={{ color: "#22d3ee" }}>Agent Internet · Supercomputer</span>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-white/5 text-white/40"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-4 py-5 space-y-2">
          {AGENT_CARDS.map((a, i) => {
            const isLinked = i < linked;
            return (
              <div key={a.name} className="flex items-center gap-3 px-3 py-2 rounded-lg"
                style={{ border: `1px solid ${isLinked ? "rgba(34,211,238,0.35)" : "rgba(255,255,255,0.08)"}`, background: isLinked ? "rgba(34,211,238,0.06)" : "transparent" }}>
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: isLinked ? "#22d3ee" : "rgba(255,255,255,0.2)", boxShadow: isLinked ? "0 0 8px #22d3ee" : "none" }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-bold text-white truncate">{a.name}</div>
                  <div className="text-[9px] uppercase tracking-wider text-white/40 truncate">{a.role} · {a.protocol}</div>
                </div>
                <span className="text-[9px] uppercase tracking-widest flex-shrink-0" style={{ color: isLinked ? "#22d3ee" : "rgba(255,255,255,0.25)" }}>
                  {isLinked ? "linked" : "…"}
                </span>
              </div>
            );
          })}
        </div>

        <div className="px-4 pb-5">
          <div className="grid grid-cols-5 gap-1.5">
            {NODES.map((n) => (
              <div key={n} className="text-center py-2 rounded-md text-[8px] uppercase tracking-wider"
                style={{ border: `1px solid ${online ? "rgba(34,211,238,0.3)" : "rgba(255,255,255,0.08)"}`, color: online ? "#22d3ee" : "rgba(255,255,255,0.25)" }}>
                {n}
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.25em]"
            style={{ color: online ? "#22d3ee" : "rgba(255,255,255,0.35)" }}>
            <Zap className="w-3.5 h-3.5" />
            {online ? "All agents online · backend live" : `Linking agents ${linked}/${AGENT_CARDS.length}`}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}