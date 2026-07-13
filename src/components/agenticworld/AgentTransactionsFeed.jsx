import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Bot, Zap } from "lucide-react";

const AGENTS = ["ORION-7", "VEX", "KIRA-X", "NOMAD", "ATLAS-9", "ECHO", "SABLE", "QUARK-3", "LUMEN", "RAVEN-2"];
const PURPOSES = [
  "data retrieval contract", "compute lease · 4.2s", "memory shard purchase",
  "task delegation fee", "oracle price feed", "model inference batch",
  "storage pledge", "reputation stake", "workflow execution", "signal subscription",
];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

function makeTx() {
  let from = rand(AGENTS), to = rand(AGENTS);
  while (to === from) to = rand(AGENTS);
  return {
    id: Date.now() + Math.random(),
    from, to,
    amount: (Math.random() * 4.9 + 0.1).toFixed(3),
    purpose: rand(PURPOSES),
    time: new Date().toLocaleTimeString([], { hour12: false }),
  };
}

export default function AgentTransactionsFeed() {
  const [txs, setTxs] = useState(() => Array.from({ length: 5 }, makeTx));
  const timer = useRef(null);

  useEffect(() => {
    const tick = () => {
      setTxs((prev) => [makeTx(), ...prev].slice(0, 8));
      timer.current = setTimeout(tick, 1200 + Math.random() * 2600);
    };
    timer.current = setTimeout(tick, 1500);
    return () => clearTimeout(timer.current);
  }, []);

  return (
    <div className="w-full max-w-2xl"
      style={{ border: "1px solid rgba(120,220,255,0.2)", background: "rgba(2,12,20,0.72)",
        backdropFilter: "blur(12px)", boxShadow: "0 8px 40px rgba(0,0,0,0.7)" }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(120,220,255,0.15)" }}>
        <div className="flex items-center gap-2 text-[10px] tracking-[0.35em] uppercase"
          style={{ color: "rgba(150,225,255,0.75)", fontFamily: "monospace" }}>
          <Zap className="w-3.5 h-3.5" /> AGENT ⇄ AGENT TRANSACTIONS
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[9px] tracking-[0.3em] uppercase" style={{ color: "rgba(120,200,230,0.5)", fontFamily: "monospace" }}>LIVE</span>
        </div>
      </div>
      <div className="divide-y" style={{ borderColor: "rgba(120,220,255,0.08)" }}>
        <AnimatePresence initial={false}>
          {txs.map((tx) => (
            <motion.div key={tx.id}
              initial={{ opacity: 0, y: -14, backgroundColor: "rgba(120,220,255,0.12)" }}
              animate={{ opacity: 1, y: 0, backgroundColor: "rgba(120,220,255,0)" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-3 px-4 py-2.5"
              style={{ borderBottom: "1px solid rgba(120,220,255,0.07)" }}>
              <Bot className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(140,220,255,0.6)" }} />
              <div className="flex items-center gap-2 text-[11px] font-bold flex-shrink-0" style={{ fontFamily: "monospace" }}>
                <span style={{ color: "rgba(210,240,255,0.9)" }}>{tx.from}</span>
                <ArrowRight className="w-3 h-3" style={{ color: "rgba(120,220,255,0.5)" }} />
                <span style={{ color: "rgba(210,240,255,0.9)" }}>{tx.to}</span>
              </div>
              <div className="flex-1 truncate text-[10px] tracking-wide" style={{ color: "rgba(140,200,230,0.45)", fontFamily: "monospace" }}>
                {tx.purpose}
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-[11px] font-bold" style={{ color: "#67e8f9", fontFamily: "monospace" }}>{tx.amount} KAS</div>
                <div className="text-[8px]" style={{ color: "rgba(120,190,220,0.35)", fontFamily: "monospace" }}>{tx.time}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}