import React from "react";
import { motion } from "framer-motion";
import FloatingLandingBar from "../components/landing/FloatingLandingBar";

const HERO_IMAGE = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/10569d41a_generated_image.png";

export default function TTTLandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <img
        src={HERO_IMAGE}
        alt="TTT cosmic background"
        className="absolute left-1/2 top-1/2 h-[118vh] w-[118vh] max-w-none -translate-x-1/2 -translate-y-1/2 scale-125 object-cover opacity-60"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,transparent_0%,transparent_34%,rgba(168,85,247,0.16)_45%,rgba(6,182,212,0.12)_62%,#000_86%),linear-gradient(180deg,rgba(0,0,0,0.12),#000_92%)]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:72px_72px]" />

      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-10 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative"
        >
          <div className="absolute -inset-5 rounded-full border border-purple-300/20 bg-black/20 shadow-[0_0_80px_rgba(168,85,247,0.32)]" />
          <div className="relative rounded-full border border-white/25 bg-white/5 p-2 shadow-[0_0_95px_rgba(168,85,247,0.36)]">
            <img
              src={HERO_IMAGE}
              alt="TTT cosmic eye portal"
              className="h-[min(60vh,620px)] w-[min(84vw,620px)] rounded-full object-cover"
            />
            <div className="pointer-events-none absolute inset-2 rounded-full bg-gradient-to-br from-white/10 via-transparent to-black/10" />
          </div>
        </motion.div>

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[7%] top-[26%] h-24 w-24 rounded-full border border-white/20 bg-purple-400/10" />
          <div className="absolute right-[10%] top-[34%] h-16 w-16 rounded-full border border-cyan-300/25 bg-cyan-300/10" />
          <div className="absolute bottom-[24%] left-[18%] h-14 w-14 rounded-full border border-pink-300/25 bg-pink-400/10" />
          <div className="absolute bottom-[31%] right-[18%] h-28 w-28 rounded-full border border-orange-300/20 bg-orange-400/10" />
        </div>

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