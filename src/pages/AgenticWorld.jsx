import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Globe, Shield, Eye } from "lucide-react";
import AgentTransactionsFeed from "@/components/agenticworld/AgentTransactionsFeed";
import AgenticCityScene from "@/components/agenticworld/AgenticCityScene";
import WorldZoomOut from "@/components/landing/WorldZoomOut";
import WorldCarouselOrbs from "@/components/landing/WorldCarouselOrbs";

const BG_URL = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/1f2b7403a_generated_image.png";

// Worlds in the greater universe — this page is index 1
const WORLDS = [
  { name: "TTT PRIME", desc: "THE MOTHER WORLD", path: "/" },
  { name: "AGENTIC WORLD", desc: "SECTOR 02" },
  { name: "KASPA NATIONS", desc: "SECTOR 03", path: "/KaspaNations" },
  { name: "IGRA HORIZON", desc: "SECTOR 04", path: "/IgraHorizon" },
  { name: "AWA", desc: "SECTOR 05", path: "/AWA" },
];
const SELF = 1;

// Agentic World — sector 02 of the greater TTT universe
export default function AgenticWorld() {
  const navigate = useNavigate();
  const [entered, setEntered] = useState(false);
  const [worldMode, setWorldMode] = useState(false);
  const [worldIndex, setWorldIndex] = useState(SELF);
  useEffect(() => { const t = setTimeout(() => setEntered(true), 400); return () => clearTimeout(t); }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* This world — zooms out into a small world orb */}
      <motion.div
        animate={worldMode
          ? { scale: 0.2, borderRadius: "50%", x: (SELF - worldIndex) * (typeof window !== "undefined" ? window.innerWidth : 0) }
          : { scale: 1, borderRadius: "0%", x: 0 }}
        transition={{ duration: 3.2, ease: [0.22, 1, 0.36, 1], x: { type: "spring", stiffness: 55, damping: 17 } }}
        style={{ transformOrigin: "50% 50%", overflow: worldMode ? "hidden" : "visible",
          height: worldMode ? "100vh" : "auto",
          boxShadow: worldMode ? "0 0 120px rgba(100,200,255,0.35), inset 0 0 80px rgba(0,0,0,0.8)" : "none" }}>

        {/* 3D animated cyber-city background */}
        <AgenticCityScene />
        <div className="fixed inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,4,8,0.25) 45%, rgba(0,0,0,0.8) 100%)" }} />

        {/* Back to sector selector */}
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          onClick={() => setWorldMode(true)}
          className="fixed top-5 left-5 z-20 flex items-center gap-2 px-4 py-2.5 text-[10px] tracking-[0.3em] uppercase focus:outline-none rounded-full"
          style={{ border: "1px solid rgba(120,220,255,0.25)", background: "rgba(10,20,28,0.55)",
            backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            color: "rgba(150,225,255,0.85)", fontFamily: "monospace" }}>
          <ArrowLeft className="w-3.5 h-3.5" /> SECTORS
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

          {/* SuperZK — deploy covenant++ & ZK proofs */}
          <motion.button initial={{ opacity: 0, y: 16 }} animate={{ opacity: entered ? 1 : 0, y: entered ? 0 : 16 }}
            transition={{ delay: 1 }} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/SuperZK?from=agenticworld")}
            className="mt-8 flex items-center gap-3 px-7 py-3.5 text-[10px] sm:text-[11px] font-black tracking-[0.3em] uppercase focus:outline-none rounded-full"
            style={{ border: "1px solid rgba(245,158,11,0.4)", background: "rgba(30,18,0,0.5)",
              backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
              color: "#fbbf24", fontFamily: "monospace",
              boxShadow: "0 0 35px rgba(245,158,11,0.18), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
            <Shield className="w-4 h-4" />
            SUPERZK · DEPLOY COVENANT++ & ZK PROOFS
          </motion.button>

          {/* Kaspa Command — global node intelligence map */}
          <motion.button initial={{ opacity: 0, y: 16 }} animate={{ opacity: entered ? 1 : 0, y: entered ? 0 : 16 }}
            transition={{ delay: 1.1 }} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/KaspaCommand")}
            className="mt-4 flex items-center gap-3 px-7 py-3.5 text-[10px] sm:text-[11px] font-black tracking-[0.3em] uppercase focus:outline-none rounded-full"
            style={{ border: "1px solid rgba(45,212,191,0.4)", background: "rgba(0,25,22,0.5)",
              backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
              color: "#5eead4", fontFamily: "monospace",
              boxShadow: "0 0 35px rgba(45,212,191,0.15), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
            <Globe className="w-4 h-4" />
            KASPA COMMAND · LIVE GLOBAL NODE MAP
          </motion.button>

          {/* OSIRIS — external global intelligence command */}
          <motion.button initial={{ opacity: 0, y: 16 }} animate={{ opacity: entered ? 1 : 0, y: entered ? 0 : 16 }}
            transition={{ delay: 1.2 }} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={() => window.open("https://osirisai.live", "_blank", "noopener,noreferrer")}
            className="mt-4 flex items-center gap-3 px-7 py-3.5 text-[10px] sm:text-[11px] font-black tracking-[0.3em] uppercase focus:outline-none rounded-full"
            style={{ border: "1px solid rgba(167,139,250,0.4)", background: "rgba(20,10,35,0.5)",
              backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
              color: "#c4b5fd", fontFamily: "monospace",
              boxShadow: "0 0 35px rgba(167,139,250,0.15), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
            <Eye className="w-4 h-4" />
            OSIRIS · GLOBAL INTELLIGENCE COMMAND
          </motion.button>

          {/* Footer with world trigger */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: entered ? 1 : 0 }} transition={{ delay: 1.2 }}
            className="mt-12 flex items-center gap-2 text-[9px] tracking-[0.45em] uppercase"
            style={{ color: "rgba(140,210,235,0.5)", fontFamily: "monospace" }}>
            <Sparkles className="w-3 h-3" />
            <span>A FRAGMENT OF THE TTT UNIVERSE</span>
            <motion.button type="button" whileHover={{ scale: 1.3 }} whileTap={{ scale: 0.9 }}
              onClick={() => setWorldMode(true)}
              className="focus:outline-none" title="See the greater world"
              style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}>
              <Globe className="w-3.5 h-3.5" style={{ color: "rgba(140,220,255,0.8)" }} strokeWidth={1.5} />
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

      {/* Neighboring worlds — slide in/out when turning left/right */}
      {worldMode && (
        <WorldCarouselOrbs worlds={WORLDS} index={worldIndex} selfIndex={SELF}
          onEnter={(w) => { if (w.path) navigate(w.path); }} />
      )}

      {/* World zoom-out overlay — fast speed lines while the page becomes a small world */}
      <AnimatePresence>
        {worldMode && (
          <WorldZoomOut worlds={WORLDS} index={worldIndex}
            onNavigate={(dir) => setWorldIndex(i => Math.min(Math.max(i + dir, 0), WORLDS.length - 1))}
            onClose={() => { setWorldMode(false); setWorldIndex(SELF); }} />
        )}
      </AnimatePresence>
    </div>
  );
}