import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import FloatingLandingBar from "../components/landing/FloatingLandingBar";

const BACKGROUND_IMAGE = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/e981f570b_generated_image.png";
const LOGO_IMAGE = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/10c825bfb_image.png";

export default function TTTLandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <img
        src={BACKGROUND_IMAGE}
        alt="TTT vibrant nature background"
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
          <Link
            to="/TTTGate"
            aria-label="Launch old TTT portal"
            className="absolute -inset-8 z-0 rounded-full border border-red-400/35 bg-black/10 shadow-[0_0_110px_rgba(239,68,68,0.38)] transition-all hover:border-red-300/80 hover:shadow-[0_0_145px_rgba(239,68,68,0.58)]"
          />
          <div className="pointer-events-none relative z-10 rounded-full border border-white/25 bg-white/5 p-2 shadow-[0_0_95px_rgba(168,85,247,0.36)]">
            <img
              src={LOGO_IMAGE}
              alt="TTT red cosmic logo"
              className="h-[min(70vw,58vh,620px)] w-[min(70vw,58vh,620px)] rounded-full object-cover object-center"
            />
            <div className="pointer-events-none absolute inset-2 rounded-full bg-gradient-to-br from-white/12 via-transparent to-black/20" />
          <div className="pointer-events-none absolute -inset-3 rounded-full border border-red-300/25 shadow-[inset_0_0_35px_rgba(255,255,255,0.12),0_0_70px_rgba(239,68,68,0.28)]" />
          </div>
        </motion.div>

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[6%] top-[18%] h-24 w-24 rounded-full border border-white/25 bg-gradient-to-br from-white/18 via-cyan-300/10 to-purple-500/10 shadow-[inset_10px_10px_24px_rgba(255,255,255,0.12),0_0_32px_rgba(34,211,238,0.18)] backdrop-blur-sm" />
          <div className="absolute right-[9%] top-[28%] h-16 w-16 rounded-full border border-cyan-200/35 bg-gradient-to-br from-white/20 via-cyan-300/12 to-transparent shadow-[inset_8px_8px_18px_rgba(255,255,255,0.16),0_0_30px_rgba(34,211,238,0.22)] backdrop-blur-sm" />
          <div className="absolute bottom-[22%] left-[18%] h-14 w-14 rounded-full border border-pink-200/35 bg-gradient-to-br from-white/18 via-pink-400/12 to-transparent shadow-[inset_7px_7px_16px_rgba(255,255,255,0.14),0_0_26px_rgba(244,114,182,0.2)] backdrop-blur-sm" />
          <div className="absolute bottom-[26%] right-[17%] h-28 w-28 rounded-full border border-orange-200/30 bg-gradient-to-br from-white/16 via-orange-400/12 to-red-500/10 shadow-[inset_12px_12px_28px_rgba(255,255,255,0.12),0_0_36px_rgba(251,146,60,0.2)] backdrop-blur-sm" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-5 rounded-full border border-red-200/25 bg-black/35 px-6 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_0_34px_rgba(239,68,68,0.24)] backdrop-blur-xl"
        >
          <p className="text-xs font-black uppercase tracking-[0.45em] text-emerald-100/80">Newly Updated TTT 2.5</p>
        </motion.div>

        <FloatingLandingBar />
      </section>
    </main>
  );
}