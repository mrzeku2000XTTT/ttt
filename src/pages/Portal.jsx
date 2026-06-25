import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, Users, Send, Play } from "lucide-react";

const BG_IMAGE = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/7b6dd8e5f_generated_image.png";

// Inline color wheel that is always visible in the center of the portal
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
    // Distance from center for saturation/lightness
    const dist = Math.sqrt(x * x + y * y) / (rect.width / 2);
    const s = Math.min(100, Math.round(dist * 100));
    const hex = `hsl(${h}, ${Math.max(60, s)}%, 55%)`;
    onColorChange(hex);
  };

  return (
    <div
      ref={ref}
      onClick={handleInteraction}
      onTouchEnd={handleInteraction}
      className="cursor-crosshair select-none"
      style={{
        width: 200,
        height: 200,
        borderRadius: "50%",
        background: "conic-gradient(red 0deg, #ff8000 30deg, yellow 60deg, #80ff00 90deg, lime 120deg, #00ff80 150deg, cyan 180deg, #0080ff 210deg, blue 240deg, #8000ff 270deg, magenta 300deg, #ff0080 330deg, red 360deg)",
        boxShadow: "0 0 60px rgba(255,255,255,0.15), 0 0 120px rgba(180,100,255,0.2)",
        position: "relative",
      }}
    >
      {/* Inner dark hole */}
      <div style={{
        position: "absolute",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "45%", height: "45%",
        borderRadius: "50%",
        background: "radial-gradient(circle, #1a0a2e 0%, #0a0510 100%)",
        boxShadow: "inset 0 0 20px rgba(0,0,0,0.8)",
      }} />
      {/* Grid lines overlay */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        backgroundImage: "radial-gradient(circle, transparent 20%, transparent 20%), repeating-radial-gradient(circle, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 20px)",
        pointerEvents: "none",
      }} />
    </div>
  );
}

export default function PortalPage() {
  const navigate = useNavigate();
  const [portalColor, setPortalColor] = useState("#a855f7");
  const [entering, setEntering] = useState(false);

  const handleWorldNav = (path) => {
    setEntering(true);
    setTimeout(() => navigate(path), 700);
  };

  const handlePlay = () => {
    // navigate to TTTGate or just WorldOfAI as default
    handleWorldNav("/WorldOfAI");
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden flex flex-col items-center"
      style={{ background: "#04020c" }}
    >
      {/* Full-bleed background image */}
      <img
        src={BG_IMAGE}
        alt=""
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ opacity: 0.85 }}
      />

      {/* Radial dark vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 80% at 50% 40%, transparent 30%, rgba(4,2,12,0.7) 100%)" }}
      />

      {/* Flash overlay on enter */}
      <AnimatePresence>
        {entering && (
          <motion.div
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ background: portalColor, mixBlendMode: "screen" }}
          />
        )}
      </AnimatePresence>

      {/* ── CONTENT ── */}
      <div className="relative z-10 flex flex-col items-center w-full min-h-screen px-4 pt-12 pb-8">

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-white font-bold text-center mb-2"
          style={{ fontSize: "clamp(22px, 6vw, 38px)", letterSpacing: "0.02em", textShadow: "0 2px 30px rgba(180,120,255,0.5)" }}
        >
          地球到火星交易
        </motion.h1>

        {/* Subtitle pill */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mb-6"
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 8,
            padding: "4px 16px",
          }}
        >
          <span className="text-white/70 text-sm tracking-wider">由 Kaspa 提供支持</span>
        </motion.div>

        {/* Portal image area + color wheel stacked */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.15 }}
          className="relative flex items-center justify-center"
          style={{ width: "min(460px, 96vw)", aspectRatio: "1 / 1.05" }}
        >
          {/* The portal ring image fills this space */}
          <img
            src={BG_IMAGE}
            alt="portal"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{ borderRadius: "50%", opacity: 0 }}
          />

          {/* Color wheel centered in the lower portion of the portal ring */}
          <div
            className="absolute flex items-center justify-center"
            style={{ bottom: "8%", left: "50%", transform: "translateX(-50%)" }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              style={{ filter: `drop-shadow(0 0 30px ${portalColor})` }}
            >
              <ColorWheelDisc onColorChange={setPortalColor} />
            </motion.div>
          </div>
        </motion.div>

        {/* Spacer to push buttons below the image */}
        <div style={{ height: 0 }} />

        {/* World of AI  |  PLAY  |  World of Kaspa */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="flex items-center gap-2 mt-2 w-full max-w-xs justify-center"
        >
          {/* World of AI */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => handleWorldNav("/WorldOfAI")}
            className="flex-1 py-3 px-3 rounded-2xl font-black text-white flex items-center justify-center whitespace-nowrap"
            style={{ fontSize: 13 }}
            style={{
              background: "rgba(120, 80, 200, 0.35)",
              border: "1.5px solid rgba(180, 120, 255, 0.55)",
              boxShadow: "0 0 20px rgba(160, 80, 255, 0.3)",
              backdropFilter: "blur(10px)",
            }}
          >
            World of AI
          </motion.button>

          {/* PLAY diamond button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.93 }}
            onClick={handlePlay}
            className="flex flex-col items-center justify-center font-black text-white text-xs tracking-widest flex-shrink-0 relative"
            style={{
              width: 60, height: 60,
              background: "rgba(255,255,255,0.15)",
              border: "1.5px solid rgba(255,255,255,0.4)",
              borderRadius: 10,
              boxShadow: "0 0 24px rgba(255,255,255,0.2)",
              backdropFilter: "blur(12px)",
              transform: "rotate(45deg)",
            }}
          >
            <span style={{ transform: "rotate(-45deg)", fontSize: 10, letterSpacing: "0.12em" }}>PLAY</span>
          </motion.button>

          {/* World of Kaspa */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => handleWorldNav("/WorldOfKaspa")}
            className="flex-1 py-3 px-3 rounded-2xl font-black text-white flex items-center justify-center whitespace-nowrap"
            style={{ fontSize: 13 }}
            style={{
              background: "rgba(0, 160, 140, 0.28)",
              border: "1.5px solid rgba(20, 200, 180, 0.55)",
              boxShadow: "0 0 20px rgba(20, 184, 166, 0.3)",
              backdropFilter: "blur(10px)",
            }}
          >
            World of Kaspa
          </motion.button>
        </motion.div>

        {/* TAP · TO · TIP row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.52 }}
          className="flex items-center gap-3 mt-4"
        >
          {/* TAP */}
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/AppStoreV2")}
            className="flex flex-col items-center justify-center gap-1"
            style={{
              width: 64, height: 64,
              background: "rgba(255,255,255,0.88)",
              borderRadius: 16,
              boxShadow: "0 2px 16px rgba(0,0,0,0.25)",
            }}
          >
            <LayoutGrid className="w-5 h-5 text-slate-800" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">TAP</span>
          </motion.button>

          {/* TO */}
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/Feed")}
            className="flex flex-col items-center justify-center gap-1"
            style={{
              width: 64, height: 64,
              background: "rgba(255,255,255,0.88)",
              borderRadius: 16,
              boxShadow: "0 2px 16px rgba(0,0,0,0.25)",
            }}
          >
            <Users className="w-5 h-5 text-slate-800" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">TO</span>
          </motion.button>

          {/* TIP */}
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/Tip")}
            className="flex flex-col items-center justify-center gap-1"
            style={{
              width: 64, height: 64,
              background: "linear-gradient(135deg, #f97316, #ec4899)",
              borderRadius: 16,
              boxShadow: "0 2px 20px rgba(236,72,153,0.4)",
            }}
          >
            <Send className="w-5 h-5 text-white" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white">TIP</span>
          </motion.button>
        </motion.div>

        {/* TTT footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-5 text-center"
        >
          <span className="text-white/40 text-xs font-semibold tracking-[0.5em] uppercase">T T T</span>
        </motion.div>
      </div>
    </div>
  );
}