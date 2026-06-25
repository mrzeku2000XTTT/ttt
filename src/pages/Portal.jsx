import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Sparkles, Globe, ArrowLeft } from "lucide-react";

const BG_IMAGE = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/7b6dd8e5f_generated_image.png";

function ColorWheelDisc({ onColorChange }) {
  const ref = useRef(null);
  const handleInteraction = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left - rect.width / 2;
    const y = clientY - rect.top - rect.height / 2;
    const angle = Math.atan2(y, x) * (180 / Math.PI) + 180;
    const h = Math.round(angle);
    const dist = Math.sqrt(x * x + y * y) / (rect.width / 2);
    const s = Math.min(100, Math.round(dist * 100));
    onColorChange(`hsl(${h}, ${Math.max(60, s)}%, 55%)`);
  };

  return (
    <div
      ref={ref}
      onClick={handleInteraction}
      onTouchEnd={handleInteraction}
      className="cursor-crosshair select-none"
      style={{
        width: 180,
        height: 180,
        borderRadius: "50%",
        background: "conic-gradient(red 0deg, #ff8000 30deg, yellow 60deg, #80ff00 90deg, lime 120deg, #00ff80 150deg, cyan 180deg, #0080ff 210deg, blue 240deg, #8000ff 270deg, magenta 300deg, #ff0080 330deg, red 360deg)",
        position: "relative",
      }}
    >
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "42%", height: "42%",
        borderRadius: "50%",
        background: "radial-gradient(circle, #0a0510 0%, #04020c 100%)",
      }} />
    </div>
  );
}

const PORTALS = [
  {
    id: "ai",
    label: "WORLD OF AI",
    sub: "Intelligence Engine",
    path: "/WorldOfAI",
    color: "#a855f7",
    border: "rgba(168,85,247,0.5)",
    glow: "rgba(168,85,247,0.25)",
    icon: Cpu,
  },
  {
    id: "kaspa",
    label: "WORLD OF KASPA",
    sub: "DAGchain Ecosystem",
    path: "/WorldOfKaspa",
    color: "#14b8a6",
    border: "rgba(20,184,166,0.5)",
    glow: "rgba(20,184,166,0.25)",
    icon: Globe,
  },
];

export default function PortalPage() {
  const navigate = useNavigate();
  const [portalColor, setPortalColor] = useState("#a855f7");
  const [entering, setEntering] = useState(false);
  const [hovered, setHovered] = useState(null);

  const handleNav = (path) => {
    setEntering(true);
    setTimeout(() => navigate(path), 600);
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col" style={{ background: "#04020c" }}>

      {/* Full-bleed BG */}
      <img src={BG_IMAGE} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ opacity: 0.6 }} />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 90% 90% at 50% 40%, transparent 20%, rgba(4,2,12,0.85) 100%)" }} />

      {/* Top gradient fade */}
      <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(4,2,12,0.9) 0%, transparent 100%)" }} />

      {/* Flash on enter */}
      <AnimatePresence>
        {entering && (
          <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ background: portalColor, mixBlendMode: "screen" }} />
        )}
      </AnimatePresence>

      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-20 flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors"
        style={{ fontSize: 12 }}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span className="tracking-widest uppercase">Back</span>
      </motion.button>

      {/* ── MAIN CONTENT ── */}
      <div className="relative z-10 flex flex-col items-center justify-between min-h-screen px-4 py-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mt-4"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-px w-12 opacity-30" style={{ background: portalColor }} />
            <span className="text-[10px] tracking-[0.4em] uppercase font-semibold" style={{ color: portalColor, opacity: 0.7 }}>PORTAL</span>
            <div className="h-px w-12 opacity-30" style={{ background: portalColor }} />
          </div>
          <h1 className="font-black text-white text-4xl sm:text-5xl tracking-tight mb-1" style={{ textShadow: `0 0 60px ${portalColor}55` }}>
            T T T
          </h1>
          <p className="text-white/30 text-xs tracking-[0.3em] uppercase mt-2">Choose your world</p>
        </motion.div>

        {/* Color Wheel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="flex items-center justify-center my-4"
        >
          <div style={{ filter: `drop-shadow(0 0 40px ${portalColor}88)` }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}>
              <ColorWheelDisc onColorChange={setPortalColor} />
            </motion.div>
          </div>
        </motion.div>

        {/* Portal cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="w-full max-w-sm flex flex-col gap-3"
        >
          {PORTALS.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.button
                key={p.id}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.12 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onHoverStart={() => setHovered(p.id)}
                onHoverEnd={() => setHovered(null)}
                onClick={() => handleNav(p.path)}
                className="relative w-full flex items-center gap-4 px-5 py-4 text-left overflow-hidden"
                style={{
                  background: hovered === p.id ? `rgba(${p.id === 'ai' ? '168,85,247' : '20,184,166'},0.12)` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${hovered === p.id ? p.border : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 16,
                  backdropFilter: "blur(12px)",
                  boxShadow: hovered === p.id ? `0 0 30px ${p.glow}` : "none",
                  transition: "all 0.2s ease",
                }}
              >
                {/* Icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${p.color}20`, border: `1px solid ${p.color}40` }}>
                  <Icon className="w-5 h-5" style={{ color: p.color }} />
                </div>

                {/* Text */}
                <div className="flex-1">
                  <div className="font-black text-white text-sm tracking-wider">{p.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: p.color, opacity: 0.7 }}>{p.sub}</div>
                </div>

                {/* Arrow */}
                <motion.div
                  animate={{ x: hovered === p.id ? 3 : 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-white/20 text-lg"
                >
                  →
                </motion.div>
              </motion.button>
            );
          })}

          {/* Explore apps */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/AppStoreV2")}
            className="w-full flex items-center gap-4 px-5 py-4 text-left"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 16,
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <Sparkles className="w-5 h-5 text-white/50" />
            </div>
            <div className="flex-1">
              <div className="font-black text-white/60 text-sm tracking-wider">EXPLORE APPS</div>
              <div className="text-xs mt-0.5 text-white/30">Full ecosystem</div>
            </div>
            <span className="text-white/15 text-lg">→</span>
          </motion.button>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-white/20 text-[10px] tracking-[0.5em] uppercase mt-6"
        >
          由 Kaspa 提供支持
        </motion.p>
      </div>
    </div>
  );
}