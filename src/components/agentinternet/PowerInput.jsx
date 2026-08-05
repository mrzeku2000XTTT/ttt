import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CornerDownLeft } from "lucide-react";
import OrganicOrb from "@/components/agentinternet/OrganicOrb";

/**
 * PowerInput — a real input box with a live-typing animation that cycles
 * through example "powers" (prompts). Each power maps to an Agent Internet skill.
 * When the user focuses/types, the animation yields to their input.
 */
export const POWERS = [
  { text: "draw me a spooky fantasy crowd", skill: "Xùnhuà · sketch→image", orb: ["#ec4899", "#a855f7", "#7c3aed"] },
  { text: "send 5 KAS to kaspa:qzr…", skill: "Bridge · real payment", orb: ["#34d399", "#06b6d4", "#0e7490"] },
  { text: "clip the best moment from this stream", skill: "Klipz · live clip", orb: ["#fb7185", "#f43f5e", "#9f1239"] },
  { text: "research Kaspa's price action today", skill: "Ying · grounded search", orb: ["#22d3ee", "#3b82f6", "#1d4ed8"] },
  { text: "mint my agent identity on-chain", skill: "Agent ZK · signed ID", orb: ["#818cf8", "#6366f1", "#4338ca"] },
  { text: "build me a landing page for my drop", skill: "TTT Builder · live site", orb: ["#fbbf24", "#f59e0b", "#b45309"] },
  { text: "turn this URL into a viral video", skill: "KUTT · render export", orb: ["#e879f9", "#d946ef", "#a21caf"] },
  { text: "lock 100 KAS in escrow for this gig", skill: "Slobz · covenant escrow", orb: ["#a3e635", "#84cc16", "#4d7c0f"] },
  { text: "post this to all my channels", skill: "TELE · encrypted reach", orb: ["#38bdf8", "#0ea5e9", "#0369a1"] },
];

const TYPE_MS = 55;
const HOLD_MS = 1600;
const ERASE_MS = 28;

export default function PowerInput({ onSubmit }) {
  const [typed, setTyped] = useState("");      // animated placeholder text
  const [userValue, setUserValue] = useState(""); // what the user actually typed
  const [activeIdx, setActiveIdx] = useState(0);
  const [phase, setPhase] = useState("typing"); // typing | holding | erasing
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  const current = POWERS[activeIdx];

  // Typing animation — only runs when not focused
  useEffect(() => {
    if (focused) return;
    let t;
    if (phase === "typing") {
      if (typed.length < current.text.length) {
        t = setTimeout(() => setTyped(current.text.slice(0, typed.length + 1)), TYPE_MS);
      } else {
        t = setTimeout(() => setPhase("holding"), 200);
      }
    } else if (phase === "holding") {
      t = setTimeout(() => setPhase("erasing"), HOLD_MS);
    } else {
      if (typed.length > 0) {
        t = setTimeout(() => setTyped(current.text.slice(0, typed.length - 1)), ERASE_MS);
      } else {
        setActiveIdx((i) => (i + 1) % POWERS.length);
        setPhase("typing");
      }
    }
    return () => clearTimeout(t);
  }, [typed, phase, activeIdx, focused, current.text]);

  const handleFocus = () => setFocused(true);
  const handleBlur = () => {
    setFocused(false);
    setPhase("typing");
    setTyped("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userValue.trim()) return;
    onSubmit?.(userValue.trim());
    setUserValue("");
    inputRef.current?.blur();
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center gap-2 px-4 h-14 sm:h-16 rounded-2xl border border-white/15 bg-black/70 backdrop-blur-xl focus-within:border-cyan-400/60 focus-within:shadow-[0_0_40px_rgba(6,182,212,0.15)] transition-all">
          <span className="text-cyan-400 font-mono text-sm sm:text-base shrink-0">›</span>

          <input
            ref={inputRef}
            type="text"
            value={userValue}
            onChange={(e) => setUserValue(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            inputMode="text"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="flex-1 bg-transparent border-0 outline-none text-white text-sm sm:text-base font-mono placeholder-transparent min-w-0 relative z-10 leading-6 caret-cyan-400"
          />

          {/* Animated placeholder — only when input empty & not focused */}
          {!focused && userValue.length === 0 && (
            <span className="absolute left-11 right-16 top-1/2 -translate-y-1/2 text-white/55 font-mono text-sm sm:text-base leading-none truncate pointer-events-none z-0 flex items-center">
              <span className="truncate">{typed}</span>
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="inline-block w-[2px] h-[1.05em] bg-cyan-400 ml-0.5 shrink-0"
              />
            </span>
          )}

          <button
            type="submit"
            disabled={!userValue.trim()}
            className="relative z-10 shrink-0 flex items-center gap-1.5 px-3 h-9 rounded-xl bg-cyan-400 text-black text-[10px] font-bold tracking-widest uppercase disabled:opacity-30 enabled:hover:bg-cyan-300 transition-colors"
          >
            <CornerDownLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Run</span>
          </button>
        </div>
      </form>

      {/* Active power label */}
      <div className="mt-3 flex items-center justify-center gap-2 h-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={focused ? "user" : current.skill}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            <OrganicOrb size={14} colors={focused ? ["#ffffff", "#22d3ee", "#6366f1"] : current.orb} glow={false} />
            <span className="text-[10px] sm:text-xs font-mono tracking-widest uppercase text-white/45">
              {focused ? "type a command…" : current.skill}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}