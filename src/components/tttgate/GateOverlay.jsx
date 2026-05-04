import React from "react";
import { motion } from "framer-motion";

/**
 * GateOverlay — animated split overlay for the TTTGate landing page.
 *  - Left: red robotic / circuit theme
 *  - Right: green nature / organic theme
 *  - Center: Kaspa currency AI orb
 * Pure visual layer — no click handlers (the parent button handles input).
 */
export default function GateOverlay() {
  return (
    <div className="absolute inset-0 z-[15] pointer-events-none overflow-hidden mix-blend-screen">
      {/* LEFT — Red robotic side */}
      <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
        {/* Circuit grid */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,40,40,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,40,40,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            maskImage:
              "linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)",
          }}
        />
        {/* Red glow */}
        <motion.div
          className="absolute -left-1/4 top-1/2 -translate-y-1/2 w-[80%] aspect-square rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(255,30,30,0.35) 0%, rgba(255,0,0,0.1) 40%, transparent 70%)",
            filter: "blur(40px)",
          }}
          animate={{ opacity: [0.5, 0.9, 0.5], scale: [1, 1.08, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Scanning line */}
        <motion.div
          className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent"
          animate={{ top: ["10%", "90%", "10%"], opacity: [0, 1, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        />
        {/* Floating data dots */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`r-${i}`}
            className="absolute w-1.5 h-1.5 rounded-full bg-red-500"
            style={{
              left: `${10 + i * 12}%`,
              top: `${20 + (i * 13) % 60}%`,
              boxShadow: "0 0 12px rgba(255,30,30,0.9)",
            }}
            animate={{ opacity: [0.2, 1, 0.2], y: [0, -10, 0] }}
            transition={{
              duration: 2 + (i % 3),
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      {/* RIGHT — Green nature side */}
      <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden">
        {/* Organic glow */}
        <motion.div
          className="absolute -right-1/4 top-1/2 -translate-y-1/2 w-[80%] aspect-square rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(60,220,140,0.3) 0%, rgba(40,180,120,0.1) 40%, transparent 70%)",
            filter: "blur(40px)",
          }}
          animate={{ opacity: [0.4, 0.85, 0.4], scale: [1, 1.1, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Vines / organic curves */}
        <svg
          className="absolute inset-0 w-full h-full opacity-40"
          viewBox="0 0 400 800"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="vineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3DDC91" stopOpacity="0" />
              <stop offset="50%" stopColor="#3DDC91" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#26B198" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 1, 2].map((i) => (
            <motion.path
              key={`v-${i}`}
              d={`M${380 - i * 60},0 Q${300 - i * 40},${200 + i * 80} ${360 - i * 50},${400 + i * 50} T${380 - i * 60},800`}
              stroke="url(#vineGrad)"
              strokeWidth={2 - i * 0.4}
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: [0, 0.9, 0.7] }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
                delay: i * 0.6,
              }}
            />
          ))}
        </svg>
        {/* Floating leaf particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`g-${i}`}
            className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400"
            style={{
              right: `${10 + i * 12}%`,
              top: `${25 + (i * 11) % 55}%`,
              boxShadow: "0 0 12px rgba(60,220,140,0.9)",
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              y: [0, 12, 0],
              x: [0, i % 2 === 0 ? 6 : -6, 0],
            }}
            transition={{
              duration: 3 + (i % 3),
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.4,
            }}
          />
        ))}
      </div>

    </div>
  );
}