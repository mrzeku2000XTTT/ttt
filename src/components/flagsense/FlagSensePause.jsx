import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { PAUSE_FEELINGS, PAUSE_NEEDS } from "@/lib/flagSenseData";

/** Pause: a 3-second breath, then name the feeling, then the need.
 *  Turns emotional reactions into reflection. */
export default function FlagSensePause({ onClose }) {
  const [stage, setStage] = useState("breathe");

  useEffect(() => {
    const t = setTimeout(() => setStage("feeling"), 3200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 z-[420] flex items-end justify-center bg-black/25 backdrop-blur-sm sm:items-center">
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        className="relative w-full max-w-sm rounded-t-[2rem] bg-card p-7 shadow-2xl sm:rounded-[2rem]"
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-secondary"
          aria-label="Close pause"
        >
          <X className="h-4 w-4" />
        </button>

        <AnimatePresence mode="wait">
          {stage === "breathe" && (
            <motion.div key="breathe" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-8">
              <div className="fs-breathe mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-[hsl(var(--fs-green)/0.14)]">
                <div className="fs-breathe h-16 w-16 rounded-full bg-[hsl(var(--fs-green)/0.35)]" style={{ animationDelay: "0.3s" }} />
              </div>
              <p className="text-[15px] font-semibold">Before you react…</p>
              <p className="mt-1 text-[12.5px] text-neutral-500">Breathe with the circle.</p>
            </motion.div>
          )}

          {stage === "feeling" && (
            <motion.div key="feeling" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fs-fade-up">
              <p className="fs-label">Pause for a second</p>
              <h3 className="mb-1 text-[20px] font-bold tracking-tight">What are you feeling?</h3>
              <p className="mb-5 text-[12.5px] text-neutral-500">Naming it makes it easier to choose what comes next.</p>
              <div className="mb-6 flex flex-wrap gap-2">
                {PAUSE_FEELINGS.map((f) => (
                  <Chip key={f} label={f} onClick={() => setStage("need")} />
                ))}
              </div>
            </motion.div>
          )}

          {stage === "need" && (
            <motion.div key="need" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="fs-fade-up">
              <p className="fs-label">One more step</p>
              <h3 className="mb-1 text-[20px] font-bold tracking-tight">What do you actually need?</h3>
              <p className="mb-5 text-[12.5px] text-neutral-500">Needs are easier to communicate than accusations.</p>
              <div className="mb-6 flex flex-wrap gap-2">
                {PAUSE_NEEDS.map((n) => (
                  <Chip key={n} label={n} onClick={onClose} />
                ))}
              </div>
              <p className="text-center text-[11.5px] text-neutral-400">
                Whatever you picked — it's usually easier to ask for that than to argue.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function Chip({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border border-black/10 bg-white px-4 py-2 text-[13px] font-medium transition-colors hover:border-neutral-900"
    >
      {label}
    </button>
  );
}