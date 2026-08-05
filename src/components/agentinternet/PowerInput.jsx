import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CornerDownLeft, Sparkles } from "lucide-react";

/**
 * PowerInput — a real input box with a live-typing animation that cycles
 * through example "powers" (prompts). Each power maps to an Agent Internet skill.
 * When the user focuses/types, the animation yields to their input.
 */
export const POWERS = [
  { text: "draw me a spooky fantasy crowd", skill: "Xùnhuà · sketch→image", app: "xunhua" },
  { text: "send 5 KAS to kaspa:qzr…", skill: "Bridge · real payment", app: "bridge" },
  { text: "clip the best moment from this stream", skill: "Klipz · live clip", app: "klipz" },
  { text: "research Kaspa's price action today", skill: "Ying · grounded search", app: "ying" },
  { text: "mint my agent identity on-chain", skill: "Agent ZK · signed ID", app: "zk" },
  { text: "build me a landing page for my drop", skill: "TTT Builder · live site", app: "builder" },
  { text: "turn this URL into a viral video", skill: "KUTT · render export", app: "kutt" },
  { text: "lock 100 KAS in escrow for this gig", skill: "Slobz · covenant escrow", app: "slobz" },
  { text: "post this to all my channels", skill: "TELE · encrypted reach", app: "tele" },
];

const TYPE_MS = 55;
const HOLD_MS = 1600;
const ERASE_MS = 28;

export default function PowerInput({ onFocus, onSubmit }) {
  const [value, setValue] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [phase, setPhase] = useState("typing"); // typing | holding | erasing
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (focused) return; // user is typing — pause animation
    const current = POWERS[activeIdx];
    let t;
    if (phase === "typing") {
      if (value.length < current.text.length) {
        t = setTimeout(() => setValue(current.text.slice(0, value.length + 1)), TYPE_MS);
      } else {
        t = setTimeout(() => setPhase("holding"), 200);
      }
    } else if (phase === "holding") {
      t = setTimeout(() => setPhase("erasing"), HOLD_MS);
    } else {
      if (value.length > 0) {
        t = setTimeout(() => setValue(current.text.slice(0, value.length - 1)), ERASE_MS);
      } else {
        setActiveIdx((i) => (i + 1) % POWERS.length);
        setPhase("typing");
      }
    }
    return () => clearTimeout(t);
  }, [value, phase, activeIdx, focused]);

  const current = POWERS[activeIdx];

  const handleFocus = () => {
    setFocused(true);
    setValue("");
    onFocus?.();
  };

  const handleBlur = () => {
    setFocused(false);
    setPhase("typing");
    setValue("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSubmit?.(value.trim());
    setValue("");
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
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            inputMode="text"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="flex-1 bg-transparent border-0 outline-none text-white text-sm sm:text-base font-mono placeholder-transparent min-w-0"
          />
          {!focused && (
            <span className="absolute left-11 right-14 top-1/2 -translate-y-1/2 text-white/55 font-mono text-sm sm:text-base truncate pointer-events-none">
              {value}
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="inline-block w-[2px] h-4 sm:h-5 bg-cyan-400 align-middle ml-0.5 -mt-0.5"
              />
            </span>
          )}
          <button
            type="submit"
            disabled={!value.trim()}
            className="shrink-0 flex items-center gap-1.5 px-3 h-9 rounded-xl bg-cyan-400 text-black text-[10px] font-bold tracking-widest uppercase disabled:opacity-30 enabled:hover:bg-cyan-300 transition-colors"
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
            <Sparkles className="w-3 h-3 text-violet-300" />
            <span className="text-[10px] sm:text-xs font-mono tracking-widest uppercase text-white/45">
              {focused ? "type a command…" : current.skill}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}