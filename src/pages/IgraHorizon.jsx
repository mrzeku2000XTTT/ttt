import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Globe, Flame } from "lucide-react";
import IgraLiveFeed from "@/components/igra/IgraLiveFeed";
import IgraAppsGrid from "@/components/igra/IgraAppsGrid";
import WorldZoomOut from "@/components/landing/WorldZoomOut";
import WorldCarouselOrbs from "@/components/landing/WorldCarouselOrbs";

// Worlds in the greater universe — this page is index 3
const WORLDS = [
  { name: "TTT PRIME", desc: "THE MOTHER WORLD", path: "/" },
  { name: "AGENTIC WORLD", desc: "SECTOR 02", path: "/AgenticWorld" },
  { name: "KASPA NATIONS", desc: "SECTOR 03", path: "/KaspaNations" },
  { name: "IGRA HORIZON", desc: "SECTOR 04" },
];
const SELF = 3;

const GOLD = "#C9A24B";
const MINT = "#6EE7B7";
const CONSTELLATION_BG = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/2803b8e71_generated_image.png";

// Igra Horizon — sector 04: Igra Labs brand (black · gold line-art · mint accents)
export default function IgraHorizon() {
  const navigate = useNavigate();
  const [entered, setEntered] = useState(false);
  const [worldMode, setWorldMode] = useState(false);
  const [worldIndex, setWorldIndex] = useState(SELF);
  useEffect(() => { const t = setTimeout(() => setEntered(true), 400); return () => clearTimeout(t); }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <motion.div
        animate={worldMode
          ? { scale: 0.2, borderRadius: "50%", x: (SELF - worldIndex) * (typeof window !== "undefined" ? window.innerWidth : 0) }
          : { scale: 1, borderRadius: "0%", x: 0 }}
        transition={{ duration: 3.2, ease: [0.22, 1, 0.36, 1], x: { type: "spring", stiffness: 55, damping: 17 } }}
        style={{ transformOrigin: "50% 50%", overflow: worldMode ? "hidden" : "visible",
          height: worldMode ? "100vh" : "auto", background: "#000",
          boxShadow: worldMode ? "0 0 120px rgba(201,162,75,0.3), inset 0 0 80px rgba(0,0,0,0.8)" : "none" }}>

        {/* Gold line-art constellation background */}
        <div className="fixed inset-0 pointer-events-none"
          style={{ backgroundImage: `url(${CONSTELLATION_BG})`, backgroundSize: "cover",
            backgroundPosition: "center", opacity: 0.5 }} />
        <div className="fixed inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 80% at 50% 40%, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.7) 100%)" }} />

        {/* Back to sector selector */}
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          onClick={() => setWorldMode(true)}
          className="fixed top-5 left-5 z-20 flex items-center gap-2 px-4 py-2.5 text-[10px] tracking-[0.3em] uppercase focus:outline-none rounded-full"
          style={{ border: "1px solid rgba(255,255,255,0.18)", background: "rgba(10,10,10,0.7)",
            backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            color: "rgba(255,255,255,0.9)", fontFamily: "monospace" }}>
          <ArrowLeft className="w-3.5 h-3.5" /> SECTORS
        </motion.button>

        <div className="relative z-10 h-screen flex flex-col items-center px-4 sm:px-6 pt-16 pb-3 overflow-hidden">
          {/* Sector tag */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: entered ? 1 : 0, y: entered ? 0 : -10 }}
            className="text-[9px] tracking-[0.5em] uppercase mb-2 flex items-center gap-3 flex-shrink-0"
            style={{ color: GOLD, fontFamily: "monospace" }}>
            <span className="w-8 h-px" style={{ background: "rgba(201,162,75,0.5)" }} />
            SECTOR 04 | IGRA HORIZON
            <span className="w-8 h-px" style={{ background: "rgba(201,162,75,0.5)" }} />
          </motion.div>

          {/* Title */}
          <motion.h1 initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: entered ? 1 : 0, scale: entered ? 1 : 0.9 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-center leading-none text-white flex-shrink-0"
            style={{ fontFamily: "'Georgia', serif" }}>
            IGRA HORIZON
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: entered ? 1 : 0 }} transition={{ delay: 0.5 }}
            className="mt-2 text-[8px] sm:text-[10px] tracking-[0.3em] uppercase text-center max-w-xl leading-relaxed flex-shrink-0"
            style={{ color: "#D9C9A3", fontFamily: "monospace" }}>
            THE EVM FORGE ON KASPA · SUB-SECOND FINALITY · FUELED BY iKAS
          </motion.p>

          {/* Feed + apps side by side to fit one screen */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: entered ? 1 : 0, y: entered ? 0 : 24 }}
            transition={{ delay: 0.8 }}
            className="mt-4 w-full max-w-6xl flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-y-auto lg:overflow-visible">
            <div className="flex justify-center min-h-0">
              <IgraLiveFeed ledgerHeight="180px" />
            </div>
            <div className="flex flex-col items-center gap-3 min-h-0">
              <IgraAppsGrid />
              {/* Explorer CTA */}
              <motion.a whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                href="https://explorer.igralabs.com" target="_blank" rel="noopener noreferrer"
                className="w-full max-w-2xl rounded-2xl overflow-hidden focus:outline-none relative"
                style={{ border: "1px solid rgba(201,162,75,0.45)", background: "rgba(8,7,4,0.75)",
                  backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
                <div className="absolute inset-0 pointer-events-none opacity-30"
                  style={{ backgroundImage: `url(${CONSTELLATION_BG})`, backgroundSize: "300%", backgroundPosition: "left center" }} />
                <div className="relative pt-3 text-center text-sm sm:text-base font-bold tracking-[0.2em]"
                  style={{ color: "#E5C567", fontFamily: "'Georgia', serif" }}>
                  EXPLORE THE IGRA ECOSYSTEM
                </div>
                <div className="relative flex items-center justify-center gap-2 pb-3 pt-1 text-[9px] font-bold tracking-[0.25em] uppercase"
                  style={{ color: MINT, fontFamily: "monospace" }}>
                  <Flame className="w-3 h-3" />
                  IGRA EXPLORER · CHAIN 38833 · FREE PUBLIC RPC
                </div>
              </motion.a>
            </div>
          </motion.div>

          {/* Footer with world trigger */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: entered ? 1 : 0 }} transition={{ delay: 1.2 }}
            className="mt-2 flex items-center gap-2 text-[8px] tracking-[0.4em] uppercase flex-shrink-0"
            style={{ color: GOLD, fontFamily: "monospace" }}>
            <Sparkles className="w-3 h-3" />
            <span>A FRAGMENT OF THE TTT UNIVERSE</span>
            <motion.button type="button" whileHover={{ scale: 1.3 }} whileTap={{ scale: 0.9 }}
              onClick={() => setWorldMode(true)}
              className="focus:outline-none" title="See the greater world"
              style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}>
              <Globe className="w-3.5 h-3.5" style={{ color: "#E5C567" }} strokeWidth={1.5} />
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

      {/* Neighboring worlds */}
      {worldMode && (
        <WorldCarouselOrbs worlds={WORLDS} index={worldIndex} selfIndex={SELF}
          onEnter={(w) => { if (w.path) navigate(w.path); }} />
      )}

      {/* World zoom-out overlay */}
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