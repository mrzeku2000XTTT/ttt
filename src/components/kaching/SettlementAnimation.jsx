import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gavel, Send, Coins, CheckCircle, Loader2, Search, Zap } from "lucide-react";

const STEPS = [
  { id: "judging", icon: Search, label: "Searching live data...", sub: "Judge Bot fetching real-time prices", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  { id: "deciding", icon: Gavel, label: "Determining winners...", sub: "Comparing prices to predictions", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { id: "paying", icon: Send, label: "Sending KAS payouts...", sub: "Payout Bot distributing winnings", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { id: "pacman", icon: Coins, label: "Distributing PACMAN tokens...", sub: "10 PACMAN per KAS bet to winners", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  { id: "done", icon: CheckCircle, label: "Round settled!", sub: "Loading new predictions...", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
];

export default function SettlementAnimation({ active, onComplete }) {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    if (!active) { setStepIdx(0); return; }
    const timers = [];
    // Progress through steps automatically
    STEPS.forEach((_, i) => {
      if (i === 0) return;
      timers.push(setTimeout(() => setStepIdx(i), i * 3000));
    });
    // Signal completion after all steps
    timers.push(setTimeout(() => {
      if (onComplete) onComplete();
    }, STEPS.length * 3000));
    return () => timers.forEach(clearTimeout);
  }, [active]);

  if (!active) return null;

  const step = STEPS[stepIdx];
  const Icon = step.icon;
  const isDone = step.id === "done";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="col-span-full"
    >
      <div className={`relative overflow-hidden rounded-2xl ${step.bg} ${step.border} border p-6 text-center`}>
        {/* Animated background pulse */}
        <motion.div
          className="absolute inset-0 opacity-20"
          animate={{
            background: [
              "radial-gradient(circle at 30% 50%, rgba(16,185,129,0.3) 0%, transparent 60%)",
              "radial-gradient(circle at 70% 50%, rgba(168,85,247,0.3) 0%, transparent 60%)",
              "radial-gradient(circle at 50% 30%, rgba(234,179,8,0.3) 0%, transparent 60%)",
              "radial-gradient(circle at 30% 50%, rgba(16,185,129,0.3) 0%, transparent 60%)",
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />

        <div className="relative z-10">
          {/* Icon */}
          <motion.div
            key={step.id}
            initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 12 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-black/30 mb-4"
          >
            {isDone ? (
              <Icon className={`w-7 h-7 ${step.color}`} />
            ) : (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                <Icon className={`w-7 h-7 ${step.color}`} />
              </motion.div>
            )}
          </motion.div>

          {/* Text */}
          <motion.div
            key={`text-${step.id}`}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <p className={`text-sm font-black ${step.color}`}>{step.label}</p>
            <p className="text-white/25 text-[10px] mt-1">{step.sub}</p>
          </motion.div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.id}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i <= stepIdx ? 'bg-emerald-400' : 'bg-white/10'
                }`}
                animate={i === stepIdx ? { scale: [1, 1.4, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1 }}
              />
            ))}
          </div>

          {/* Tip-style sparkle effects */}
          {!isDone && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-emerald-400/40 rounded-full"
                  initial={{ x: `${20 + Math.random() * 60}%`, y: "100%", opacity: 0 }}
                  animate={{
                    y: "-20%",
                    opacity: [0, 0.8, 0],
                    scale: [0.5, 1.5, 0.5],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    delay: i * 0.5,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}