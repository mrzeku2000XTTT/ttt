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
            className="object-contain"
            style={{
              width: "72%",
              height: "72%",
              position: "absolute",
              left: "14%",
              top: "14%",
              filter: dark ? "invert(1)" : undefined,
              mixBlendMode: dark ? "screen" : undefined,
            }}
          />
        </div>
        {/* Circle outline */}
        <div
          className={`absolute inset-0 rounded-full pointer-events-none ${dark ? "border-2 border-neutral-900" : "border border-neutral-200"}`}
        />
        {/* DD eyes — at eye level of the profile, animated blink */}
        <motion.span
          className="absolute font-bold leading-none pointer-events-none z-10"
          style={{
            top: "34%",
            right: "16%",
            fontSize: Math.max(7, Math.round(size * 0.18)),
            color: dark ? "#f5f5f5" : "#1a1a1a",
            letterSpacing: "-0.04em",
          }}
          animate={{ opacity: [1, 1, 0.15, 1, 1], scaleY: [1, 1, 0.1, 1, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", times: [0, 0.82, 0.88, 0.94, 1] }}
        >
          DD
        </motion.span>
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