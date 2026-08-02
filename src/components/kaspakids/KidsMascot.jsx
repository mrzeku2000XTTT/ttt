import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function KidsMascot({ message, mood = "happy" }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (message) {
      setShow(true);
      const t = setTimeout(() => setShow(false), 6000);
      return () => clearTimeout(t);
    }
  }, [message]);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center pointer-events-none">
      <AnimatePresence>
        {show && message && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="mb-2 max-w-[80vw] sm:max-w-sm bg-white text-zinc-800 text-sm font-semibold px-4 py-2.5 rounded-2xl rounded-bl-none shadow-xl border-2 border-[#9B84F6]"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        animate={{ y: [0, -8, 0], rotate: [0, 4, -4, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-[50%_50%_45%_55%/55%_45%_55%_45%] bg-gradient-to-br from-[#9B84F6] to-[#7C5CFC] shadow-[0_8px_30px_rgba(124,92,252,0.5)] pointer-events-auto"
      >
        {/* eyes */}
        <div className="absolute top-5 left-3 w-3 h-3 bg-white rounded-full flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-zinc-800 rounded-full" />
        </div>
        <div className="absolute top-5 right-3 w-3 h-3 bg-white rounded-full flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-zinc-800 rounded-full" />
        </div>
        {/* mouth */}
        <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 ${mood === "sad" ? "w-5 h-2 border-b-2 border-zinc-800 rounded-b-none" : "w-5 h-2.5 border-b-2 border-zinc-800 rounded-b-full"}`} />
        {/* cheeks */}
        <div className="absolute bottom-3 left-1 w-2 h-1.5 bg-pink-300/70 rounded-full" />
        <div className="absolute bottom-3 right-1 w-2 h-1.5 bg-pink-300/70 rounded-full" />
      </motion.div>
    </div>
  );
}