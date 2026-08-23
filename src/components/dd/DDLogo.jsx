import React from "react";
import { motion } from "framer-motion";

const LOGO_URL = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/9c255656c_IMG_5210.jpeg";

export default function DDLogo({ size = 32, showWord = true, animate = true, active = false }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <motion.span
        initial={animate ? { opacity: 0, scale: 0.5 } : false}
        animate={animate ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative inline-block overflow-hidden rounded-[7px]"
        style={{ width: size, height: size, background: "#fff" }}
      >
        <img src={LOGO_URL} alt="DD" className="w-full h-full object-cover" />
        {active && (
          <motion.span
            className="absolute inset-0 rounded-[7px] ring-2 ring-violet-400/50 pointer-events-none"
            animate={{ opacity: [0.25, 0.7, 0.25] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </motion.span>
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