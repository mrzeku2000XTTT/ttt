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
        className="absolute left-1/2 top-1/2 h-[min(112vw,900px)] w-[min(112vw,900px)] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain opacity-75"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,transparent_0%,transparent_36%,rgba(239,68,68,0.11)_48%,rgba(6,182,212,0.08)_64%,#000_88%),linear-gradient(180deg,rgba(0,0,0,0.08),#000_94%)]" />
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
            className="absolute -inset-10 z-0 rounded-full border border-red-300/35 bg-[radial-gradient(circle,transparent_62%,rgba(239,68,68,0.20)_64%,rgba(168,85,247,0.18)_72%,transparent_76%),conic-gradient(from_90deg,rgba(239,68,68,0.0),rgba(239,68,68,0.34),rgba(34,211,238,0.22),rgba(239,68,68,0.34),rgba(239,68,68,0.0))] shadow-[inset_0_0_40px_rgba(255,255,255,0.08),0_0_90px_rgba(239,68,68,0.32)] transition-all hover:border-red-200/80 hover:scale-[1.015] hover:shadow-[inset_0_0_46px_rgba(255,255,255,0.12),0_0_135px_rgba(239,68,68,0.5)]"
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
          <div className="absolute left-[5%] top-[20%] h-20 w-20 rounded-full border border-white/18 bg-gradient-to-br from-white/12 via-cyan-300/7 to-transparent shadow-[inset_8px_8px_20px_rgba(255,255,255,0.1),0_0_24px_rgba(34,211,238,0.12)] backdrop-blur-sm" />
          <div className="absolute right-[7%] top-[31%] h-12 w-12 rounded-full border border-cyan-200/24 bg-gradient-to-br from-white/14 via-cyan-300/8 to-transparent shadow-[inset_6px_6px_14px_rgba(255,255,255,0.12),0_0_22px_rgba(34,211,238,0.14)] backdrop-blur-sm" />
          <div className="absolute bottom-[23%] left-[18%] h-11 w-11 rounded-full border border-pink-200/22 bg-gradient-to-br from-white/12 via-pink-400/8 to-transparent shadow-[inset_5px_5px_13px_rgba(255,255,255,0.1),0_0_18px_rgba(244,114,182,0.12)] backdrop-blur-sm" />
          <div className="absolute bottom-[26%] right-[15%] h-20 w-20 rounded-full border border-orange-200/20 bg-gradient-to-br from-white/10 via-orange-400/8 to-transparent shadow-[inset_9px_9px_22px_rgba(255,255,255,0.1),0_0_24px_rgba(251,146,60,0.12)] backdrop-blur-sm" />
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