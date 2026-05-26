import React from "react";
import { motion } from "framer-motion";

export default function AnimatedCube() {
  return (
    <div className="relative h-9 w-9 [perspective:700px]">
      <motion.div
        className="absolute inset-1 rounded-md bg-black border border-white/20 shadow-[0_0_26px_rgba(168,85,247,0.35)]"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateX: [0, 360], rotateY: [0, 360] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute inset-0 rounded-md bg-gradient-to-br from-white/10 via-purple-500/10 to-cyan-500/10" />
      </motion.div>
    </div>
  );
}