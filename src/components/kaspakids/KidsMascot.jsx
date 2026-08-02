import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Official Slobz clay mascot from Sector 6
const MASCOT_IMG = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/0809726ab_generated_image.png";

export default function KidsMascot({ message, size = "md" }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (message) {
      setShow(true);
      const t = setTimeout(() => setShow(false), 6000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const dim = size === "lg" ? "w-28 h-28 sm:w-36 sm:h-36" : "w-20 h-20 sm:w-24 sm:h-24";

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center pointer-events-none">
      <AnimatePresence>
        {show && message && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="mb-2 max-w-[80vw] sm:max-w-sm bg-[#FDFBF7] text-[#1F1B2E] text-sm font-bold px-4 py-2.5 rounded-2xl rounded-b-none shadow-[0_12px_30px_rgba(124,92,252,0.35)] border-2 border-[#7C5CFC]"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.img
        src={MASCOT_IMG}
        alt="Slobby — the Slobz mascot from Sector 6"
        animate={{ y: [0, -10, 0], rotate: [0, 4, -4, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className={`${dim} rounded-[28px] object-cover shadow-[0_12px_36px_rgba(124,92,252,0.45)] pointer-events-auto`}
      />
    </div>
  );
}