import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const HERO_IMAGE = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/9542c3e8a_image.png";

/**
 * TTTGate — cinematic landing page.
 * Click the TTT logo (red eyes + TTT mark) on the building to trigger a
 * frame-by-frame transition that zooms into the logo, flashes red, and
 * fades into the main TTTV2 experience.
 */
export default function TTTGatePage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState("idle"); // idle | zoom | flash | fade
  const [hovered, setHovered] = useState(false);
  const audioRef = useRef(null);

  // Preload the image so the transition is buttery
  useEffect(() => {
    const img = new Image();
    img.src = HERO_IMAGE;
  }, []);

  // Force the tab title to "TTT" on the landing page
  // (overrides any stale auto-injected per-route title from Base44)
  useEffect(() => {
    document.title = "TTT — The Kaspa Super App";
  }, []);

  const triggerTransition = () => {
    if (phase !== "idle") return;
    setPhase("zoom");
    // Phase timings: zoom 1.4s → flash 0.35s → fade 0.6s → navigate
    setTimeout(() => setPhase("flash"), 1400);
    setTimeout(() => setPhase("fade"), 1750);
    setTimeout(() => navigate("/TTTV2"), 2350);
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden select-none">
      {/* Hero image — animated zoom toward the logo on transition */}
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={
          phase === "zoom" || phase === "flash" || phase === "fade"
            ? { scale: 3.4, opacity: phase === "fade" ? 0 : 1 }
            : { scale: 1, opacity: 1 }
        }
        transition={{
          scale: { duration: 1.4, ease: [0.6, 0.05, 0.3, 1] },
          opacity: { duration: 0.6, ease: "easeOut" },
        }}
        style={{
          // Origin = the logo's location on the building (roughly 50%, 38%)
          transformOrigin: "50% 38%",
          backgroundImage: `url(${HERO_IMAGE})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Subtle vignette + atmospheric red flicker */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.65)_100%)]" />

      {/* Hover red glow on the logo */}
      <AnimatePresence>
        {hovered && phase === "idle" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute pointer-events-none"
            style={{
              left: "50%",
              top: "38%",
              transform: "translate(-50%, -50%)",
              width: "30%",
              aspectRatio: "1",
              background:
                "radial-gradient(circle, rgba(255,30,30,0.55) 0%, rgba(255,0,0,0.15) 40%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Clickable logo hotspot — sits on top of the TTT mark in the image */}
      <button
        onClick={triggerTransition}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        disabled={phase !== "idle"}
        aria-label="Enter TTT"
        className="absolute z-20 group"
        style={{
          left: "50%",
          top: "38%",
          transform: "translate(-50%, -50%)",
          width: "min(28vw, 28vh)",
          height: "min(28vw, 28vh)",
          cursor: phase === "idle" ? "pointer" : "default",
        }}
      >
        {/* Pulsing ring to invite the click */}
        {phase === "idle" && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-red-500/60"
              animate={{ scale: [1, 1.25, 1], opacity: [0.7, 0, 0.7] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border border-red-400/40"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay: 0.7 }}
            />
          </>
        )}
      </button>

      {/* Bottom prompt */}
      <AnimatePresence>
        {phase === "idle" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="absolute bottom-8 left-0 right-0 z-30 flex flex-col items-center gap-2 px-6"
          >
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="text-red-500 text-xs sm:text-sm font-bold tracking-[0.4em] uppercase"
              style={{ textShadow: "0 0 12px rgba(255,0,0,0.7)" }}
            >
              Tap the Mark to Enter
            </motion.div>
            <div className="text-white/30 text-[10px] sm:text-xs tracking-[0.3em] uppercase font-medium">
              TTT — The Final Realm
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top brand strip */}
      <AnimatePresence>
        {phase === "idle" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute top-6 left-0 right-0 z-30 flex items-center justify-center"
          >
            <div className="px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-red-500/30 flex items-center gap-2">
              <span className="relative flex w-1.5 h-1.5">
                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
                <span className="relative w-1.5 h-1.5 rounded-full bg-red-500" />
              </span>
              <span className="text-red-300 text-[10px] tracking-[0.3em] uppercase font-bold">
                Live · Kaspa Super App
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RED FLASH frame */}
      <AnimatePresence>
        {phase === "flash" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.4, 1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, times: [0, 0.3, 0.6, 1] }}
            className="absolute inset-0 z-40 bg-red-600 mix-blend-screen pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* WHITE blowout right at the cut */}
      <AnimatePresence>
        {phase === "flash" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0, 1, 0.7] }}
            transition={{ duration: 0.35, times: [0, 0.5, 0.75, 1] }}
            className="absolute inset-0 z-50 bg-white pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Final fade-to-black */}
      <AnimatePresence>
        {phase === "fade" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeIn" }}
            className="absolute inset-0 z-50 bg-black pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Scanline overlay for cinematic feel */}
      <div
        className="absolute inset-0 z-10 pointer-events-none opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.4) 0px, rgba(255,255,255,0.4) 1px, transparent 1px, transparent 3px)",
        }}
      />
    </div>
  );
}