import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, X, ChevronRight } from "lucide-react";

const PORTAL_VIDEO = "https://cdn.coverr.co/videos/coverr-abstract-tunnel-of-light-1584/1080p.mp4";

const PRESET_COLORS = [
  { name: "AI", color: "#ef4444", glow: "#ff000088", path: "/WorldOfAI" },
  { name: "Kaspa", color: "#14b8a6", glow: "#14b8a688", path: "/WorldOfKaspa" },
  { name: "Cosmic", color: "#8b5cf6", glow: "#8b5cf688", path: "/WorldOfAI" },
  { name: "Gold", color: "#f59e0b", glow: "#f59e0b88", path: "/WorldOfAI" },
  { name: "Neo", color: "#22c55e", glow: "#22c55e88", path: "/WorldOfKaspa" },
  { name: "Solar", color: "#f97316", glow: "#f9731688", path: "/WorldOfAI" },
];

function ColorWheel({ currentColor, onChange, onClose }) {
  const [hue, setHue] = useState(0);
  const wheelRef = useRef(null);

  const handleWheel = (e) => {
    const rect = wheelRef.current.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left - rect.width / 2;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top - rect.height / 2;
    const angle = Math.atan2(y, x) * (180 / Math.PI) + 180;
    const h = Math.round(angle);
    const hex = `hsl(${h}, 90%, 55%)`;
    setHue(h);
    onChange(hex);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: 20 }}
      className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 p-4 rounded-2xl"
      style={{ background: "rgba(10,10,20,0.95)", border: "1px solid rgba(255,255,255,0.12)", width: 260 }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold tracking-widest text-white/60">PORTAL COLOR</span>
        <button onClick={onClose}><X className="w-4 h-4 text-white/40" /></button>
      </div>

      {/* Color wheel */}
      <div
        ref={wheelRef}
        onClick={handleWheel}
        onTouchStart={handleWheel}
        className="w-full h-36 rounded-xl cursor-crosshair mb-3 relative overflow-hidden"
        style={{
          background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)",
          boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)"
        }}
      >
        <div className="absolute inset-0 rounded-xl" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 flex items-center justify-center text-[11px] text-white/70 font-bold tracking-widest pointer-events-none">TAP TO PICK</div>
      </div>

      {/* Presets */}
      <div className="grid grid-cols-3 gap-2">
        {PRESET_COLORS.map(p => (
          <button
            key={p.name}
            onClick={() => onChange(p.color)}
            className="flex flex-col items-center gap-1 p-2 rounded-lg transition-all hover:bg-white/5"
          >
            <div className="w-8 h-8 rounded-full border-2 border-white/20" style={{ background: p.color, boxShadow: `0 0 12px ${p.glow}` }} />
            <span className="text-[9px] text-white/50 font-semibold tracking-wider">{p.name}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export default function PortalPage() {
  const navigate = useNavigate();
  const [portalColor, setPortalColor] = useState("#14b8a6");
  const [showColorWheel, setShowColorWheel] = useState(false);
  const [portalPulse, setPortalPulse] = useState(false);
  const [entering, setEntering] = useState(false);
  const videoRef = useRef(null);

  // Determine destination based on color
  const getDestination = () => {
    const isKaspa = ["#14b8a6", "#22c55e"].some(c => portalColor === c);
    // Match by preset
    const preset = PRESET_COLORS.find(p => p.color === portalColor);
    if (preset) return preset.path;
    // Default: red/warm → AI, cool/green → Kaspa
    const hue = portalColor;
    return "/WorldOfAI";
  };

  const isKaspaColor = () => {
    const preset = PRESET_COLORS.find(p => p.color === portalColor);
    if (preset) return preset.path === "/WorldOfKaspa";
    return false;
  };

  const handlePortalClick = () => {
    setPortalPulse(true);
    setEntering(true);
    setTimeout(() => {
      navigate(getDestination());
    }, 1200);
  };

  const glowColor = portalColor;
  const worldLabel = isKaspaColor() ? "World of Kaspa" : "World of AI";

  return (
    <div className="relative min-h-screen overflow-hidden bg-black flex flex-col items-center justify-center">
      {/* Video background */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-30"
        style={{ filter: `hue-rotate(${portalColor === "#14b8a6" ? "180deg" : portalColor === "#ef4444" ? "0deg" : "270deg"})` }}
      >
        <source src={PORTAL_VIDEO} type="video/mp4" />
      </video>

      {/* Dark overlay */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.85) 100%)" }} />

      {/* TTT logo — top left → back to AppStore */}
      <button
        onClick={() => navigate("/AppStoreV2")}
        className="absolute top-5 left-5 z-50 text-white font-black text-2xl tracking-tight hover:opacity-70 transition-opacity"
      >
        TTT
      </button>

      {/* Color wheel toggle */}
      <button
        onClick={() => setShowColorWheel(!showColorWheel)}
        className="absolute top-5 right-5 z-50 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", boxShadow: `0 0 20px ${glowColor}55` }}
      >
        <div className="w-5 h-5 rounded-full" style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }} />
      </button>

      {/* Main portal */}
      <AnimatePresence>
        {entering && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 30, opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeIn" }}
            className="absolute inset-0 rounded-full z-40"
            style={{ background: glowColor, left: "50%", top: "50%", width: 200, height: 200, marginLeft: -100, marginTop: -100 }}
          />
        )}
      </AnimatePresence>

      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        {/* Portal ring */}
        <motion.button
          onClick={handlePortalClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          animate={portalPulse ? { scale: [1, 1.15, 0] } : { scale: [1, 1.02, 1] }}
          transition={portalPulse ? { duration: 1.2 } : { duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="relative flex items-center justify-center cursor-pointer"
          style={{ width: 240, height: 240 }}
        >
          {/* Outer glow rings */}
          {[1, 2, 3].map(i => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              animate={{ scale: [1, 1 + i * 0.15, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2 + i * 0.5, repeat: Infinity, delay: i * 0.4 }}
              style={{
                width: 240 + i * 40,
                height: 240 + i * 40,
                border: `2px solid ${glowColor}`,
                boxShadow: `0 0 30px ${glowColor}`,
              }}
            />
          ))}

          {/* Portal disc */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle at 40% 35%, ${glowColor}cc 0%, ${glowColor}66 30%, ${glowColor}22 60%, transparent 100%)`,
              boxShadow: `0 0 80px ${glowColor}88, inset 0 0 60px ${glowColor}44`,
              border: `3px solid ${glowColor}`,
            }}
          />

          {/* Animated swirl inside portal */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-4 rounded-full"
            style={{
              background: `conic-gradient(from 0deg, transparent, ${glowColor}88, transparent, ${glowColor}44, transparent)`,
            }}
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute inset-8 rounded-full"
            style={{
              background: `conic-gradient(from 180deg, transparent, ${glowColor}66, transparent)`,
            }}
          />

          {/* Center label */}
          <div className="relative z-10 text-center">
            <div className="text-white font-black text-lg tracking-wider drop-shadow-lg">{worldLabel}</div>
            <div className="text-white/60 text-xs tracking-widest mt-1 flex items-center gap-1 justify-center">
              ENTER <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </motion.button>

        {/* Portal label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-10 text-center"
        >
          <h1 className="text-white font-black text-3xl tracking-tight mb-2">PORTAL</h1>
          <p className="text-white/40 text-sm tracking-widest">CHOOSE YOUR WORLD</p>

          {/* Quick world switch buttons */}
          <div className="flex gap-3 mt-5 justify-center">
            <button
              onClick={() => setPortalColor("#ef4444")}
              className="px-5 py-2 rounded-full text-xs font-bold tracking-widest transition-all hover:scale-105"
              style={{
                background: portalColor === "#ef4444" ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.08)",
                border: `1px solid ${portalColor === "#ef4444" ? "#ef4444" : "rgba(239,68,68,0.3)"}`,
                color: "#ef4444",
                boxShadow: portalColor === "#ef4444" ? "0 0 20px #ef444455" : "none"
              }}
            >
              ⚡ WORLD OF AI
            </button>
            <button
              onClick={() => setPortalColor("#14b8a6")}
              className="px-5 py-2 rounded-full text-xs font-bold tracking-widest transition-all hover:scale-105"
              style={{
                background: portalColor === "#14b8a6" ? "rgba(20,184,166,0.3)" : "rgba(20,184,166,0.08)",
                border: `1px solid ${portalColor === "#14b8a6" ? "#14b8a6" : "rgba(20,184,166,0.3)"}`,
                color: "#14b8a6",
                boxShadow: portalColor === "#14b8a6" ? "0 0 20px #14b8a655" : "none"
              }}
            >
              ◈ WORLD OF KASPA
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* Color wheel panel */}
      <AnimatePresence>
        {showColorWheel && (
          <ColorWheel
            currentColor={portalColor}
            onChange={(c) => setPortalColor(c)}
            onClose={() => setShowColorWheel(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}