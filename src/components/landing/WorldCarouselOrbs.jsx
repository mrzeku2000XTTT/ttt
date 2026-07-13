import React from "react";
import { motion } from "framer-motion";

// Neighboring "worlds" that slide in/out horizontally as you turn left/right
// in world mode. Index 0 is the live landing page itself (rendered elsewhere).
export default function WorldCarouselOrbs({ worlds, index, onEnter, selfIndex = 0 }) {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1000;
  return (
    <>
      {worlds.map((w, i) => {
        if (i === selfIndex) return null;
        return (
          <motion.div key={w.name}
            className="fixed inset-0 z-30 flex items-center justify-center pointer-events-none"
            initial={false}
            animate={{ x: (i - index) * vw }}
            transition={{ type: "spring", stiffness: 55, damping: 17 }}>
            <motion.button onClick={() => onEnter(w)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="pointer-events-auto rounded-full flex items-center justify-center focus:outline-none"
              style={{
                width: "min(42vw, 42vh)", height: "min(42vw, 42vh)",
                background: "radial-gradient(circle at 35% 30%, rgba(70,48,12,0.9), rgba(12,8,2,0.98) 70%)",
                border: "1px solid rgba(200,150,40,0.5)",
                boxShadow: "0 0 120px rgba(220,160,40,0.35), inset 0 0 70px rgba(200,150,40,0.15)",
                backgroundImage: "repeating-radial-gradient(circle at 50% 50%, transparent 0px, transparent 22px, rgba(200,150,40,0.08) 23px)",
              }}>
              <div className="text-center px-6">
                <div className="text-[18px] sm:text-[26px] font-black tracking-[0.15em] leading-tight"
                  style={{ fontFamily: "'Georgia', serif",
                    background: "linear-gradient(180deg, #fff5cc 0%, #f0d060 30%, #c8960c 70%)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                    filter: "drop-shadow(0 0 24px rgba(200,140,0,0.5))" }}>
                  {w.name}
                </div>
                <div className="text-[9px] tracking-[0.4em] uppercase mt-2"
                  style={{ color: "rgba(200,160,70,0.55)", fontFamily: "monospace" }}>{w.desc}</div>
                <div className="text-[9px] tracking-[0.3em] uppercase mt-5 animate-pulse"
                  style={{ color: w.path ? "#f5d050" : "rgba(160,120,50,0.4)", fontFamily: "monospace",
                    textShadow: w.path ? "0 0 16px rgba(240,200,60,0.6)" : "none" }}>
                  {w.path ? "[ ENTER WORLD ]" : "[ LOCKED ]"}
                </div>
              </div>
            </motion.button>
          </motion.div>
        );
      })}
    </>
  );
}