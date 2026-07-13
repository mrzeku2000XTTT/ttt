import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Globe } from "lucide-react";
import NationsGrid from "@/components/kaspanations/NationsGrid";
import WorldZoomOut from "@/components/landing/WorldZoomOut";
import WorldCarouselOrbs from "@/components/landing/WorldCarouselOrbs";

const BG_URL = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/292395992_generated_image.png";

// Worlds in the greater universe — this page is index 2
const WORLDS = [
  { name: "TTT PRIME", desc: "THE MOTHER WORLD", path: "/" },
  { name: "AGENTIC WORLD", desc: "SECTOR 02", path: "/AgenticWorld" },
  { name: "KASPA NATIONS", desc: "SECTOR 03" },
  { name: "IGRA HORIZON", desc: "SECTOR 04", path: "/IgraHorizon" },
];
const SELF = 2;

// Kaspa Nations — sector 03 of the greater TTT universe
export default function KaspaNations() {
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
          boxShadow: worldMode ? "0 0 120px rgba(80,255,180,0.35), inset 0 0 80px rgba(0,0,0,0.8)" : "none" }}>

        {/* Generated world background */}
        <div className="fixed inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${BG_URL})` }} />
        <div className="fixed inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,8,4,0.45) 45%, rgba(0,0,0,0.88) 100%)" }} />

        {/* Back to sector selector */}
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          onClick={() => setWorldMode(true)}
          className="fixed top-5 left-5 z-20 flex items-center gap-2 px-3 py-2 text-[10px] tracking-[0.3em] uppercase focus:outline-none"
          style={{ border: "1px solid rgba(80,255,180,0.3)", background: "rgba(0,0,0,0.6)",
            color: "rgba(125,255,206,0.8)", fontFamily: "monospace" }}>
          <ArrowLeft className="w-3.5 h-3.5" /> SECTORS
        </motion.button>

        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-20">
          {/* Sector tag */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: entered ? 1 : 0, y: entered ? 0 : -10 }}
            className="text-[10px] tracking-[0.6em] uppercase mb-6 flex items-center gap-3"
            style={{ color: "rgba(80,255,180,0.6)", fontFamily: "monospace" }}>
            <span className="w-8 h-px" style={{ background: "rgba(80,255,180,0.3)" }} />
            SECTOR 03 · KASPA NATIONS
            <span className="w-8 h-px" style={{ background: "rgba(80,255,180,0.3)" }} />
          </motion.div>

          {/* Title */}
          <motion.h1 initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: entered ? 1 : 0, scale: entered ? 1 : 0.9 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-center leading-none"
            style={{ fontFamily: "'Georgia', serif",
              background: "linear-gradient(180deg, #eafff5 0%, #8ff5c8 40%, #2aa06e 90%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              filter: "drop-shadow(0 0 40px rgba(80,255,180,0.35))" }}>
            KASPA NATIONS
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: entered ? 1 : 0 }} transition={{ delay: 0.5 }}
            className="mt-5 text-[10px] sm:text-xs tracking-[0.35em] uppercase text-center max-w-xl"
            style={{ color: "rgba(180,250,220,0.65)", fontFamily: "monospace" }}>
            ONE NETWORK · EVERY COUNTRY · KASPA COMMUNITIES WORLDWIDE
          </motion.p>

          {/* Country communities */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: entered ? 1 : 0, y: entered ? 0 : 24 }}
            transition={{ delay: 0.8 }} className="mt-10 w-full flex justify-center">
            <NationsGrid />
          </motion.div>

          {/* Footer with world trigger */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: entered ? 1 : 0 }} transition={{ delay: 1.2 }}
            className="mt-12 flex items-center gap-2 text-[9px] tracking-[0.45em] uppercase"
            style={{ color: "rgba(140,235,190,0.5)", fontFamily: "monospace" }}>
            <Sparkles className="w-3 h-3" />
            <span>A FRAGMENT OF THE TTT UNIVERSE</span>
            <motion.button type="button" whileHover={{ scale: 1.3 }} whileTap={{ scale: 0.9 }}
              onClick={() => setWorldMode(true)}
              className="focus:outline-none" title="See the greater world"
              style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}>
              <Globe className="w-3.5 h-3.5" style={{ color: "rgba(140,255,200,0.8)" }} strokeWidth={1.5} />
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