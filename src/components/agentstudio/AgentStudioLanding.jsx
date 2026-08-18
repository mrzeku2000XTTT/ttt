import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Settings, Target } from "lucide-react";

const BOOT_LINES = [
  "establishing encrypted relay...",
  "resolving tttz.xyz · edge node",
  "auth · verifying session",
  "handshake · kaspa.org mainnet",
  "syncing DAG · ghostdag consensus",
  "mounting callable apps · 115",
  "loading agent registry · 5 agents",
  "arming 5 sub-agent slots",
  "opening KAI relay · wss://tttz.xyz",
];

function CyanSphere() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="cyanglow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#a5f3ff" />
          <stop offset="55%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#0e7490" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#cyanglow)" />
      <circle cx="9" cy="8.5" r="3.2" fill="rgba(255,255,255,0.55)" />
    </svg>
  );
}

export default function AgentStudioLanding({ onEnter, onNew }) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (visible >= BOOT_LINES.length) return;
    const t = setTimeout(() => setVisible((v) => v + 1), 480);
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
      {/* contrast + vignette overlay */}
      <div className="fixed inset-0 z-[1] bg-gradient-to-b from-black/40 via-black/20 to-black/70" />
      <div className="fixed inset-0 z-[1] pointer-events-none" style={{ boxShadow: "inset 0 0 240px 80px rgba(0,0,0,0.8)" }} />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-6">
        <div className="flex items-center gap-2.5">
          <span className="drop-shadow-[0_0_10px_rgba(6,182,212,0.9)]">
            <CyanSphere />
          </span>
          <span className="text-white text-lg sm:text-xl font-medium tracking-tight">TTT A.I</span>
        </div>
        <button
          onClick={() => navigate("/AppStoreV2")}
          className="flex items-center justify-center w-9 h-9 rounded-full liquid-glass text-white/80 hover:text-white transition-colors"
          title="Settings"
        >
          <Settings size={18} />
        </button>
      </header>

      {/* Terminal console */}
      <div className="relative z-10 flex justify-center px-6 mt-6 sm:mt-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="liquid-glass w-full max-w-md rounded-xl p-4 sm:p-5 font-mono text-[11px] sm:text-[13px] leading-relaxed text-[#00ff9f]"
          style={{ textShadow: "0 0 8px rgba(0,255,159,0.55)" }}
        >
          {BOOT_LINES.slice(0, visible).map((line) => (
            <div key={line} className="whitespace-nowrap">
              <span className="opacity-70">&gt;&gt; </span>
              {line}
            </div>
          ))}
          {visible < BOOT_LINES.length && (
            <span className="inline-block w-2 h-4 align-middle bg-[#00ff9f] animate-pulse" />
          )}
          {visible >= BOOT_LINES.length && (
            <div className="mt-1 opacity-80">
              <span className="opacity-70">&gt;&gt; </span>relay ready · awaiting operator
              <span className="inline-block w-2 h-4 align-middle ml-0.5 bg-[#00ff9f] animate-pulse" />
            </div>
          )}
        </motion.div>
      </div>

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
              className="liquid-glass rounded-full px-7 py-3.5 text-sm font-medium text-white hover:text-white transition-colors"
            >
              Enter Studio
            </button>
            <button
              onClick={onNew}
              className="rounded-full px-7 py-3.5 text-sm font-medium text-black bg-white hover:bg-white/90 transition-colors"
            >
              Create New Agent
            </button>
            <Link
              to="/"
              className="flex items-center gap-2 liquid-glass rounded-full px-7 py-3.5 text-sm font-medium text-white hover:text-white transition-colors"
              title="TTTz.xyz landing"
            >
              <CyanSphere />
              TTT A.i
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Footer target icon */}
      <div className="relative z-10 flex justify-end px-6 sm:px-10 pb-8">
        <button
          onClick={() => navigate("/AppStoreV2")}
          className="flex items-center justify-center w-9 h-9 rounded-full liquid-glass text-white/80 hover:text-white transition-colors"
          title="Locate"
        >
          <Target size={18} />
        </button>
      </div>
    </main>
  );
}