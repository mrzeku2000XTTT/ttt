import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const DRAGON_HERO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/5bc1bd1ce_generated_image.png";
const DRAGON_FLY = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/bcd890eb0_generated_image.png";
const DRAGON_DAG = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/9298b3414_generated_image.png";

/**
 * Cinematic dragon parallax scene — 3 dragon images that fade and shift as the user scrolls.
 * Pure visual: no data fetching, no state outside scroll progress.
 */
export default function ApexDragonScene() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll();

  // Hero dragon — visible 0-30% of scroll
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25, 0.4], [0.85, 0.55, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.4], [1, 1.15]);
  const heroY = useTransform(scrollYProgress, [0, 0.4], ["0%", "-15%"]);

  // Mid dragon — visible 30-65%
  const flyOpacity = useTransform(scrollYProgress, [0.25, 0.4, 0.6, 0.75], [0, 0.7, 0.7, 0]);
  const flyX = useTransform(scrollYProgress, [0.25, 0.75], ["-10%", "10%"]);
  const flyScale = useTransform(scrollYProgress, [0.25, 0.5, 0.75], [0.9, 1.05, 1.15]);

  // Final DAG dragon — visible 65-100%
  const dagOpacity = useTransform(scrollYProgress, [0.6, 0.78, 1], [0, 0.65, 0.85]);
  const dagScale = useTransform(scrollYProgress, [0.6, 1], [0.9, 1.1]);
  const dagRotate = useTransform(scrollYProgress, [0.6, 1], [-3, 2]);

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Hero golden dragon on volcanic peak */}
      <motion.div
        style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        className="absolute inset-0"
      >
        <img
          src={DRAGON_HERO}
          alt=""
          className="w-full h-full object-cover"
          style={{ filter: "brightness(0.55) contrast(1.15) saturate(1.1)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
      </motion.div>

      {/* Mid red flying dragon breathing fire */}
      <motion.div
        style={{ opacity: flyOpacity, x: flyX, scale: flyScale }}
        className="absolute inset-0"
      >
        <img
          src={DRAGON_FLY}
          alt=""
          className="w-full h-full object-cover"
          style={{ filter: "brightness(0.5) contrast(1.2) saturate(1.2)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black" />
      </motion.div>

      {/* DAG dragon coiled around node network */}
      <motion.div
        style={{ opacity: dagOpacity, scale: dagScale, rotate: dagRotate }}
        className="absolute inset-0"
      >
        <img
          src={DRAGON_DAG}
          alt=""
          className="w-full h-full object-cover"
          style={{ filter: "brightness(0.6) contrast(1.15) saturate(1.15)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
      </motion.div>

      {/* Persistent vignette + spotlight beams */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_transparent_0%,_rgba(0,0,0,0.85)_70%)]" />
    </div>
  );
}