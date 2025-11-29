import React from "react";
import { motion } from "framer-motion";

export default function TDPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <h1 className="text-6xl font-black text-white mb-4">TD</h1>
        <p className="text-white/60 text-xl">Coming Soon</p>
      </motion.div>
    </div>
  );
}