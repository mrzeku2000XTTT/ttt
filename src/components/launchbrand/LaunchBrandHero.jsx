import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Star } from "lucide-react";

export default function LaunchBrandHero() {
  const handleStartBuilding = () => {
    const studio = document.getElementById("brand-studio");
    if (studio) {
      studio.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="relative pt-12 min-h-screen flex items-center justify-center overflow-hidden">
      {/* Static cosmic background — fills entire hero */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 15% 20%, rgba(6,182,212,0.45) 0%, transparent 45%),
            radial-gradient(circle at 85% 25%, rgba(168,85,247,0.4) 0%, transparent 50%),
            radial-gradient(circle at 40% 85%, rgba(236,72,153,0.35) 0%, transparent 50%),
            radial-gradient(ellipse at top, #1a0f2e 0%, #050510 50%, #000 100%)
          `,
        }}
      />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 80%, #000 100%)",
        }}
      />

      {/* Content */}
      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Pill */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 mb-8"
          >
            <Star className="w-3 h-3 text-amber-300 fill-amber-300" />
            <span className="text-[11px] font-bold tracking-widest uppercase bg-gradient-to-r from-cyan-300 via-violet-300 to-pink-300 bg-clip-text text-transparent">
              New · Launch Your Own Brand
            </span>
          </motion.div>

          {/* Headline */}
          <h1 className="text-[clamp(2.5rem,9vw,6.5rem)] font-[900] leading-[0.92] tracking-tight mb-6">
            <span className="block text-white">Build a brand</span>
            <span className="block bg-gradient-to-r from-cyan-300 via-violet-300 to-pink-300 bg-clip-text text-transparent">
              the world remembers.
            </span>
          </h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-base sm:text-lg text-white/60 max-w-xl mx-auto leading-relaxed mb-10"
          >
            AI-generated identity, instant launch on Kaspa, built-in payments and a 24/7 agent.
            Your brand — alive in minutes.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <motion.button
              onClick={handleStartBuilding}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="group h-12 px-7 bg-white text-black text-[14px] font-bold rounded-full shadow-2xl shadow-cyan-500/20 flex items-center gap-2 hover:shadow-cyan-500/40 transition-shadow"
            >
              <Sparkles className="w-4 h-4" />
              Start Building
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="h-12 px-7 text-white text-[14px] font-bold rounded-full border border-white/20 hover:border-white/40 hover:bg-white/5 backdrop-blur-md transition-colors"
            >
              See Examples
            </motion.button>
          </motion.div>

          {/* Trust line */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-12 flex items-center justify-center gap-6 text-[11px] text-white/40 font-medium"
          >
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live on Kaspa
            </div>
            <div className="hidden sm:block">·</div>
            <div className="hidden sm:block">No-code · AI-native</div>
            <div className="hidden sm:block">·</div>
            <div className="hidden sm:block">Founder-tier access</div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center pt-2"
        >
          <div className="w-1 h-2 rounded-full bg-white/40" />
        </motion.div>
      </motion.div>
    </section>
  );
}