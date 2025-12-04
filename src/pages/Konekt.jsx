import React from "react";
import { motion } from "framer-motion";

export default function KonektPage() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background gradient */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 via-black to-pink-900/20" />
        <motion.div
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-0 right-0 w-96 h-96 bg-orange-500/20 rounded-full blur-[120px]"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 h-screen flex flex-col p-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 text-center"
        >
          <h1 className="text-4xl font-black text-white tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-400">
              KONEKT
            </span>
          </h1>
          <p className="text-white/60 text-sm">Gateway to more apps</p>
        </motion.div>

        {/* Iframe container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-1 rounded-2xl overflow-hidden border border-white/10 backdrop-blur-xl bg-white/5"
        >
          <iframe
            src="https://ytmp3.as/AOPR/"
            className="w-full h-full"
            title="Konekt App Gateway"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </motion.div>
      </div>
    </div>
  );
}