import React from "react";
import { motion } from "framer-motion";

export default function SlobzBlobs() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      <motion.div
        animate={{ y: [0, -20, 0], rotate: [0, 8, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-10 -left-16 w-48 h-48 rounded-[45%_55%_60%_40%/50%_45%_55%_50%] bg-[#B8A7F0]/60"
      />
      <motion.div
        animate={{ y: [0, 15, 0], rotate: [0, -6, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/3 -right-20 w-56 h-56 rounded-[55%_45%_40%_60%/45%_55%_50%_50%] bg-[#FF9B82]/40"
      />
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-16 left-1/4 w-40 h-40 rounded-[50%_50%_45%_55%/55%_45%_50%_50%] bg-[#9B84F6]/50"
      />
      <div className="absolute top-24 right-1/4 w-4 h-4 rounded-full bg-[#FF7A59]/70" />
      <div className="absolute bottom-40 right-16 w-6 h-6 rounded-full bg-[#7C5CFC]/50" />
      <div className="absolute top-1/2 left-10 w-3 h-3 rounded-full bg-white/80" />
    </div>
  );
}