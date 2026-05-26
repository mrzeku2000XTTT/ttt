import React from "react";
import { motion } from "framer-motion";
import FloatingLandingBar from "../components/landing/FloatingLandingBar";

const HERO_IMAGE = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/10c825bfb_image.png";

export default function TTTLandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(168,85,247,0.26),transparent_34%),radial-gradient(circle_at_80%_70%,rgba(6,182,212,0.18),transparent_30%),linear-gradient(180deg,#000,#030006_52%,#000)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:72px_72px]" />

      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-10 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative"
        >
          <div className="absolute -inset-8 rounded-full bg-purple-500/20 blur-3xl" />
          <div className="relative rounded-full border border-white/20 bg-white/8 p-2 shadow-[0_0_120px_rgba(168,85,247,0.35)] backdrop-blur-2xl">
            <img
              src={HERO_IMAGE}
              alt="TTT cosmic eye portal"
              className="h-[min(72vh,720px)] w-[min(88vw,720px)] rounded-full object-cover shadow-[inset_0_0_40px_rgba(255,255,255,0.18)]"
            />
            <div className="pointer-events-none absolute inset-2 rounded-full bg-gradient-to-br from-white/18 via-transparent to-black/30" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-5 rounded-full border border-white/15 bg-white/10 px-5 py-2 backdrop-blur-xl"
        >
          <p className="text-xs font-black uppercase tracking-[0.45em] text-white/70">HD Glass Portal</p>
        </motion.div>

        <FloatingLandingBar />
      </section>
    </main>
  );
}