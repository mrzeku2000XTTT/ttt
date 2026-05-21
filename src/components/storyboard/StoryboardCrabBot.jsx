import React from "react";
import { motion } from "framer-motion";

export default function StoryboardCrabBot({ active = false, sceneCount = 0 }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[120] h-24 overflow-hidden">
      <motion.div
        className="absolute bottom-2 flex flex-col items-center"
        initial={{ x: "-15vw" }}
        animate={{ x: ["-15vw", "105vw", "-15vw"] }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      >
        <motion.div
          className="mb-2 rounded-full border border-cyan-200/30 bg-black/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100 shadow-2xl shadow-cyan-500/20 backdrop-blur-xl"
          animate={{ opacity: active ? [0.65, 1, 0.65] : 0.8, y: active ? [0, -3, 0] : 0 }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          Architect Bot {active ? "stitching" : sceneCount ? `scene ${sceneCount}` : "ready"}
        </motion.div>

        <motion.div
          className="relative h-14 w-24"
          animate={{ y: [0, -4, 0], rotate: [-1, 1, -1] }}
          transition={{ duration: 0.55, repeat: Infinity }}
        >
          <div className="absolute left-6 top-5 h-7 w-12 rounded-full bg-gradient-to-b from-orange-400 to-red-600 shadow-[0_0_22px_rgba(248,113,113,0.55)]" />
          <div className="absolute left-8 top-2 h-6 w-3 rounded-full bg-orange-300" />
          <div className="absolute left-13 top-2 h-6 w-3 rounded-full bg-orange-300" />
          <div className="absolute left-8 top-1 h-2 w-2 rounded-full bg-black" />
          <div className="absolute left-13 top-1 h-2 w-2 rounded-full bg-black" />

          <motion.div className="absolute left-1 top-7 h-2 w-8 origin-right rounded-full bg-red-500" animate={{ rotate: [-28, 18, -28] }} transition={{ duration: 0.45, repeat: Infinity }} />
          <motion.div className="absolute right-1 top-7 h-2 w-8 origin-left rounded-full bg-red-500" animate={{ rotate: [28, -18, 28] }} transition={{ duration: 0.45, repeat: Infinity }} />
          <div className="absolute -left-1 top-3 h-5 w-5 rounded-full border-4 border-red-500" />
          <div className="absolute -right-1 top-3 h-5 w-5 rounded-full border-4 border-red-500" />

          {[0, 1, 2].map((leg) => (
            <React.Fragment key={leg}>
              <motion.div
                className="absolute h-2 w-8 origin-right rounded-full bg-red-700"
                style={{ left: 8, top: 29 + leg * 5 }}
                animate={{ rotate: leg % 2 ? [18, -20, 18] : [-20, 18, -20] }}
                transition={{ duration: 0.38, repeat: Infinity }}
              />
              <motion.div
                className="absolute h-2 w-8 origin-left rounded-full bg-red-700"
                style={{ right: 8, top: 29 + leg * 5 }}
                animate={{ rotate: leg % 2 ? [-18, 20, -18] : [20, -18, 20] }}
                transition={{ duration: 0.38, repeat: Infinity }}
              />
            </React.Fragment>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}