import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * ApexScrollFrames — stacked, layered glass frames pinned to the viewport.
 * Each frame translates, rotates and fades on scroll, creating a cinematic
 * parallax depth effect over the dragon background.
 *
 * Pure visual decoration — pointer-events disabled, sits behind content.
 */
export default function ApexScrollFrames() {
  const { scrollYProgress } = useScroll();

  // Frame 1 — back layer, slow drift
  const f1Y = useTransform(scrollYProgress, [0, 1], ["0%", "-40%"]);
  const f1Rotate = useTransform(scrollYProgress, [0, 1], [-2, 4]);
  const f1Opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.15, 0.35, 0.1]);
  const f1Scale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);

  // Frame 2 — mid layer
  const f2Y = useTransform(scrollYProgress, [0, 1], ["10%", "-25%"]);
  const f2X = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);
  const f2Rotate = useTransform(scrollYProgress, [0, 1], [3, -5]);
  const f2Opacity = useTransform(scrollYProgress, [0, 0.4, 0.8, 1], [0.2, 0.5, 0.4, 0.15]);

  // Frame 3 — front layer, fastest
  const f3Y = useTransform(scrollYProgress, [0, 1], ["20%", "-60%"]);
  const f3X = useTransform(scrollYProgress, [0, 1], ["8%", "-8%"]);
  const f3Rotate = useTransform(scrollYProgress, [0, 1], [-4, 6]);
  const f3Opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.1, 0.55, 0.45, 0.2]);
  const f3Scale = useTransform(scrollYProgress, [0, 1], [0.95, 1.1]);

  // Frame 4 — accent layer with sharper motion
  const f4Y = useTransform(scrollYProgress, [0, 1], ["-10%", "30%"]);
  const f4Rotate = useTransform(scrollYProgress, [0, 1], [8, -4]);
  const f4Opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.08, 0.3, 0.05]);

  return (
    <div className="fixed inset-0 z-[1] pointer-events-none overflow-hidden">
      {/* Frame 1 — large back frame */}
      <motion.div
        style={{ y: f1Y, rotate: f1Rotate, opacity: f1Opacity, scale: f1Scale }}
        className="absolute top-[10%] left-[5%] right-[5%] h-[80vh] rounded-3xl border-2 border-orange-500/40"
      >
        <div className="absolute inset-2 rounded-2xl border border-orange-500/20" />
        <div className="absolute -top-[2px] left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-orange-400 to-transparent" />
        <div className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-red-400 to-transparent" />
      </motion.div>

      {/* Frame 2 — diagonal mid frame */}
      <motion.div
        style={{ y: f2Y, x: f2X, rotate: f2Rotate, opacity: f2Opacity }}
        className="absolute top-[20%] left-[15%] right-[15%] h-[60vh] rounded-2xl border border-orange-300/50"
      >
        {/* Corner marks */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-orange-400" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-orange-400" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-red-400" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-red-400" />
      </motion.div>

      {/* Frame 3 — sharp front frame */}
      <motion.div
        style={{ y: f3Y, x: f3X, rotate: f3Rotate, opacity: f3Opacity, scale: f3Scale }}
        className="absolute top-[30%] left-[25%] right-[25%] h-[40vh] rounded-xl border border-white/30"
        >
        <div className="absolute inset-1 rounded-lg border border-orange-500/30" />
        {/* Cross hairs */}
        <div className="absolute top-1/2 left-0 w-3 h-px bg-orange-400" />
        <div className="absolute top-1/2 right-0 w-3 h-px bg-orange-400" />
        <div className="absolute left-1/2 top-0 w-px h-3 bg-orange-400" />
        <div className="absolute left-1/2 bottom-0 w-px h-3 bg-orange-400" />
      </motion.div>

      {/* Frame 4 — small floating accent frame */}
      <motion.div
        style={{ y: f4Y, rotate: f4Rotate, opacity: f4Opacity }}
        className="absolute top-[55%] left-[40%] w-[20vw] h-[20vw] max-w-[300px] max-h-[300px] rounded-full border border-red-500/40"
      >
        <div className="absolute inset-3 rounded-full border border-orange-500/30" />
        <div className="absolute inset-6 rounded-full border border-orange-300/20" />
      </motion.div>

      {/* Scroll progress vertical line — left edge */}
      <motion.div
        style={{ scaleY: scrollYProgress }}
        className="absolute top-0 bottom-0 left-3 w-px bg-gradient-to-b from-orange-500 via-red-500 to-transparent origin-top opacity-40"
      />
      {/* Scroll progress vertical line — right edge */}
      <motion.div
        style={{ scaleY: scrollYProgress }}
        className="absolute top-0 bottom-0 right-3 w-px bg-gradient-to-b from-red-500 via-orange-500 to-transparent origin-top opacity-40"
      />
    </div>
  );
}