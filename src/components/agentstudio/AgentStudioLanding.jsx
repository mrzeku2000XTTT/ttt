import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const BOOT_LINES = [
  "spawning agent runtime · v3",
  "linking kaspa mainnet · ghostdag",
  "deriving identity wallet · XMSS",
  "loading agent registry · 5 agents",
  "arming skill modules · covenant++",
  "verifying self-send anchors",
  "syncing on-chain epochs · 3",
  "mounting callable tools · 115",
  "consensus relay online · wss://tttz.xyz",
];

export default function AgentStudioLanding({ onEnter, onNew }) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(0);
  const [bootDone, setBootDone] = useState(false);

  useEffect(() => {
    if (visible >= BOOT_LINES.length) {
      const t = setTimeout(() => setBootDone(true), 1100);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setVisible((v) => v + 1), 420);
    return () => clearTimeout(t);
  }, [visible]);

  return (
    <main className="relative w-full min-h-screen overflow-hidden bg-black flex flex-col font-sans selection:bg-cyan-400/30 selection:text-white">
      {/* Cosmic video background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-0"
        src="https://media.base44.com/videos/public/6901295fa9bcfaa0f5ba2c2a/0a2c28484_Cosmic_Terminal_BG.mp4"
      />
      <div className="fixed inset-0 z-[1] bg-gradient-to-b from-black/40 via-black/20 to-black/70" />
      <div className="fixed inset-0 z-[1] pointer-events-none" style={{ boxShadow: "inset 0 0 240px 80px rgba(0,0,0,0.8)" }} />

      {/* Header — TTT back button */}
      <header className="relative z-10 px-6 sm:px-10 py-6">
        <button
          onClick={() => navigate("/AppStoreV2")}
          className="text-white text-2xl sm:text-3xl font-bold tracking-tight hover:text-cyan-300 transition-colors"
          title="Back to App Store"
        >
          TTT
        </button>
      </header>

      {/* Terminal console — fades out after boot */}
      <motion.div
        className="relative z-10 flex justify-center px-6 mt-2 sm:mt-6"
        animate={{ opacity: bootDone ? 0 : 1 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      >
        <div
          className="w-full max-w-md rounded-xl p-4 sm:p-5 font-mono text-[11px] sm:text-[13px] leading-relaxed text-[#00FF41]"
          style={{ background: "rgba(0,0,0,0.45)", textShadow: "0 0 8px rgba(0,255,65,0.55)" }}
        >
          {BOOT_LINES.slice(0, visible).map((line) => (
            <div key={line} className="whitespace-nowrap">
              <span className="opacity-70">&gt;&gt; </span>
              {line}
            </div>
          ))}
          {visible < BOOT_LINES.length && (
            <span className="inline-block w-2 h-4 align-middle bg-[#00FF41] animate-pulse" />
          )}
          {visible >= BOOT_LINES.length && !bootDone && (
            <div className="mt-1 opacity-80">
              <span className="opacity-70">&gt;&gt; </span>relay ready · awaiting operator
              <span className="inline-block w-2 h-4 align-middle ml-0.5 bg-[#00FF41] animate-pulse" />
            </div>
          )}
        </div>
      </motion.div>

      {/* Center CTA */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-medium tracking-tight text-white leading-[1.05] mb-4 max-w-4xl">
            Agent Studio
          </h1>
          <p className="text-white/70 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed mb-9">
            Train autonomous agents on Kaspa. Every epoch anchored by a real on-chain self-send — provable, non-custodial, yours to export.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onEnter}
              className="rounded-full px-7 py-3.5 text-sm font-medium text-black bg-white hover:bg-white/90 transition-colors"
            >
              Enter Studio
            </button>
            <button
              onClick={onNew}
              className="rounded-full px-7 py-3.5 text-sm font-medium text-white border border-white/30 bg-white/5 hover:bg-white/10 backdrop-blur-md transition-colors"
            >
              Create New Agent
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}