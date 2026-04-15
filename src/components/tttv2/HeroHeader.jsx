import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import OrbitingApps from "./OrbitingApps";

export default function HeroHeader() {
  return (
    <section className="relative pt-24 sm:pt-32 pb-10 sm:pb-16 px-5 overflow-hidden">
      {/* Subtle radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-radial from-cyan-100/40 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-3xl mx-auto text-center">
        {/* TapToTip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-3"
        >
          <span className="text-[13px] font-[800] tracking-widest uppercase text-zinc-400">TapToTip</span>
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 ring-1 ring-zinc-200/60 mb-6"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-semibold text-zinc-500 tracking-wide uppercase">Version 2.0</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-[clamp(2rem,6vw,4rem)] font-[900] leading-[1] tracking-tight text-zinc-900 mb-3"
        >
          The Kaspa
          <br />
          <span className="bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
            App Store.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-[15px] text-zinc-400 max-w-md mx-auto leading-relaxed mb-6"
        >
          80+ apps. One ecosystem. Built on the fastest blockDAG.
        </motion.p>

        {/* Circular orbiting app icons */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.25 }}
          className="flex justify-center mb-8"
        >
          <OrbitingApps />
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <Link to="/Feed">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="h-11 px-7 bg-zinc-900 text-white text-[14px] font-semibold rounded-full shadow-lg shadow-zinc-900/15 flex items-center gap-2 hover:bg-zinc-800 transition-colors"
            >
              Get Started <ArrowUpRight className="w-4 h-4" />
            </motion.button>
          </Link>
          <Link to="/AppStoreV2">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="h-11 px-7 text-zinc-600 text-[14px] font-semibold rounded-full ring-1 ring-zinc-200 hover:ring-zinc-300 hover:bg-zinc-50 transition-all flex items-center gap-2"
            >
              Browse All Apps
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}