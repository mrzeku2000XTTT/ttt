import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Brain, Mail, Webhook, Database, GitBranch, Image as ImageIcon, Clock } from "lucide-react";

const NODES = [
  { Icon: Brain, color: "from-purple-500 to-pink-500", delay: 0 },
  { Icon: ImageIcon, color: "from-cyan-500 to-blue-500", delay: 0.1 },
  { Icon: Mail, color: "from-amber-500 to-orange-500", delay: 0.2 },
  { Icon: Webhook, color: "from-rose-500 to-red-500", delay: 0.3 },
  { Icon: Database, color: "from-indigo-500 to-purple-500", delay: 0.4 },
  { Icon: GitBranch, color: "from-yellow-500 to-amber-500", delay: 0.5 },
  { Icon: Clock, color: "from-zinc-500 to-zinc-600", delay: 0.6 },
];

/**
 * NodaLoadingOverlay — animated NODA brand boot sequence shown inside the
 * Agent Computer when the agent navigates to a NODA route. Pure visual.
 */
export default function NodaLoadingOverlay({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 z-30 bg-gradient-to-br from-zinc-950 via-cyan-950/40 to-black flex flex-col items-center justify-center pointer-events-none overflow-hidden"
        >
          {/* Grid backdrop */}
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "linear-gradient(#06b6d4 1px, transparent 1px), linear-gradient(90deg, #06b6d4 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          {/* Glow blobs */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-cyan-500/20 blur-3xl"
          />
          <motion.div
            animate={{ scale: [1.1, 0.9, 1.1], opacity: [0.4, 0.2, 0.4] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-purple-500/20 blur-3xl"
          />

          {/* Logo */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="relative z-10 mb-6"
          >
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-cyan-500/40">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/30 to-transparent" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-2 rounded-[28px] border-2 border-cyan-400/40 border-t-cyan-300"
              />
              <Zap className="relative w-9 h-9 text-white drop-shadow-lg" />
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative z-10 text-3xl sm:text-4xl font-black tracking-tighter text-white mb-2"
          >
            NODA
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="relative z-10 text-[10px] sm:text-xs tracking-[0.3em] uppercase font-bold text-cyan-300/80 mb-8"
          >
            Booting Workflow Engine
          </motion.p>

          {/* Animated node row */}
          <div className="relative z-10 flex items-center gap-1.5 sm:gap-2 mb-6">
            {NODES.map(({ Icon, color, delay }, i) => (
              <React.Fragment key={i}>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: [0, 1, 1],
                    opacity: [0, 1, 1],
                  }}
                  transition={{
                    duration: 0.5,
                    delay: 0.4 + delay,
                    times: [0, 0.6, 1],
                  }}
                  className="relative"
                >
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg border border-white/20 relative overflow-hidden`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
                    <Icon className="relative w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                </motion.div>
                {i < NODES.length - 1 && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.3, delay: 0.55 + delay }}
                    className="w-2 sm:w-3 h-px bg-gradient-to-r from-cyan-400/60 to-purple-400/60 origin-left"
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="relative z-10 w-48 sm:w-64 h-1 rounded-full bg-white/10 overflow-hidden"
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="h-full w-1/2 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="relative z-10 text-white/40 text-[11px] mt-4 font-mono"
          >
            Loading nodes · wiring brain · ready in moments
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}