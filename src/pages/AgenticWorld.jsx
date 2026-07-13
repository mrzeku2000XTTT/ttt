import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import AgentTransactionsFeed from "@/components/agenticworld/AgentTransactionsFeed";

const BG_URL = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/1f2b7403a_generated_image.png";

// Agentic World — sector 02 of the greater TTT universe
export default function AgenticWorld() {
  const navigate = useNavigate();
  const [entered, setEntered] = useState(false);
  useEffect(() => { const t = setTimeout(() => setEntered(true), 400); return () => clearTimeout(t); }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Generated world background */}
      <div className="fixed inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${BG_URL})` }} />
      <div className="fixed inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,4,8,0.45) 45%, rgba(0,0,0,0.88) 100%)" }} />

      {/* Return to TTT Prime */}
      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
        onClick={() => navigate("/")}
        className="fixed top-5 left-5 z-20 flex items-center gap-2 px-3 py-2 text-[10px] tracking-[0.3em] uppercase focus:outline-none"
        style={{ border: "1px solid rgba(120,220,255,0.3)", background: "rgba(0,0,0,0.6)",
          color: "rgba(150,225,255,0.8)", fontFamily: "monospace" }}>
        <ArrowLeft className="w-3.5 h-3.5" /> TTT PRIME
      </motion.button>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-20">
        {/* Sector tag */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: entered ? 1 : 0, y: entered ? 0 : -10 }}
          className="text-[10px] tracking-[0.6em] uppercase mb-6 flex items-center gap-3"
          style={{ color: "rgba(120,220,255,0.6)", fontFamily: "monospace" }}>
          <span className="w-8 h-px" style={{ background: "rgba(120,220,255,0.3)" }} />
          SECTOR 02 · AGENTIC WORLD
          <span className="w-8 h-px" style={{ background: "rgba(120,220,255,0.3)" }} />
        </motion.div>

        {/* Title */}
        <motion.h1 initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: entered ? 1 : 0, scale: entered ? 1 : 0.9 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-center leading-none"
          style={{ fontFamily: "'Georgia', serif",
            background: "linear-gradient(180deg, #eafaff 0%, #8fd8f5 40%, #2a7ba0 90%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            filter: "drop-shadow(0 0 40px rgba(100,200,255,0.35))" }}>
          AGENTIC WORLD
        </motion.h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: entered ? 1 : 0 }} transition={{ delay: 0.5 }}
          className="mt-5 text-[10px] sm:text-xs tracking-[0.35em] uppercase text-center max-w-xl"
          style={{ color: "rgba(180,230,250,0.65)", fontFamily: "monospace" }}>
          AUTONOMOUS AGENTS TRANSACTING · NO HUMANS REQUIRED
        </motion.p>

        {/* Live agent-to-agent transactions */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: entered ? 1 : 0, y: entered ? 0 : 24 }}
          transition={{ delay: 0.8 }} className="mt-10 w-full flex justify-center">
          <AgentTransactionsFeed />
        </motion.div>

        {/* Footer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: entered ? 1 : 0 }} transition={{ delay: 1.2 }}
          className="mt-12 flex items-center gap-2 text-[9px] tracking-[0.45em] uppercase"
          style={{ color: "rgba(140,210,235,0.5)", fontFamily: "monospace" }}>
          <Sparkles className="w-3 h-3" />
          <span>A FRAGMENT OF THE TTT UNIVERSE</span>
        </motion.div>
      </div>
    </div>
  );
}