import React from "react";
import { motion } from "framer-motion";

const LOGO_URL = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/9c255656c_IMG_5210.jpeg";

export default function DDLogo({ size = 32, showWord = true, animate = true, active = false, dark = false }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <motion.div
        initial={animate ? { opacity: 0, scale: 0.5 } : false}
        animate={animate ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative shrink-0"
        style={{ width: size, height: size }}
      >
        {/* Circular head — dark fill */}
        <div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{ background: dark ? "#1a1a1a" : "#fff" }}
        >
          <img
            src={LOGO_URL}
            alt="DD"
            className="w-full h-full object-cover"
            style={dark ? { filter: "invert(1)", mixBlendMode: "screen" } : undefined}
          />
        </div>
        {/* Circle outline */}
        <div
          className={`absolute inset-0 rounded-full pointer-events-none ${dark ? "border-2 border-neutral-900" : "border border-neutral-200"}`}
        />
        {/* DD eyes — inside the circle, upper-right */}
        <span
          className="absolute font-bold leading-none pointer-events-none"
          style={{
            top: "12%",
            right: "14%",
            fontSize: Math.max(8, Math.round(size * 0.2)),
            color: dark ? "#f5f5f5" : "#1a1a1a",
            letterSpacing: "-0.04em",
          }}
        >
          DD
        </span>
        {active && (
          <motion.span
            className="absolute inset-0 rounded-full ring-2 ring-neutral-700/50 pointer-events-none"
            animate={{ opacity: [0.25, 0.7, 0.25] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </motion.div>
      {showWord && (
        <motion.span
          initial={animate ? { opacity: 0, x: -6 } : false}
          animate={animate ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.45, delay: 0.28, ease: "easeOut" }}
          className="font-bold tracking-tight text-neutral-900"
          style={{ fontSize: Math.round(size * 0.6), lineHeight: 1 }}
        >
          DD
        </motion.span>
      )}
    </div>
  );
}