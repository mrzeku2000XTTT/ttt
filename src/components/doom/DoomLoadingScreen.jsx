import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TIPS = [
  "Every empire in history has eventually collapsed.",
  "The sun will expand and incinerate Earth in ~5 billion years.",
  "More people are alive today than have ever died.",
  "A human body contains enough fat to make 7 bars of soap.",
  "The universe is 99.9999% empty space.",
  "Cleopatra lived closer in time to the Moon landing than to the pyramids.",
  "There are more possible chess games than atoms in the observable universe.",
  "Sharks are older than trees.",
  "You are made of stardust forged in dying stars.",
  "Every map you've ever seen has been wrong — the Earth is not flat.",
];

function TypewriterTip({ text, onDone }) {
  const [displayed, setDisplayed] = useState("");
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setDisplayed("");
    setIdx(0);
  }, [text]);

  useEffect(() => {
    if (idx >= text.length) {
      const t = setTimeout(onDone, 1800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setDisplayed((prev) => prev + text[idx]);
      setIdx((i) => i + 1);
    }, 32);
    return () => clearTimeout(t);
  }, [idx, text, onDone]);

  return (
    <span>
      {displayed}
      {idx < text.length && (
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.6, repeat: Infinity }}
          className="inline-block w-0.5 h-5 bg-red-400 ml-0.5 align-middle"
        />
      )}
    </span>
  );
}

export default function DoomLoadingScreen({ query }) {
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * TIPS.length));
  const [visible, setVisible] = useState(true);

  const nextTip = () => {
    setVisible(false);
    setTimeout(() => {
      setTipIndex((i) => (i + 1) % TIPS.length);
      setVisible(true);
    }, 300);
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white overflow-hidden">
      {/* Pulsing void rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-red-900/40"
          style={{ width: 100 + i * 140, height: 100 + i * 140 }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.5 + i * 0.6, repeat: Infinity, delay: i * 0.4 }}
        />
      ))}

      {/* Red bleeding orb */}
      <motion.div
        className="absolute w-40 h-40 rounded-full"
        style={{ background: "radial-gradient(circle at 40% 40%, #7f1d1d, #000)" }}
        animate={{ scale: [0.9, 1.08, 0.9], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      {/* Scan lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,0,0,0.07) 4px)",
        }}
      />

      {/* Main text */}
      <div className="relative z-10 text-center px-8 max-w-lg">
        <motion.div
          className="text-red-500/80 text-[10px] font-black tracking-[0.5em] uppercase mb-6"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Descending
        </motion.div>

        <motion.div
          className="text-white/30 text-xs font-mono tracking-widest uppercase mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Pulling truths about
        </motion.div>
        <motion.div
          className="text-white text-2xl font-bold tracking-tight mb-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          "{query}"
        </motion.div>

        {/* Tip section */}
        <div className="border-t border-white/10 pt-6">
          <div className="text-white/25 text-[9px] font-black tracking-[0.4em] uppercase mb-3">
            Did you know
          </div>
          <div className="min-h-[60px] flex items-start">
            <AnimatePresence mode="wait">
              {visible && (
                <motion.p
                  key={tipIndex}
                  className="text-white/70 text-sm font-serif leading-relaxed text-left"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <TypewriterTip text={TIPS[tipIndex]} onDone={nextTip} />
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Bottom progress bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-red-800 via-red-500 to-red-800"
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{ duration: 8, ease: "linear" }}
      />
    </div>
  );
}