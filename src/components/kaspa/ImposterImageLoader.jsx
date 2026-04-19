import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ImageIcon } from "lucide-react";

const PHASES = [
  "🎨 sketching composition…",
  "🖌️ blocking colors…",
  "✨ refining details…",
  "🔍 sharpening edges…",
  "🖼️ almost there…",
];

export default function ImposterImageLoader() {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const phaseTimer = setInterval(() => {
      setPhaseIdx(i => (i + 1) % PHASES.length);
    }, 1800);
    const elapsedTimer = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => { clearInterval(phaseTimer); clearInterval(elapsedTimer); };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start"
    >
      <div
        className="px-3 py-2.5 rounded-2xl rounded-bl-md flex items-center gap-2.5 min-w-[200px]"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(168,85,247,0.25)",
        }}
      >
        {/* Animated image icon */}
        <div className="relative flex-shrink-0 w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center"
          style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.35)" }}>
          <ImageIcon className="w-4 h-4 text-purple-300" />
          {/* Shimmer sweep */}
          <div className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)",
              animation: "img-shimmer 1.5s ease-in-out infinite",
            }} />
        </div>

        <div className="flex flex-col min-w-0">
          <div className="text-[12px] font-medium text-white/90 truncate">{PHASES[phaseIdx]}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, rgba(168,85,247,0.9), rgba(236,72,153,0.9))",
                  animation: "img-progress 2.2s ease-in-out infinite",
                }} />
            </div>
            <span className="text-[9px] text-white/40 tabular-nums flex-shrink-0">{elapsed}s</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes img-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes img-progress {
          0% { width: 5%; }
          50% { width: 75%; }
          100% { width: 95%; }
        }
      `}</style>
    </motion.div>
  );
}