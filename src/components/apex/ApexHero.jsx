import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, ArrowRight, Lock } from "lucide-react";

export default function ApexHero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 py-20">
      {/* Spotlight beams */}
      <div className="absolute top-0 left-1/4 w-[2px] h-[60vh] bg-gradient-to-b from-orange-400/40 via-orange-500/10 to-transparent rotate-12 blur-sm" />
      <div className="absolute top-0 right-1/4 w-[2px] h-[60vh] bg-gradient-to-b from-red-400/40 via-red-500/10 to-transparent -rotate-12 blur-sm" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 bg-orange-500/10 border border-orange-500/30 rounded-full"
        >
          <Lock className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-orange-200 text-[11px] font-bold tracking-[0.25em] uppercase">Zero-Knowledge Proof</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1 }}
          className="font-black text-white text-5xl sm:text-7xl md:text-[110px] leading-[0.9] tracking-tight mb-6"
          style={{
            fontFamily: "'Orbitron', system-ui, sans-serif",
            textShadow: "0 0 40px rgba(255, 107, 26, 0.3), 0 0 80px rgba(220, 38, 38, 0.15)",
          }}
        >
          APEX
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="w-24 h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent mx-auto mb-8"
        />

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-white/70 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-3"
        >
          The peak of <span className="text-orange-400 font-semibold">workflow verification</span>.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-white/50 text-sm sm:text-base max-w-xl mx-auto leading-relaxed mb-10"
        >
          When NODA succeeds, APEX certifies it — without ever seeing your data. Pure cryptographic proof. Zero leaks.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex items-center justify-center gap-3 flex-wrap"
        >
          <Link
            to="/APEX"
            className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold text-sm shadow-2xl shadow-orange-500/40 transition-all hover:scale-105"
          >
            Launch APEX
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white text-sm font-semibold backdrop-blur-sm"
          >
            How it works
          </a>
        </motion.div>
      </div>
    </section>
  );
}